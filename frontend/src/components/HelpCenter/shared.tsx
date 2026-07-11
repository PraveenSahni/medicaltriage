import { ExternalLink, PlugZap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ApiCatalogRow, DataStrategyCard, MatrixCard } from "./types";

export function DataStrategyHelpCard({ card }: { card: DataStrategyCard }) {
  const Icon = card.icon;

  return (
    <div className="help-mini-definition">
      <span className="status-pill border border-emerald-200 bg-emerald-50 text-emerald-700">
        {card.eyebrow}
      </span>
      <div className="help-card-heading">
        <span className="help-icon">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <strong>{card.title}</strong>
          <span>{card.body}</span>
        </div>
      </div>
      <ul className="help-bullet-list">
        {card.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {card.formula && <code className="help-inline-code">{card.formula}</code>}
      <a href={card.link.href} className="text-emerald-600 font-semibold hover:underline">
        <ExternalLink className="inline h-3.5 w-3.5" />
        <span> {card.link.label}</span>
      </a>
      <small className="text-emerald-700">{card.status}</small>
    </div>
  );
}

export function MatrixHelpCard({ card }: { card: MatrixCard }) {
  const Icon = card.icon;

  return (
    <article className="help-card">
      <div className="help-card-heading">
        <span className="help-icon">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <span className="tag-label">{card.eyebrow}</span>
          <h3 className="help-title">{card.title}</h3>
          <p>{card.body}</p>
        </div>
      </div>
      <ul className="help-bullet-list">
        {card.bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <a href={card.link.href} className="text-emerald-600 font-semibold hover:underline">
        <ExternalLink className="inline h-3.5 w-3.5" />
        <span> {card.link.label}</span>
      </a>
    </article>
  );
}

export function HelpCard({
  title,
  body,
  icon: Icon
}: {
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <article className="help-card">
      <div className="help-card-heading">
        <span className="help-icon">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="help-title">{title}</h3>
          <p>{body}</p>
        </div>
      </div>
    </article>
  );
}

export function MiniDefinition({ label, body }: { label: string; body: string }) {
  return (
    <div className="help-mini-definition">
      <strong>{label}</strong>
      <span>{body}</span>
    </div>
  );
}

export function ApiCatalogTable({
  title,
  body,
  rows
}: {
  title: string;
  body: string;
  rows: ApiCatalogRow[];
}) {
  return (
    <article className="help-card help-card-wide">
      <div className="help-card-heading">
        <span className="help-icon">
          <PlugZap className="h-5 w-5" />
        </span>
        <div>
          <h3 className="help-title">{title}</h3>
          <p>{body}</p>
        </div>
      </div>
      <div className="help-api-table">
        {rows.map((row) => (
          <div key={`${row.area}-${row.status}`} className="help-api-row">
            <strong>{row.area}</strong>
            <code>{row.api}</code>
            <span>{row.use}</span>
            <small>{row.status}</small>
          </div>
        ))}
      </div>
    </article>
  );
}
