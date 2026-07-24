export type SeverityFilter = "all" | "EMERGENCY" | "URGENT" | "ROUTINE";
export type AssignmentFilter = "all" | "unassigned" | "assigned";

export type BoardFilters = {
  severity: SeverityFilter;
  assignment: AssignmentFilter;
  nurse: string;
  station: string;
  attentionOnly: boolean;
};

export const DEFAULT_FILTERS: BoardFilters = {
  severity: "all",
  assignment: "all",
  nurse: "all",
  station: "all",
  attentionOnly: false
};

export function activeFilterCount(filters: BoardFilters): number {
  return (
    Number(filters.severity !== "all") +
    Number(filters.assignment !== "all") +
    Number(filters.nurse !== "all") +
    Number(filters.station !== "all") +
    Number(filters.attentionOnly)
  );
}

type FilterPopoverProps = {
  open: boolean;
  filters: BoardFilters;
  nurseOptions: string[];
  stationOptions: string[];
  onChange: (filters: BoardFilters) => void;
  onReset: () => void;
};

export function FilterPopover({ open, filters, nurseOptions, stationOptions, onChange, onReset }: FilterPopoverProps) {
  if (!open) {
    return null;
  }
  return (
    <div className="smb-popover smb-filter-panel" role="menu">
      <div className="smb-popover-title">Filter calls</div>
      <div className="smb-filter-row">
        <label htmlFor="smb-filter-severity">Priority</label>
        <select
          id="smb-filter-severity"
          value={filters.severity}
          onChange={(event) => onChange({ ...filters, severity: event.target.value as SeverityFilter })}
        >
          <option value="all">All</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="URGENT">Urgent</option>
          <option value="ROUTINE">Routine</option>
        </select>
      </div>
      <div className="smb-filter-row">
        <label htmlFor="smb-filter-assignment">Assignment</label>
        <select
          id="smb-filter-assignment"
          value={filters.assignment}
          onChange={(event) => onChange({ ...filters, assignment: event.target.value as AssignmentFilter })}
        >
          <option value="all">All</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>
      <div className="smb-filter-row">
        <label htmlFor="smb-filter-nurse">Nurse</label>
        <select
          id="smb-filter-nurse"
          value={filters.nurse}
          onChange={(event) => onChange({ ...filters, nurse: event.target.value })}
        >
          <option value="all">All nurses</option>
          {nurseOptions.map((nurse) => (
            <option key={nurse} value={nurse}>
              {nurse}
            </option>
          ))}
        </select>
      </div>
      <div className="smb-filter-row">
        <label htmlFor="smb-filter-station">Station</label>
        <select
          id="smb-filter-station"
          value={filters.station}
          onChange={(event) => onChange({ ...filters, station: event.target.value })}
        >
          <option value="all">All stations</option>
          {stationOptions.map((station) => (
            <option key={station} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>
      <label className="smb-toggle-row">
        <span>Needs attention only</span>
        <input
          type="checkbox"
          checked={filters.attentionOnly}
          onChange={(event) => onChange({ ...filters, attentionOnly: event.target.checked })}
        />
      </label>
      <div className="smb-filter-footer">
        <button type="button" className="smb-reset-btn" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </div>
  );
}
