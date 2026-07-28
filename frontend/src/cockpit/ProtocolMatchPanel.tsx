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

  if (!prepared) {
    return null;
  }

  const suggestions = prepared.suggestions ?? [];
  // The nurse can override the auto-matched guideline (prepared.primaryProtocolId
  // is only a keyword-search suggestion) by picking any candidate below - that
  // choice is what QuestionsStage.tsx actually fetches/commits, not silently
  // overridden by re-running the keyword search on a later reason-text edit.
  const selectedProtocolId = item.matchedProtocolId ?? prepared.primaryProtocolId;
  const questionsStarted = Boolean(item.taqResponses && Object.keys(item.taqResponses).length > 0);
  const canSelect = !isReadOnly && !item.dispositionCode && !questionsStarted && suggestions.length > 0;

  async function selectProtocol(protocolId: string) {
    setBusy(true);
    setSelectError("");
    try {
      await updateItemContext(item.id, { matchedProtocolId: protocolId });
    } catch (caught) {
      setSelectError(caught instanceof Error ? caught.message : "Failed to select guideline.");
    } finally {
      setBusy(false);
    }
  }

  const selected = selectedProtocolId
    ? suggestions.find((suggestion) => suggestion.protocolId === selectedProtocolId)
    : undefined;
  const alternates = selected
    ? suggestions.filter((suggestion) => suggestion.protocolId !== selected.protocolId)
    : suggestions;
  const selectedTitle = selected?.titleEn ?? prepared.primaryProtocolTitle;

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
        <div className="protocol-match-empty">No matching guideline found for the current reason and keywords.</div>
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
            <div className="protocol-match-empty">No matching guideline found for the current reason and keywords.</div>
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
              onSelect={() => selectProtocol(selected.protocolId)}
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
                    onSelect={() => selectProtocol(suggestion.protocolId)}
                    key={suggestion.protocolId}
                  />
                ))}
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
