export function EmptyColumnState({ filtering }: { filtering: boolean }) {
  return <div className="smb-empty">{filtering ? "No matching calls" : "No calls in this stage"}</div>;
}
