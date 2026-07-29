export type SortMode = "priority" | "longest" | "recent";

const SORT_LABELS: Record<SortMode, string> = {
  priority: "By severity",
  longest: "Longest waiting",
  recent: "Recently added"
};

type SortPopoverProps = {
  open: boolean;
  value: SortMode;
  onSelect: (mode: SortMode) => void;
};

export function SortPopover({ open, value, onSelect }: SortPopoverProps) {
  if (!open) {
    return null;
  }
  return (
    <div className="smb-popover" role="menu">
      <div className="smb-popover-title">Sort within each stage</div>
      {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          role="menuitemradio"
          aria-checked={value === mode}
          className={`smb-tool-option${value === mode ? " smb-tool-option-selected" : ""}`}
          onClick={() => onSelect(mode)}
        >
          <span>{SORT_LABELS[mode]}</span>
          <span className="smb-check">✓</span>
        </button>
      ))}
    </div>
  );
}
