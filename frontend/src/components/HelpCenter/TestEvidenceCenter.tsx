import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CircleSlash2,
  Clock3,
  FileCheck2,
  Filter,
  LoaderCircle,
  MessageSquarePlus,
  RotateCcw,
  Search,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ExecutionStatus = "Passed" | "Failed" | "Blocked" | "Not Run" | "In Progress";
type ValidationStatus = "Pending" | "Validated" | "Rejected" | "Retest Required";
type StepResult = "Passed" | "Failed" | "Not Run";

type TestStep = {
  action: string;
  expected: string;
  actual: string;
  result: StepResult;
};

type TestCase = {
  id: string;
  title: string;
  category: string;
  module: string;
  objective: string;
  preconditions: string[];
  testData: string[];
  steps: TestStep[];
  executionStatus: ExecutionStatus;
  validationStatus: ValidationStatus;
  validationBy?: string;
  validationAt?: string;
  validatorComments?: string[];
  error?: string;
  evidence: string[];
  executedBy: string;
  executedAt: string;
  notes: string;
};

type ValidationRecord = {
  status: ValidationStatus;
  validatedBy?: string;
  validatedAt?: string;
  comments: string[];
};

type GeneratedTestCatalog = {
  schemaVersion: number;
  generatedAt: string;
  source: string;
  summary: {
    suites: number;
    total: number;
    passed: number;
    failed: number;
    notRun: number;
    success: boolean;
  };
  cases: TestCase[];
};

const EXECUTED_AT = "17 Jul 2026, 09:54 GST";
const VALIDATOR_NAME = "Current help reviewer";
const EXPANDED_KEY = "ist-help-test-expanded-v1";
const VALIDATION_KEY = "ist-help-test-validation-v1";
const AUTOMATED_CATALOG_URL = "/test-evidence/executed-test-catalog.json";
const END_TO_END_EXECUTIONS = 24;

const apiEvidence = [
  "Playwright APIRequestContext execution on isolated port 18080",
  "tests/e2e/api-contract.spec.ts",
  "Machine-readable traces retained on first retry; screenshots and video retained on browser failure"
];

const browserEvidence = [
  "Google Chrome stable 150.0.7871.115",
  "Microsoft Edge stable 151.0.4129.21",
  "tests/e2e/browser-journey.spec.ts and Playwright HTML report"
];

function passedStep(action: string, expected: string, actual: string): TestStep {
  return { action, expected, actual, result: "Passed" };
}

function makeCase(input: Omit<TestCase, "executionStatus" | "validationStatus" | "executedAt">): TestCase {
  return {
    ...input,
    executionStatus: "Passed",
    validationStatus: "Pending",
    executedAt: EXECUTED_AT
  };
}

