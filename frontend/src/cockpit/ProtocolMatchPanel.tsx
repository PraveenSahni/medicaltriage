import { useState } from "react";
import { useQueue, type QueueItem, type QueueProtocolSuggestion } from "../QueueContext";

// Real STCC Algorithm.Acuity is 1 (most urgent) to 5 (least urgent) - color
// scale mirrors that direction, reusing this app's existing severity palette
// (red -> amber -> blue -> green) rather than inventing a new one.
const ACUITY_COLOR: Record<number, string> = {
  1: "#a32d2d",
  2: "#c0552b",
  3: "#7a5d00",
  4: "#185fa5",
  5: "#0f6e56"
};

function acuityChip(acuity: number | undefined) {
  if (typeof acuity !== "number") {
    return null;
  }
  const color = ACUITY_COLOR[acuity] ?? "#6b6a66";
  return (
    <span className="protocol-match-acuity-chip" style={{ color, borderColor: color }} title={`Acuity ${acuity} of 5`}>
      Acuity {acuity}
    </span>
  );
}

function formatAgeSex(item: QueueItem): string | null {
  const age = item.patientAge;
  if (!age) {
    return null;
  }
  const parts: string[] = [];
  if (typeof age.ageYears === "number") {
    parts.push(age.ageYears === 1 ? "1 year" : `${age.ageYears} years`);
  }
  if (age.biologicalSex && age.biologicalSex !== "unknown") {
    parts.push(age.biologicalSex === "female" ? "Female" : age.biologicalSex === "male" ? "Male" : age.biologicalSex);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function SuggestionRow({
  suggestion,
  isSelected,
  canSelect,
  busy,
  onSelect
}: {
  suggestion: QueueProtocolSuggestion;
  isSelected: boolean;
  canSelect: boolean;
  busy: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`protocol-match-suggestion${isSelected ? " is-primary" : ""}`}>
      <div className="protocol-match-suggestion-head">
        <span className="protocol-match-suggestion-title">{suggestion.titleEn}</span>
        {acuityChip(suggestion.acuity)}
        <span className="protocol-match-suggestion-score">Score {suggestion.score}</span>
      </div>
      {suggestion.matchedTerms.length > 0 && (
        <div className="protocol-match-tags">
          {suggestion.matchedTerms.map((term) => (
            <span className="protocol-match-tag" key={term}>
              {term}
            </span>
          ))}
        </div>
      )}
      {canSelect && (
        <button
          type="button"
          className="protocol-match-select-btn"
          disabled={isSelected || busy}
          onClick={onSelect}
        >
          {isSelected ? "Selected" : "Use this guideline"}
        </button>
      )}
    </div>
  );
}

export function ProtocolMatchPanel({ item, isReadOnly }: { item: QueueItem; isReadOnly: boolean }) {
  const { updateItemContext } = useQueue();
  const prepared = item.preparedProtocol;
  const ageSexLabel = formatAgeSex(item);
  const [busy, setBusy] = useState(false);
  const [selectError, setSelectError] = useState("");
  const [alternatesExpanded, setAlternatesExpanded] = useState(false);
  const [pendingOverrideProtocolId, setPendingOverrideProtocolId] = useState<string>();
  const [overrideReason, setOverrideReason] = useState("");

  if (!prepared) {
    return null;
  }

  const suggestedProtocolId = prepared.primaryProtocolId;
  const suggestions = prepared.suggestions ?? [];
  // The nurse can override the auto-matched guideline (prepared.primaryProtocolId
  // is only a keyword-search suggestion) by picking any candidate below - that
  // choice is what QuestionsStage.tsx actually fetches/commits, not silently
  // overridden by re-running the keyword search on a later reason-text edit.
  const selectedProtocolId = item.matchedProtocolId ?? prepared.primaryProtocolId;
  const questionsStarted = Boolean(item.taqResponses && Object.keys(item.taqResponses).length > 0);
  const canSelect = !isReadOnly && !item.dispositionCode && !questionsStarted && suggestions.length > 0;

  async function selectProtocol(protocolId: string, protocolOverrideReason?: string) {
    setBusy(true);
    setSelectError("");
    try {
      await updateItemContext(item.id, {
        matchedProtocolId: protocolId,
        ...(protocolOverrideReason ? { protocolOverrideReason } : {})
      });
      setPendingOverrideProtocolId(undefined);
      setOverrideReason("");
    } catch (caught) {
      setSelectError(caught instanceof Error ? caught.message : "Failed to select guideline.");
    } finally {
      setBusy(false);
    }
  }

  function requestProtocolSelection(protocolId: string) {
    if (suggestedProtocolId && protocolId !== suggestedProtocolId) {
      setSelectError("");
      setPendingOverrideProtocolId(protocolId);
      setOverrideReason("");
      return;
    }
    void selectProtocol(protocolId);
  }

  const selected = selectedProtocolId
    ? suggestions.find((suggestion) => suggestion.protocolId === selectedProtocolId)
    : undefined;
  // Exclude the selected guideline from "other candidates" by id, not just
  // when a matching suggestion object was found - otherwise a nurse's
  // override that has since fallen out of the (re-scored) suggestions list
  // still leaves the top keyword match's own entry duplicated below, since
  // it was never actually excluded in that case.
  const alternates = suggestions.filter((suggestion) => suggestion.protocolId !== selectedProtocolId);
  // Only fall back to the top keyword match's title when that IS what's
  // selected (no override, or an override that happens to equal it) -
  // falling back unconditionally previously showed the top match's name
  // under "Selected guideline" even when the nurse had chosen a different
  // protocol no longer present in the current suggestions list, which
  // silently misrepresented her actual choice.
  const selectedTitle =
    selected?.titleEn ?? (selectedProtocolId === prepared.primaryProtocolId ? prepared.primaryProtocolTitle : undefined);

  return (
    <div className="protocol-match-panel">
      <div className="protocol-match-header">
        <span>Keyword &amp; Protocol Match</span>
        {ageSexLabel && <span className="protocol-match-patient">{ageSexLabel}</span>}
      </div>

      {prepared.extractedKeywords.length > 0 && (
        <div className="protocol-match-keywords">
          {prepared.extractedKeywords.map((keyword) => (
            <span className="protocol-match-tag" key={keyword}>
              {keyword}
            </span>
          ))}
        </div>
      )}

      {prepared.status === "PENDING_REASON" && (
        <div className="protocol-match-empty">Awaiting reason for call to search for a matching guideline.</div>
      )}

      {prepared.status === "NO_MATCH" && (
        <>
          <div className="protocol-match-empty">No matching guideline found for the current reason and keywords.</div>
          <div className="protocol-match-select-hint">
            This demo&rsquo;s content library currently covers a limited set of protocols and may not include a
            match for every reason or age group.
          </div>
          {canSelect && suggestions.map((suggestion) => (
            <SuggestionRow
              key={suggestion.protocolId}
              suggestion={suggestion}
              isSelected={false}
              canSelect
              busy={busy}
              onSelect={() => requestProtocolSelection(suggestion.protocolId)}
            />
          ))}
        </>
      )}

      {prepared.status === "AMBIGUOUS" && (
        <>
          <div className="protocol-match-empty">Multiple guidelines match closely. No guideline was selected automatically.</div>
          <div className="protocol-match-select-hint">Review the candidates and explicitly select the clinically appropriate guideline.</div>
          {suggestions.map((suggestion) => (
            <SuggestionRow
              key={suggestion.protocolId}
              suggestion={suggestion}
              isSelected={item.matchedProtocolId === suggestion.protocolId}
              canSelect={canSelect}
              busy={busy}
              onSelect={() => requestProtocolSelection(suggestion.protocolId)}
            />
          ))}
        </>
      )}

      {prepared.status === "PREPARED" && (
        <>
          {selectedTitle ? (
            <div className="protocol-match-primary-label">
              Selected guideline: <strong>{selectedTitle}</strong>
              {item.matchedProtocolId && item.matchedProtocolId !== prepared.primaryProtocolId && (
                <span className="protocol-match-override-note"> (nurse-selected, overriding the top keyword match)</span>
              )}
            </div>
          ) : (
            <>
              <div className="protocol-match-empty">No matching guideline found for the current reason and keywords.</div>
              <div className="protocol-match-select-hint">
                This demo&rsquo;s content library currently covers a limited set of protocols and may not include a
                match for every reason or age group.
              </div>
            </>
          )}

          {canSelect && (
            <div className="protocol-match-select-hint">
              Search results are based on the reason narrative, patient age, and sex. Select the guideline that
              best matches the caller&rsquo;s presentation.
            </div>
          )}

          {questionsStarted && !isReadOnly && (
            <div className="protocol-match-select-hint">
              Guideline selection is locked once triage questions have been answered for this call.
            </div>
          )}

          {selected && (
            <SuggestionRow
              suggestion={selected}
              isSelected
              canSelect={canSelect}
              busy={busy}
              onSelect={() => requestProtocolSelection(selected.protocolId)}
            />
          )}

          {alternates.length > 0 && (
            <div className="protocol-match-alternates">
              <button
                type="button"
                className="rag-rail-toggle"
                onClick={() => setAlternatesExpanded((current) => !current)}
                aria-expanded={alternatesExpanded}
              >
                <span>Other candidates considered ({alternates.length})</span>
                <span className="rag-rail-toggle-icon">{alternatesExpanded ? "−" : "+"}</span>
              </button>
              {alternatesExpanded &&
                alternates.map((suggestion) => (
                  <SuggestionRow
                    suggestion={suggestion}
                    isSelected={false}
                    canSelect={canSelect}
                    busy={busy}
                    onSelect={() => requestProtocolSelection(suggestion.protocolId)}
                    key={suggestion.protocolId}
                  />
                ))}
            </div>
          )}

          {pendingOverrideProtocolId && (
            <div className="protocol-match-override-confirmation" role="group" aria-label="Protocol override rationale">
              <label htmlFor={`protocol-override-reason-${item.id}`}>
                Clinical rationale for overriding the suggested protocol
              </label>
              <textarea
                id={`protocol-override-reason-${item.id}`}
                value={overrideReason}
                maxLength={500}
                onChange={(event) => setOverrideReason(event.target.value)}
                placeholder="Explain why the alternate protocol is clinically more appropriate."
              />
              <div className="protocol-match-override-actions">
                <button
                  type="button"
                  disabled={busy || overrideReason.trim().length < 10}
                  onClick={() => void selectProtocol(pendingOverrideProtocolId, overrideReason.trim())}
                >
                  Confirm protocol override
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingOverrideProtocolId(undefined);
                    setOverrideReason("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {selectError && (
            <p className="cockpit-action-error" role="alert">
              {selectError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
