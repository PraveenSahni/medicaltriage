import { act, render, screen, fireEvent } from "@testing-library/react";
import { TriageServiceManagerBoard } from "./TriageServiceManagerBoard";
import type { QueueItem } from "../QueueContext";
import type { AuthenticatedSession } from "../auth/session";

const claimItem = jest.fn();
const connectCall = jest.fn();
const releaseItem = jest.fn();
const moveItem = jest.fn();
const updateItemContext = jest.fn();
const openItemInStep = jest.fn();
const refreshQueue = jest.fn();

let mockQueue: QueueItem[] = [];

jest.mock("../QueueContext", () => ({
  useQueue: () => ({
    queue: mockQueue,
    loading: false,
    error: undefined,
    callCenterSessionsByQueueItemId: {},
    refreshQueue,
    claimItem,
    connectCall,
    releaseItem,
    moveItem,
    updateItemContext,
    openItemInStep,
    setActiveItemById: jest.fn(),
    clearActiveItem: jest.fn()
  })
}));

const generateDemoStccCall = jest.fn();
jest.mock("./demoStccCallGenerator", () => ({
  generateDemoStccCall: () => generateDemoStccCall()
}));

// Real module uses import.meta.env (Vite-only syntax) which the Jest/ts-jest
// ESM setup here can't parse - mocked out since these tests never open the
// drawer's IAQ/TAQ tabs (which are what actually call fetchProtocolDetail).
jest.mock("../cockpit/api/protocols", () => ({
  fetchProtocolDetail: jest.fn().mockRejectedValue(new Error("not used in these tests"))
}));

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: `queue-item-${Math.random().toString(36).slice(2, 10)}`,
    istStaffId: "IST-000042",
    status: "INCOMING",
    currentStage: "INTAKE",
    priorityScore: 0,
    patientType: "Staff",
    channel: "Phone",
    summary: "Back pain",
    reasonNarrative: "Mild back pain since this morning.",
    identityValidated: true,
    safetyFloorActive: false,
    sbarCopied: false,
    slaDeadlineIso: new Date().toISOString(),
    customAviationTags: [],
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    stccProcess: {
      processName: "Telehealth Triage Encounter",
      averageDurationMinutes: "11-13",
      currentActionTab: "REASON_AND_EMERGENCY_RULE_OUT",
      canonicalSteps: [],
      visibleActionTabs: []
    },
    ...overrides
  } as QueueItem;
}

const session: AuthenticatedSession = {
  sessionId: "sess-1",
  user: {
    id: "user-1",
    fullName: "Test Manager",
    email: "khalid@irisstar.tech",
    department: "Operations",
    facility: "DOH",
    roles: ["triage_service_manager"],
    accountStatus: "ACTIVE",
    mfaStatus: "VERIFIED"
  },
  activeRole: "triage_service_manager",
  permissions: ["triage.queue.manage"],
  expiresAtIso: new Date(Date.now() + 3_600_000).toISOString(),
  mfaVerified: true
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQueue = [
    makeItem({ id: "waiting-1", status: "INCOMING", reasonNarrative: "Back pain that started gradually." }),
    makeItem({
      id: "safety-1",
      status: "IN_PROCESS",
      currentStage: "VITALS",
      safetyFloorActive: true,
      calculatedSeverity: "EMERGENCY",
      lockedBy: "nurse-a",
      lockedByName: "Nurse Aisha",
      reasonNarrative: "Chest tightness and sweating."
    }),
    makeItem({
      id: "completed-1",
      status: "COMPLETED",
      currentStage: "SBAR",
      lockedBy: "nurse-b",
      lockedByName: "Nurse Omar",
      reasonNarrative: "Nausea and vomiting."
    })
  ];
});

function renderBoard() {
  return render(<TriageServiceManagerBoard session={session} onLogout={jest.fn()} />);
}

describe("TriageServiceManagerBoard", () => {
  it("places queue items in the correct visual column", () => {
    renderBoard();
    expect(screen.getAllByText(/Back pain that started gradually/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Chest tightness and sweating/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Nausea and vomiting/).length).toBeGreaterThan(0);
  });

  it("search filters cards locally without calling any mutation function", () => {
    renderBoard();
    const search = screen.getByLabelText("Search calls");
    fireEvent.change(search, { target: { value: "chest tightness" } });

    expect(screen.getAllByText(/Chest tightness and sweating/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Back pain that started gradually/).length).toBe(0);

    expect(claimItem).not.toHaveBeenCalled();
    expect(connectCall).not.toHaveBeenCalled();
    expect(releaseItem).not.toHaveBeenCalled();
    expect(moveItem).not.toHaveBeenCalled();
    expect(updateItemContext).not.toHaveBeenCalled();
  });

  it("shows the attention strip only when a safety alert exists, and Locate on board applies the attention filter", () => {
    renderBoard();
    expect(screen.getByText("Locate on board")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Locate on board"));
    expect(screen.getAllByText(/Chest tightness and sweating/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Back pain that started gradually/).length).toBe(0);
  });

  it("opens a read-only drawer on card click and closes it again, without calling mutation functions", () => {
    renderBoard();
    fireEvent.click(screen.getAllByText(/Back pain that started gradually/)[0]);
    expect(screen.getByText("Observation only")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close details"));
    expect(screen.queryByText("Observation only")).not.toBeInTheDocument();

    expect(claimItem).not.toHaveBeenCalled();
    expect(moveItem).not.toHaveBeenCalled();
    expect(updateItemContext).not.toHaveBeenCalled();
  });

  it("read-only drawer has real dialog semantics, moves focus in on open, and restores it on close", () => {
    renderBoard();
    const trigger = screen.getAllByText(/Back pain that started gradually/)[0];
    (trigger as HTMLElement).closest("article")?.focus?.();
    fireEvent.click(trigger);

    const dialog = screen.getByLabelText("Call details");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement).toBe(screen.getByLabelText("Close details"));

    fireEvent.click(screen.getByLabelText("Close details"));
    expect(screen.queryByLabelText("Call details")).not.toBeInTheDocument();
  });

  it("read-only drawer traps Tab focus and closes on Escape", () => {
    renderBoard();
    fireEvent.click(screen.getAllByText(/Back pain that started gradually/)[0]);
    const dialog = screen.getByLabelText("Call details");
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const last = focusable[focusable.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(focusable[0]);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByLabelText("Call details")).not.toBeInTheDocument();
  });

  it("never renders any claim/answer/hold/resume/escalate/complete control", () => {
    renderBoard();
    const forbidden = /answer|claim|hold|resume|escalate|reassign|complete call/i;
    document.querySelectorAll("button").forEach((button) => {
      expect(button.textContent ?? "").not.toMatch(forbidden);
    });
  });

  it("toggling Generate Calls on starts continuous generation, and toggling off stops it, without calling other mutation functions", async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    generateDemoStccCall.mockResolvedValue(undefined);
    renderBoard();

    const toggle = screen.getByText("▶ Generate Calls");
    fireEvent.click(toggle);
    expect(screen.getByText("■ Stop Generating")).toBeInTheDocument();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(generateDemoStccCall).toHaveBeenCalledTimes(1);
    expect(refreshQueue).toHaveBeenCalled();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20_000);
    });
    expect(generateDemoStccCall).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText("■ Stop Generating"));
    expect(screen.getByText("▶ Generate Calls")).toBeInTheDocument();

    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(generateDemoStccCall).toHaveBeenCalledTimes(2);

    expect(claimItem).not.toHaveBeenCalled();
    expect(moveItem).not.toHaveBeenCalled();
    expect(updateItemContext).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
