import { ClipboardCheck, Kanban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, KeyboardEvent } from "react";

function selectAdjacentTab<TKey extends string>(
  event: KeyboardEvent<HTMLButtonElement>,
  keys: TKey[],
  currentIndex: number,
  onChange: (key: TKey) => void
) {
  let nextIndex = currentIndex;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % keys.length;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + keys.length) % keys.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = keys.length - 1;
  if (nextIndex === currentIndex) return;

  event.preventDefault();
  onChange(keys[nextIndex]);
  const tabButtons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  tabButtons?.[nextIndex]?.focus();
}

type WorkspaceMode = "workspace" | "kanban";

type WorkspaceModeSwitchProps = {
  value: WorkspaceMode | null;
  onChange: (value: WorkspaceMode) => void;
};

export function WorkspaceModeSwitch({ value, onChange }: WorkspaceModeSwitchProps) {
  const options: Array<{
    value: WorkspaceMode;
    label: string;
    title: string;
    icon: LucideIcon;
  }> = [
    { value: "workspace", label: "Step", title: "Step cockpit", icon: ClipboardCheck },
    { value: "kanban", label: "Board", title: "Kanban board", icon: Kanban }
  ];

  return (
    <div className="ist-mode-switch" role="tablist" aria-label="Triage workspace mode">
      {options.map((option, index) => {
        const Icon = option.icon;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={option.title}
            tabIndex={active ? 0 : -1}
            className={`ist-mode-option ${active ? "ist-mode-option-active" : ""}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => selectAdjacentTab(event, options.map((item) => item.value), index, onChange)}
            title={option.title}
          >
            <Icon aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type LabeledIconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  label: string;
  active?: boolean;
};

export function LabeledIconButton({
  icon: Icon,
  label,
  active = false,
  className = "",
  ...buttonProps
}: LabeledIconButtonProps) {
  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      className={`ist-labeled-icon-action ${active ? "ist-labeled-icon-action-active" : ""} ${className}`.trim()}
      aria-pressed={active || undefined}
      title={buttonProps.title ?? label}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

type IconActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  label: string;
  active?: boolean;
};

export function IconActionButton({
  icon: Icon,
  label,
  active = false,
  className = "",
  ...buttonProps
}: IconActionButtonProps) {
  return (
    <button
      {...buttonProps}
      type={buttonProps.type ?? "button"}
      className={`ist-icon-action ${active ? "ist-icon-action-active" : ""} ${className}`.trim()}
      aria-label={label}
      aria-pressed={active || undefined}
      title={buttonProps.title ?? label}
    >
      <Icon aria-hidden="true" />
    </button>
  );
}

export type SectionTab<TKey extends string> = {
  key: TKey;
  label: string;
  icon: LucideIcon;
};

export type SectionNavigationItem<TKey extends string> = SectionTab<TKey>;

type SectionTabsProps<TKey extends string> = {
  tabs: Array<SectionTab<TKey>>;
  activeTab: TKey;
  onChange: (key: TKey) => void;
  ariaLabel: string;
  className?: string;
};

export function SectionTabs<TKey extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  className = ""
}: SectionTabsProps<TKey>) {
  return (
    <div className={`ist-section-tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`ist-section-tab ${active ? "ist-section-tab-active" : ""}`}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => selectAdjacentTab(event, tabs.map((item) => item.key), index, onChange)}
          >
            <Icon aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type SectionNavigationProps<TKey extends string> = {
  items: Array<SectionNavigationItem<TKey>>;
  onSelect: (key: TKey) => void;
  ariaLabel: string;
  className?: string;
};

export function SectionNavigation<TKey extends string>({
  items,
  onSelect,
  ariaLabel,
  className = ""
}: SectionNavigationProps<TKey>) {
  return (
    <nav
      className={`ist-section-tabs ist-section-navigation ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            className="ist-section-tab"
            onClick={() => onSelect(item.key)}
          >
            <Icon aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
