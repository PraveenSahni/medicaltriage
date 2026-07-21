import { useEffect, useMemo, useRef, useState } from "react";
import { NotebookPen, Siren } from "lucide-react";

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

type InitialAssessmentResponseType = "OPEN_TEXT" | "YES_NO" | "LOCATION" | "DURATION" | "PAIN_SCALE" | "TEMPERATURE";

type InitialAssessmentQuestion = {
  id: string;
  sequence: number;
  responseType: InitialAssessmentResponseType;
  promptTextEn: string;
  clarificationPromptEn?: string;
  required?: boolean;
  emergencyKeywords: string[];
};

type ProtocolResponse = {
  protocol?: {
    id: string;
    titleEn: string;
    initialAssessmentQuestions?: InitialAssessmentQuestion[];
  };
  error?: string;
};

type PanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; protocolTitle: string; questions: InitialAssessmentQuestion[] };

type EmergencyHit = {
  questionId: string;
  keyword: string;
  answer: string;
};

function findEmergencyHit(question: InitialAssessmentQuestion, answer: string): EmergencyHit | undefined {
  const normalizedAnswer = answer.toLowerCase();
  const keyword = question.emergencyKeywords.find((candidate) => normalizedAnswer.includes(candidate.toLowerCase()));
  return keyword ? { questionId: question.id, keyword, answer } : undefined;
}

function YesNoInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div className="flex gap-2">
      {["Yes", "No"].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-md border px-4 py-2 text-sm transition ${
            value === option
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const painBands = [
  { max: 0, label: "No pain", tone: "text-emerald-700" },
  { max: 3, label: "Mild (1-3)", tone: "text-emerald-700" },
  { max: 7, label: "Moderate (4-7)", tone: "text-amber-700" },
  { max: 10, label: "Severe (8-10)", tone: "text-rose-700" }
] as const;

function PainScaleInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const numeric = Number.parseInt(value, 10);
  const current = Number.isInteger(numeric) ? numeric : undefined;
  const band = current !== undefined ? painBands.find((candidate) => current <= candidate.max) : undefined;
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={current ?? 0}
          onChange={(event) => onChange(event.target.value)}
          className="h-2 w-full max-w-md cursor-pointer accent-emerald-600"
          aria-label="Pain scale 0 to 10"
        />
        <span className={`w-28 shrink-0 text-sm ${band ? band.tone : "text-slate-400"}`}>
          {current !== undefined ? `${current} / 10 - ${band?.label}` : "Not recorded"}
        </span>
      </div>
      <div className="flex w-full max-w-md justify-between text-[10px] uppercase tracking-[0.1em] text-slate-400">
        <span>0</span>
        <span className="text-emerald-600">Mild 1-3</span>
        <span className="text-amber-600">Moderate 4-7</span>
        <span className="text-rose-600">Severe 8-10</span>
      </div>
    </div>
  );
}

const temperatureMethods = ["Oral", "Ear", "Forehead", "Axillary", "Rectal"] as const;

function parseTemperature(value: string): { degrees?: number; method?: string; notMeasured: boolean } {
  if (value === "Not measured") return { notMeasured: true };
  const degreesMatch = value.match(/([0-9]{2}(?:\.[0-9])?)/);
  const methodMatch = temperatureMethods.find((method) => value.includes(method));
  return {
    degrees: degreesMatch ? Number.parseFloat(degreesMatch[1]) : undefined,
    method: methodMatch,
    notMeasured: false
  };
}

function TemperatureInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const parsed = parseTemperature(value);
  const degrees = parsed.degrees ?? 37.0;
  const compose = (nextDegrees: number, nextMethod?: string) =>
    onChange(`${nextDegrees.toFixed(1)}C${nextMethod ? ` (${nextMethod})` : ""}`);
  const feverTone = degrees >= 39.5 ? "text-rose-700" : degrees >= 38 ? "text-amber-700" : "text-slate-700";
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={34}
          max={42}
          step={0.1}
          value={degrees}
          onChange={(event) => compose(Number.parseFloat(event.target.value), parsed.method)}
          className="h-2 w-full max-w-md cursor-pointer accent-emerald-600"
          aria-label="Temperature in Celsius"
        />
        <span className={`w-40 shrink-0 text-sm ${parsed.notMeasured ? "text-slate-400" : feverTone}`}>
          {parsed.notMeasured
            ? "Not measured"
            : parsed.degrees !== undefined
              ? `${degrees.toFixed(1)} C${degrees >= 39.5 ? " - high fever" : degrees >= 38 ? " - fever" : ""}`
              : "Not recorded"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Method</span>
        {temperatureMethods.map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => compose(degrees, method)}
            className={`rounded-md border px-2 py-1 text-xs transition ${
              parsed.method === method
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
            }`}
          >
            {method}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("Not measured")}
          className={`rounded-md border px-2 py-1 text-xs transition ${
            parsed.notMeasured
              ? "border-amber-400 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
          }`}
        >
          Not measured
        </button>
      </div>
    </div>
  );
}

const durationUnits = ["minutes", "hours", "days", "weeks"] as const;

function parseDuration(value: string): { amount?: number; unit: (typeof durationUnits)[number] } {
  const match = value.match(/^([0-9]+(?:\.[0-9]+)?)\s+(minutes|hours|days|weeks)$/);
  if (!match) return { unit: "hours" };
  return { amount: Number.parseFloat(match[1]), unit: match[2] as (typeof durationUnits)[number] };
}

