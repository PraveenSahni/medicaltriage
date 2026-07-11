import type { LucideIcon } from "lucide-react";

export type DataStrategyCard = {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  status: string;
  body: string;
  bullets: string[];
  formula?: string;
  link: {
    href: string;
    label: string;
  };
};

export type MatrixCard = {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  body: string;
  bullets: string[];
  link: {
    href: string;
    label: string;
  };
};

export type ApiCatalogRow = {
  area: string;
  api: string;
  use: string;
  status: string;
};

export type HelpSummaryCard = {
  title: string;
  body: string;
  icon: LucideIcon;
};

export type TeleTriageStage = {
  title: string;
  body: string;
};
