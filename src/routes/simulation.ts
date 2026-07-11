import { Router } from "express";
import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  runSimulation,
  runSimulationSuite,
  simulationScenarios,
  simulationTrainingJsonl
} from "../services/simulationEngine.js";

type GeneratedRunSummary = {
  name: string;
  path: string;
  lastModifiedIso: string;
  recordCount?: number;
  generatedAt?: string;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(filePath, "utf-8")) as Record<string, unknown>;
}

async function readJsonlSample(filePath: string, limit = 3): Promise<unknown[]> {
  if (!(await exists(filePath))) {
    return [];
  }

  const content = await readFile(filePath, "utf-8");
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, limit)
    .map((line) => JSON.parse(line) as unknown);
}

function partitionPath(manifest: Record<string, unknown>, key: string): string | null {
  const partitions = manifest[key];
  if (!Array.isArray(partitions) || partitions.length === 0) {
    return null;
  }

  const first = partitions[0] as { path?: unknown };
  return typeof first.path === "string" ? first.path : null;
}

async function listGeneratedRuns(generatedDir: string): Promise<GeneratedRunSummary[]> {
  if (!(await exists(generatedDir))) {
    return [];
  }

  const entries = await readdir(generatedDir, { withFileTypes: true });
  const runs: GeneratedRunSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const runPath = path.join(generatedDir, entry.name);
    const manifestPath = path.join(runPath, "manifest.json");
    if (!(await exists(manifestPath))) {
      continue;
    }

    const [stats, manifest] = await Promise.all([stat(manifestPath), readJson(manifestPath)]);
    runs.push({
      name: entry.name,
      path: runPath,
      lastModifiedIso: stats.mtime.toISOString(),
      recordCount: typeof manifest.record_count === "number" ? manifest.record_count : undefined,
      generatedAt: typeof manifest.generated_at === "string" ? manifest.generated_at : undefined
    });
  }

  return runs.sort((left, right) => right.lastModifiedIso.localeCompare(left.lastModifiedIso));
}

const SimulationPayloadSchema = z.object({
  scenarioId: z.string().max(120).optional(),
  name: z.string().max(240).optional(),
  istStaffId: z.string().min(3).max(64),
  role: z.enum(["Pilot", "Cabin Crew", "Ground Staff", "Dependent", "Operations"]),
  ageYears: z.number().int().min(0).max(120),
  biologicalSex: z.enum(["female", "male", "other", "unknown"]).optional(),
  dependentName: z.string().max(160).optional(),
  symptomText: z.string().min(1).max(1000),
  symptomVector: z.array(z.number()).length(5).optional(),
  vitals: z.object({
    heartRate: z.number().int().min(20).max(260),
    respiratoryRate: z.number().int().min(1).max(80),
    spo2: z.number().min(40).max(100),
    temperatureC: z.number().min(30).max(45),
    consciousLevel: z.enum(["A", "V", "P", "U", "alert", "voice", "pain", "unresponsive"])
  }),
  outstation: z.boolean().optional(),
  stationCode: z.string().max(12).optional(),
  onDuty: z.boolean().optional(),
  sicknessLeaveRequested: z.boolean().optional(),
  recentVaccinationHours: z.number().int().min(0).optional(),
  occupationalOrCommissionVisit: z.boolean().optional(),
  aiSuggestedSeverity: z.enum(["Emergency", "Urgent", "Routine", "Self-care"]).optional()
});

export function createSimulationRouter(): Router {
  const router = Router();

  router.get("/scenarios", (_req, res) => {
    return res.json({
      syntheticOnly: true,
      count: simulationScenarios.length,
      scenarios: simulationScenarios.map((scenario) => ({
        scenarioId: scenario.scenarioId,
        name: scenario.name,
        role: scenario.role,
        ageYears: scenario.ageYears,
        symptomText: scenario.symptomText,
        vitals: scenario.vitals
      }))
    });
  });

  router.post("/run", (req, res) => {
    const parsed = SimulationPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid simulation payload",
        details: parsed.error.flatten()
      });
    }

    return res.json(runSimulation(parsed.data));
  });

  router.post("/run/:scenarioId", (req, res) => {
    const scenario = simulationScenarios.find((item) => item.scenarioId === req.params.scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: "Simulation scenario not found." });
    }

    return res.json(runSimulation(scenario));
  });

  router.get("/suite", (req, res) => {
    const results = runSimulationSuite();
    if (req.query.format === "jsonl") {
      return res.type("application/x-ndjson").send(results.map((result) => JSON.stringify(result)).join("\n"));
    }

    return res.json({
      syntheticOnly: true,
      count: results.length,
      results
    });
  });

  router.get("/training-set", (_req, res) => {
    return res
      .type("application/x-ndjson")
      .send(simulationTrainingJsonl());
  });

  router.get("/generated", async (_req, res) => {
    const generatedDir = path.resolve(process.cwd(), "data", "generated");
    const runs = await listGeneratedRuns(generatedDir);
    const preferredRun =
      runs.find((run) => run.name === "bulk_clinical_sim_100_regional") ??
      runs.find((run) => run.name.includes("regional")) ??
      runs[0];

    if (!preferredRun) {
      return res.json({
        syntheticOnly: true,
        available: false,
        message: "No generated simulation runs found under data/generated.",
        runs: []
      });
    }

    const manifestPath = path.join(preferredRun.path, "manifest.json");
    const manifest = await readJson(manifestPath);
    const encounterPath = partitionPath(manifest, "encounter_partitions");
    const trainingPath = partitionPath(manifest, "training_partitions");
    const auditPath = partitionPath(manifest, "audit_partitions");

    return res.json({
      syntheticOnly: true,
      available: true,
      activeRun: preferredRun,
      runs,
      files: {
        manifest: manifestPath,
        encounters: encounterPath,
        training: trainingPath,
        audit: auditPath
      },
      manifest: {
        recordCount: manifest.record_count,
        auditRecordCount: manifest.audit_record_count,
        startDate: manifest.start_date,
        endDate: manifest.end_date,
        elapsedSeconds: manifest.elapsed_seconds,
        counts: manifest.counts,
        regionalContext: manifest.regional_context
      },
      samples: {
        encounters: encounterPath ? await readJsonlSample(path.resolve(process.cwd(), encounterPath), 3) : [],
        training: trainingPath ? await readJsonlSample(path.resolve(process.cwd(), trainingPath), 1) : [],
        audit: auditPath ? await readJsonlSample(path.resolve(process.cwd(), auditPath), 1) : []
      }
    });
  });

  return router;
}
