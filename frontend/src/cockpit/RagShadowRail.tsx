import { useState } from "react";
import type { QueueItem, QueueProtocolSuggestion } from "../QueueContext";

const agreementLabels: Record<string, string> = {
  FULL_MATCH: "Full agreement",
  PARTIAL_MATCH: "Partial agreement",
  NO_MATCH: "No agreement",
  NO_DETERMINISTIC_CANDIDATE: "No deterministic candidate",
  NO_SHADOW_CANDIDATE: "No shadow candidate"
};

const agreementTone: Record<string, string> = {
  FULL_MATCH: "rag-tone-home",
  PARTIAL_MATCH: "rag-tone-hcp4",
  NO_MATCH: "rag-tone-ems",
  NO_DETERMINISTIC_CANDIDATE: "rag-tone-muted",
  NO_SHADOW_CANDIDATE: "rag-tone-muted"
};

function CandidateRow({ candidate }: { candidate: QueueProtocolSuggestion }) {
  return (
    <div className="rag-rail-candidate">
      <div className="rag-rail-candidate-head">
        <span className="rag-rail-candidate-title">{candidate.titleEn}</span>
        <span className="rag-rail-candidate-score">Score {candidate.score}</span>
      </div>
      {candidate.matchedTerms.length > 0 && (
        <div className="rag-rail-candidate-terms">
          {candidate.matchedTerms.map((term) => (
            <span className="rag-rail-tag" key={term}>
              {term}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function RagShadowRail({ item }: { item: QueueItem }) {
  const [expanded, setExpanded] = useState(false);
  const ragShadow = item.preparedProtocol?.ragShadow;

  return (
    <aside className="cockpit-rag-rail" aria-label="RAG shadow advisory comparison">
      <button
        type="button"
        className="rag-rail-toggle"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
      >
        <span>RAG Shadow (Advisory)</span>
        <span className="rag-rail-toggle-icon">{expanded ? "−" : "+"}</span>
      </button>

      {!ragShadow && <div className="rag-rail-empty">No shadow comparison available for this call yet.</div>}

      {expanded && ragShadow && (
        <div className="rag-rail-body">
          <div className={`rag-rail-agreement ${agreementTone[ragShadow.comparison.agreement] ?? "rag-tone-muted"}`}>
            <span>{agreementLabels[ragShadow.comparison.agreement] ?? ragShadow.comparison.agreement}</span>
            <span className="rag-rail-confidence">{Math.round(ragShadow.retrieval.confidence * 100)}% confidence</span>
          </div>

          {ragShadow.suggestedProtocolCandidates.length > 0 && (
            <div className="rag-rail-section">
              <div className="rag-rail-section-label">Shadow candidates</div>
              {ragShadow.suggestedProtocolCandidates.map((candidate) => (
                <CandidateRow candidate={candidate} key={candidate.protocolId} />
              ))}
            </div>
          )}

          {ragShadow.prohibitedActionAcknowledgement.length > 0 && (
            <div className="rag-rail-section">
              <div className="rag-rail-section-label">Boundary</div>
              <ul className="rag-rail-boundary-list">
                {ragShadow.prohibitedActionAcknowledgement.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rag-rail-note">
            Advisory only - this comparison cannot decide disposition and always requires nurse review.
          </div>
        </div>
      )}
    </aside>
  );
}
