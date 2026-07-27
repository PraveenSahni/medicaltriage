import { randomUUID } from "node:crypto";

/**
 * Captures the caller's spoken "reason for call" from the IVR leg of a call
 * and converts it to text via a pluggable speech-to-text provider - same
 * registry pattern as callCenterGateway.ts's CallCenterAdapter, so a real
 * vendor (Twilio recording + a real STT provider) can be registered later
 * without changing the route/orchestration code that calls this module.
 *
 * No real telephony/STT vendor is wired in yet (matches the existing
 * DryRunCallCenterAdapter precedent for the call-center gateway) - only the
 * dry-run provider is registered by default.
 */

export type TranscriptionResult = {
  text: string;
  confidence: number;
  provider: string;
};

export type TranscriptionInput = {
  // A reference to where the raw caller-audio recording lives (e.g. a
  // storage URL/object key) once a real telephony/recording vendor is
  // wired in. Optional today since no real recording pipeline exists yet.
  audioReference?: string;
  // Dry-run/test-only escape hatch: in the absence of a real audio
  // recording and STT vendor, this lets the caller-side flow (or an
  // automated test) supply the text a real STT provider would have
  // produced, so the rest of the pipeline (persistence, protocol
  // re-matching, UI display) can be exercised end-to-end today.
  simulatedTranscriptText?: string;
};

export interface TranscriptionProvider {
  readonly key: string;
  readonly displayName: string;
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>;
}

export class ReasonForCallVoiceCaptureError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

export class DryRunTranscriptionProvider implements TranscriptionProvider {
  readonly key = "dry-run";
  readonly displayName = "IST Dry-Run Speech-to-Text Provider";

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    if (!input.simulatedTranscriptText && !input.audioReference) {
      throw new ReasonForCallVoiceCaptureError(
        400,
        "No caller audio reference or simulated transcript text was supplied to transcribe.",
        "REASON_CALL_AUDIO_MISSING"
      );
    }
    // A real provider would download input.audioReference and run STT on it.
    // The dry-run provider has no audio pipeline behind it, so it can only
    // echo back the caller-supplied simulated transcript - this keeps the
    // interface shape (text/confidence/provider) identical to what a real
    // provider will return, without fabricating clinical content.
    const text = input.simulatedTranscriptText;
    if (!text) {
      throw new ReasonForCallVoiceCaptureError(
        503,
        "No real speech-to-text provider is configured, and no simulated transcript was supplied for this dry-run call.",
        "REASON_CALL_TRANSCRIPTION_UNAVAILABLE"
      );
    }
    return { text, confidence: 1, provider: this.key };
  }
}

type GlobalWithProviders = typeof globalThis & {
  istTranscriptionProviders?: Map<string, TranscriptionProvider>;
};
const globalForProviders = globalThis as GlobalWithProviders;

export function registerTranscriptionProvider(provider: TranscriptionProvider): void {
  globalForProviders.istTranscriptionProviders ??= new Map<string, TranscriptionProvider>();
  globalForProviders.istTranscriptionProviders.set(provider.key, provider);
}

function providers(): Map<string, TranscriptionProvider> {
  if (!globalForProviders.istTranscriptionProviders) {
    globalForProviders.istTranscriptionProviders = new Map<string, TranscriptionProvider>();
    globalForProviders.istTranscriptionProviders.set("dry-run", new DryRunTranscriptionProvider());
  }
  return globalForProviders.istTranscriptionProviders;
}

function resolveProvider(key: string): TranscriptionProvider {
  const provider = providers().get(key);
  if (!provider) {
    throw new ReasonForCallVoiceCaptureError(
      503,
      `Speech-to-text provider '${key}' is not configured.`,
      "REASON_CALL_TRANSCRIPTION_PROVIDER_UNAVAILABLE"
    );
  }
  return provider;
}

// TRANSCRIPTION_PROVIDER lets a real vendor be swapped in later purely via
// configuration - defaults to the dry-run provider since no real vendor is
// wired in yet (mirrors CALL_CENTER_PROVIDER's role for callCenterGateway.ts).
const TRANSCRIPTION_PROVIDER = process.env.TRANSCRIPTION_PROVIDER ?? "dry-run";

export type ReasonForCallCapture = {
  audioReference?: string;
  transcriptText: string;
  confidence: number;
  provider: string;
  capturedAtIso: string;
};

export async function captureReasonForCallAudio(input: TranscriptionInput): Promise<ReasonForCallCapture> {
  const provider = resolveProvider(TRANSCRIPTION_PROVIDER);
  const result = await provider.transcribe(input);
  return {
    audioReference: input.audioReference,
    transcriptText: result.text,
    confidence: result.confidence,
    provider: result.provider,
    capturedAtIso: new Date().toISOString()
  };
}

// Exposed for tests/manual verification of a fresh capture id if ever needed
// to correlate a capture with an external recording asset.
export function newCaptureReferenceId(): string {
  return `reason-capture-${randomUUID()}`;
}
