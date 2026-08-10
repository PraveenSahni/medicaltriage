import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import { useQueue, type QueueItem, type QueueSeverity } from "../QueueContext";
import { CockpitUtilityBar } from "./CockpitUtilityBar";
import { generateDemoStccCall } from "../serviceManagerBoard/demoStccCallGenerator";
import type { AuthenticatedSession } from "../auth/session";

type SidebarProps = {
  queue: QueueItem[];
  loading: boolean;
  error?: string;
  activeItemId?: string;
  heldQueueItemIds: Set<string>;
  maxHeldCalls: number;
  currentUserId: string;
  onOpenCall: (item: QueueItem) => void;
  session: AuthenticatedSession;
  onLogout: () => void;
  onBack?: () => void;
};

type CallTag = "waiting" | "open-now" | "on-hold" | "queue-locked" | "closed" | "assigned-to-other";

type SortMode = "smart" | "waiting" | "newest" | "oldest";
type PriorityFilter = "all" | "urgent" | "routine";
type StatusFilter = "all" | "available" | "locked";
type TypeFilter = "all" | "employee" | "dependent";

const SORT_LABELS: Record<SortMode, string> = {
  smart: "Smart Priority",
  waiting: "Longest Waiting",
  newest: "Newest First",
  oldest: "Oldest First"
};

function genderWord(biologicalSex: "female" | "male" | "other" | "unknown" | undefined): string {
  if (biologicalSex === "female") return "Female";
  if (biologicalSex === "male") return "Male";
  if (biologicalSex === "other") return "Other";
  return "Not set";
}

// Two display buckets rather than the full 4-value severity scale - matches
// the simplified queue design's intent (Urgent vs Routine only, no visible
// Emergency/Self-care split cluttering the card).
function priorityBucket(severity: QueueSeverity | undefined): "URGENT" | "ROUTINE" {
  return severity === "EMERGENCY" || severity === "URGENT" ? "URGENT" : "ROUTINE";
}

function priorityRank(severity: QueueSeverity | undefined): number {
  switch (severity) {
    case "EMERGENCY":
      return 0;
    case "URGENT":
      return 1;
    case "ROUTINE":
      return 2;
    default:
      return 3;
  }
}

