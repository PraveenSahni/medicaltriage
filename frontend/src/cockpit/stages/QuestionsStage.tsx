import { useEffect, useState } from "react";
import { useQueue, type QueueItem, type QueueSeverity } from "../../QueueContext";
import { colorStyleForSeverity } from "../severityColors";
import { fetchProtocolDetail, type ProtocolTaqQuestion } from "../api/protocols";
import { QATAR_DESTINATION_BY_CODE } from "../qatarDestinations";

const severityMap: Record<string, QueueSeverity> = {
  Emergency: "EMERGENCY",
  Urgent: "URGENT",
  Routine: "ROUTINE",
  "Self-care": "SELF_CARE"
};

const displaySeverityByQueueSeverity: Record<QueueSeverity, string> = {
  EMERGENCY: "Emergency",
  URGENT: "Urgent",
  ROUTINE: "Routine",
  SELF_CARE: "Self-care"
};

// Real STCC question text often bundles several clinical criteria into one
// bracket-numbered sentence, e.g. "[1] SEVERE pain AND [2] age > 60 years" -
// confirmed via direct DB query as a widespread vendor convention (72 of 152
// real questions across all 5 protocols), always AND-joined at the top level
// (0 real top-level ORs found). Rendered as one run-on sentence, the nurse has
// to visually parse out "this is really N separate things that must ALL be
// true" herself, mid-call. This splits it into distinct clauses for display
// only - questionTextEn itself is never touched, and any string without a
// "[1]" marker (the majority of real questions) passes through unchanged.
const TRAILING_NOTE = /\s*\(((?:Exception|Reason)\s*:[^)]*)\)\s*$/i;

function splitCompoundCriteria(text: string): { clauses: string[]; note?: string } {
  if (!/\[\d+\]/.test(text)) {
    return { clauses: [text] };
  }
  const clauses = text.split(/\sAND\s(?=\[\d+\])/);
  const lastIndex = clauses.length - 1;
  const noteMatch = clauses[lastIndex].match(TRAILING_NOTE);
  if (noteMatch) {
    clauses[lastIndex] = clauses[lastIndex].slice(0, noteMatch.index).trim();
    return { clauses, note: noteMatch[1].trim() };
  }
  return { clauses };
}

function QuestionTitle({ text }: { text: string }) {
  const { clauses, note } = splitCompoundCriteria(text);
  if (clauses.length === 1) {
    return <div className="step-title">{text}</div>;
  }
  return (
    <>
      <div className="step-title taq-criteria-list">
        {clauses.map((clause, index) => (
          <span className="taq-criteria-item" key={index}>
            {index > 0 && <span className="taq-criteria-and">AND</span>}
            {clause.trim()}
          </span>
        ))}
      </div>
      {note && <div className="step-rationale">{note}</div>}
    </>
  );
}

/**
 * item.taqResponses (a real, persisted Record<questionId, boolean> - see
 * QueueContextUpdateSchema) is the source of truth for which TAQ questions
 * have been answered and how. Local `answers` state (keyed by index into the
 * sorted question list, since choose()/rendering work off position) is
 * hydrated from it once the question list loads, so reopening a held,
 * handed-off, or already-completed call rebuilds the real answer trail and
 * progress bar instead of starting blank from the current browser tab's own
 * click history.
 *
 * The full question list is fetched from GET /api/v1/protocols/:protocolId
 * rather than read from item.preparedProtocol.acuityQuestionPreview - that
 * preview is intentionally trimmed (e.g. 8 of a real protocol's 30
 * questions) for lightweight display elsewhere, and using it here silently
 * truncated the real STCC decision tree, letting an all-"No" answer set
 * reach Self-Care without ever presenting the questions further down the
 * real list that a Yes should have matched.
 */
