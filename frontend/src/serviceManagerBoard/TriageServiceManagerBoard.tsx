import "./serviceManagerBoard.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueue, type QueueItem } from "../QueueContext";
import type { AuthenticatedSession } from "../auth/session";
import { getAccessToken } from "../authToken";
import { canAccessNurseCockpit } from "../cockpit/roles";
import {
  BOARD_COLUMNS,
  countAssignedNurses,
  countInFlow,
  countSafetyAlerts,
  countWaiting,
  longestWaitMinutes,
  mapExistingStatusToBoardColumn,
  cardTitle
} from "./boardMapping";
import { BoardToolbar } from "./BoardToolbar";
import { WorkflowColumn } from "./WorkflowColumn";
import { ReadOnlyCallDrawer } from "./ReadOnlyCallDrawer";
import { ServiceSummary } from "./ServiceSummary";
import { DEFAULT_FILTERS, type BoardFilters } from "./FilterPopover";
import type { SortMode } from "./SortPopover";
import { generateDemoStccCall } from "./demoStccCallGenerator";

type TriageServiceManagerBoardProps = {
  session: AuthenticatedSession;
  onLogout: () => void;
  onOpenNurseCockpit?: () => void;
};

function priorityRank(item: QueueItem): number {
  if (item.safetyFloorActive) return 0;
  switch (item.calculatedSeverity) {
    case "EMERGENCY":
      return 1;
    case "URGENT":
      return 2;
    default:
      return 3;
  }
}

