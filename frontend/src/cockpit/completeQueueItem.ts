import type { QueueClinicalStage, QueueItem, QueueStatus } from "../QueueContext";
import { compileTriageCompletion } from "./api/triageCompletion";

// Shared with CompletionStage.tsx's manual "Complete Call" flow - this is
// also invoked implicitly when a nurse navigates away to open a different
// call while leaving this one fully triaged (disposition + destination
// already set) but not yet explicitly closed. A nurse should never have to
// remember to come back and close a call she's done reviewing just because
// she moved on to the next caller.
export async function completeQueueItem(
  item: QueueItem,
  updateItemContext: (id: string, update: Record<string, unknown>) => Promise<QueueItem>,
  moveItem: (id: string, toStage: QueueClinicalStage, toStatus?: QueueStatus, reason?: string) => Promise<QueueItem>
): Promise<void> {
  if (item.status === "COMPLETED" || !item.dispositionCode || !item.destinationName) {
    return;
  }

  await updateItemContext(item.id, {
    clinicalApproval: item.clinicalApproval ?? { approvedAtIso: new Date().toISOString() }
  });

  if (!item.sbarCopied) {
    const completionRequestBody = {
      ist_staff_id: item.istStaffId,
      chief_complaint: item.reasonNarrative ?? item.summary ?? "Reason not captured.",
      final_disposition_code: item.dispositionCode,
      routing_destination: item.destinationName
    };
    let text: string;
    try {
      const result = await compileTriageCompletion(item.id, completionRequestBody);
      text = typeof result.notePayload === "string" ? result.notePayload : JSON.stringify(result.notePayload, null, 2);
    } catch {
      text = `S: ${item.istStaffId}, reports ${item.reasonNarrative ?? "reason not captured"}\nB: Reason & Rule-Out and Questions completed via structured triage.\nA: Disposition: ${item.dispositionCode}.\nR: Route per disposition; callback precautions given as applicable.`;
    }
    await updateItemContext(item.id, { sbarCopied: true, sbarNoteText: text });
  }

  await moveItem(item.id, "SBAR", "COMPLETED");
}