// MM:SS for waits under an hour (precise, matches a live countdown feel);
// once a wait exceeds 59 minutes, MM:SS becomes unreadable (minutes keeps
// counting past 59 with no rollover into hours, e.g. "1683:24"), so switch
// to HH:MM instead.
function waitClock(item: QueueItem): string {
  const totalSeconds = Math.max(0, Math.round((Date.now() - new Date(item.createdAtIso).getTime()) / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) {
    const seconds = totalSeconds % 60;
    return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// This is a multi-nurse system: the top-left label reflects whether the call
// is still available or already picked up (by this nurse or another one),
// not clinical severity - severity is still sortable/filterable, just not the
// primary thing shown on the card (see priorityBucket, used by the Priority
// filter and Smart Priority sort only).
const STATE_LABELS: Record<CallTag, string> = {
  waiting: "WAITING",
  "open-now": "IN PROGRESS",
  "on-hold": "ON HOLD",
  "queue-locked": "WAITING",
  closed: "CLOSED",
  "assigned-to-other": "IN PROGRESS"
};

function tagForItem(item: QueueItem, activeItemId: string | undefined, currentUserId: string, isHeld: boolean, tooManyHeld: boolean): CallTag {
  if (item.status === "COMPLETED") {
    return "closed";
  }
  // A held call is never "open now" even if it's still the context's
  // activeItemId - Hold returns the main panel to the No Active Call state,
  // matching the preview's holdCurrentCall() exactly.
  if (isHeld) {
    return "on-hold";
  }
  if (item.id === activeItemId) {
    return "open-now";
  }
  if (item.lockedBy && item.lockedBy !== currentUserId) {
    const lockActive = item.lockExpiresAtIso ? new Date(item.lockExpiresAtIso).getTime() > Date.now() : false;
    if (lockActive) {
      return "assigned-to-other";
    }
  }
  if (activeItemId) {
    return "queue-locked";
  }
  if (tooManyHeld) {
    return "queue-locked";
  }
  return "waiting";
}

export function Sidebar({
  queue,
  loading,
  error,
  activeItemId,
  heldQueueItemIds,
  maxHeldCalls,
  currentUserId,
  onOpenCall,
  session,
  onLogout,
  onBack
}: SidebarProps) {
  const { claimItem, connectCall, refreshQueue } = useQueue();
  const [claimError, setClaimError] = useState("");
  const [autoGenerateOn, setAutoGenerateOn] = useState(false);
  const [, setGenerateError] = useState<string | undefined>();
  const generatingRef = useRef(false);

  // While toggled on, keeps generating one new demo call every 20 seconds
  // until toggled off, reusing the same generator/pattern as the Service
  // Manager Board's "Generate Calls" toggle. A generation already in flight
  // is never overlapped.
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
  const [activeTab, setActiveTab] = useState<"open" | "completed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Matches the preview's heldCount() > MAX_HELD_CALLS exactly: holding is
  // never blocked, but picking up a NEW call is blocked once more than
  // maxHeldCalls are already parked on hold (so up to 2 calls can be held
  // simultaneously with MAX_HELD_CALLS=1 before pickup is blocked).
  const tooManyHeld = heldQueueItemIds.size > maxHeldCalls;

  // Completed calls get their own tab entirely, rather than sinking to the
  // bottom of one shared list - with hundreds of calls processed in a
  // session, a mixed list either buries open calls under closed ones or (if
  // sorted open-first) makes closed calls hard to find for read-only review.
  const openQueue = queue.filter((item) => item.status !== "COMPLETED");
  const completedQueue = queue.filter((item) => item.status === "COMPLETED");
  const visibleQueue = activeTab === "open" ? openQueue : completedQueue;

  const activeFilterCount =
    (priorityFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0);

  function resetFilters() {
    setPriorityFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleQueue.filter((item) => {
      if (q) {
        const haystack = `${item.istStaffId} ${item.summary} ${item.reasonNarrative ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (priorityFilter !== "all" && priorityBucket(item.calculatedSeverity) !== priorityFilter.toUpperCase()) {
        return false;
      }
      if (typeFilter !== "all") {
        const wantsDependent = typeFilter === "dependent";
        if ((item.patientType === "Dependent") !== wantsDependent) return false;
      }
      if (statusFilter !== "all") {
        const isHeld = heldQueueItemIds.has(item.id);
        const isActive = item.id === activeItemId;
        const tag = tagForItem(item, activeItemId, currentUserId, isHeld, tooManyHeld && !isHeld);
        const isAvailable = tag === "waiting";
        if (statusFilter === "available" && !isAvailable) return false;
        if (statusFilter === "locked" && (isAvailable || isActive || isHeld)) return false;
      }
      return true;
    });
  }, [visibleQueue, searchQuery, priorityFilter, statusFilter, typeFilter, heldQueueItemIds, activeItemId, currentUserId, tooManyHeld]);

  // Held calls float to the top, active call next, regardless of sort mode -
  // a nurse always sees their own in-progress work first. The chosen sort
  // then orders everything else.
  const ordered = useMemo(() => {
    const pinned = (item: QueueItem) => {
      if (heldQueueItemIds.has(item.id)) return 0;
      if (item.id === activeItemId) return 1;
      return 2;
    };
    return [...filtered].sort((a, b) => {
      const pinDiff = pinned(a) - pinned(b);
      if (pinDiff !== 0) return pinDiff;
      switch (sortMode) {
        case "waiting":
        case "oldest":
          return new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime();
        case "newest":
          return new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
        case "smart":
        default: {
          const rankDiff = priorityRank(a.calculatedSeverity) - priorityRank(b.calculatedSeverity);
          if (rankDiff !== 0) return rankDiff;
          return new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime();
        }
      }
    });
  }, [filtered, sortMode, heldQueueItemIds, activeItemId]);

  async function answerCall(item: QueueItem) {
    setClaimError("");
    try {
      const claimed = await claimItem(item.id);
      onOpenCall(claimed);
    } catch (caught) {
      setClaimError(caught instanceof Error ? caught.message : "Failed to claim call.");
    }
  }

  async function resumeCall(item: QueueItem) {
    setClaimError("");
    try {
      const { item: resumed } = await connectCall(item.id, "RESUME");
      onOpenCall(resumed);
    } catch (caught) {
      setClaimError(caught instanceof Error ? caught.message : "Failed to resume call.");
    }
  }

  return (
    <aside className="cockpit-sidebar" aria-label="Open calls">
      <CockpitUtilityBar
        session={session}
        onLogout={onLogout}
        onBack={onBack}
        autoGenerateOn={autoGenerateOn}
        onToggleGenerate={() => setAutoGenerateOn((current) => !current)}
      />
      <div className="cockpit-sidebar-body">
      <div className="cockpit-sidebar-tabs" role="tablist" aria-label="Call list">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "open"}
          className={`cockpit-sidebar-tab${activeTab === "open" ? " cockpit-sidebar-tab-active" : ""}`}
          onClick={() => setActiveTab("open")}
        >
          Open Calls <span className="cockpit-sidebar-tab-badge">{openQueue.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "completed"}
          className={`cockpit-sidebar-tab${activeTab === "completed" ? " cockpit-sidebar-tab-active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed <span className="cockpit-sidebar-tab-badge cockpit-sidebar-tab-badge-completed">{completedQueue.length}</span>
        </button>
      </div>

      <div className="cockpit-queue-toolbar">
        <div className="cockpit-search">
          <span aria-hidden="true">&#128269;</span>
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search cases by staff id, symptom, or reason"
          />
        </div>
        <div className="cockpit-toolbar-icons">
          <div className="cockpit-dropdown">
            <button
              type="button"
              className="cockpit-icon-btn"
              title={`Sort: ${SORT_LABELS[sortMode]}`}
              aria-label="Sort options"
              onClick={() => {
                setSortMenuOpen((open) => !open);
                setFilterDrawerOpen(false);
              }}
            >
              &#8645;
            </button>
            {sortMenuOpen && (
              <div className="cockpit-dropdown-menu" role="menu">
                {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="menuitemradio"
                    aria-checked={sortMode === mode}
                    className={`cockpit-dropdown-item${sortMode === mode ? " cockpit-dropdown-item-active" : ""}`}
                    onClick={() => {
                      setSortMode(mode);
                      setSortMenuOpen(false);
                    }}
                  >
                    {SORT_LABELS[mode]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="cockpit-dropdown">
            <button
              type="button"
              className="cockpit-icon-btn"
              title="Filters"
              aria-label="Filter options"
              onClick={() => {
                setFilterDrawerOpen((open) => !open);
                setSortMenuOpen(false);
              }}
            >
              &#9881;
            </button>
            {filterDrawerOpen && (
              <div className="cockpit-dropdown-menu cockpit-filter-drawer" role="menu">
                <div className="cockpit-filter-group">
                  <span className="cockpit-filter-label">Priority</span>
                  <div className="cockpit-filter-options">
                    {(["all", "urgent", "routine"] as PriorityFilter[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`cockpit-filter-chip${priorityFilter === value ? " cockpit-filter-chip-active" : ""}`}
                        onClick={() => setPriorityFilter(value)}
                      >
                        {value === "all" ? "All" : value === "urgent" ? "Urgent" : "Routine"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cockpit-filter-group">
                  <span className="cockpit-filter-label">Status</span>
                  <div className="cockpit-filter-options">
                    {(["all", "available", "locked"] as StatusFilter[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`cockpit-filter-chip${statusFilter === value ? " cockpit-filter-chip-active" : ""}`}
                        onClick={() => setStatusFilter(value)}
                      >
                        {value === "all" ? "All" : value === "available" ? "Available" : "Locked"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="cockpit-filter-group">
                  <span className="cockpit-filter-label">Type</span>
                  <div className="cockpit-filter-options">
                    {(["all", "employee", "dependent"] as TypeFilter[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`cockpit-filter-chip${typeFilter === value ? " cockpit-filter-chip-active" : ""}`}
                        onClick={() => setTypeFilter(value)}
                      >
                        {value === "all" ? "All" : value === "employee" ? "Employee" : "Dependent"}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="cockpit-filter-reset" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button type="button" className="cockpit-active-filter-indicator" onClick={() => setFilterDrawerOpen(true)}>
          Filters {activeFilterCount}
        </button>
      )}

      {loading && <p className="cockpit-sidebar-status">Loading queue...</p>}
      {error && <p className="cockpit-sidebar-status cockpit-sidebar-status-error">{error}</p>}
      {claimError && <p className="cockpit-sidebar-status cockpit-sidebar-status-error">{claimError}</p>}
      {!loading && ordered.length === 0 && (
        <p className="cockpit-sidebar-status">
          {visibleQueue.length === 0
            ? activeTab === "open"
              ? "No calls waiting."
              : "No completed calls yet."
            : "No calls match your search/filters."}
        </p>
      )}

      <ul className="call-list">
        {ordered.map((item) => {
          const isHeld = heldQueueItemIds.has(item.id);
          const isActive = item.id === activeItemId;
          const tag = tagForItem(item, activeItemId, currentUserId, isHeld, tooManyHeld && !isHeld);
          const disabled = tag === "assigned-to-other" || (tag === "queue-locked" && !isHeld && !isActive);

          let action: JSX.Element | null = null;
          if (tag === "assigned-to-other") {
            action = <div className="call-item-locked-by">{item.lockedByName ?? "Another nurse"}</div>;
          } else if (isHeld) {
            action = (
              <button
                type="button"
                className="answer-btn resume-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  void resumeCall(item);
                }}
              >
                &#8635; Resume
              </button>
            );
          } else if (isActive) {
            action = null;
          } else if (item.status === "COMPLETED") {
            action = (
              <button
                type="button"
                className="answer-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenCall(item);
                }}
              >
                &#128274; View (read only)
              </button>
            );
          } else if (tag === "queue-locked") {
            action = (
              <button type="button" className="answer-btn" disabled>
                Answer call &rarr;
              </button>
            );
          } else {
            action = (
              <button
                type="button"
                className="answer-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  void answerCall(item);
                }}
              >
                Answer call &rarr;
              </button>
            );
          }

          const stateLabel = STATE_LABELS[tag];

          return (
            <li key={item.id}>
              <div
                className={`call-item call-item-compact${isActive && !isHeld ? " active" : ""}${isHeld ? " held" : ""}${
                  disabled ? " locked" : ""
                }${item.status === "COMPLETED" ? " completed" : ""}`}
              >
                <div className="call-item-top">
                  <span className={`state-pill state-${tag}`}>{stateLabel}</span>
                  <span className="call-wait-time">{waitClock(item)}</span>
                </div>
                {/* reasonNarrative is the field that actually gets edited
                    (nurse typing or IVR audio capture) - item.summary is only
                    ever set once at creation and goes stale the moment
                    reasonNarrative changes. */}
                <div className="title">{item.reasonNarrative || item.summary}</div>
                <div className="call-item-meta">
                  {item.identityValidated ? (
                    <>
                      {item.patientAge ? `${item.patientAge.ageYears} · ` : ""}
                      {genderWord(item.patientAge?.biologicalSex)} · {item.patientType === "Dependent" ? "Dependent" : "Employee"}
                    </>
                  ) : (
                    "Validating identity with HRMS..."
                  )}
                </div>
                {action}
              </div>
            </li>
          );
        })}
      </ul>
      </div>
    </aside>
  );
}
