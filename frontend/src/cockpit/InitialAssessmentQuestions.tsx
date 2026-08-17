import { useEffect, useState } from "react";
import { useQueue, type QueueItem } from "../QueueContext";
import { fetchProtocolDetail, type InitialAssessmentQuestion } from "./api/protocols";
import { resolveClinicalProtocolId } from "./clinicalLineage";
import { colorStyleForSeverity } from "./severityColors";

// IAQ questions carry no severity (they're pure history-taking, not
// triage-tier), so they get this app's own existing "no severity" neutral
// tint (colorStyleForSeverity(undefined) - already used elsewhere, e.g. the
// "no criteria met" card in QuestionsStage.tsx) rather than a new invented
// color. This gives IAQ cards their own consistent, recognizable identity
// distinct from every TAQ severity tier (red/amber/blue/green all already
// taken), without colliding with any of them.
const iaqCardStyle = colorStyleForSeverity(undefined);

const painScaleChips = ["Mild (1-3)", "Moderate (4-7)", "Severe (8-10)"];

function widgetLabel(responseType: string) {
  return responseType.replace(/_/g, " ");
}

// Splits a real STCC IAQ prompt line into the literal caller-facing script
// (the first quoted question - what the nurse actually reads aloud) and
// everything else (numbering prefix, additional quoted follow-ups,
// "(Note: ...)"/"(e.g., ...)" parentheticals, "- If X:" branch labels) as a
// muted secondary guidance line, mirroring the TAQ question card's bold
// title + italic rationale structure (QuestionsStage.tsx). Falls back to the
// whole line as the headline when there's no quoted segment at all (a real,
// confirmed case: Diarrhea's bare-prose severity bullets) rather than
// guessing at structure that isn't there.
// Every real STCC IAQ line leads with its own numbered category label (e.g.
// "1. LOCATION:", "9. RELIEVING/AGGRAVATING FACTORS:") - purely redundant
// once split out, since the same category already shows in the gtag badge
// above (widgetLabel(question.responseType)). Stripped here so a question
// with no real guidance beyond that label (e.g. "1. LOCATION:" alone) hides
// the guidance line entirely, matching TAQ's rationale only showing when
// there's genuine content - not noise repeating what's already displayed.
const LEADING_CATEGORY_LABEL = /^\d+\.\s*[A-Za-z][A-Za-z\s/-]*:\s*/;

function splitPromptForDisplay(text: string): { headline: string; guidance?: string } {
  const match = text.match(/"[^"]*"/);
  if (!match || match.index === undefined) {
    return { headline: text };
  }
  const headline = match[0].slice(1, -1).trim();
  const guidance = (text.slice(0, match.index) + text.slice(match.index + match[0].length))
    .replace(/\s+/g, " ")
    .trim()
    .replace(LEADING_CATEGORY_LABEL, "")
    .trim();
  return { headline, guidance: guidance.length > 0 ? guidance : undefined };
}

