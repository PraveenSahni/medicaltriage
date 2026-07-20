import {
  VoiceInterpreterInputSchema,
  VoiceInterpreterOutputSchema,
  type VoiceInterpreterInput,
  type VoiceInterpreterOutput
} from "../types/voiceAssessment.js";

export type VoiceInterpreterContext = {
  provider: string;
  model?: string;
  version: string;
};

export type VoiceInterpretation = {
  result: VoiceInterpreterOutput;
  context: VoiceInterpreterContext;
};

export interface VoiceResponseInterpreter {
  interpret(input: VoiceInterpreterInput): Promise<VoiceInterpretation>;
}

export interface MedGemmaInferencePort {
  infer(input: VoiceInterpreterInput): Promise<unknown>;
}

const UNCERTAIN_PHRASES = [
  "i do not know",
  "i don't know",
  "not sure",
  "cannot tell",
  "can't tell",
  "maybe",
  "unclear"
];

function normalized(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bdon't\b/g, "do not")
    .replace(/\bwon't\b/g, "will not")
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceSnippet(transcript: string): string[] {
  const trimmed = transcript.trim();
  return trimmed ? [trimmed.slice(0, 240)] : [];
}

function emergencySignal(input: VoiceInterpreterInput, transcript: string): string | undefined {
  return input.emergencyKeywords.find((keyword) => transcript.includes(normalized(keyword)));
}

function yesNoValue(transcript: string): boolean | undefined {
  if (
    /^(no|nope|cannot|cant)\b/.test(transcript) ||
    /\b(cannot|can not|unable to)\b/.test(transcript)
  ) {
    return false;
  }
  if (
    /^(yes|yeah|yep|correct)\b/.test(transcript) ||
    /\b(can|able to)\b/.test(transcript)
  ) {
    return true;
  }
  return undefined;
}

function painScaleValue(transcript: string): number | undefined {
  const match = transcript.match(/(?:^|\s)(10|[0-9])(?:\s|$)/);
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  return Number.isInteger(value) && value >= 0 && value <= 10 ? value : undefined;
}

export class DeterministicVoiceResponseInterpreter implements VoiceResponseInterpreter {
  async interpret(rawInput: VoiceInterpreterInput): Promise<VoiceInterpretation> {
    const input = VoiceInterpreterInputSchema.parse(rawInput);
    const transcript = normalized(input.transcriptText);
    const evidence = evidenceSnippet(input.transcriptText);

    if (input.interrupted) {
      return {
        result: VoiceInterpreterOutputSchema.parse({
          classification: "INTERRUPTED",
          confidence: 1,
          evidence,
          requiresNurseTakeover: false
        }),
        context: { provider: "deterministic", version: "1.0.0" }
      };
    }

    const emergencyKeyword = emergencySignal(input, transcript);
    if (emergencyKeyword) {
      return {
        result: VoiceInterpreterOutputSchema.parse({
          classification: "EMERGENCY_SIGNAL",
          value: input.transcriptText.trim(),
          confidence: Math.max(input.sttConfidence ?? 0.8, 0.8),
          evidence: [...evidence, `Matched configured emergency phrase: ${emergencyKeyword}`],
          requiresNurseTakeover: true,
          takeoverReason: "A configured emergency phrase was detected during initial assessment."
        }),
        context: { provider: "deterministic", version: "1.0.0" }
      };
    }

    if (
      !transcript ||
      (input.sttConfidence !== undefined && input.sttConfidence < 0.65) ||
      UNCERTAIN_PHRASES.some((phrase) => transcript.includes(phrase))
    ) {
      return {
        result: VoiceInterpreterOutputSchema.parse({
          classification: "UNCERTAIN",
          confidence: input.sttConfidence ?? 0,
          evidence,
          requiresNurseTakeover: false
        }),
        context: { provider: "deterministic", version: "1.0.0" }
      };
    }

    if (input.responseType === "YES_NO") {
      const value = yesNoValue(transcript);
      if (value === undefined) {
        return {
          result: VoiceInterpreterOutputSchema.parse({
            classification: "UNCERTAIN",
            confidence: Math.min(input.sttConfidence ?? 0.5, 0.6),
            evidence,
            requiresNurseTakeover: false
          }),
          context: { provider: "deterministic", version: "1.0.0" }
        };
      }
      return {
        result: VoiceInterpreterOutputSchema.parse({
          classification: value ? "YES" : "NO",
          value,
          confidence: input.sttConfidence ?? 0.9,
          evidence,
          requiresNurseTakeover: false
        }),
        context: { provider: "deterministic", version: "1.0.0" }
      };
    }

    if (input.responseType === "PAIN_SCALE") {
      const value = painScaleValue(transcript);
      if (value === undefined) {
        return {
          result: VoiceInterpreterOutputSchema.parse({
            classification: "UNCERTAIN",
            confidence: Math.min(input.sttConfidence ?? 0.5, 0.6),
            evidence,
            requiresNurseTakeover: false
          }),
          context: { provider: "deterministic", version: "1.0.0" }
        };
      }
      return {
        result: VoiceInterpreterOutputSchema.parse({
          classification: "OPEN_TEXT",
          value,
          confidence: input.sttConfidence ?? 0.9,
          evidence,
          requiresNurseTakeover: false
        }),
        context: { provider: "deterministic", version: "1.0.0" }
      };
    }

    return {
      result: VoiceInterpreterOutputSchema.parse({
        classification: "OPEN_TEXT",
        value: input.transcriptText.trim(),
        confidence: input.sttConfidence ?? 0.85,
        evidence,
        requiresNurseTakeover: false
      }),
      context: { provider: "deterministic", version: "1.0.0" }
    };
  }
}

/**
 * Adapter for a future Qatar-hosted MedGemma endpoint. The endpoint can only
 * return the strict interpretation contract; clinical outcome fields are
 * rejected by Zod's strict parser.
 */
export class BoundedMedGemmaVoiceResponseInterpreter implements VoiceResponseInterpreter {
  constructor(
    private readonly port: MedGemmaInferencePort,
    private readonly model = "medgemma",
    private readonly version = "unconfigured"
  ) {}

  async interpret(rawInput: VoiceInterpreterInput): Promise<VoiceInterpretation> {
    const input = VoiceInterpreterInputSchema.parse(rawInput);
    const rawOutput = await this.port.infer(input);
    return {
      result: VoiceInterpreterOutputSchema.parse(rawOutput),
      context: {
        provider: "medgemma-bounded",
        model: this.model,
        version: this.version
      }
    };
  }
}
