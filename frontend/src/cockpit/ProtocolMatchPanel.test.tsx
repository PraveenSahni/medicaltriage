import { render, screen } from "@testing-library/react";
import { ProtocolMatchPanel } from "./ProtocolMatchPanel";
import type { QueueItem, QueuePreparedProtocol } from "../QueueContext";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: "queue-item-abcdef123456",
    istStaffId: "IST-000042",
    status: "IN_PROCESS",
    currentStage: "PROTOCOL",
    priorityScore: 0,
    patientType: "Staff",
    channel: "Phone",
    summary: "Sore throat",
    reasonNarrative: "Mild sore throat, no red flags, requesting routine advice.",
    identityValidated: true,
    safetyFloorActive: false,
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

function makePrepared(overrides: Partial<QueuePreparedProtocol> = {}): QueuePreparedProtocol {
  return {
    status: "PREPARED",
    sourceType: "open-source-guideline",
    releaseVersion: "v1",
    reasonNarrative: "Mild sore throat, no red flags, requesting routine advice.",
    extractedKeywords: ["sore throat", "routine"],
    primaryProtocolId: "oscg-sore-throat",
    primaryProtocolTitle: "Sore Throat",
    suggestions: [
      {
        protocolId: "oscg-sore-throat",
        titleEn: "Sore Throat",
        score: 5,
        matchedTerms: ["sore throat"],
        questionCount: 4,
        highestSeverity: "Routine",
        releaseVersion: "v1"
      },
      {
        protocolId: "oscg-cold-flu",
        titleEn: "Cold and Flu",
        score: 2,
        matchedTerms: ["routine"],
        questionCount: 3,
        highestSeverity: "Self-care",
        releaseVersion: "v1"
      }
    ],
    acuityQuestionPreview: [],
    careAdviceItems: [],
    resourceSectionsAvailable: {
      background: true,
      firstAid: true,
      careAdvice: true,
      seeMoreAppropriateGuideline: true
    },
    preparedAtIso: new Date().toISOString(),
    ...overrides
  };
}

describe("ProtocolMatchPanel", () => {
  it("renders nothing when no preparedProtocol is present on the item", () => {
    const { container } = render(<ProtocolMatchPanel item={makeItem()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders extracted keywords, patient age/sex, primary protocol, and alternate candidates", () => {
    const item = makeItem({
      preparedProtocol: makePrepared(),
      patientAge: { source: "staff", ageYears: 29, ageMonths: 0, calculatedFrom: "HRMS_AGE_FIELD", biologicalSex: "male" }
    });
    render(<ProtocolMatchPanel item={item} />);

    expect(screen.getByText("29 years · Male")).toBeInTheDocument();
    expect(screen.getAllByText("sore throat").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sore Throat").length).toBeGreaterThan(0);
    expect(screen.getByText("Cold and Flu")).toBeInTheDocument();
    expect(screen.getByText("Score 5")).toBeInTheDocument();
    expect(screen.getByText("Score 2")).toBeInTheDocument();
  });

  it("shows a pending-reason message when status is PENDING_REASON", () => {
    const item = makeItem({ preparedProtocol: makePrepared({ status: "PENDING_REASON", extractedKeywords: [] }) });
    render(<ProtocolMatchPanel item={item} />);
    expect(screen.getByText(/Awaiting reason for call/)).toBeInTheDocument();
  });

  it("shows a no-match message when status is NO_MATCH", () => {
    const item = makeItem({
      preparedProtocol: makePrepared({ status: "NO_MATCH", primaryProtocolId: undefined, primaryProtocolTitle: undefined, suggestions: [] })
    });
    render(<ProtocolMatchPanel item={item} />);
    expect(screen.getByText(/No matching guideline found/)).toBeInTheDocument();
  });

  it("never renders a claim/answer/mutate control", () => {
    const item = makeItem({ preparedProtocol: makePrepared() });
    render(<ProtocolMatchPanel item={item} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