function DurationInput({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const parsed = parseDuration(value);
  const compose = (amount: number | undefined, unit: (typeof durationUnits)[number]) => {
    if (amount === undefined || Number.isNaN(amount) || amount < 0) {
      onChange("");
      return;
    }
    onChange(`${amount} ${unit}`);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        value={parsed.amount ?? ""}
        placeholder="0"
        onChange={(event) => compose(event.target.value === "" ? undefined : Number.parseFloat(event.target.value), parsed.unit)}
        className="h-10 w-24 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        aria-label="Duration amount"
      />
      <div className="flex gap-1">
        {durationUnits.map((unit) => (
          <button
            key={unit}
            type="button"
            onClick={() => compose(parsed.amount, unit)}
            className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
              parsed.unit === unit && parsed.amount !== undefined
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
            }`}
          >
            {unit}
          </button>
        ))}
      </div>
      <span className="text-sm text-slate-500">{parsed.amount !== undefined ? `= ${value} ago` : "Not recorded"}</span>
    </div>
  );
}

function AnswerInput({
  question,
  value,
  onChange
}: {
  question: InitialAssessmentQuestion;
  value: string;
  onChange: (next: string) => void;
}) {
  if (question.responseType === "YES_NO") {
    return <YesNoInput value={value} onChange={onChange} />;
  }
  if (question.responseType === "PAIN_SCALE") {
    return <PainScaleInput value={value} onChange={onChange} />;
  }
  if (question.responseType === "TEMPERATURE") {
    return <TemperatureInput value={value} onChange={onChange} />;
  }
  if (question.responseType === "DURATION") {
    return <DurationInput value={value} onChange={onChange} />;
  }

  return (
    <input
      type="text"
      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      value={value}
      placeholder="Record the caller's answer in their own words"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export default function InitialAssessmentPanel({
  protocolId,
  onEscalate,
  initialAnswers,
  onAnswersChange
}: {
  protocolId?: string;
  onEscalate: (reason: string) => void;
  initialAnswers?: Record<string, string>;
  onAnswersChange?: (answers: Record<string, string>) => void;
}) {
  const [state, setState] = useState<PanelState>({ status: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [escalatedKeywords, setEscalatedKeywords] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setAnswers({});
    setEscalatedKeywords(new Set());
    if (!protocolId) {
      setState({ status: "idle" });
      return undefined;
    }

    let ignore = false;
    setState({ status: "loading" });
    fetch(`${apiBase}/api/v1/protocols/${encodeURIComponent(protocolId)}`, { credentials: "include" })
      .then(async (response) => {
        const payload = (await response.json()) as ProtocolResponse;
        if (!response.ok || !payload.protocol) {
          throw new Error(payload.error ?? `Protocol request failed with ${response.status}`);
        }
        return payload.protocol;
      })
      .then((protocol) => {
        if (ignore) return;
        const questions = [...(protocol.initialAssessmentQuestions ?? [])].sort((left, right) => left.sequence - right.sequence);
        setState({ status: "ready", protocolTitle: protocol.titleEn, questions });
        if (initialAnswers) {
          const seeded: Record<string, string> = {};
          for (const question of questions) {
            const persisted = initialAnswers[question.promptTextEn];
            if (persisted) seeded[question.id] = persisted;
          }
          setAnswers(seeded);
        }
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Protocol unavailable" });
      });

    return () => {
      ignore = true;
    };
    // initialAnswers seeds only when a (new) protocol loads; live edits flow through recordAnswer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId]);

  const answersChangeRef = useRef(onAnswersChange);
  answersChangeRef.current = onAnswersChange;

  useEffect(() => {
    if (state.status !== "ready" || Object.keys(answers).length === 0) return;
    const emit = answersChangeRef.current;
    if (!emit) return;
    const promptKeyed: Record<string, string> = {};
    for (const question of state.questions) {
      const answer = answers[question.id];
      if (answer) promptKeyed[question.promptTextEn] = answer;
    }
    emit(promptKeyed);
  }, [answers, state]);

  function recordAnswer(questionId: string, next: string) {
    setAnswers((current) => ({ ...current, [questionId]: next }));
  }

  const emergencyHits = useMemo(() => {
    if (state.status !== "ready") return [] as EmergencyHit[];
    return state.questions
      .map((question) => {
        const answer = answers[question.id];
        return answer ? findEmergencyHit(question, answer) : undefined;
      })
      .filter((hit): hit is EmergencyHit => Boolean(hit));
  }, [answers, state]);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700">
          <NotebookPen className="h-4 w-4" />
        </span>
        <h4 className="min-w-0 truncate text-sm font-normal leading-tight text-slate-950">
          {state.status === "ready" ? `History taking - ${state.protocolTitle}` : "History taking"}
        </h4>
      </div>

      {state.status === "idle" && (
        <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-500">
          Confirm the reason narrative and guideline selection to load history-taking prompts.
        </p>
      )}
      {state.status === "loading" && (
        <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-500">
          Loading initial assessment questions...
        </p>
      )}
      {state.status === "error" && (
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-5 text-amber-800">
          Initial assessment questions unavailable: {state.message}
        </p>
      )}

      {state.status === "ready" && state.questions.length === 0 && (
        <p className="mt-2 rounded-md border border-dashed border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-500">
          This guideline has no initial assessment prompts.
        </p>
      )}

      {state.status === "ready" && state.questions.length > 0 && (
        <ol className="mt-2 grid gap-2 lg:grid-cols-2">
          {state.questions.map((question) => {
            const answer = answers[question.id] ?? "";
            const hit = answer ? findEmergencyHit(question, answer) : undefined;
            return (
              <li key={question.id} className={`rounded-md border p-2 ${hit ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{question.sequence}.</span>
                  <span className="ist-emphasis text-xs font-semibold leading-5 text-slate-950">{question.promptTextEn}</span>
                  {question.required && <span className="text-[9px] uppercase tracking-[0.12em] text-amber-600">required</span>}
                </div>
                {question.clarificationPromptEn && (
                  <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{question.clarificationPromptEn}</p>
                )}
                <div className="mt-1.5">
                  <AnswerInput
                    question={question}
                    value={answer}
                    onChange={(next) => recordAnswer(question.id, next)}
                  />
                </div>
                {hit && (
                  <div className="mt-1.5 flex flex-col gap-1.5 rounded-md border border-rose-200 bg-white p-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-rose-800">
                      <Siren className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
                      Emergency phrase detected: <strong className="ist-emphasis font-semibold">&quot;{hit.keyword}&quot;</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEscalatedKeywords((current) => new Set(current).add(hit.keyword));
                        onEscalate(`Emergency phrase "${hit.keyword}" recorded during initial assessment.`);
                      }}
                      disabled={escalatedKeywords.has(hit.keyword)}
                      className="ist-emphasis w-fit rounded-md border border-rose-300 bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {escalatedKeywords.has(hit.keyword) ? "Escalated" : "Escalate now"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
