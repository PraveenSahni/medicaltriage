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

/**
 * The backend has no field to persist individual TAQ Yes/No answers - only
 * the resulting disposition (matchedProtocolId/calculatedSeverity/
 * dispositionCode) round-trips through QueueContextUpdateSchema. This is a
 * real backend gap: per-answer state does not survive a hold/resume or a
 * handoff to another nurse. Answers are kept in local component state during
 * this walkthrough; only the terminal disposition is persisted.
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
          matchedProtocolId: item.preparedProtocol!.primaryProtocolId,
          calculatedSeverity: severityMap[question.severity],
          dispositionCode: question.dispositionCode,
          // destinationName must be set in this same atomic update - the
          // backend locks destinationName (along with dispositionCode etc.)
          // to its value as of the moment currentStage reaches DISPOSITION;
          // a later separate PATCH attempting to set it for the first time
          // is rejected with 409 QUEUE_DISPOSITION_LOCKED.
          destinationName: QATAR_DESTINATION_BY_CODE[question.dispositionCode] ?? question.dispositionCode,
          clinicalApproval: { ...(item.clinicalApproval ?? {}), terminalQuestionId: question.id }
        });
        await moveItem(item.id, "DISPOSITION");
        onDispositionReached();
      } else if (Object.keys(next).length === questions!.length) {
        await updateItemContext(item.id, {
          matchedProtocolId: item.preparedProtocol!.primaryProtocolId,
          calculatedSeverity: "SELF_CARE",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          destinationName: QATAR_DESTINATION_BY_CODE.SELF_CARE_WITH_CALLBACK_PRECAUTIONS
        });
        await moveItem(item.id, "DISPOSITION");
        onDispositionReached();
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

      <div id="flow">
        {!alreadyDecided &&
          questions.slice(0, lastVisible + 1).map((question, index) => {
            const answered = index in answers;
            if (!answered) {
              return (
                <div key={question.id} className="step" style={colorStyleForSeverity(question.severity)}>
                  <div className="step-hdr">
                    <div className="step-num">{index + 1}</div>
                    <div>
                      <div className="gtag">{question.severity}</div>
                      <div className="step-title">{question.questionTextEn}</div>
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
                    <div className="step-title">{question.questionTextEn}</div>
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