export function InitialAssessmentQuestions({ item, isReadOnly }: { item: QueueItem; isReadOnly: boolean }) {
  const { updateItemContext } = useQueue();
  const [questions, setQuestions] = useState<InitialAssessmentQuestion[] | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(item.initialAssessmentResponses ?? {});
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const [draftText, setDraftText] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const protocolId = resolveClinicalProtocolId(item);

  useEffect(() => {
    let cancelled = false;
    if (!protocolId) {
      setQuestions([]);
      return;
    }
    fetchProtocolDetail(protocolId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        const sorted = [...detail.protocol.initialAssessmentQuestions].sort((a, b) => a.sequence - b.sequence);
        setQuestions(sorted);
        const firstUnanswered = sorted.find((question) => !(question.id in (item.initialAssessmentResponses ?? {})));
        setOpenId(firstUnanswered?.id);
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught.message : "Failed to load initial assessment questions.");
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId]);

  if (!protocolId || (questions && questions.length === 0)) {
    return null;
  }

  if (loadError) {
    return (
      <p className="cockpit-action-error" role="alert">
        {loadError}
      </p>
    );
  }

  if (!questions) {
    return <p className="action-sub-note">Loading initial assessment questions...</p>;
  }

  async function save(questionId: string, value: string, allQuestions: InitialAssessmentQuestion[], advance = true) {
    if (isReadOnly) {
      return;
    }
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    setSaveError("");
    try {
      await updateItemContext(item.id, { initialAssessmentResponses: next });
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Failed to save answer.");
    }
    if (advance) {
      const next_unanswered = allQuestions.find((question) => !(question.id in next));
      setOpenId(next_unanswered?.id);
    }
  }

  const TEXT_RESPONSE_TYPES = new Set(["TEMPERATURE", "DURATION", "LOCATION", "OPEN_TEXT"]);

  // A typed-but-unsaved draft in the currently open text question should not
  // be silently lost just because the nurse clicked ahead to another
  // question without pressing Save first - auto-save it here, without
  // stealing the open panel away from the question the nurse actually
  // clicked (advance=false leaves openId alone; the explicit setOpenId
  // below is what actually moves it).
  function toggle(id: string) {
    if (openId && openId !== id && questions) {
      const currentQuestion = questions.find((question) => question.id === openId);
      if (currentQuestion && TEXT_RESPONSE_TYPES.has(currentQuestion.responseType)) {
        const draft = (draftText[openId] ?? answers[openId] ?? "").trim();
        if (draft && draft !== answers[openId]) {
          save(openId, draft, questions, false);
        }
      }
    }
    setOpenId((current) => (current === id ? undefined : id));
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <div className="sub-hdr">Initial Assessment Questions</div>
      <div className="iaq-note">
        Click a question to expand it, choose or type the caller&rsquo;s answer. Answering auto-advances to the next
        question.
      </div>

      {questions.map((question, index) => {
        const answered = question.id in answers;
        const isOpen = openId === question.id;
        const { headline, guidance } = splitPromptForDisplay(question.promptTextEn);
        return (
          <div key={question.id} className={`step${answered ? " asked" : ""}${isOpen ? " open" : ""}`} style={iaqCardStyle}>
            <div className="step-hdr" onClick={() => toggle(question.id)} style={{ cursor: "pointer" }}>
              <div className="step-num">{answered ? "✓" : index + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="gtag">{widgetLabel(question.responseType)}</div>
                <div className="step-title">{headline}</div>
                {guidance && <div className="step-rationale">{guidance}</div>}
                {answered && <div className="ans">&#10132; {answers[question.id]}</div>}
              </div>
              <div className="chev">&#9654;</div>
            </div>

            {isOpen && (
              <div className="iaq-body" onClick={(event) => event.stopPropagation()}>
                {question.clarificationPromptEn && (
                  <div className="iaq-note" style={{ margin: "0 0 8px" }}>
                    <strong>Hint:</strong> {question.clarificationPromptEn}
                  </div>
                )}

                {question.responseType === "YES_NO" && (
                  <div className="iaq-choices">
                    {["Yes", "No"].map((choice) => (
                      <div
                        key={choice}
                        className={`iaq-chip${answers[question.id] === choice ? " sel" : ""}`}
                        onClick={() => save(question.id, choice, questions)}
                      >
                        {choice}
                      </div>
                    ))}
                  </div>
                )}

                {question.responseType === "PAIN_SCALE" && (
                  <div className="iaq-choices">
                    {painScaleChips.map((choice) => (
                      <div
                        key={choice}
                        className={`iaq-chip${answers[question.id] === choice ? " sel" : ""}`}
                        onClick={() => save(question.id, choice, questions)}
                      >
                        {choice}
                      </div>
                    ))}
                  </div>
                )}

                {(question.responseType === "TEMPERATURE" ||
                  question.responseType === "DURATION" ||
                  question.responseType === "LOCATION" ||
                  question.responseType === "OPEN_TEXT") && (
                  <div className="iaq-row">
                    <input
                      className="iaq-text"
                      type="text"
                      defaultValue={answers[question.id] ?? ""}
                      onChange={(event) => setDraftText((current) => ({ ...current, [question.id]: event.target.value }))}
                      onBlur={() => {
                        // Losing focus for ANY reason (clicking another
                        // question, clicking "Triage Questions ->", clicking
                        // anywhere else on the page) must not silently drop
                        // an unsaved draft - this is a stronger, general
                        // safety net than the toggle()-only autosave below,
                        // since toggle() has no visibility into clicks on
                        // buttons outside this component (e.g. the stage's
                        // own Continue button).
                        const value = (draftText[question.id] ?? answers[question.id] ?? "").trim();
                        if (value && value !== answers[question.id]) {
                          save(question.id, value, questions, false);
                        }
                      }}
                      disabled={isReadOnly}
                    />
                    <button
                      type="button"
                      className="iaq-save"
                      disabled={isReadOnly}
                      onClick={() => {
                        const value = (draftText[question.id] ?? answers[question.id] ?? "").trim();
                        if (!value) {
                          return;
                        }
                        save(question.id, value, questions);
                      }}
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {saveError && (
        <p className="cockpit-action-error" role="alert">
          {saveError}
        </p>
      )}

      {answeredCount === questions.length ? (
        <div className="continue-gate">
          <span>All {questions.length} initial assessment questions answered.</span>
        </div>
      ) : (
        <div className="iaq-progress">
          {answeredCount} of {questions.length} answered
        </div>
      )}
    </>
  );
}
