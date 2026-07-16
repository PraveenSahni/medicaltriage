import { BrainCircuit, PhoneCall } from "lucide-react";
import { DataIngestionTab } from "./DataIngestionTab";
import { HelpCard, MiniDefinition } from "./shared";
import type { DataStrategyCard, HelpSummaryCard, TeleTriageStage } from "./types";

export function SystemPurposeTab({
  systemCards,
  dataConsumptionStrategyCards,
  teleTriageStages
}: {
  systemCards: HelpSummaryCard[];
  dataConsumptionStrategyCards: DataStrategyCard[];
  teleTriageStages: TeleTriageStage[];
}) {
  return (
    <section className="help-grid">
      {systemCards.map((card) => (
        <HelpCard key={card.title} title={card.title} body={card.body} icon={card.icon} />
      ))}

      <DataIngestionTab cards={dataConsumptionStrategyCards} />

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <PhoneCall className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">How tele-triage works in this system</h3>
            <p>
              The application is built around a remote nurse-led encounter. It gathers caller
              context, matches a clinical protocol, rules out emergency findings first, applies
              aviation-specific constraints, proposes a route, and prepares documentation for a
              clinician-approved decision.
            </p>
          </div>
        </div>
        <div className="help-route-order" aria-label="Tele-triage operating model">
          {teleTriageStages.map((stage, index) => (
            <div key={stage.title} className="help-route-order-step">
              <strong>{index + 1}</strong>
              <span>
                <b>{stage.title}</b>
                <br />
                {stage.body}
              </span>
            </div>
          ))}
        </div>
      </article>

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Clinical content strategy</h3>
            <p>
              The benchmark is mature ClearTriage/SymptomScreen practice: licensed, annually
              reviewed clinical protocols, structured checklists, targeted care advice, role-based
              workflows, training materials, and continuous quality feedback.
            </p>
          </div>
        </div>
        <div className="help-compare-grid">
          <MiniDefinition
            label="ClearTriage-style"
            body="Licensed nurse triage pathway for comprehensive assessment, clinical documentation, disposition rationale, and care advice."
          />
          <MiniDefinition
            label="SymptomScreen-style"
            body="Simplified access-staff screening for urgent red-flag detection and safe routing without requiring non-clinical staff to make clinical judgments."
          />
          <MiniDefinition
            label="IST Health layer"
            body="Localized staff/dependent identity, insurance status, aviation medicine rules, Arabic/English operation, and Qatar destination routing."
          />
        </div>
      </article>
    </section>
  );
}
