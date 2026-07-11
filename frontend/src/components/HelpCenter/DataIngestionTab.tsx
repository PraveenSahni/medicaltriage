import { Database } from "lucide-react";
import { DataStrategyHelpCard } from "./shared";
import type { DataStrategyCard } from "./types";

export function DataIngestionTab({ cards }: { cards: DataStrategyCard[] }) {
  return (
    <article className="help-card help-card-wide">
      <div className="help-card-heading">
        <span className="help-icon">
          <Database className="h-5 w-5" />
        </span>
        <div>
          <span className="tag-label">DATA CONSUMPTION STRATEGY</span>
          <h3 className="help-title">Clinical data ingestion and migration model</h3>
          <p>
            The help library now shows the two ingestion strategies behind the recent Phase I
            backend work: open-source clinical standards for MVP validation, and a controlled
            licensed-content migration path for UAT or Go-Live.
          </p>
        </div>
      </div>
      <div className="help-compare-grid">
        {cards.map((card) => (
          <DataStrategyHelpCard key={card.title} card={card} />
        ))}
      </div>
    </article>
  );
}