export function TriageServiceManagerBoard({ session, onLogout, onOpenNurseCockpit }: TriageServiceManagerBoardProps) {
  // Read-only consumption of the existing queue integration: only queue/
  // loading/error/refreshQueue (a GET, not a mutation) are used. claimItem,
  // moveItem, updateItemContext, connectCall, releaseItem are intentionally
  // never destructured or called anywhere in this board.
  const { queue, loading, error, refreshQueue } = useQueue();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [filters, setFilters] = useState<BoardFilters>(DEFAULT_FILTERS);
  const [drawerItemId, setDrawerItemId] = useState<string | undefined>();
  const [autoGenerateOn, setAutoGenerateOn] = useState(false);
  const [generateError, setGenerateError] = useState<string | undefined>();
  const boardRef = useRef<HTMLElement>(null);
  const generatingRef = useRef(false);

  const nurseOptions = useMemo(
    () => [...new Set(queue.map((item) => item.lockedByName).filter((name): name is string => Boolean(name)))].sort(),
    [queue]
  );
  const stationOptions = useMemo(
    () => [...new Set(queue.map((item) => item.stationCode).filter((code): code is string => Boolean(code)))].sort(),
    [queue]
  );

  const isFiltering = Boolean(searchQuery.trim()) || filters.severity !== "all" || filters.assignment !== "all" ||
    filters.nurse !== "all" || filters.station !== "all" || filters.attentionOnly;

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return queue.filter((item) => {
      if (q) {
        const haystack = [
          item.id,
          item.istStaffId,
          cardTitle(item),
          item.reasonNarrative ?? "",
          item.matchedProtocolId ?? "",
          item.lockedByName ?? "",
          item.stationCode ?? "",
          item.patientType,
          item.channel
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.severity !== "all" && item.calculatedSeverity !== filters.severity) return false;
      if (filters.assignment !== "all") {
        const isAssigned = Boolean(item.lockedBy);
        if (filters.assignment === "unassigned" && isAssigned) return false;
        if (filters.assignment === "assigned" && !isAssigned) return false;
      }
      if (filters.nurse !== "all" && item.lockedByName !== filters.nurse) return false;
      if (filters.station !== "all" && item.stationCode !== filters.station) return false;
      if (filters.attentionOnly) {
        const needsAttention = item.safetyFloorActive || item.calculatedSeverity === "EMERGENCY" || item.calculatedSeverity === "URGENT";
        if (!needsAttention) return false;
      }
      return true;
    });
  }, [queue, searchQuery, filters]);

  const sortedQueue = useMemo(() => {
    return [...filteredQueue].sort((a, b) => {
      if (sortMode === "longest") {
        return new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime();
      }
      if (sortMode === "recent") {
        return new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
      }
      const rankDiff = priorityRank(a) - priorityRank(b);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime();
    });
  }, [filteredQueue, sortMode]);

  const columnItems = useMemo(() => {
    const byColumn: Record<string, QueueItem[]> = {};
    for (const column of BOARD_COLUMNS) {
      byColumn[column.id] = [];
    }
    for (const item of sortedQueue) {
      byColumn[mapExistingStatusToBoardColumn(item)].push(item);
    }
    // The Closed column is a completed-for-the-day audit list, not an active
    // triage queue - "most recently closed first" is what a manager actually
    // wants there regardless of the longest-wait/priority sort mode applied
    // to the still-active columns above (updatedAtIso is the last time the
    // record changed, which for a COMPLETED call is the completion moment).
    byColumn.closed = [...byColumn.closed].sort(
      (a, b) => new Date(b.updatedAtIso).getTime() - new Date(a.updatedAtIso).getTime()
    );
    return byColumn;
  }, [sortedQueue]);

  const safetyAlertCount = countSafetyAlerts(queue);
  const drawerItem = drawerItemId ? queue.find((item) => item.id === drawerItemId) : undefined;
  const hasCockpitAccess = canAccessNurseCockpit(session.activeRole);

  function locateSafetyOnBoard() {
    setFilters({ ...DEFAULT_FILTERS, attentionOnly: true });
    boardRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  // While toggled on, keeps generating one new demo call (licensed STCC
  // "Abdominal Pain - Male" content only) every 20 seconds until toggled off.
  // A generation already in flight is never overlapped.
  useEffect(() => {
    if (!autoGenerateOn) {
      return;
    }
    async function tick() {
      if (generatingRef.current) {
        return;
      }
      generatingRef.current = true;
      try {
        await generateDemoStccCall();
        await refreshQueue();
        setGenerateError(undefined);
      } catch (caught) {
        setGenerateError(caught instanceof Error ? caught.message : "Failed to generate call.");
      } finally {
        generatingRef.current = false;
      }
    }
    void tick();
    const handle = window.setInterval(() => void tick(), 20_000);
    return () => window.clearInterval(handle);
  }, [autoGenerateOn, refreshQueue]);

  return (
    <div id="service-manager-board-root" className="smb-app">
      <header className="smb-topbar">
        <div className="smb-brand">
          <div className="smb-brand-copy">
            <b>Triage Service Manager</b>
            <span>Live clinical flow · Read only</span>
          </div>
        </div>
        <div className="smb-shift">
          <span className="smb-status-dot" /> {session.user.fullName} · No call controls
        </div>
        <div className="smb-top-actions">
          <button
            type="button"
            className={`smb-soft-btn${autoGenerateOn ? " smb-soft-btn-active" : ""}`}
            onClick={() => setAutoGenerateOn((current) => !current)}
            aria-pressed={autoGenerateOn}
            title="Continuously generate demo incoming calls across the available protocol content"
          >
            {autoGenerateOn ? "■ Stop Generating" : "▶ Generate Calls"}
          </button>
          {hasCockpitAccess && onOpenNurseCockpit && (
            <button type="button" className="smb-soft-btn" onClick={onOpenNurseCockpit}>
              Nurse Cockpit
            </button>
          )}
          <button type="button" className="smb-soft-btn" onClick={() => void refreshQueue()}>
            ↻ Refresh
          </button>
          <button type="button" className="smb-soft-btn" onClick={onLogout}>
            Sign out
          </button>
          {/* Opens the standalone Help & Library page in a new tab (server-
              rendered at GET /help) - a plain link, not a client-side action,
              so this board's own state (filters, drawer, generator toggle)
              is never touched by clicking it. The access token is appended as
              a query param because a plain top-level navigation can't carry a
              custom Authorization header, and Firebase Hosting's rewrite-to-
              Cloud-Run proxy on the custom domain does not forward the Cookie
              header either - see helpRouter.ts's /help handler. */}
          <a
            className="smb-soft-btn"
            href={`/help${getAccessToken() ? `?token=${encodeURIComponent(getAccessToken()!)}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Help"
          >
            Help
          </a>
        </div>
      </header>

      <main className="smb-content">
        <ServiceSummary
          waitingCount={countWaiting(queue)}
          longestWaitMinutes={longestWaitMinutes(queue)}
          inFlowCount={countInFlow(queue)}
          safetyAlertCount={safetyAlertCount}
          assignedNurseCount={countAssignedNurses(queue)}
        />

        {safetyAlertCount > 0 && (
          <section className="smb-attention smb-attention-show">
            <div className="smb-attention-copy">
              <span>⚠</span>
              <div>
                <b>Manager attention:</b>{" "}
                <span>
                  {safetyAlertCount === 1
                    ? "1 safety-floor case requires oversight."
                    : `${safetyAlertCount} safety-floor cases require oversight.`}
                </span>
              </div>
            </div>
            <button type="button" onClick={locateSafetyOnBoard}>
              Locate on board
            </button>
          </section>
        )}

        <BoardToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortMode={sortMode}
          onSortChange={setSortMode}
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={() => setFilters(DEFAULT_FILTERS)}
          nurseOptions={nurseOptions}
          stationOptions={stationOptions}
        />

        {loading && queue.length === 0 && <p className="smb-status">Loading triage service...</p>}
        {error && <p className="smb-status smb-status-error">Unable to load the triage service board.</p>}
        {generateError && <p className="smb-status smb-status-error">{generateError}</p>}

        {/* tabIndex=0 closes a real axe-core finding (scrollable-region-focusable) -
            this section scrolls horizontally but had no way to reach it via keyboard. */}
        <section className="smb-board" ref={boardRef} tabIndex={0} aria-label="Triage clinical flow board">
          {BOARD_COLUMNS.map((column) => (
            <WorkflowColumn
              key={column.id}
              id={column.id}
              title={column.title}
              subtitle={column.subtitle}
              icon={column.icon}
              items={columnItems[column.id] ?? []}
              filtering={isFiltering}
              onOpenItem={(item) => setDrawerItemId(item.id)}
            />
          ))}
        </section>
      </main>

      {drawerItem && <ReadOnlyCallDrawer item={drawerItem} onClose={() => setDrawerItemId(undefined)} />}
    </div>
  );
}
