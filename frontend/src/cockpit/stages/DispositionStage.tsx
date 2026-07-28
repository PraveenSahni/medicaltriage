import { useEffect, useState } from "react";
import { useQueue, type QueueItem } from "../../QueueContext";
import { colorStyleForSeverity } from "../severityColors";
import { fetchProtocolDetail, type ProtocolCareAdvice, type ProtocolSupplemental } from "../api/protocols";
import { QATAR_DESTINATION_BY_CODE } from "../qatarDestinations";

const severityForDispositionCode: Record<string, string> = {
  HMC_EMERGENCY_DEPARTMENT: "Emergency",
  SIDRA_PEDIATRIC_ED: "Emergency",
  HMC_URGENT_REVIEW: "Urgent",
  IST_HIA_MIDFIELD_MEDICAL_CENTRE: "Urgent",
  IST_OLD_AIRPORT_MEDICAL_COMMISSION: "Urgent",
  PHCC_URGENT_CARE_OR_TELECONSULT: "Routine",
  OUTSTATION_TELECONSULT_ESCALATION: "Routine",
  SELF_CARE_WITH_CALLBACK_PRECAUTIONS: "Self-care"
};

/**
 * Care advice is fetched from GET /api/v1/protocols/:protocolId and filtered
 * to the items matching the reached dispositionCode - the queue item's own
 * preparedProtocol has no field carrying full care-advice content at all
 * (only `careAdviceIds: string[]` on each TAQ preview and a boolean
 * `resourceSectionsAvailable.careAdvice` flag), so reading
 * `preparedProtocol.careAdviceItems` here always returned nothing.
 *
 * Given Now / Send Later checkboxes are presentation-only, matching the
 * approved preview exactly (its own reference implementation never
 * persists these either - see renderDispositionPanel in the preview HTML).
 * Given Now is always shown checked+disabled; Send Later is enabled only
 * when the advice item's patientSendable flag is true. The backend has no
 * field to persist an acknowledgement of either - that remains a real
 * backend gap, not something this UI fakes.
 */
