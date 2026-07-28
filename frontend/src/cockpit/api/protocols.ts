const apiBase = import.meta.env.VITE_API_BASE_URL || "";

export type InitialAssessmentResponseType =
  | "LOCATION"
  | "DURATION"
  | "YES_NO"
  | "TEMPERATURE"
  | "PAIN_SCALE"
  | "OPEN_TEXT";

export type InitialAssessmentQuestion = {
  id: string;
  sequence: number;
  responseType: InitialAssessmentResponseType;
  promptTextEn: string;
  clarificationPromptEn?: string;
  required: boolean;
};

export type ProtocolTaqQuestion = {
  id: string;
  acuityOrder: number;
  severity: "Emergency" | "Urgent" | "Routine" | "Self-care";
  questionTextEn: string;
  dispositionCode: string;
  rationaleEn?: string;
  redFlag?: boolean;
  careAdviceIds?: string[];
  telemedicineEligible?: boolean;
  telemedicineNotesEn?: string;
  // Real STCC disposition-level ladder value (e.g. 100/90/85/80...) - already
  // in the backend ClinicalContentQuestionSchema, used here to group
  // contiguous not-yet-answered questions for a scoped "No to all".
  dispositionLevel?: number;
};

export type ProtocolCareAdvice = {
  id: string;
  titleEn: string;
  instructionTextEn: string;
  dispositionCode?: string;
  patientSendable?: boolean;
  displayOrder?: number;
};

export type ProtocolSupplemental = {
  id: string;
  titleEn: string;
  supplementalType: string;
  plainTextEn: string;
  displayOrder?: number;
};

export type ProtocolDetail = {
  release: unknown;
  protocol: {
    id: string;
    initialAssessmentQuestions: InitialAssessmentQuestion[];
    questions: ProtocolTaqQuestion[];
    careAdvice: ProtocolCareAdvice[];
    supplementals?: ProtocolSupplemental[];
    [key: string]: unknown;
  };
};

const cache = new Map<string, Promise<ProtocolDetail>>();

/**
 * The queue item's own preparedProtocol is a trimmed DTO that only carries
 * acuityQuestionPreview (TAQs) - Initial Assessment Questions are not copied
 * onto it (see src/services/queueOrchestration.ts). They already exist in
 * full on GET /api/v1/protocols/:protocolId, so we fetch that directly
 * rather than requiring a backend change.
 */
export function fetchProtocolDetail(protocolId: string): Promise<ProtocolDetail> {
  const cached = cache.get(protocolId);
  if (cached) {
    return cached;
  }
  const request = fetch(`${apiBase}/api/v1/protocols/${encodeURIComponent(protocolId)}`, {
    credentials: "include"
  }).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? `Failed to load protocol ${protocolId}`);
    }
    return payload as ProtocolDetail;
  });
  cache.set(protocolId, request);
  request.catch(() => cache.delete(protocolId));
  return request;
}
