import { useEffect, useState } from "react";
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

// Mirrors the backend's QueueVitalsSchema clinical bounds exactly (src/types/queue.ts) -
// a value outside these is always rejected server-side, so checking here first means a
// nurse tabbing away mid-digit (e.g. "6" on the way to typing "60") never triggers a
// failed save; the draft just stays locally with a clear reason why it hasn't been sent.
const vitalBounds: Record<string, [number, number]> = {
  heartRate: [20, 260],
  respiratoryRate: [4, 80],
  spo2: [50, 100]
};

// Real smart-default/autocomplete suggestions (UX/NFR-014) - the most
// common real-world values within each vital's normal range, offered via
// a native <datalist> so a nurse can pick a typical value with one click
// instead of typing every time, while still being free to enter any other
// number.
const vitalSuggestions: Record<string, number[]> = {
  heartRate: [60, 72, 80, 90, 100],
  respiratoryRate: [12, 14, 16, 18, 20],
  spo2: [95, 97, 98, 99, 100]
};

// Real callers do not all sound the same - a stand-in variety of English
// accents used for the demo speech playback below (see playReasonAudio),
// picked deterministically per call so the same call always plays back
// consistently while different calls sound like different callers.
const ENGLISH_ACCENT_LOCALES = ["en-US", "en-GB", "en-AU", "en-IN", "en-ZA", "en-CA", "en-IE", "en-NZ"];