export function QuestionsStage({
  item,
  isReadOnly,
  onDispositionReached
}: {
  item: QueueItem;
  isReadOnly: boolean;
  onDispositionReached: () => void;
}) {
  const { updateItemContext, moveItem } = useQueue();
  const [questions, setQuestions] = useState<ProtocolTaqQuestion[] | undefined>(undefined);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [reviewOpenIndex, setReviewOpenIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  // A nurse can override the auto keyword-matched guideline from the Reason &
  // Rule-Out stage's ProtocolMatchPanel (writes item.matchedProtocolId there,
  // before any TAQ has been answered) - that choice takes precedence over the
  // preparedProtocol's keyword-search suggestion for which question set is
  // actually presented and committed here.
  const protocolId = item.matchedProtocolId ?? item.preparedProtocol?.primaryProtocolId;

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
        setQuestions([...detail.protocol.questions].sort((a, b) => a.acuityOrder - b.acuityOrder));
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught.message : "Failed to load protocol questions.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [protocolId]);

  useEffect(() => {
    if (!questions || questions.length === 0 || !item.taqResponses) {
      return;
    }
    setAnswers((current) => {
      if (Object.keys(current).length > 0) {
        // Already hydrated (or the nurse has started answering live in this
        // tab) - never clobber in-progress local state on a later re-render.
        return current;
      }
      const hydrated: Record<number, boolean> = {};
      questions.forEach((question, index) => {
        const persisted = item.taqResponses?.[question.id];
        if (typeof persisted === "boolean") {
          hydrated[index] = persisted;
        }
      });
      return Object.keys(hydrated).length > 0 ? hydrated : current;
    });
    // Only re-run when the question list itself changes - item.taqResponses
    // updates on every local answer too, and re-running this against a
    // stale closure would fight with choose()'s own setAnswers calls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  if (!item.preparedProtocol) {
    return (
      <section aria-label="Questions">
        <p className="action-sub-note">No protocol questions are available for this call yet.</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <p className="cockpit-action-error" role="alert">
        {loadError}
      </p>
    );
  }

  if (!questions) {
    return (
      <section aria-label="Questions">
        <p className="action-sub-note">Loading protocol questions...</p>
      </section>
    );
  }

  if (questions.length === 0) {
    return (
      <section aria-label="Questions">
        <p className="action-sub-note">No protocol questions are available for this call yet.</p>
      </section>
    );
  }

  const alreadyDecided = Boolean(item.dispositionCode);
  const firstYesIndex = Object.keys(answers)
    .map(Number)
    .filter((index) => answers[index])
    .sort((a, b) => a - b)[0];
  const yesAt = firstYesIndex !== undefined ? firstYesIndex : -1;
  const answeredCount = Object.keys(answers).length;
  const allAnsweredNo = answeredCount === questions.length && yesAt === -1;

  function frontierIndex(): number {
    for (let i = 0; i < questions!.length; i++) {
      if (!(i in answers)) {
        return i;
      }
    }
    return questions!.length;
  }

  const lastVisible = yesAt !== -1 ? yesAt : Math.min(frontierIndex(), questions.length - 1);
  const progressPct =
    yesAt !== -1 || allAnsweredNo ? 100 : Math.round((frontierIndex() / questions.length) * 100);

  async function choose(index: number, yes: boolean) {
    if (isReadOnly || alreadyDecided) {
      return;
    }
    const next: Record<number, boolean> = {};
    for (const key of Object.keys(answers)) {
      const numKey = Number(key);
      if (numKey < index) {
        next[numKey] = answers[numKey];
      }
    }
    next[index] = yes;
    setAnswers(next);
    setReviewOpenIndex(null);
    setBusy(true);
    setActionError("");

    try {
      const question = questions![index];
      // Persist every individual TAQ answer (not just the terminal Yes) so
      // the full question-by-question record survives a hold/resume, a
      // handoff to another nurse, and is available for read-only review
      // (e.g. the Service Manager Board's expanded call detail) - previously
      // only the single terminal question id was ever recorded.
      const updatedTaqResponses = { ...(item.taqResponses ?? {}), [question.id]: yes };
      if (yes) {
        // A Yes on any TAQ always fixes the disposition immediately - no
        // further questions are asked once one is answered Yes. The exact
        // question id is stashed in clinicalApproval (a free-form JSON field
        // already patchable through QueueContextUpdateSchema, no backend
        // change) so the Disposition stage can show care advice for this
        // precise real STCC question rather than the coarser, collapsed
        // dispositionCode - several distinct real STCC levels (e.g. Call EMS
        // 911 Now / Go to ED Now / Go to ED-UCC Now) share the same
        // dispositionCode in this app's 8-value enum, so filtering by that
        // code alone would show all of their advice mixed together.
        await updateItemContext(item.id, {
          matchedProtocolId: protocolId,
          calculatedSeverity: severityMap[question.severity],
          dispositionCode: question.dispositionCode,
          // destinationName must be set in this same atomic update - the
          // backend locks destinationName (along with dispositionCode etc.)
          // to its value as of the moment currentStage reaches DISPOSITION;
          // a later separate PATCH attempting to set it for the first time
          // is rejected with 409 QUEUE_DISPOSITION_LOCKED.
          destinationName: QATAR_DESTINATION_BY_CODE[question.dispositionCode] ?? question.dispositionCode,
          clinicalApproval: { ...(item.clinicalApproval ?? {}), terminalQuestionId: question.id },
          taqResponses: updatedTaqResponses
        });
        await moveItem(item.id, "DISPOSITION");
        onDispositionReached();
      } else if (Object.keys(next).length === questions!.length) {
        await updateItemContext(item.id, {
          matchedProtocolId: protocolId,
          calculatedSeverity: "SELF_CARE",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          destinationName: QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS,
          taqResponses: updatedTaqResponses
        });
        await moveItem(item.id, "DISPOSITION");
        onDispositionReached();
      } else {
        // Not yet terminal - just persist this individual No answer.
        await updateItemContext(item.id, { taqResponses: updatedTaqResponses });
      }
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Failed to record answer.");
    } finally {
      setBusy(false);
    }
  }

  function toggleReview(index: number) {
    if (!(index in answers)) {
      return;
    }
    setReviewOpenIndex((current) => (current === index ? null : index));
  }

  // Scoped "No to all": clears every not-yet-answered question at the SAME
  // real STCC disposition level as the current frontier question only - never
  // past it, unlike a blanket "answer everything No" button, which would
  // silently skip lower-acuity questions the nurse hasn't actually ruled out
  // (a real safety regression). Mirrors the per-level grouping already used
  // in the other nurse workspace (NurseWorkspaceRedesign.tsx), computed here
  // on the fly against the flat question list rather than requiring a
  // restructured grouped UI.
  function frontierLevelGroup(): number[] {
    const start = frontierIndex();
    if (start >= questions!.length) {
      return [];
    }
    const level = questions![start].dispositionLevel;
    const group: number[] = [];
    for (let i = start; i < questions!.length; i++) {
      if (questions![i].dispositionLevel !== level) {
        break;
      }
      group.push(i);
    }
    return group;
  }

  async function noToAllAtLevel() {
    if (isReadOnly || alreadyDecided || busy) {
      return;
    }
    const group = frontierLevelGroup();
    if (group.length === 0) {
      return;
    }
    const next: Record<number, boolean> = { ...answers };
    for (const idx of group) {
      next[idx] = false;
    }
    setAnswers(next);
    setReviewOpenIndex(null);
    setBusy(true);
    setActionError("");

    try {
      const updatedTaqResponses = { ...(item.taqResponses ?? {}) };
      for (const idx of group) {
        updatedTaqResponses[questions![idx].id] = false;
      }
      if (Object.keys(next).length === questions!.length) {
        await updateItemContext(item.id, {
          matchedProtocolId: protocolId,
          calculatedSeverity: "SELF_CARE",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          destinationName: QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS,
          taqResponses: updatedTaqResponses
        });
        await moveItem(item.id, "DISPOSITION");
        onDispositionReached();
      } else {
        await updateItemContext(item.id, { taqResponses: updatedTaqResponses });
      }
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Failed to record answers.");
    } finally {
      setBusy(false);
    }
  }

  const terminalQuestion = yesAt !== -1 ? questions[yesAt] : undefined;
  const dispositionReached = yesAt !== -1 || allAnsweredNo || alreadyDecided;

  return (
    <section aria-label="Questions">
      <div className="action-sub-note">
        Questions are presented high-to-low acuity; a Yes fixes the disposition, a No unlocks the
        next item.
      </div>

      <div className="prog-wrap">
        <div className="prog-row">
          <span>{dispositionReached ? "Complete - disposition reached" : `Question ${frontierIndex() + 1} of ${questions.length}`}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="prog-track">
          <div className="prog-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {!alreadyDecided && !dispositionReached && frontierLevelGroup().length > 1 && (
        <div className="taq-level-actions">
          <button type="button" className="no-to-all-btn" onClick={noToAllAtLevel} disabled={busy}>
            No to all at this level ({frontierLevelGroup().length} questions)
          </button>
        </div>
      )}

      <div id="flow">
        {questions.slice(0, lastVisible + 1).map((question, index) => {
            const answered = index in answers;
            if (!answered) {
              return (
                <div key={question.id} className="step" style={colorStyleForSeverity(question.severity)}>
                  <div className="step-hdr">
                    <div className="step-num">{index + 1}</div>
                    <div>
                      <div className="gtag">
                        {question.severity}
                        {question.telemedicineEligible && (
                          <span className="telemedicine-badge" title="Telemedicine eligible">
                            &#128249; Video
                          </span>
                        )}
                      </div>
                      <QuestionTitle text={question.questionTextEn} />
                      {question.rationaleEn && <div className="step-rationale">{question.rationaleEn}</div>}
                    </div>
                  </div>
                  <div className="choices">
                    <div className="choice" onClick={() => choose(index, true)}>
                      Yes
                    </div>
                    <div className="choice" onClick={() => choose(index, false)}>
                      No
                    </div>
                  </div>
                </div>
              );
            }

            const isOpenForReview = reviewOpenIndex === index;
            return (
              <div
                key={question.id}
                className={`step asked${isOpenForReview ? " open" : ""}`}
                style={colorStyleForSeverity(question.severity)}
              >
                <div className="step-hdr" onClick={() => toggleReview(index)} style={{ cursor: "pointer" }}>
                  <div className="step-num">&#10003;</div>
                  <div style={{ flex: 1 }}>
                    <div className="gtag">{question.severity}</div>
                    <QuestionTitle text={question.questionTextEn} />
                    {question.rationaleEn && <div className="step-rationale">{question.rationaleEn}</div>}
                    <div className="ans">&#10132; {answers[index] ? "Yes" : "No"}</div>
                  </div>
                  <div className="chev">&#9654;</div>
                </div>
                {isOpenForReview && (
                  <div className="choices" style={{ marginTop: 10 }}>
                    <div
                      className={`choice${answers[index] ? " sel-yes" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        choose(index, true);
                      }}
                    >
                      Yes
                    </div>
                    <div
                      className={`choice${!answers[index] ? " sel-no" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        choose(index, false);
                      }}
                    >
                      No
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {(yesAt !== -1 || alreadyDecided) && (
          <div
            className="r-card"
            style={colorStyleForSeverity(
              terminalQuestion?.severity ?? (item.calculatedSeverity ? displaySeverityByQueueSeverity[item.calculatedSeverity] : undefined)
            )}
          >
            <div className="r-title">
              {(terminalQuestion?.severity ?? (item.calculatedSeverity ? displaySeverityByQueueSeverity[item.calculatedSeverity] : "")).toString().toUpperCase()}
            </div>
            {yesAt !== -1 && <div className="r-sub">Triggered by Question {yesAt + 1}</div>}
            <div className="r-detail">{item.dispositionCode}</div>
          </div>
        )}
        {allAnsweredNo && yesAt === -1 && !alreadyDecided && (
          <div className="r-card" style={colorStyleForSeverity(undefined)}>
            <div className="r-title">NO CRITERIA MET</div>
            <div className="r-sub">All {questions.length} questions answered &ldquo;No&rdquo;</div>
          </div>
        )}
      </div>

      {actionError && (
        <p className="cockpit-action-error" role="alert">
          {actionError}
        </p>
      )}

      {dispositionReached && !isReadOnly && (
        <div className="flow-actions">
          <button type="button" className="complete-btn" onClick={onDispositionReached} disabled={busy}>
            Disposition &amp; Advice &rarr;
          </button>
        </div>
      )}
    </section>
  );
}