const initialTestCases: TestCase[] = [
  makeCase({
    id: "API-001",
    title: "Runtime environment and health contract",
    category: "Runtime",
    module: "Platform",
    objective: "Prove the isolated test server reports a healthy simulation environment and synthetic data profile.",
    preconditions: ["Fresh API server on port 18080", "APP_ENVIRONMENT=simulation"],
    testData: ["GET /healthz", "GET /api/v1/runtime/environment"],
    steps: [
      passedStep("Request health endpoint", "HTTP 200 and healthy service", "HTTP 200 returned"),
      passedStep("Read runtime metadata", "Simulation and synthetic-e2e profile", "Both values matched exactly")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Guards against testing the wrong environment or data profile."
  }),
  makeCase({
    id: "API-002",
    title: "Unauthenticated and invalid-login rejection",
    category: "Security",
    module: "Authentication",
    objective: "Confirm protected APIs reject anonymous access and incorrect credentials do not create a session.",
    preconditions: ["No authenticated cookie", "Named simulation users loaded"],
    testData: ["Anonymous queue request", "Incorrect nurse password"],
    steps: [
      passedStep("Call protected queue without a session", "HTTP 401", "HTTP 401 returned"),
      passedStep("Submit invalid credentials", "Generic authentication failure", "HTTP 401 with non-disclosing message")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Negative path; no user-existence detail is disclosed."
  }),
  makeCase({
    id: "API-003",
    title: "Named nurse session and role binding",
    category: "Security",
    module: "RBAC",
    objective: "Verify the simulated nurse identity is bound to one effective role and masked session data.",
    preconditions: ["Remote Triage Nurse directory user active"],
    testData: ["layla@irisstar.tech", "remote_triage_nurse"],
    steps: [
      passedStep("Authenticate the named nurse", "Workspace redirect with nurse role", "Authenticated and redirected to workspace"),
      passedStep("Read session", "Stable user ID and masked email", "usr_nurse_10001 and n****@irisstar.tech returned")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Proves user-to-role binding rather than free role switching."
  }),
  makeCase({
    id: "API-004",
    title: "Queue, HRMS age, protocol, and RAG boundary integrity",
    category: "Clinical Data",
    module: "Queue Orchestration",
    objective: "Validate queue records carry calculated age, unique protocol questions, acuity ordering, and an advisory-only RAG trace.",
    preconditions: ["Synthetic directory and protocol packet loaded", "Nurse authenticated"],
    testData: ["case-10002", "Dependent child", "Fever with fast breathing"],
    steps: [
      passedStep("Fetch queue item", "HRMS-derived dependent age", "Age source dependent and calculated from date of birth"),
      passedStep("Inspect prepared questions", "Unique high-to-low acuity order", "No duplicate IDs; acuity order ascending"),
      passedStep("Inspect RAG shadow", "Approved content only; no decision authority", "All four prohibited-action acknowledgements present")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Validates the STCC-compatible deterministic boundary before browser rendering."
  }),
  makeCase({
    id: "API-005",
    title: "HRMS and clinical master reconciliation",
    category: "Clinical Data",
    module: "Protocol Library",
    objective: "Reconcile staff validation, protocol search, protocol detail, and mapped care advice across APIs.",
    preconditions: ["Synthetic HRMS and approved clinical masters available"],
    testData: ["IST-1001", "fever", "sample-fever-child"],
    steps: [
      passedStep("Validate staff and dependents", "Profile and mapped dependents", "Validated profile returned"),
      passedStep("Search and load protocol", "Same primary protocol in search and detail", "Protocol IDs reconciled"),
      passedStep("Load mapped advice", "Advice IDs referenced by questions exist", "All referenced advice resolved")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Detects orphaned question/advice links and search-detail drift."
  }),
  makeCase({
    id: "API-006",
    title: "Adult, pediatric, and stable safety scoring",
    category: "Clinical Safety",
    module: "Rules Engine",
    objective: "Prove deterministic red floors route adults and children correctly while stable vitals avoid false emergency escalation.",
    preconditions: ["Rules-first scoring endpoint available"],
    testData: ["Adult SpO2 91", "Child tachypnea and SpO2 91", "Stable adult vitals", "Manual age attempt"],
    steps: [
      passedStep("Score adult red-floor vitals", "RED_ALERT to HMC", "Score 10 and HMC emergency route"),
      passedStep("Score pediatric red-floor vitals", "RED_ALERT to Sidra", "Score 10 and Sidra pediatric emergency route"),
      passedStep("Score stable vitals and reject manual age", "Non-red route; HRMS age remains authoritative", "Both rules enforced")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Covers positive, negative, adult, pediatric, and age-source controls."
  }),
  makeCase({
    id: "API-007",
    title: "Provider-neutral gateway status and role denial",
    category: "Integration",
    module: "Call Center Gateway",
    objective: "Verify gateway readiness is visible while an intake-only role cannot execute clinical call commands.",
    preconditions: ["Call center dry-run enabled", "Intake coordinator authenticated"],
    testData: ["GET gateway status", "ANSWER command as intake coordinator"],
    steps: [
      passedStep("Read provider-neutral gateway status", "Dry-run provider and recording policy visible", "Status contract returned"),
      passedStep("Attempt clinical command with intake role", "HTTP 403", "RBAC denial returned")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Negative authorization test for the call-control boundary."
  }),
  makeCase({
    id: "API-008",
    title: "Incoming call through bilingual SBAR and writeback",
    category: "End-to-End",
    module: "Tele-Triage",
    objective: "Execute the server-side encounter from call answer through clinical context, completion, queue closure, and FHIR dry-run.",
    preconditions: ["Nurse authenticated", "case-10002 available", "EMR writeback in dry-run"],
    testData: ["Pediatric emergency case", "SIDRA_PEDIATRIC_ED", "RESTRICTED fit-to-fly"],
    steps: [
      passedStep("Answer and lock the call", "Connected session owned by nurse", "CONNECTED and usr_nurse_10001 lock"),
      passedStep("Persist score and clinical context", "Emergency Sidra route", "Severity, route, and rationale persisted"),
      passedStep("Generate note and close", "Bilingual SBAR, completed queue, FHIR dry-run", "All three writes returned HTTP 200")
    ],
    evidence: apiEvidence,
    executedBy: "Playwright API contract runner",
    notes: "Primary API release gate."
  }),
  makeCase({
    id: "WEB-001",
    title: "Simulation banner and credential autofill",
    category: "Runtime",
    module: "Login",
    objective: "Confirm the login page identifies simulation mode and binds the selected named user to role, email, and password.",
    preconditions: ["Fresh Chrome and Edge sessions"],
    testData: ["Remote Triage Nurse simulation user"],
    steps: [
      passedStep("Open login page", "Simulation banner and IST Health identity", "Both rendered in Chrome and Edge"),
      passedStep("Select named user", "Role, email, and password change together", "All three fields matched the user catalog")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "Cross-browser execution; one unique functional case."
  }),
  makeCase({
    id: "WEB-002",
    title: "Invalid browser login remains outside the app",
    category: "Security",
    module: "Login",
    objective: "Confirm an incorrect password shows a generic error and does not navigate into a protected workspace.",
    preconditions: ["Login page loaded"],
    testData: ["Valid nurse email", "Incorrect password"],
    steps: [
      passedStep("Submit invalid password", "Visible generic error", "Error displayed in both browsers"),
      passedStep("Inspect current URL", "No protected route", "URL remained outside workspace/admin")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "Browser negative authentication path."
  }),
  makeCase({
    id: "WEB-003",
    title: "Platform administrator lands in Control Center",
    category: "Security",
    module: "RBAC",
    objective: "Verify a platform administrator is routed to administration rather than the nurse workspace.",
    preconditions: ["Platform Administrator user active"],
    testData: ["rishma@irisstar.tech", "platform_super_administrator"],
    steps: [
      passedStep("Simulate Platform Administrator", "Redirect to #/admin", "Admin route loaded"),
      passedStep("Inspect landing content", "Control Center visible", "Administration surface rendered")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "Cross-browser role-routing proof."
  }),
  makeCase({
    id: "WEB-004",
    title: "Queue API-to-UI data parity",
    category: "Clinical Data",
    module: "Nurse Cockpit",
    objective: "Prove the queue card displays the reason, HRMS-derived age, and channel returned by the API without drift.",
    preconditions: ["Nurse authenticated", "Queue API response captured"],
    testData: ["case-10002 dependent card"],
    steps: [
      passedStep("Capture queue response", "Non-empty queue and child case", "case-10002 returned"),
      passedStep("Compare visible card", "Reason, age, and channel equal API values", "All values matched in Chrome and Edge")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "Explicit fetched-data validation rather than a visual-only check."
  }),
  makeCase({
    id: "WEB-005",
    title: "Answer call and show HRMS, protocol, RAG, and score evidence",
    category: "End-to-End",
    module: "Nurse Cockpit",
    objective: "Open a real queue item and validate every prepared clinical evidence block in the active triage view.",
    preconditions: ["Nurse authenticated", "Incoming pediatric call available"],
    testData: ["case-10002", "Fever - Child", "Score 10 RED_ALERT"],
    steps: [
      passedStep("Answer incoming call", "Gateway connects and nurse owns the item", "CONNECTED and IN_PROCESS returned"),
      passedStep("Review Action 1 evidence", "HRMS, age, protocol, RAG boundary, and score visible", "All blocks rendered from API data"),
      passedStep("Review destination", "Sidra emergency route visible", "Safety summary displayed Sidra Medicine Emergency Department")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "This case previously exposed brittle assumptions about where progressive-disclosure content appears."
  }),
  makeCase({
    id: "WEB-006",
    title: "Create and start a true callback request",
    category: "Integration",
    module: "Call Center Gateway",
    objective: "Create a waiting callback through intake, then prove the nurse starts an outbound callback from the cockpit.",
    preconditions: ["Intake and nurse named users active", "Gateway dry-run enabled"],
    testData: ["Callback channel", "IST-1001", "DOH"],
    steps: [
      passedStep("Create callback as intake", "HTTP 201 waiting queue item", "New callback item created"),
      passedStep("Select Call back as nurse", "Outbound callback connects", "OUTBOUND Callback CONNECTED returned"),
      passedStep("Open active triage", "Full-screen triage focus visible", "Dialog rendered in both browsers")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "Separates pending callbacks from already-connected callback records."
  }),
  makeCase({
    id: "WEB-007",
    title: "Complete all four nurse actions and writeback",
    category: "End-to-End",
    module: "Tele-Triage",
    objective: "Prove the nurse can traverse every action tab and close the encounter without bypassing clinical gates.",
    preconditions: ["Nurse owns pediatric emergency case", "Clipboard permission enabled", "FHIR dry-run enabled"],
    testData: ["Emergency question answered Yes", "Sidra disposition", "RESTRICTED fit-to-fly"],
    steps: [
      passedStep("Move through reason and questions", "Acuity question and default No visible", "Question control rendered and response recorded"),
      passedStep("Review disposition and care advice", "Sidra route and restricted fit-to-fly", "Both values visible"),
      passedStep("Open SBAR and complete", "Note, queue closure, and writeback succeed", "Three HTTP 200 responses and success confirmation")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "This test found and now guards the former SBAR-entry deadlock."
  }),
  makeCase({
    id: "WEB-008",
    title: "Help evidence review and governed validation actions",
    category: "Governance",
    module: "Help Center",
    objective: "Verify test evidence remains scannable and that validation, rejection, retest, comments, filters, and disclosure controls behave accessibly.",
    preconditions: ["Named user authenticated", "Help Center available", "Session storage enabled"],
    testData: ["API-001 accordion", "Blank retest reason", "WEB-007 search term"],
    steps: [
      passedStep("Open Test Results and expand API-001", "Details and expected-versus-actual steps visible", "Accordion disclosed all evidence fields"),
      passedStep("Request retest without a reason", "Action blocked with mandatory-reason error", "Accessible error message displayed"),
      passedStep("Record reason and filter WEB-007", "Validation metadata updates and one result remains", "Retest state persisted and search returned one case")
    ],
    evidence: browserEvidence,
    executedBy: "Playwright Chrome and Edge projects",
    notes: "Covers acceptance criteria for progressive disclosure and validator controls."
  })
];

const executionStatuses: Array<ExecutionStatus | "All"> = ["All", "Passed", "Failed", "Blocked", "Not Run", "In Progress"];
const validationStatuses: Array<ValidationStatus | "All"> = ["All", "Pending", "Validated", "Rejected", "Retest Required"];

function readSessionJson<T>(key: string, fallback: T): T {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function executionIcon(status: ExecutionStatus) {
  if (status === "Passed") return CheckCircle2;
  if (status === "Failed") return XCircle;
  if (status === "Blocked") return CircleSlash2;
  if (status === "In Progress") return LoaderCircle;
  return CircleDashed;
}

function validationIcon(status: ValidationStatus) {
  if (status === "Validated") return ShieldCheck;
  if (status === "Rejected") return XCircle;
  if (status === "Retest Required") return RotateCcw;
  return Clock3;
}

export function TestEvidenceCenter() {
  const [query, setQuery] = useState("");
  const [executionFilter, setExecutionFilter] = useState<ExecutionStatus | "All">("All");
  const [validationFilter, setValidationFilter] = useState<ValidationStatus | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [failedOnly, setFailedOnly] = useState(false);
  const [awaitingOnly, setAwaitingOnly] = useState(false);
  const [automatedCases, setAutomatedCases] = useState<TestCase[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [expanded, setExpanded] = useState<string[]>(() => readSessionJson(EXPANDED_KEY, []));
  const [validations, setValidations] = useState<Record<string, ValidationRecord>>(() =>
    readSessionJson(VALIDATION_KEY, {})
  );

  useEffect(() => {
    window.sessionStorage.setItem(EXPANDED_KEY, JSON.stringify(expanded));
  }, [expanded]);

  useEffect(() => {
    window.sessionStorage.setItem(VALIDATION_KEY, JSON.stringify(validations));
  }, [validations]);

  useEffect(() => {
    let active = true;
    async function loadCatalog() {
      try {
        const response = await fetch(AUTOMATED_CATALOG_URL, { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Test catalogue returned HTTP ${response.status}.`);
        const catalog = (await response.json()) as GeneratedTestCatalog;
        const uniqueIds = new Set(catalog.cases.map((item) => item.id));
        if (catalog.schemaVersion !== 1 || catalog.summary.total !== catalog.cases.length) {
          throw new Error("Test catalogue summary does not match its case records.");
        }
        if (uniqueIds.size !== catalog.cases.length) {
          throw new Error("Test catalogue contains duplicate test-case IDs.");
        }
        if (active) setAutomatedCases(catalog.cases);
      } catch (error) {
        if (active) setCatalogError(error instanceof Error ? error.message : "Test catalogue could not be loaded.");
      } finally {
        if (active) setCatalogLoading(false);
      }
    }
    void loadCatalog();
    return () => {
      active = false;
    };
  }, []);

  const cases = useMemo(
    () =>
      [...initialTestCases, ...automatedCases].map((item) => {
        const validation = validations[item.id];
        return validation
          ? {
              ...item,
              validationStatus: validation.status,
              validationBy: validation.validatedBy,
              validationAt: validation.validatedAt,
              validatorComments: validation.comments
            }
          : item;
      }),
    [automatedCases, validations]
  );

  const categories = useMemo(() => ["All", ...new Set(cases.map((item) => item.category))], [cases]);
  const modules = useMemo(() => ["All", ...new Set(cases.map((item) => item.module))], [cases]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cases.filter((item) => {
      const searchMatch =
        !normalized ||
        [item.id, item.title, item.category, item.module, item.objective].some((value) =>
          value.toLowerCase().includes(normalized)
        );
      return (
        searchMatch &&
        (executionFilter === "All" || item.executionStatus === executionFilter) &&
        (validationFilter === "All" || item.validationStatus === validationFilter) &&
        (categoryFilter === "All" || item.category === categoryFilter) &&
        (moduleFilter === "All" || item.module === moduleFilter) &&
        (!failedOnly || item.executionStatus === "Failed") &&
        (!awaitingOnly || item.validationStatus === "Pending" || item.validationStatus === "Retest Required")
      );
    });
  }, [awaitingOnly, cases, categoryFilter, executionFilter, failedOnly, moduleFilter, query, validationFilter]);

  const summary = useMemo(() => {
    const count = (status: ExecutionStatus) => filtered.filter((item) => item.executionStatus === status).length;
    const passed = count("Passed");
    return {
      total: filtered.length,
      passed,
      failed: count("Failed"),
      blocked: count("Blocked"),
      notRun: count("Not Run"),
      pending: filtered.filter((item) => item.validationStatus === "Pending").length,
      validated: filtered.filter((item) => item.validationStatus === "Validated").length,
      percentage: filtered.length === 0 ? 0 : Math.round((passed / filtered.length) * 100)
    };
  }, [filtered]);

  function toggle(id: string) {
    setExpanded((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function recordValidation(id: string, status: ValidationStatus, comment: string) {
    const now = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    setValidations((current) => {
      const previous = current[id];
      return {
        ...current,
        [id]: {
          status,
          validatedBy: status === "Pending" ? previous?.validatedBy : VALIDATOR_NAME,
          validatedAt: status === "Pending" ? previous?.validatedAt : now,
          comments: [...(previous?.comments ?? []), ...(comment.trim() ? [comment.trim()] : [])]
        }
      };
    });
  }

  return (
    <section className="test-evidence" aria-labelledby="test-evidence-title">
      <header className="test-evidence-header">
        <div>
          <span className="tag-label">VERIFICATION EVIDENCE</span>
          <h3 id="test-evidence-title">Test Cases and Test Results</h3>
          <p>
            {cases.length} unique cases cover {automatedCases.length + END_TO_END_EXECUTIONS} recorded executions across
            Jest, API, Google Chrome, and Microsoft Edge. Expand a case to compare expected and actual results, review
            evidence, and record validation.
          </p>
        </div>
        <div className="test-evidence-run">
          <FileCheck2 className="h-5 w-5" />
          <span>Latest run</span>
          <strong>{EXECUTED_AT}</strong>
        </div>
      </header>

      <div className="test-summary" aria-label="Filtered test summary">
        {[
          ["Total", summary.total],
          ["Passed", summary.passed],
          ["Failed", summary.failed],
          ["Blocked", summary.blocked],
          ["Not run", summary.notRun],
          ["Pending validation", summary.pending],
          ["Validated", summary.validated],
          ["Pass rate", `${summary.percentage}%`]
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="test-filters" aria-label="Test result filters">
        <label className="test-search">
          <span>Search</span>
          <span className="test-input-wrap">
            <Search className="h-4 w-4" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, title, module, or keyword"
            />
          </span>
        </label>
        <FilterSelect label="Execution" value={executionFilter} values={executionStatuses} onChange={setExecutionFilter} />
        <FilterSelect label="Validation" value={validationFilter} values={validationStatuses} onChange={setValidationFilter} />
        <FilterSelect label="Category" value={categoryFilter} values={categories} onChange={setCategoryFilter} />
        <FilterSelect label="Module" value={moduleFilter} values={modules} onChange={setModuleFilter} />
        <div className="test-filter-actions">
          <label>
            <input type="checkbox" checked={failedOnly} onChange={(event) => setFailedOnly(event.target.checked)} />
            Failed only
          </label>
          <label>
            <input type="checkbox" checked={awaitingOnly} onChange={(event) => setAwaitingOnly(event.target.checked)} />
            Awaiting validation
          </label>
          <button type="button" onClick={() => setExpanded(filtered.map((item) => item.id))}>Expand all</button>
          <button type="button" onClick={() => setExpanded([])}>Collapse all</button>
        </div>
      </div>

      <div className="test-result-count" role="status">
        <Filter className="h-4 w-4" aria-hidden="true" />
        {catalogLoading
          ? "Loading the complete executed test catalogue..."
          : `Showing ${filtered.length} of ${cases.length} unique test cases`}
      </div>

      {catalogError && (
        <p className="test-action-error" role="alert">
          <AlertTriangle className="h-4 w-4" />
          The automated regression catalogue is unavailable: {catalogError}
        </p>
      )}

      <div className="test-accordion">
        {filtered.map((item) => (
          <TestCasePanel
            key={item.id}
            testCase={item}
            open={expanded.includes(item.id)}
            onToggle={() => toggle(item.id)}
            onValidate={(comment) => recordValidation(item.id, "Validated", comment)}
            onReject={(comment) => recordValidation(item.id, "Rejected", comment)}
            onRetest={(comment) => recordValidation(item.id, "Retest Required", comment)}
            onComment={(comment) => recordValidation(item.id, item.validationStatus, comment)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="test-empty">
            <Search className="h-5 w-5" />
            <strong>No test cases match these filters.</strong>
            <span>Clear one or more filters to continue.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  values,
  onChange
}: {
  label: string;
  value: T;
  values: T[];
  onChange: (value: T) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {values.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function TestCasePanel({
  testCase,
  open,
  onToggle,
  onValidate,
  onReject,
  onRetest,
  onComment
}: {
  testCase: TestCase;
  open: boolean;
  onToggle: () => void;
  onValidate: (comment: string) => void;
  onReject: (comment: string) => void;
  onRetest: (comment: string) => void;
  onComment: (comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const ExecutionIcon = executionIcon(testCase.executionStatus);
  const ValidationIcon = validationIcon(testCase.validationStatus);
  const panelId = `test-panel-${testCase.id.toLowerCase()}`;

  function act(kind: "validate" | "reject" | "retest" | "comment") {
    const clean = comment.trim();
    if ((kind === "reject" || kind === "retest" || kind === "comment") && !clean) {
      setError(kind === "comment" ? "Enter a comment before adding it." : "A reason is required for this action.");
      return;
    }
    if (kind === "validate") onValidate(clean);
    if (kind === "reject") onReject(clean);
    if (kind === "retest") onRetest(clean);
    if (kind === "comment") onComment(clean);
    setComment("");
    setError("");
  }

  return (
    <article className={`test-case test-case-${testCase.executionStatus.toLowerCase().replace(" ", "-")}`}>
      <button
        type="button"
        className="test-case-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="test-case-id">{testCase.id}</span>
        <span className="test-case-title">
          <strong>{testCase.title}</strong>
          <small>{testCase.category} / {testCase.module}</small>
        </span>
        <StatusLabel icon={ExecutionIcon} value={testCase.executionStatus} kind="execution" />
        <StatusLabel icon={ValidationIcon} value={testCase.validationStatus} kind="validation" />
        <span className="test-case-date">{testCase.executedAt}</span>
        <ChevronDown className={`h-5 w-5 test-chevron ${open ? "test-chevron-open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className="test-case-detail">
          <section className="test-case-overview">
            <Definition title="Objective" body={testCase.objective} />
            <DefinitionList title="Preconditions" items={testCase.preconditions} />
            <DefinitionList title="Test data / input" items={testCase.testData} />
          </section>

          <section className="test-step-section" aria-label={`${testCase.id} execution steps`}>
            <h4>Execution steps</h4>
            <div className="test-step-table">
              <div className="test-step-row test-step-head">
                <span>Step</span><span>Procedure</span><span>Expected</span><span>Actual</span><span>Result</span>
              </div>
              {testCase.steps.map((step, index) => (
                <div key={`${testCase.id}-${index}`} className={`test-step-row test-step-${step.result.toLowerCase().replace(" ", "-")}`}>
                  <span data-label="Step">{index + 1}</span>
                  <span data-label="Procedure">{step.action}</span>
                  <span data-label="Expected">{step.expected}</span>
                  <span data-label="Actual">{step.actual}</span>
                  <span data-label="Result"><StepStatus value={step.result} /></span>
                </div>
              ))}
            </div>
          </section>

          <section className="test-case-meta">
            <Definition title="Overall result" body={testCase.executionStatus} />
            <Definition title="Executed by" body={testCase.executedBy} />
            <Definition title="Execution date and time" body={testCase.executedAt} />
            <Definition title="Error / failure reason" body={testCase.error ?? "None"} />
            <DefinitionList title="Supporting evidence" items={testCase.evidence} />
            <Definition title="Execution notes" body={testCase.notes} />
          </section>

          <section className="test-validation" aria-label={`${testCase.id} validation controls`}>
            <div className="test-validation-summary">
              <div>
                <span>Validation status</span>
                <strong>{testCase.validationStatus}</strong>
              </div>
              <div>
                <span>Validated by</span>
                <strong>{testCase.validationBy ?? "Awaiting reviewer"}</strong>
              </div>
              <div>
                <span>Validation date and time</span>
                <strong>{testCase.validationAt ?? "Not recorded"}</strong>
              </div>
            </div>
            {testCase.validatorComments && testCase.validatorComments.length > 0 && (
              <div className="test-comments">
                <strong>Validator comments</strong>
                <ul>{testCase.validatorComments.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              </div>
            )}
            <label className="test-comment-field">
              <span>Validator comment or reason</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder="Required for rejection, retest, and Add Comment"
                aria-describedby={error ? `${panelId}-error` : undefined}
              />
            </label>
            {error && <p id={`${panelId}-error`} className="test-action-error" role="alert"><AlertTriangle className="h-4 w-4" />{error}</p>}
            <div className="test-validation-actions">
              <button type="button" className="test-action-primary" onClick={() => act("validate")}><ShieldCheck className="h-4 w-4" />Validate</button>
              <button type="button" onClick={() => act("reject")}><XCircle className="h-4 w-4" />Reject</button>
              <button type="button" onClick={() => act("retest")}><RotateCcw className="h-4 w-4" />Request Retest</button>
              <button type="button" onClick={() => act("comment")}><MessageSquarePlus className="h-4 w-4" />Add Comment</button>
            </div>
          </section>
        </div>
      )}
    </article>
  );
}

function StatusLabel({ icon: Icon, value, kind }: { icon: typeof CheckCircle2; value: string; kind: "execution" | "validation" }) {
  return <span className={`test-status test-status-${kind} test-status-${value.toLowerCase().replace(/ /g, "-")}`}><Icon className="h-4 w-4" aria-hidden="true" />{value}</span>;
}

function StepStatus({ value }: { value: StepResult }) {
  const Icon = value === "Passed" ? CheckCircle2 : value === "Failed" ? XCircle : CircleDashed;
  return <span className={`test-step-status test-step-status-${value.toLowerCase().replace(" ", "-")}`}><Icon className="h-4 w-4" />{value}</span>;
}

function Definition({ title, body }: { title: string; body: string }) {
  return <div className="test-definition"><span>{title}</span><p>{body}</p></div>;
}

function DefinitionList({ title, items }: { title: string; items: string[] }) {
  return <div className="test-definition"><span>{title}</span><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}
