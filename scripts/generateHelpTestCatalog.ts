import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

type JestAssertion = {
  ancestorTitles: string[];
  duration?: number | null;
  failureMessages: string[];
  status: "passed" | "failed" | "pending" | "todo";
  title: string;
};

type JestSuite = {
  assertionResults: JestAssertion[];
  endTime: number;
  message: string;
  name: string;
  startTime: number;
  status: string;
};

type JestReport = {
  numFailedTests: number;
  numPassedTests: number;
  numPendingTests: number;
  numTotalTestSuites: number;
  numTotalTests: number;
  startTime: number;
  success: boolean;
  testResults: JestSuite[];
};

type TestCase = {
  id: string;
  title: string;
  category: string;
  module: string;
  objective: string;
  preconditions: string[];
  testData: string[];
  steps: Array<{
    action: string;
    expected: string;
    actual: string;
    result: "Passed" | "Failed" | "Not Run";
  }>;
  executionStatus: "Passed" | "Failed" | "Blocked" | "Not Run" | "In Progress";
  validationStatus: "Pending";
  error?: string;
  evidence: string[];
  executedBy: string;
  executedAt: string;
  notes: string;
};

const suiteClassification: Record<string, { code: string; category: string; module: string }> = {
  "adminAccessBifurcation.test.ts": { code: "ADM", category: "Security", module: "Control Center Access" },
  "approval.test.ts": { code: "APR", category: "Governance", module: "Clinical Approval" },
  "callCenterGateway.test.ts": { code: "CCG", category: "Integration", module: "Call Center Gateway" },
  "fhir-writeback.test.ts": { code: "FHR", category: "Integration", module: "FHIR Writeback" },
  "multiTenantRBAC.test.ts": { code: "MTN", category: "Security", module: "Multi-Tenant RBAC" },
  "queueOrchestration.test.ts": { code: "QUE", category: "Tele-Triage", module: "Queue Orchestration" },
  "roleUatMatrix.test.ts": { code: "RBAC", category: "Security", module: "Role Access Matrix" },
  "runtime.test.ts": { code: "RUN", category: "Runtime", module: "Environment Controls" },
  "safety-alignment.test.ts": { code: "SAF", category: "Clinical Safety", module: "Safety Alignment" },
  "safety-kernel.test.ts": { code: "KER", category: "Clinical Safety", module: "Safety Kernel" },
  "simulation.test.ts": { code: "SIM", category: "AI / ML", module: "Simulation Engine" },
  "triage.test.ts": { code: "TRI", category: "Tele-Triage", module: "Triage API" }
};

function fileName(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() ?? path;
}

function stableId(code: string, source: string): string {
  const explicitId = source.match(/\bCCG-[A-Z]+-\d{3}\b/)?.[0];
  if (explicitId) return explicitId;
  const digest = createHash("sha256").update(source).digest("hex").slice(0, 10).toUpperCase();
  return `AUT-${code}-${digest}`;
}

function executionStatus(status: JestAssertion["status"]): TestCase["executionStatus"] {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  return "Not Run";
}

function stepResult(status: JestAssertion["status"]): "Passed" | "Failed" | "Not Run" {
  if (status === "passed") return "Passed";
  if (status === "failed") return "Failed";
  return "Not Run";
}

function formatQatarTime(timestamp: number): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Qatar"
  }).format(new Date(timestamp))} AST`;
}

function expectedOutcome(assertion: JestAssertion): string {
  const context = assertion.ancestorTitles.join(" ").toLowerCase();
  if (context.includes("negative")) return "The prohibited role action or invalid condition is rejected by the asserted boundary.";
  if (context.includes("positive")) return "The assigned role completes the permitted action and receives the asserted response.";
  return "All deterministic assertions complete without an unexpected exception or contract mismatch.";
}

const inputPath = resolve(process.argv[2] ?? "test-results/jest-results.json");
const outputPath = resolve(process.argv[3] ?? "frontend/public/test-evidence/executed-test-catalog.json");
const report = JSON.parse(readFileSync(inputPath, "utf8")) as JestReport;

const cases: TestCase[] = report.testResults.flatMap((suite) => {
  const suiteFile = fileName(suite.name);
  const classification = suiteClassification[suiteFile] ?? {
    code: "GEN",
    category: "Regression",
    module: suiteFile.replace(/\.test\.ts$/, "")
  };
  const sourcePath = relative(process.cwd(), suite.name).replace(/\\/g, "/");

  return suite.assertionResults.map((assertion) => {
    const fullTitle = [...assertion.ancestorTitles, assertion.title].join(" > ");
    const status = executionStatus(assertion.status);
    const duration = assertion.duration == null ? "duration not reported" : `${assertion.duration} ms`;
    const errors = assertion.failureMessages.filter(Boolean);

    return {
      id: stableId(classification.code, `${sourcePath}|${fullTitle}`),
      title: assertion.title,
      category: classification.category,
      module: classification.module,
      objective: `Verify ${assertion.title.replace(/\.$/, "").toLowerCase()}.`,
      preconditions: [
        "Isolated Jest regression environment is available.",
        `Owning suite: ${assertion.ancestorTitles.join(" > ") || suiteFile}.`
      ],
      testData: [
        `Source: ${sourcePath}`,
        `Automated test identity: ${fullTitle}`
      ],
      steps: [
        {
          action: `Execute the automated check: ${fullTitle}`,
          expected: expectedOutcome(assertion),
          actual: status === "Passed" ? `All assertions passed in ${duration}.` : errors.join("\n") || `Execution status: ${status}.`,
          result: stepResult(assertion.status)
        }
      ],
      executionStatus: status,
      validationStatus: "Pending" as const,
      error: errors.length > 0 ? errors.join("\n") : undefined,
      evidence: [
        sourcePath,
        "test-results/jest-results.json",
        `Jest assertion status: ${assertion.status}; ${duration}`
      ],
      executedBy: "Jest automated regression runner",
      executedAt: formatQatarTime(suite.endTime || report.startTime),
      notes: `Generated from the executed Jest JSON report. Stable ID is derived from the source file and full test title.`
    };
  });
});

const ids = cases.map((item) => item.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate generated test IDs: ${[...new Set(duplicateIds)].join(", ")}`);
}
if (cases.length !== report.numTotalTests) {
  throw new Error(`Generated ${cases.length} cases but Jest reported ${report.numTotalTests}.`);
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "Jest JSON execution report",
  summary: {
    suites: report.numTotalTestSuites,
    total: report.numTotalTests,
    passed: report.numPassedTests,
    failed: report.numFailedTests,
    notRun: report.numPendingTests,
    success: report.success
  },
  cases
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
process.stdout.write(`Generated ${cases.length} unique Help test cases at ${outputPath}\n`);
