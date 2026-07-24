import { useState } from "react";
import { SearchControl } from "./SearchControl";
import { SortPopover, type SortMode } from "./SortPopover";
import { FilterPopover, activeFilterCount, type BoardFilters } from "./FilterPopover";

type BoardToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  filters: BoardFilters;
  onFiltersChange: (filters: BoardFilters) => void;
  onResetFilters: () => void;
  nurseOptions: string[];
  stationOptions: string[];
};

export function BoardToolbar({
  searchQuery,
  onSearchChange,
  sortMode,
  onSortChange,
  filters,
  onFiltersChange,
  onResetFilters,
  nurseOptions,
  stationOptions
}: BoardToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const count = activeFilterCount(filters);

  return (
    <section className="smb-toolbar">
      <SearchControl value={searchQuery} onChange={onSearchChange} />
      <div className="smb-queue-tools">
        <div className="smb-tool-menu">
          <button
            type="button"
            className={`smb-tool-button${sortOpen ? " smb-tool-button-open" : ""}`}
            onClick={() => {
              setSortOpen((open) => !open);
              setFilterOpen(false);
            }}
            title="Sort calls"
            aria-label="Sort calls"
            aria-expanded={sortOpen}
          >
            ⇅
          </button>
          <SortPopover
            open={sortOpen}
            value={sortMode}
            onSelect={(mode) => {
              onSortChange(mode);
              setSortOpen(false);
            }}
          />
        </div>
        <div className="smb-tool-menu">
          <button
            type="button"
            className={`smb-tool-button${filterOpen ? " smb-tool-button-open" : ""}${count > 0 ? " smb-tool-button-filtered" : ""}`}
            onClick={() => {
              setFilterOpen((open) => !open);
              setSortOpen(false);
            }}
            title="Filter calls"
            aria-label="Filter calls"
            aria-expanded={filterOpen}
          >
            ⚙
            {count > 0 && <span className="smb-active-count">{count}</span>}
          </button>
          <FilterPopover
            open={filterOpen}
            filters={filters}
            nurseOptions={nurseOptions}
            stationOptions={stationOptions}
            onChange={onFiltersChange}
            onReset={onResetFilters}
          />
        </div>
      </div>
    </section>
  );
}