export function DispositionStage({
  item,
  isReadOnly,
  onContinue
}: {
  item: QueueItem;
  isReadOnly: boolean;
  onContinue: () => void;
}) {
  const { updateItemContext, moveItem } = useQueue();
  const [destinationName, setDestinationName] = useState(
    item.destinationName || QATAR_DESTINATION_BY_CODE[item.dispositionCode ?? ""] || ""
  );
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [careAdvice, setCareAdvice] = useState<ProtocolCareAdvice[]>([]);
  const [supplementals, setSupplementals] = useState<ProtocolSupplemental[]>([]);
  const [headingOverride, setHeadingOverride] = useState<string | undefined>(undefined);
  const [loadError, setLoadError] = useState("");

  const protocolId = item.preparedProtocol?.primaryProtocolId;
  const severity = severityForDispositionCode[item.dispositionCode ?? ""] ?? item.calculatedSeverity;
  const terminalQuestionId =
    typeof item.clinicalApproval?.terminalQuestionId === "string" ? item.clinicalApproval.terminalQuestionId : undefined;

  useEffect(() => {
    let cancelled = false;
    if (!protocolId || !item.dispositionCode) {
      return;
    }
    fetchProtocolDetail(protocolId)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        // Several distinct real STCC disposition levels (e.g. Call EMS 911
        // Now / Go to ED Now / Go to ED-UCC Now) collapse onto the same
        // dispositionCode in this app's 8-value enum. When we know exactly
        // which real question was answered Yes (terminalQuestionId, stashed
        // in clinicalApproval by QuestionsStage), filter to that question's
        // own careAdviceIds instead - precise, not just same-tier-adjacent.
        const terminalQuestion = terminalQuestionId
          ? detail.protocol.questions.find((q) => q.id === terminalQuestionId)
          : undefined;
        const matched = terminalQuestion
          ? detail.protocol.careAdvice.filter((advice) => terminalQuestion.careAdviceIds?.includes(advice.id))
          : detail.protocol.careAdvice.filter((advice) => advice.dispositionCode === item.dispositionCode);
        setCareAdvice(matched);
        setSupplementals(detail.protocol.supplementals ?? []);
        // The first matched advice item's own title is the real STCC
        // disposition heading text (e.g. "Call EMS 911 Now") when a precise
        // terminal question was resolved - more specific than the collapsed
        // dispositionCode label.
        setHeadingOverride(terminalQuestion ? matched[0]?.titleEn : undefined);
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(caught instanceof Error ? caught.message : "Failed to load care advice.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [protocolId, item.dispositionCode, terminalQuestionId]);

  async function approveAndContinue() {
    setBusy(true);
    setActionError("");
    try {
      // destinationName is set atomically with dispositionCode back in
      // QuestionsStage - the backend locks it once currentStage reaches
      // DISPOSITION (see hasCompleteVitals/validateClinicalSequence in
      // queueOrchestration.ts) and rejects a later PATCH that changes it
      // with 409 QUEUE_DISPOSITION_LOCKED. Only include it here if the nurse
      // actually edited it to something different from what's persisted -
      // that's a legitimate override attempt the backend gets to accept or
      // reject on its own terms, not something this UI should paper over.
      const update: Record<string, unknown> = { clinicalApproval: { approvedAtIso: new Date().toISOString() } };
      if (destinationName && destinationName !== item.destinationName) {
        update.destinationName = destinationName;
      }
      await updateItemContext(item.id, update);
      await moveItem(item.id, "SBAR");
      onContinue();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Failed to save disposition.");
    } finally {
      setBusy(false);
    }
  }

  if (!item.dispositionCode) {
    return (
      <section aria-label="Disposition and Advice">
        <div className="action-sub-note">
          The clinical disposition is determined by rules and nurse-confirmed answers. Care
          advice is mapped from approved content.
        </div>
        <div className="iaq-note">No disposition reached yet - complete the Questions stage first.</div>
      </section>
    );
  }

  return (
    <section aria-label="Disposition and Advice">
      <div className="action-sub-note">
        The clinical disposition is determined by rules and nurse-confirmed answers. Care advice
        is mapped from approved content.
      </div>

      <div className="r-card" style={colorStyleForSeverity(severity)}>
        <div className="r-title">{(headingOverride ?? item.dispositionCode.replace(/_/g, " ")).toUpperCase()}</div>
        <div className="r-detail">Confirm destination and deliver care advice below.</div>

        <label className="field-label" htmlFor="destination-name">
          Destination
        </label>
        <input
          id="destination-name"
          className="input-control"
          value={destinationName}
          disabled={isReadOnly}
          onChange={(event) => setDestinationName(event.target.value)}
        />
      </div>

      {loadError && (
        <p className="cockpit-action-error" role="alert">
          {loadError}
        </p>
      )}

      {careAdvice.length > 0 && (
        <div className="file-grid">
          {careAdvice.map((advice) => (
            <div key={advice.id} className="fc">
              <b>{advice.titleEn}</b>
              {advice.sanitizedHtmlEn ? (
                <div className="care-advice-rich-text" dangerouslySetInnerHTML={{ __html: advice.sanitizedHtmlEn }} />
              ) : (
                advice.instructionTextEn
              )}
              <div style={{ marginTop: 8 }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.8rem", marginRight: 18 }}>
                  <input type="checkbox" checked disabled /> Given Now
                </label>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.8rem",
                    opacity: advice.patientSendable && !isReadOnly ? 1 : 0.45
                  }}
                >
                  <input type="checkbox" disabled={!advice.patientSendable || isReadOnly} /> Send Later
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {supplementals.length > 0 && (
        <div className="disposition-reference-section">
          <div className="disposition-reference-heading">Reference &amp; Patient Education</div>
          <div className="file-grid">
            {supplementals.map((supplemental) => (
              <div key={supplemental.id} className="fc">
                <b>{supplemental.titleEn}</b>
                <div className="disposition-reference-type">{supplemental.supplementalType}</div>
                {supplemental.sanitizedHtmlEn ? (
                  <div className="care-advice-rich-text" dangerouslySetInnerHTML={{ __html: supplemental.sanitizedHtmlEn }} />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap" }}>{supplemental.plainTextEn}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {actionError && (
        <p className="cockpit-action-error" role="alert">
          {actionError}
        </p>
      )}

      {!isReadOnly && (
        <div className="flow-actions">
          <button type="button" className="complete-btn" onClick={approveAndContinue} disabled={busy}>
            Continue to SBAR &rarr;
          </button>
        </div>
      )}
    </section>
  );
}
