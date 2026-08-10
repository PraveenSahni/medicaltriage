import "./cockpit.css";
import { useMemo, useState } from "react";
import { useQueue, type QueueItem } from "../QueueContext";
import type { AuthenticatedSession } from "../auth/session";
import { Sidebar } from "./Sidebar";
import { NoActiveCall } from "./NoActiveCall";
import { ActiveCallHeader } from "./ActiveCallHeader";
import { ReasonRuleOutStage } from "./stages/ReasonRuleOutStage";
import { QuestionsStage } from "./stages/QuestionsStage";
import { DispositionStage } from "./stages/DispositionStage";
import { CompletionStage } from "./stages/CompletionStage";
import { RagShadowRail } from "./RagShadowRail";
import { completeQueueItem } from "./completeQueueItem";

export type CockpitStageKey = "reason" | "questions" | "disposition" | "sbar";

export const COCKPIT_STAGES: Array<{ key: CockpitStageKey; label: string; icon: string }> = [
  { key: "reason", label: "1 · Reason & Rule-Out", icon: "\u{1F50D}" },
  { key: "questions", label: "2 · Questions", icon: "☑" },
  { key: "disposition", label: "3 · Disposition & Advice", icon: "⚕" },
  { key: "sbar", label: "4 · SBAR / Complete", icon: "\u{1F4CB}" }
];

const MAX_HELD_CALLS = 1;

function stageKeyForQueueItem(item: QueueItem): CockpitStageKey {
  switch (item.currentStage) {
    case "DISPOSITION":
      return "disposition";
    case "SBAR":
      return "sbar";
    case "PROTOCOL":
      return "questions";
    default:
      return "reason";
  }
}

type CockpitAppProps = {
  session: AuthenticatedSession;
  onLogout: () => void;
  onBack?: () => void;
};

