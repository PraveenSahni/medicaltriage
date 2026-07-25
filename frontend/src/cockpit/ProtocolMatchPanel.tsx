import type { QueueItem, QueueProtocolSuggestion } from "../QueueContext";

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

function SuggestionRow({ suggestion, isPrimary }: { suggestion: QueueProtocolSuggestion; isPrimary: boolean }) {
  return (
    <div className={`protocol-match-suggestion${isPrimary ? " is-primary" : ""}`}>
      <div className="protocol-match-suggestion-head">
        <span className="protocol-match-suggestion-title">{suggestion.titleEn}</span>
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
    </div>
  );
}

export function ProtocolMatchPanel({ item }: { item: QueueItem }) {
  const prepared = item.preparedProtocol;
  const ageSexLabel = formatAgeSex(item);

  if (!prepared) {
    return null;
  }

  const suggestions = prepared.suggestions ?? [];
  const primary = prepared.primaryProtocolId
    ? suggestions.find((suggestion) => suggestion.protocolId === prepared.primaryProtocolId)
    : undefined;
  const alternates = primary ? suggestions.filter((suggestion) => suggestion.protocolId !== primary.protocolId) : suggestions;

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
          {prepared.primaryProtocolTitle ? (
            <div className="protocol-match-primary-label">
              Selected guideline: <strong>{prepared.primaryProtocolTitle}</strong>
            </div>
          ) : (
            <div className="protocol-match-empty">No matching guideline found for the current reason and keywords.</div>
          )}

          {primary && <SuggestionRow suggestion={primary} isPrimary />}

          {alternates.length > 0 && (
            <div className="protocol-match-alternates">
              <div className="protocol-match-alternates-label">Other candidates considered</div>
              {alternates.map((suggestion) => (
                <SuggestionRow suggestion={suggestion} isPrimary={false} key={suggestion.protocolId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
