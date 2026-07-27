import { useState } from "react";
import { useQueue, type QueueItem, type QueueVitals } from "../../QueueContext";
import { InitialAssessmentQuestions } from "../InitialAssessmentQuestions";
import { ProtocolMatchPanel } from "../ProtocolMatchPanel";

const numericVitalKeys: Array<keyof Omit<QueueVitals, "consciousLevel">> = ["heartRate", "respiratoryRate", "spo2"];

const vitalLabels: Record<string, string> = {
  heartRate: "Heart Rate (bpm)",
  respiratoryRate: "Respiratory Rate (/min)",
  spo2: "SpO2 (%)"
};

const vitalPlaceholders: Record<string, string> = {
  heartRate: "60-100",
  respiratoryRate: "12-20",
  spo2: "95-100"
};

// Real callers do not all sound the same - a stand-in variety of English
// accents used for the demo speech playback below (see playReasonAudio),
// picked deterministically per call so the same call always plays back
// consistently while different calls sound like different callers.
const ENGLISH_ACCENT_LOCALES = ["en-US", "en-GB", "en-AU", "en-IN", "en-ZA", "en-CA", "en-IE", "en-NZ"];

function hashStringToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % modulo;
}

export function ReasonRuleOutStage({
  item,
  isReadOnly,
  onContinue
}: {
  item: QueueItem;
  isReadOnly: boolean;
  onContinue: () => void;
}) {
  const { updateItemContext } = useQueue();
  const [saving, setSaving] = useState(false);
  const [vitalsUnobtainable, setVitalsUnobtainable] = useState(Boolean(item.vitalsUnobtainable));
  const [reasonNarrative, setReasonNarrative] = useState(item.reasonNarrative ?? "");
  const [saveError, setSaveError] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [playingAudio, setPlayingAudio] = useState(false);

  const temperature = item.vitals?.temperature ?? 37;

  async function saveVitalsUnobtainable(next: boolean) {
    setVitalsUnobtainable(next);
    setSaving(true);
    setSaveError("");
    try {
      await updateItemContext(item.id, { vitalsUnobtainable: next });
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveVital(field: string, value: unknown) {
    setSaving(true);
    setSaveError("");
    try {
      await updateItemContext(item.id, { vitals: { ...item.vitals, [field]: value } });
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function saveReasonNarrative() {
    if (reasonNarrative === item.reasonNarrative) {
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await updateItemContext(item.id, { reasonNarrative });
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function speakWithVoices() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(reasonNarrative);
    // Different callers should not all sound identical - pick a different
    // English accent deterministically from the call id, so the same call
    // always plays back with the same voice but different calls vary.
    const accentLocale = ENGLISH_ACCENT_LOCALES[hashStringToIndex(item.id, ENGLISH_ACCENT_LOCALES.length)];
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice =
      voices.find((voice) => voice.lang === accentLocale) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang;
    } else {
      utterance.lang = accentLocale;
    }
    utterance.onstart = () => setPlayingAudio(true);
    utterance.onend = () => setPlayingAudio(false);
    utterance.onerror = () => setPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }

  // No real recorded caller-audio file exists yet (no telephony vendor is
  // wired in - see reasonForCallVoiceCapture.ts), so there is nothing real
  // to play back. For demo purposes this uses the browser's built-in
  // speech synthesis to read the captured reason aloud, standing in for
  // "play the caller's recorded audio" until a real recording pipeline
  // exists - at that point this button should be swapped for an <audio>
  // element pointing at item.reasonCallCapture.audioReference instead.
  // A different English accent is used per call (deterministic on the call
  // id) so callers don't all sound identical, matching real caller variety.
  function playReasonAudio() {
    if (!("speechSynthesis" in window)) {
      setCaptureError("Audio playback is not supported in this browser.");
      return;
    }
    // Some browsers load the voice list asynchronously and return an empty
    // array on the very first call - wait for it once rather than falling
    // back to the default voice permanently.
    if (window.speechSynthesis.getVoices().length === 0) {
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        speakWithVoices();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      // Some browsers never fire voiceschanged if voices were already
      // available synchronously elsewhere - fall back after a short delay.
      window.setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        speakWithVoices();
      }, 250);
      return;
    }
    speakWithVoices();
  }

  return (
    <section aria-label="Reason and Rule-Out">
      <div className="action-sub-note">
        Opening script, HRMS context, reason, guideline selection, and emergency rule-out are
        handled before lower-acuity assessment questions.
      </div>

      <div className="opening-script">
        <div className="os-icon" aria-hidden="true">
          &#9742;
        </div>
        <div>
          <div className="os-script">
            Greet caller, confirm role <span>({item.reasonNarrative ?? "reason not yet captured"})</span>
          </div>
          <div className="os-facts">
            <span>{item.channel}</span>
            <span>
              <b>Patient</b> {item.patientType}
            </span>
            {item.department && (
              <span>
                <b>Department</b> {item.department}
              </span>
            )}
            {item.stationCode && (
              <span>
                <b>Station</b> {item.stationCode}
              </span>
            )}
            {item.identityValidated ? (
              <span className="hrms-ok">HRMS Validated</span>
            ) : (
              <span className="hrms-warn">HRMS Review Needed</span>
            )}
          </div>
        </div>
      </div>

      <div className="sub-hdr">History Taking</div>
      <div className="reason-card">
        <div className="reason-label-row">
          <label htmlFor="history-input">Reason for Call - in the caller&rsquo;s own words</label>
          {item.reasonCallCapture && (
            <button
              type="button"
              className="reason-audio-play-btn"
              onClick={playReasonAudio}
              disabled={playingAudio}
              aria-label="Play call audio"
              title="Play call audio"
            >
              {playingAudio ? "\u{1F50A} Playing..." : "▶ Play call audio"}
            </button>
          )}
        </div>
        <textarea
          id="history-input"
          value={reasonNarrative}
          disabled={isReadOnly || saving}
          onChange={(event) => setReasonNarrative(event.target.value)}
          onBlur={saveReasonNarrative}
        />
        {item.reasonCallCapture && (
          <div className="reason-capture-note">
            Auto-filled from call audio via {item.reasonCallCapture.provider}
            {typeof item.reasonCallCapture.confidence === "number"
              ? ` (${Math.round(item.reasonCallCapture.confidence * 100)}% confidence)`
              : ""}{" "}
            - edit above if the transcription needs correcting.
          </div>
        )}
        {captureError && (
          <p className="cockpit-action-error" role="alert">
            {captureError}
          </p>
        )}
      </div>

      <ProtocolMatchPanel item={item} isReadOnly={isReadOnly} />

      {item.safetyFloorActive ? (
        <div className="redflag-banner active" role="alert">
          <span>&#9888;</span>
          <span>
            Emergency safety floor auto-applied ({item.safetyFloorSource ?? "symptom"}-based). This cannot be
            downgraded below Emergency for this call.
          </span>
        </div>
      ) : (
        <div className="redflag-banner clear">
          <span>&#10003;</span>
          <span>No red-flag phrases detected in the history so far, and no vitals currently outside safe range.</span>
        </div>
      )}

      <div className="sub-hdr">
        Vital Taking <span className="optional-tag">Optional</span>
      </div>
      <div className={`vitals-card${vitalsUnobtainable ? " disabled" : ""}`}>
        <label className="vitals-unobtainable">
          <input
            type="checkbox"
            checked={vitalsUnobtainable}
            disabled={isReadOnly || saving}
            onChange={(event) => saveVitalsUnobtainable(event.target.checked)}
          />
          Vitals cannot be obtained on this call
        </label>

        <div className="vitals-grid">
          {numericVitalKeys.map((key) => (
            <div className="vfield" key={key}>
              <label>{vitalLabels[key]}</label>
              <input
                type="number"
                placeholder={vitalPlaceholders[key]}
                value={item.vitals?.[key] ?? ""}
                disabled={isReadOnly || saving}
                onChange={(event) => saveVital(key, Number(event.target.value))}
              />
            </div>
          ))}
          <div className="vfield">
            <label>Consciousness (AVPU)</label>
            <select
              value={item.vitals?.consciousLevel ?? "alert"}
              disabled={isReadOnly || saving}
              onChange={(event) => saveVital("consciousLevel", event.target.value)}
            >
              <option value="alert">Alert</option>
              <option value="voice">Responds to Voice</option>
              <option value="pain">Responds to Pain</option>
              <option value="unresponsive">Unresponsive</option>
            </select>
          </div>
          <div className="vfield">
            <label>Temperature</label>
            <div className="temp-row">
              <input
                type="range"
                min="34"
                max="42"
                step="0.1"
                value={temperature}
                disabled={isReadOnly || saving}
                onChange={(event) => saveVital("temperature", Number(event.target.value))}
              />
              <span className="temp-value">{temperature.toFixed(1)}&deg;C</span>
            </div>
          </div>
        </div>

        {saveError && (
          <p className="cockpit-action-error" role="alert">
            {saveError}
          </p>
        )}
      </div>

      <InitialAssessmentQuestions item={item} isReadOnly={isReadOnly} />

      {!isReadOnly && (
        <div className="continue-gate">
          <span>Reason and rule-out reviewed.</span>
          <button type="button" onClick={onContinue}>
            Triage Questions &rarr;
          </button>
        </div>
      )}
    </section>
  );
}
