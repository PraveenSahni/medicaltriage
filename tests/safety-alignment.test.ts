import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { calculateTriageScore } from "../src/services/news2Scoring.js";
import { TriageCalculateScoreRequestSchema } from "../src/types/triage.js";

type SharedScenario = {
  id: string;
  description: string;
  patient_vitals: Record<string, unknown>;
  ai_suggested_disposition: string;
  expected_red_floor: boolean;
  expected_python_override: boolean;
  expected_ts_risk_band: string;
};

const fixturePath = join(process.cwd(), "tests", "fixtures", "triage_scenarios.json");
const scenarios = JSON.parse(readFileSync(fixturePath, "utf8")) as SharedScenario[];

function evaluatePythonSafetyWrapper(scenario: SharedScenario) {
  const payload = JSON.stringify({
    patient_vitals: scenario.patient_vitals,
    ai_suggested_disposition: scenario.ai_suggested_disposition
  });
  const result = spawnSync(process.execPath, ["scripts/runPython.mjs", "python/safety_wrapper.py", "--payload", payload], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(`Python safety wrapper failed for ${scenario.id}: ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout) as {
    override_triggered: boolean;
    final_disposition: string;
    red_floor_reasons: string[];
  };
}

describe("shared TypeScript/Python safety fixture alignment", () => {
  it.each(scenarios)("$id - $description", (scenario) => {
    const parsedVitals = TriageCalculateScoreRequestSchema.parse(scenario.patient_vitals);
    const tsResult = calculateTriageScore(parsedVitals);
    const pyResult = evaluatePythonSafetyWrapper(scenario);

    expect(tsResult.redAlertTriggered).toBe(scenario.expected_red_floor);
    expect(tsResult.riskBand).toBe(scenario.expected_ts_risk_band);
    expect(pyResult.override_triggered).toBe(scenario.expected_python_override);
    expect(pyResult.red_floor_reasons.length > 0).toBe(tsResult.redAlertTriggered);

    if (scenario.expected_red_floor && scenario.expected_python_override) {
      expect(pyResult.final_disposition).toBe("RED_ALERT");
      expect(tsResult.dispositionCode).toMatch(/HMC_EMERGENCY_DEPARTMENT|SIDRA_PEDIATRIC_ED/);
    }
  });
});
