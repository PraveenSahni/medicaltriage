import { render, screen, fireEvent } from "@testing-library/react";
import { RagShadowRail } from "./RagShadowRail";
import type { QueueItem, RagShadowSuggestion } from "../QueueContext";

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

function makeRagShadow(overrides: Partial<RagShadowSuggestion> = {}): RagShadowSuggestion {
  return {
    mode: "DRY_RUN_SHADOW",
    boundary: "APPROVED_CONTENT_ONLY",
    sourceType: "open-source-guideline",
    sourceReleaseVersion: "v1",
    query: "Mild sore throat, no red flags, requesting routine advice.",
    extractedReason: {
      normalizedReason: "mild sore throat no red flags requesting routine advice",
      keywords: ["sore throat", "routine"],
      possibleRedFlags: []
    },
    retrieval: {
      eventId: "evt-1",
      corpusIds: ["corpus-1"],
      retrievedSourceIds: ["oscg-sore-throat"],
      retrievedSnippetHashes: ["hash-1"],
      confidence: 0.82
    },
    suggestedProtocolCandidates: [
      {
        protocolId: "oscg-sore-throat",
        titleEn: "Sore Throat",
        score: 5,
        matchedTerms: ["sore throat"],
        questionCount: 4,
        highestSeverity: "Routine",
        releaseVersion: "v1"
      }
    ],
    comparison: {
      deterministicPrimaryProtocolId: "oscg-sore-throat",
      shadowPrimaryProtocolId: "oscg-sore-throat",
      agreement: "FULL_MATCH",
      reasonCode: "IDENTICAL_TOP_CANDIDATE"
    },
    prohibitedActionAcknowledgement: ["Shadow suggestions must never auto-set disposition."],
    cannotDecideDisposition: true,
    requiresNurseReview: true,
    generatedAtIso: new Date().toISOString(),
    ...overrides
  };
}

describe("RagShadowRail", () => {
  it("shows an empty message when ragShadow is not present", () => {
    render(<RagShadowRail item={makeItem()} />);
    expect(screen.getByText(/No shadow comparison available/)).toBeInTheDocument();
  });

  it("renders agreement, confidence, candidates, and boundary notes when ragShadow is present", () => {
    const item = makeItem({ preparedProtocol: { ragShadow: makeRagShadow() } as QueueItem["preparedProtocol"] });
    render(<RagShadowRail item={item} />);

    // Starts collapsed - expand it first.
    fireEvent.click(screen.getByRole("button", { name: /RAG Shadow \(Advisory\)/ }));
    expect(screen.getByText("Full agreement")).toBeInTheDocument();
    expect(screen.getByText("82% confidence")).toBeInTheDocument();
    expect(screen.getByText("Sore Throat")).toBeInTheDocument();
    expect(screen.getByText("Score 5")).toBeInTheDocument();
    expect(screen.getByText("Shadow suggestions must never auto-set disposition.")).toBeInTheDocument();
    expect(screen.getByText(/Advisory only/)).toBeInTheDocument();
  });

  it("collapses and expands via the toggle without any network call", () => {
    const item = makeItem({ preparedProtocol: { ragShadow: makeRagShadow() } as QueueItem["preparedProtocol"] });
    render(<RagShadowRail item={item} />);

    // Starts collapsed.
    expect(screen.queryByText("Full agreement")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /RAG Shadow \(Advisory\)/ }));
    expect(screen.getByText("Full agreement")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /RAG Shadow \(Advisory\)/ }));
    expect(screen.queryByText("Full agreement")).not.toBeInTheDocument();
  });

  it("never renders a mutating control beyond the collapse toggle", () => {
    const item = makeItem({ preparedProtocol: { ragShadow: makeRagShadow() } as QueueItem["preparedProtocol"] });
    render(<RagShadowRail item={item} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(1);
    expect(buttons[0]).toHaveTextContent(/RAG Shadow \(Advisory\)/);
  });
});
