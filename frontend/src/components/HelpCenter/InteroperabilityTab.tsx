import { BrainCircuit, Database, GitBranch, PlugZap } from "lucide-react";
import { ApiCatalogTable, HelpCard, MatrixHelpCard } from "./shared";
import type { ApiCatalogRow, MatrixCard } from "./types";

export function InteroperabilityTab({
  integrationRows,
  oracleHcmApiRows,
  plannedApiRows,
  llmCloudMigrationTasks
}: {
  integrationRows: string[][];
  oracleHcmApiRows: ApiCatalogRow[];
  plannedApiRows: ApiCatalogRow[];
  llmCloudMigrationTasks: MatrixCard[];
}) {
  return (
    <section className="help-stack">
      <article className="help-card">
        <div className="help-card-heading">
          <span className="help-icon">
            <PlugZap className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Integration Map</h3>
            <p>
              The scaffold keeps a stable API contract while individual enterprise connectors are
              swapped in after security, privacy, and clinical governance approval.
            </p>
          </div>
        </div>

        <div className="help-integration-table">
          {integrationRows.map(([system, purpose, status]) => (
            <div key={system} className="help-integration-row">
              <strong>{system}</strong>
              <span>{purpose}</span>
              <small>{status}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <h3 className="help-title">Oracle Fusion HCM compatibility approach</h3>
            <p>
              The platform keeps one internal staff-validation contract and places Oracle Fusion Cloud HCM
              behind an adapter. The adapter calls the tenant base URL plus
              <code className="help-inline-code">/hcmRestApi/resources/11.13.18.05</code>, uses
              service-account authentication from GCP Secret Manager, starts read-only, caches only
              the minimum eligibility snapshot, and escalates to writeback only after HR, privacy,
              and medical governance approve it.
            </p>
          </div>
        </div>
      </article>

      <ApiCatalogTable
        title="Oracle Fusion HCM API plan"
        body="These are the Oracle HRMS / Oracle Fusion HCM APIs the production connector should use for staff, dependent, duty, absence, and document context."
        rows={oracleHcmApiRows}
      />

      <ApiCatalogTable
        title="All integration APIs"
        body="This is the full system integration catalogue shown in Help so every connector has a named purpose, API surface, and implementation status."
        rows={plannedApiRows}
      />

      <article className="help-card help-card-wide">
        <div className="help-card-heading">
          <span className="help-icon">
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">CLOUD LLM IMPLEMENTATION TASKS</span>
            <h3 className="help-title">MedGemma strategy for the GCP move</h3>
            <p>
              These are the practical implementation tasks for moving from local synthetic
              evaluation to a governed, private clinical copilot in GCP Doha. The model remains
              advisory and cannot change deterministic triage rules.
            </p>
          </div>
        </div>
      </article>

      <div className="help-grid">
        {llmCloudMigrationTasks.map((card) => (
          <MatrixHelpCard key={card.title} card={card} />
        ))}
      </div>

      <div className="help-grid">
        <HelpCard
          title="Adapter rule"
          body="The frontend and triage engine should keep calling IST triage APIs. Oracle, insurance, EMR, scheduling, and analytics remain replaceable backend adapters with audit logging and fail-safe fallback."
          icon={Database}
        />
        <HelpCard
          title="Change sync rule"
          body="Use Oracle Atom feeds for key employee changes and HCM Extracts for bulk baseline or periodic refresh. Avoid high-frequency REST polling against worker data."
          icon={GitBranch}
        />
      </div>
    </section>
  );
}
