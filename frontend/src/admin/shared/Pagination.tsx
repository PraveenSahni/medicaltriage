import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

type PaginationProps = {
  limit: number;
  offset: number;
  totalCount: number;
  onChange: (next: { limit: number; offset: number }) => void;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Server-paginated (limit/offset query params) - stays that way. This is
// display-only; the exact same {limit, offset} callback contract every
// panel already wires up is unchanged.
export function Pagination({ limit, offset, totalCount, onChange }: PaginationProps) {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="flex items-center gap-3 py-2.5 flex-wrap">
      <Button variant="outline" size="sm" disabled={offset <= 0} onClick={() => onChange({ limit, offset: Math.max(0, offset - limit) })}>
        Prev
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages} ({totalCount} total)
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={offset + limit >= totalCount}
        onClick={() => onChange({ limit, offset: offset + limit })}
      >
        Next
      </Button>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Per page</span>
        <Select value={String(limit)} onValueChange={(value) => onChange({ limit: Number(value), offset: 0 })}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
