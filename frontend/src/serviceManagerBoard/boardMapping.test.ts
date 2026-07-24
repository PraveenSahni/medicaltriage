import {
  countAssignedNurses,
  countInFlow,
  countSafetyAlerts,
  countWaiting,
  deriveWaitTime,
  mapExistingStatusToBoardColumn,
  maskId
} from "./boardMapping";
import type { QueueItem } from "../QueueContext";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "queue-item-abcdef123456",
    istStaffId: "IST-000042",
    status: "INCOMING",
    currentStage: "INTAKE",
    priorityScore: 0,
    patientType: "Staff",
    channel: "Phone",
    summary: "Back pain",
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

describe("mapExistingStatusToBoardColumn", () => {
  it("maps INCOMING to waiting", () => {
    expect(mapExistingStatusToBoardColumn(makeItem({ status: "INCOMING" }))).toBe("waiting");
  });

  it.each([
    ["INTAKE", "reasonRuleOut"],
    ["IDENTITY", "reasonRuleOut"],
    ["VITALS", "reasonRuleOut"],
    ["PROTOCOL", "questions"],
    ["DISPOSITION", "dispositionAdvice"],
    ["SBAR", "sbarComplete"]
  ] as const)("maps IN_PROCESS + %s to %s", (stage, column) => {
    expect(
      mapExistingStatusToBoardColumn(makeItem({ status: "IN_PROCESS", currentStage: stage }))
    ).toBe(column);
  });

  it("treats INFO_REQUIRED the same as IN_PROCESS", () => {
    expect(
      mapExistingStatusToBoardColumn(makeItem({ status: "INFO_REQUIRED", currentStage: "PROTOCOL" }))
    ).toBe("questions");
  });

  it("maps COMPLETED to its own closed column regardless of stage", () => {
    expect(
      mapExistingStatusToBoardColumn(makeItem({ status: "COMPLETED", currentStage: "INTAKE" }))
    ).toBe("closed");
    expect(
      mapExistingStatusToBoardColumn(makeItem({ status: "COMPLETED", currentStage: "SBAR" }))
    ).toBe("closed");
  });
});

describe("deriveWaitTime", () => {
  it("formats elapsed time as MM:SS", () => {
    const createdAtIso = new Date(Date.now() - 90_000).toISOString();
    expect(deriveWaitTime(makeItem({ createdAtIso }))).toBe("01:30");
  });
});

describe("maskId", () => {
  it("never exposes more than the last 4 characters", () => {
    const raw = "queue-item-abcdef123456";
    const masked = maskId(raw);
    expect(masked.endsWith("3456")).toBe(true);
    expect(masked).not.toContain(raw.slice(0, -4));
  });

  it("renders at a fixed width regardless of the raw id's length", () => {
    const short = maskId("ab123456");
    const long = maskId("queue-item-abcdef123456");
    expect(short.length).toBe(long.length);
  });

  it("still masks short ids using the same fixed-width format", () => {
    expect(maskId("ab12")).toBe("********ab12");
  });

  it("returns a placeholder for missing ids", () => {
    expect(maskId(undefined)).toBe("—");
  });
});

describe("summary aggregation helpers", () => {
  const queue: QueueItem[] = [
    makeItem({ id: "1", status: "INCOMING" }),
    makeItem({ id: "2", status: "IN_PROCESS", currentStage: "PROTOCOL", lockedBy: "nurse-a" }),
    makeItem({ id: "3", status: "IN_PROCESS", currentStage: "DISPOSITION", lockedBy: "nurse-b", safetyFloorActive: true }),
    makeItem({ id: "4", status: "COMPLETED", currentStage: "SBAR", lockedBy: "nurse-a" })
  ];

  it("countWaiting counts only waiting-column items", () => {
    expect(countWaiting(queue)).toBe(1);
  });

  it("countInFlow counts non-waiting, non-completed items", () => {
    expect(countInFlow(queue)).toBe(2);
  });

  it("countSafetyAlerts excludes completed items", () => {
    expect(countSafetyAlerts(queue)).toBe(1);
  });

  it("countAssignedNurses counts distinct nurses on open items only", () => {
    expect(countAssignedNurses(queue)).toBe(2);
  });
});
