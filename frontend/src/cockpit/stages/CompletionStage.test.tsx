import { render, screen, waitFor } from "@testing-library/react";
import { CompletionStage } from "./CompletionStage";
import type { QueueItem } from "../../QueueContext";

const updateItemContext = jest.fn().mockResolvedValue(undefined);
const moveItem = jest.fn().mockResolvedValue(undefined);

jest.mock("../../QueueContext", () => ({
  useQueue: () => ({ updateItemContext, moveItem })
}));

const previewTriageCompletion = jest.fn();
const compileTriageCompletion = jest.fn();

jest.mock("../api/triageCompletion", () => ({
  previewTriageCompletion: (...args: unknown[]) => previewTriageCompletion(...args),
  compileTriageCompletion: (...args: unknown[]) => compileTriageCompletion(...args)
}));

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "queue-item-abc",
    istStaffId: "IST-000042",
    status: "COMPLETED",
    currentStage: "SBAR",
    priorityScore: 0,
    patientType: "Staff",
    channel: "Phone",
    summary: "Ear pain",
    reasonNarrative: "Ear pain and reduced hearing since twenty minutes ago.",
    dispositionCode: "HMC_URGENT_REVIEW",
    destinationName: "HMC urgent review pathway",
    identityValidated: true,
    safetyFloorActive: false,
    sbarCopied: true,
    stccProcess: {
      processName: "Telehealth Triage Encounter",
      averageDurationMinutes: "11-13",
      currentActionTab: "SBAR_COMPLETE",
      canonicalSteps: [],
      visibleActionTabs: []
    },
    ...overrides
  } as QueueItem;
}

beforeEach(() => {
  updateItemContext.mockClear();
  moveItem.mockClear();
  previewTriageCompletion.mockReset().mockResolvedValue({ notePayload: "# default preview note", preview: true });
  compileTriageCompletion.mockReset();
});

describe("CompletionStage", () => {
  it("shows the persisted sbarNoteText directly for a completed call, without calling the preview endpoint", () => {
    const item = makeItem({ sbarNoteText: "# Real bilingual note\n...persisted content..." });
    render(<CompletionStage item={item} isReadOnly onCallCompleted={jest.fn()} />);

    expect(screen.getByText(/Real bilingual note/)).toBeInTheDocument();
    expect(previewTriageCompletion).not.toHaveBeenCalled();
  });

  it("fetches and displays a read-only preview for a completed call with no persisted note", async () => {
    previewTriageCompletion.mockResolvedValue({ notePayload: "# Generated preview note", preview: true });
    const item = makeItem({ sbarNoteText: undefined });
    render(<CompletionStage item={item} isReadOnly onCallCompleted={jest.fn()} />);

    expect(screen.getByText(/This call was closed before the SBAR note text was captured\./)).toBeInTheDocument();

    await waitFor(() => expect(previewTriageCompletion).toHaveBeenCalledTimes(1));
    expect(previewTriageCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        ist_staff_id: item.istStaffId,
        chief_complaint: item.reasonNarrative,
        final_disposition_code: item.dispositionCode,
        routing_destination: item.destinationName
      })
    );
    await waitFor(() => expect(screen.getByText(/Generated preview note/)).toBeInTheDocument());
  });

  it("never calls the non-idempotent /triage/complete path for a completed call review", () => {
    const item = makeItem({ sbarNoteText: undefined });
    render(<CompletionStage item={item} isReadOnly onCallCompleted={jest.fn()} />);
    expect(compileTriageCompletion).not.toHaveBeenCalled();
  });

  it("sends the correct snake_case field names to compileTriageCompletion when completing an active call, with no manual Copy SBAR step", async () => {
    compileTriageCompletion.mockResolvedValue({ notePayload: "# Active note", clipboardOptimized: true });
    const item = makeItem({
      status: "IN_PROCESS",
      sbarNoteText: undefined,
      sbarCopied: false,
      dispositionCode: "HMC_URGENT_REVIEW",
      destinationName: "HMC urgent review pathway"
    });
    render(<CompletionStage item={item} isReadOnly={false} onCallCompleted={jest.fn()} />);

    expect(screen.queryByRole("button", { name: /Copy SBAR/ })).not.toBeInTheDocument();

    const completeButton = screen.getByRole("button", { name: /Complete Call/ });
    completeButton.click();

    await waitFor(() => expect(compileTriageCompletion).toHaveBeenCalledTimes(1));
    expect(compileTriageCompletion).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({
        ist_staff_id: item.istStaffId,
        chief_complaint: item.reasonNarrative,
        final_disposition_code: item.dispositionCode,
        routing_destination: item.destinationName
      })
    );
  });
});
