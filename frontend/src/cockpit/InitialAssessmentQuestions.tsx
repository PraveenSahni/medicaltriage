import { useEffect, useState } from "react";
import { useQueue, type QueueItem } from "../QueueContext";
import { fetchProtocolDetail, type InitialAssessmentQuestion } from "./api/protocols";

const painScaleChips = ["Mild (1-3)", "Moderate (4-7)", "Severe (8-10)"];

function widgetLabel(responseType: string) {
  return responseType.replace(/_/g, " ");
}

export function InitialAssessmentQuestions({ item, isReadOnly }: { item: QueueItem; isReadOnly: boolean }) {
  const { updateItemContext } = useQueue();
  const [questions, setQuestions] = useState<InitialAssessmentQuestion[] | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(item.initialAssessmentResponses ?? {});
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const [draftText, setDraftText] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const protocolId = item.preparedProtocol?.primaryProtocolId;

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

  async function save(questionId: string, value: string, allQuestions: InitialAssessmentQuestion[]) {
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
    const next_unanswered = allQuestions.find((question) => !(question.id in next));
    setOpenId(next_unanswered?.id);
  }

  function toggle(id: string) {
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
        return (
          <div key={question.id} className={`step${answered ? " asked" : ""}${isOpen ? " open" : ""}`}>
            <div className="step-hdr" onClick={() => toggle(question.id)} style={{ cursor: "pointer" }}>
              <div className="step-num">{answered ? "✓" : index + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="gtag">{widgetLabel(question.responseType)}</div>
                <div className="step-title">{question.promptTextEn}</div>
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