// Same sex-label convention as Sidebar.tsx's genderWord() - "Not set" for a
// missing/other value rather than silently omitting it, since a nurse acting
// on this opening script should never have to guess whether sex data exists.
function sexAgeLabel(patientAge: QueueItem["patientAge"]): string {
  if (!patientAge) {
    return "Age/sex not yet available";
  }
  const sex =
    patientAge.biologicalSex === "female"
      ? "Female"
      : patientAge.biologicalSex === "male"
        ? "Male"
        : patientAge.biologicalSex === "other"
          ? "Other"
          : "Sex not set";
  return `${patientAge.ageYears} yrs · ${sex}`;
}

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
  // Vitals are almost never obtainable on a phone/tele-triage call, so this
  // defaults to checked for a fresh call (item.vitalsUnobtainable === undefined)
  // - it only reads as false if a nurse has explicitly unchecked it before.
  const [vitalsUnobtainable, setVitalsUnobtainable] = useState(item.vitalsUnobtainable ?? true);
  const [reasonNarrative, setReasonNarrative] = useState(item.reasonNarrative ?? "");
  const [saveError, setSaveError] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [playingAudio, setPlayingAudio] = useState(false);
  // Vital Taking is optional and rarely needed on a tele-triage call, so it
  // always starts collapsed - the nurse can still expand it manually.
  const [vitalsExpanded, setVitalsExpanded] = useState(false);
  // Same signal ProtocolMatchPanel already uses to lock guideline selection
  // once Triage Questions have been answered - the Reason for Call must not
  // be editable after that point either, since changing it would silently
  // re-score the protocol match underneath a call whose clinical questions
  // (and therefore disposition path) were already answered against the
  // previous wording.
  const questionsStarted = Boolean(item.taqResponses && Object.keys(item.taqResponses).length > 0);
  const [confirmingTranscript, setConfirmingTranscript] = useState(false);
  // True whenever the textarea has a draft that differs from what's actually
  // saved - the same condition the Confirm-save button already gates on.
  // Shown as a "Changed" flag next to Play call audio so the nurse can see
  // at a glance that her edit hasn't been saved yet.
  const hasUnsavedReasonEdit = reasonNarrative !== (item.reasonNarrative ?? "");

  const temperature = item.vitals?.temperature ?? 37;

  // Numeric vitals fields used to be fully server-controlled (value bound
  // directly to item.vitals) and saved on every keystroke - since the
  // backend's QueueVitalsSchema enforces real clinical bounds (e.g.
  // heartRate 20-260), the very first digit of "60" (a lone "6") failed
  // validation and the input snapped back to its old (unset) value,
  // making it look like vitals entry was blocked entirely (confirmed live:
  // a nurse could not type a heart rate at all). Buffering the typed text
  // locally and only persisting a parsed number once the field is blurred
  // means every keystroke is always visible, and only a value the nurse
  // has actually finished entering is ever sent to the server.
  const [vitalDrafts, setVitalDrafts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of numericVitalKeys) {
      const value = item.vitals?.[key];
      initial[key] = value === undefined ? "" : String(value);
    }
    return initial;
  });

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const key of numericVitalKeys) {
      const value = item.vitals?.[key];
      next[key] = value === undefined ? "" : String(value);
    }
    setVitalDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const [vitalDraftErrors, setVitalDraftErrors] = useState<Record<string, string>>({});

  function saveVitalDraftOnBlur(key: string) {
    const raw = vitalDrafts[key]?.trim() ?? "";
    if (raw === "") {
      setVitalDraftErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      return;
    }
    const parsed = Number(raw);
    const [min, max] = vitalBounds[key];
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      setVitalDraftErrors((current) => ({ ...current, [key]: `Enter a value between ${min} and ${max}.` }));
      return;
    }
    setVitalDraftErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    saveVital(key, parsed);
  }

  // Persist the checked-by-default state the first time this stage is
  // opened for a call that has never had this field saved before, so the
  // default is real server state, not just a visual default the nurse could
  // silently disagree with by never touching the checkbox.
  useEffect(() => {
    if (!isReadOnly && item.vitalsUnobtainable === undefined) {
      updateItemContext(item.id, { vitalsUnobtainable: true }).catch(() => {
        // Non-critical - the checkbox still reflects the intended default
        // locally, and any subsequent manual toggle will retry the save.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

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
      // Saving a changed reasonNarrative always clears any earlier "heard &
      // confirmed" attestation server-side (see updateQueueItemContext) -
      // a stale confirmation must never survive editing the very text it
      // was confirming.
      await updateItemContext(item.id, { reasonNarrative });
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  // Explicit nurse attestation that she has listened to the call audio and
  // the saved Reason for Call text accurately reflects it - a distinct,
  // affirmative action from just saving an edit, since a saved transcript
  // may still be inaccurate if nobody has actually checked it against the
  // audio.
  async function confirmTranscript() {
    setConfirmingTranscript(true);
    setSaveError("");
    try {
      await updateItemContext(item.id, { reasonNarrativeConfirmed: true });
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Failed to save.");
    } finally {
      setConfirmingTranscript(false);
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
            Greet caller, confirm role <span>({sexAgeLabel(item.patientAge)})</span>
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
          {/* Every call is conceptually an IVR/call-center call, so
              createQueueItem() now populates reasonCallCapture at creation
              time for every call - this stays gated on that field (not just
              reasonNarrative) so the button accurately reflects "this call's
              reason was captured", which is universally true in practice. */}
          <div className="reason-label-actions">
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
            {!isReadOnly && !questionsStarted && hasUnsavedReasonEdit && (
              <span className="reason-changed-flag" title="This edit hasn't been saved yet - click Confirm below.">
                &#10007; Changed
              </span>
            )}
            {!isReadOnly && !questionsStarted && !hasUnsavedReasonEdit && (
              <button
                type="button"
                className={`reason-heard-confirm-btn${item.reasonNarrativeConfirmed ? " confirmed" : ""}`}
                onClick={confirmTranscript}
                // Once confirmed, this is frozen - a nurse who wants to
                // change the wording again has to edit the text (which
                // clears the confirmation server-side) rather than being
                // able to just re-click this as a no-op toggle.
                disabled={confirmingTranscript || item.reasonNarrativeConfirmed}
                title={
                  item.reasonNarrativeConfirmed
                    ? "Confirmed - you've verified this text against the call audio. Edit the text above to change it."
                    : "Confirm you've listened to the audio and this text is accurate."
                }
              >
                &#10003; {item.reasonNarrativeConfirmed ? "Confirmed" : "Confirm heard"}
              </button>
            )}
          </div>
        </div>
        <textarea
          id="history-input"
          value={reasonNarrative}
          disabled={isReadOnly || saving || questionsStarted || item.reasonNarrativeConfirmed}
          onChange={(event) => setReasonNarrative(event.target.value)}
          onBlur={saveReasonNarrative}
        />
        {!isReadOnly && !questionsStarted && item.reasonNarrativeConfirmed && (
          <p className="reason-locked-note">
            Reason for Call is locked - it has been confirmed as heard and accurate.
          </p>
        )}
        {!isReadOnly && !questionsStarted && !item.reasonNarrativeConfirmed && (
          <button
            type="button"
            className="reason-confirm-btn"
            disabled={saving || reasonNarrative === (item.reasonNarrative ?? "")}
            onClick={saveReasonNarrative}
          >
            {saving ? "Saving..." : "Confirm"}
          </button>
        )}
        {!isReadOnly && questionsStarted && (
          <p className="reason-locked-note">
            Reason for Call is locked once Triage Questions have been answered for this call.
          </p>
        )}
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

      <div
        className="rag-rail-toggle sub-hdr-toggle"
        role="button"
        tabIndex={0}
        onClick={() => setVitalsExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setVitalsExpanded((current) => !current);
          }
        }}
        aria-expanded={vitalsExpanded}
        style={{ cursor: "pointer" }}
      >
        <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span className="sub-hdr-toggle-label">
            Vital Taking <span className="optional-tag">Optional</span>
          </span>
          <label
            className="vitals-unobtainable"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={vitalsUnobtainable}
              disabled={isReadOnly || saving}
              onChange={(event) => saveVitalsUnobtainable(event.target.checked)}
            />
            Vitals cannot be obtained on this call
          </label>
        </span>
        <span className="rag-rail-toggle-icon">{vitalsExpanded ? "−" : "+"}</span>
      </div>

      {vitalsExpanded && (
      <div className={`vitals-card${vitalsUnobtainable ? " disabled" : ""}`}>
        <div className="vitals-grid">
          {numericVitalKeys.map((key) => (
            <div className="vfield" key={key}>
              <label>{vitalLabels[key]}</label>
              <input
                type="number"
                list={`vital-suggestions-${key}`}
                placeholder={vitalPlaceholders[key]}
                value={vitalDrafts[key] ?? ""}
                disabled={isReadOnly || saving}
                onChange={(event) =>
                  setVitalDrafts((current) => ({ ...current, [key]: event.target.value }))
                }
                onBlur={() => saveVitalDraftOnBlur(key)}
              />
              <datalist id={`vital-suggestions-${key}`}>
                {vitalSuggestions[key].map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              {vitalDraftErrors[key] && <p className="vfield-error">{vitalDraftErrors[key]}</p>}
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
      )}

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