export function CockpitApp({ session, onLogout, onBack }: CockpitAppProps) {
  const {
    queue,
    activeItem,
    loading,
    error,
    callCenterSessionsByQueueItemId,
    updateItemContext,
    moveItem,
    setActiveItemById,
    clearActiveItem
  } = useQueue();
  const [stage, setStage] = useState<CockpitStageKey>("reason");
  const [escalateError, setEscalateError] = useState("");

  const heldQueueItemIds = useMemo(
    () =>
      new Set(
        Object.entries(callCenterSessionsByQueueItemId)
          .filter(([, session]) => session.status === "HELD")
          .map(([queueItemId]) => queueItemId)
      ),
    [callCenterSessionsByQueueItemId]
  );

  const activeCall = activeItem && callCenterSessionsByQueueItemId[activeItem.id];
  const isActiveCallHeld = activeCall?.status === "HELD";
  const isReadOnly = activeItem?.status === "COMPLETED";

  function openCall(item: QueueItem) {
    // A nurse who has already reached a disposition on the call she's
    // leaving shouldn't have to remember to come back and click "Complete
    // Call" - moving on to answer a different call is itself a clear signal
    // she's done reviewing this one. This never fires mid-review (Reason,
    // Questions, or Disposition & Advice stages have no dispositionCode/
    // destinationName yet, or the nurse hasn't reached SBAR), only once
    // she's already navigating away from a fully-triaged, still-open call.
    if (
      activeItem &&
      activeItem.id !== item.id &&
      activeItem.status !== "COMPLETED" &&
      activeItem.dispositionCode &&
      activeItem.destinationName
    ) {
      void completeQueueItem(activeItem, updateItemContext, moveItem).catch(() => {
        // Non-critical - the outgoing call simply stays open for the nurse
        // (or another nurse) to complete manually later; nothing here should
        // block switching to the newly-selected call.
      });
    }
    setActiveItemById(item.id);
    setStage(stageKeyForQueueItem(item));
  }

  // The Service Manager Board buckets a call into its "Reason & Rule-Out"
  // vs "Questions" column purely from the backend's currentStage
  // (boardMapping.ts) - clicking "Continue" here previously only flipped
  // this component's own local `stage` state, so the backend record stayed
  // at INTAKE for the entire Reason & Rule-Out + Questions workflow and the
  // board never reflected real progress (confirmed live: a call still deep
  // in TAQ questions kept showing under Reason & Rule-Out). Advancing
  // currentStage to PROTOCOL here is the real signal the board needs.
  async function continueToQuestions() {
    if (!activeItem) {
      setStage("questions");
      return;
    }
    try {
      // validateClinicalSequence (queueOrchestration.ts) requires a
      // matchedProtocolId before accepting a move to PROTOCOL -
      // ProtocolMatchPanel defaults display to the top suggestion without
      // ever persisting it unless the nurse explicitly clicks "Use this
      // guideline", so persist that same default here if nothing was
      // explicitly chosen yet.
      if (!activeItem.matchedProtocolId && activeItem.preparedProtocol?.primaryProtocolId) {
        await updateItemContext(activeItem.id, {
          matchedProtocolId: activeItem.preparedProtocol.primaryProtocolId
        });
      }
      await moveItem(activeItem.id, "PROTOCOL");
    } catch {
      // Non-critical - the nurse should never be blocked from continuing
      // her review because a background stage-sync PATCH failed; the
      // Service Manager Board simply won't reflect this call's true stage
      // until a later successful transition.
    }
    setStage("questions");
  }

  async function escalateEmergencyNow() {
    if (!activeItem) {
      return;
    }
    setEscalateError("");
    const emergencyQuestion = activeItem.preparedProtocol?.acuityQuestionPreview?.[0];
    try {
      await updateItemContext(activeItem.id, {
        calculatedSeverity: "EMERGENCY",
        matchedProtocolId: activeItem.preparedProtocol?.primaryProtocolId,
        dispositionCode: emergencyQuestion?.dispositionCode ?? "HMC_EMERGENCY_DEPARTMENT",
        floorSource: "judgment"
      });
      await moveItem(activeItem.id, "DISPOSITION");
      setStage("questions");
    } catch (caught) {
      setEscalateError(caught instanceof Error ? caught.message : "Escalation failed.");
    }
  }

  return (
    <div id="cockpit-root" className="cockpit-shell">
      <div className="cockpit-layout">
        <Sidebar
          queue={queue}
          loading={loading}
          error={error}
          // A held call stays as QueueContext's activeItem (only its call-center
          // session flips to HELD) - pass undefined here once held so Sidebar's
          // tagForItem doesn't treat it as still occupying the one "active"
          // slot, which previously locked the whole queue even with only 1
          // call held (see Sidebar.tsx's tooManyHeld for the real cap logic).
          activeItemId={isActiveCallHeld ? undefined : activeItem?.id}
          heldQueueItemIds={heldQueueItemIds}
          maxHeldCalls={MAX_HELD_CALLS}
          currentUserId={session.user.id}
          onOpenCall={openCall}
          session={session}
          onLogout={onLogout}
          onBack={onBack}
        />

        <main className="cockpit-main">
          {!activeItem || isActiveCallHeld ? (
            <NoActiveCall />
          ) : (
            <>
              <ActiveCallHeader
                item={activeItem}
                session={session}
                isHeld={isActiveCallHeld}
                isReadOnly={isReadOnly}
                isEscalated={activeItem.safetyFloorActive}
                escalationSource={
                  activeItem.safetyFloorSource === "judgment" || activeItem.safetyFloorSource === "symptom"
                    ? activeItem.safetyFloorSource
                    : undefined
                }
                onEscalate={escalateEmergencyNow}
              />
              {escalateError && (
                <p className="cockpit-action-error" role="alert">
                  {escalateError}
                </p>
              )}

              <div className="stage-tabs" role="tablist" aria-label="Clinical workflow stage">
                {COCKPIT_STAGES.map((candidate) => (
                  <button
                    key={candidate.key}
                    type="button"
                    role="tab"
                    aria-selected={stage === candidate.key}
                    aria-controls="cockpit-stage-body"
                    className={`stage-tab${stage === candidate.key ? " stage-tab-active" : ""}`}
                    onClick={() => setStage(candidate.key)}
                  >
                    <span className="stg-icon">{candidate.icon}</span>
                    {candidate.label}
                  </button>
                ))}
              </div>

              <div className="cockpit-stage-body" id="cockpit-stage-body" role="tabpanel" aria-label={`${stage} stage`}>
                {stage === "reason" && (
                  <ReasonRuleOutStage item={activeItem} isReadOnly={isReadOnly} onContinue={continueToQuestions} />
                )}
                {stage === "questions" && (
                  <QuestionsStage
                    item={activeItem}
                    isReadOnly={isReadOnly}
                    onDispositionReached={() => setStage("disposition")}
                  />
                )}
                {stage === "disposition" && (
                  <DispositionStage item={activeItem} isReadOnly={isReadOnly} onContinue={() => setStage("sbar")} />
                )}
                {stage === "sbar" && (
                  <CompletionStage
                    item={activeItem}
                    isReadOnly={isReadOnly}
                    onCallCompleted={() => {
                      clearActiveItem();
                      setStage("reason");
                    }}
                  />
                )}
              </div>
            </>
          )}
        </main>

        {activeItem && !isActiveCallHeld && <RagShadowRail item={activeItem} />}
      </div>
    </div>
  );
}
