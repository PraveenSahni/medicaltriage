import { render, screen } from "@testing-library/react";
import { ManagerCallCard } from "./ManagerCallCard";
import type { QueueItem } from "../QueueContext";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "queue-item-abcdef123456",
    istStaffId: "IST-000042",
    status: "IN_PROCESS",
    currentStage: "PROTOCOL",
    priorityScore: 0,
    patientType: "Staff",
    channel: "Phone",
    summary: "Back pain",
    reasonNarrative: "Mild-to-moderate back pain that started gradually a few days ago.",
    identityValidated: true,
    calculatedSeverity: "URGENT",
    safetyFloorActive: false,
    sbarCopied: false,
    lockedByName: "Nurse Sara",
    stationCode: "DOH",
    slaDeadlineIso: new Date().toISOString(),
    customAviationTags: [],
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
    stccProcess: {
      processName: "Telehealth Triage Encounter",
      averageDurationMinutes: "11-13",
      currentActionTab: "QUESTIONS",
      canonicalSteps: [],
      visibleActionTabs: []
    },
    ...overrides
  } as QueueItem;
}

describe("ManagerCallCard", () => {
  it("renders masked id, severity pill, title, and footer without exposing raw identifiers", () => {
    const item = makeItem();
    render(<ManagerCallCard item={item} column="questions" onClick={() => {}} />);

    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Nurse Sara")).toBeInTheDocument();

    const rendered = document.body.textContent ?? "";
    expect(rendered).toContain("Mild-to-moderate back pain");
    expect(rendered).not.toContain(item.id);
    expect(rendered).not.toContain(item.istStaffId);
    expect(rendered).not.toMatch(/RAG|confidence/i);
  });

  it("does not repeat the narrative when it duplicates the derived title", () => {
    const item = makeItem({ reasonNarrative: "Mild back pain since this morning." });
    render(<ManagerCallCard item={item} column="questions" onClick={() => {}} />);
    // Title and narrative are the same short sentence - only one occurrence
    // should render, not the title followed by an identical second line.
    expect(screen.getAllByText(/Mild back pain since this morning/).length).toBe(1);
  });

  it("shows the narrative separately when it adds information beyond the title", () => {
    const item = makeItem({
      reasonNarrative:
        "Twisted ankle while playing sport. Cannot put weight on it and swelling has started."
    });
    render(<ManagerCallCard item={item} column="questions" onClick={() => {}} />);
    expect(screen.getByText("Twisted ankle while playing sport.")).toBeInTheDocument();
    expect(
      screen.getByText("Twisted ankle while playing sport. Cannot put weight on it and swelling has started.")
    ).toBeInTheDocument();
  });

  it("shows active SBAR cases in the SBAR/Complete column and completed cases in the separate Closed column", () => {
    const active = makeItem({ status: "IN_PROCESS", currentStage: "SBAR" });
    const { unmount } = render(<ManagerCallCard item={active} column="sbarComplete" onClick={() => {}} />);
    expect(screen.getByText("Active SBAR")).toBeInTheDocument();
    unmount();

    const completed = makeItem({ status: "COMPLETED", currentStage: "SBAR" });
    render(<ManagerCallCard item={completed} column="closed" onClick={() => {}} />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("never renders a claim/answer/move/escalate control", () => {
    render(<ManagerCallCard item={makeItem()} column="questions" onClick={() => {}} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
