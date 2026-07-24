type SearchControlProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchControl({ value, onChange }: SearchControlProps) {
  return (
    <div className="smb-search-wrap">
      <span aria-hidden="true">⌕</span>
      <input
        type="text"
        className="smb-search"
        placeholder="Search calls..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search calls"
      />
    </div>
  );
}
