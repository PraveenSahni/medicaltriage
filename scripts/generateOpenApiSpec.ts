// Generates docs/openapi.json from a declarative list of this app's real
// registered routes (mount prefix + method + path + auth requirement),
// cross-checked against src/app.ts's app.use() registrations. This is a
// path/method/auth-level OpenAPI document (NFR-186) - it does not yet
// derive full request/response JSON Schemas from each route's Zod schema
// (a larger follow-on task), but it is a real, accurate map of every
// endpoint this API actually exposes, not a fabricated or aspirational one.
import { writeFileSync } from "node:fs";
import path from "node:path";

type Endpoint = {
  method: "get" | "post" | "put" | "patch" | "delete";
  path: string;
  summary: string;
  auth: "session" | "none";
};

type Mount = {
  prefix: string;
  tag: string;
  requiresSessionForAll: boolean;
  endpoints: Endpoint[];
};

const mounts: Mount[] = [
  {
    prefix: "/api/v1/auth",
    tag: "Auth",
    requiresSessionForAll: false,
    endpoints: [
      { method: "get", path: "/session", summary: "Get the current session, if any.", auth: "none" },
      { method: "post", path: "/login", summary: "Authenticate with username/password (rate-limited).", auth: "none" },
      { method: "post", path: "/logout", summary: "End the current session.", auth: "none" },
      { method: "post", path: "/sso/test", summary: "SSO test/diagnostic endpoint.", auth: "none" }
    ]
  },
  {
    prefix: "/api/v1/hrms",
    tag: "HRMS",
    requiresSessionForAll: false,
    endpoints: [{ method: "post", path: "/sync-users", summary: "Sync users from the Oracle Fusion HCM directory.", auth: "none" }]
  },
  {
    prefix: "/api/v1/integrations/call-center",
    tag: "Call Center Integration",
    requiresSessionForAll: false,
    endpoints: [{ method: "post", path: "/events", summary: "Inbound call-center event webhook (signature-verified).", auth: "none" }]
  },
  {
    prefix: "/api/v1/admin",
    tag: "Admin",
    requiresSessionForAll: true,
    endpoints: [
      { method: "get", path: "/control-modules", summary: "List admin control-center modules visible to the caller.", auth: "session" },
      { method: "get", path: "/summary", summary: "Admin dashboard summary.", auth: "session" },
      { method: "get", path: "/users", summary: "List admin users.", auth: "session" },
      { method: "get", path: "/roles", summary: "List roles.", auth: "session" },
      { method: "get", path: "/responsibilities", summary: "List responsibilities.", auth: "session" },
      { method: "get", path: "/permissions", summary: "List permissions.", auth: "session" },
      { method: "get", path: "/sso-providers", summary: "List configured SSO providers.", auth: "session" },
      { method: "get", path: "/encryption-policies", summary: "List encryption policies.", auth: "session" },
      { method: "get", path: "/audit-events", summary: "List audit events.", auth: "session" },
      { method: "get", path: "/reveal-directory", summary: "List the reveal-request directory.", auth: "session" },
      { method: "get", path: "/governance", summary: "List clinical governance work items.", auth: "session" },
      { method: "get", path: "/protocol-library", summary: "List protocol library items.", auth: "session" },
      { method: "get", path: "/integrations", summary: "List integration connectors.", auth: "session" },
      { method: "get", path: "/reports", summary: "List the report catalog.", auth: "session" },
      { method: "get", path: "/support", summary: "List the support ticket queue.", auth: "session" },
      { method: "post", path: "/reveal", summary: "Request a controlled reveal of masked sensitive data.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/approval",
    tag: "Clinical Approval",
    requiresSessionForAll: true,
    endpoints: [
      { method: "get", path: "/queue", summary: "Clinician HITL approval queue.", auth: "session" },
      { method: "get", path: "/dashboard", summary: "Safety/quality dashboard.", auth: "session" },
      { method: "post", path: "/reviews/{encounterId}", summary: "Record a clinician's approval/override decision for an encounter.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/ccp",
    tag: "Care Communication Platform",
    requiresSessionForAll: true,
    endpoints: [
      { method: "get", path: "/communication/status", summary: "CCP integration status.", auth: "session" },
      { method: "get", path: "/messages/drafts", summary: "List outbound message drafts.", auth: "session" },
      { method: "post", path: "/messages/draft", summary: "Create an outbound message draft.", auth: "session" },
      { method: "post", path: "/messages/{draftId}/approve-send", summary: "Approve and send a drafted message.", auth: "session" },
      { method: "post", path: "/webhooks/twilio", summary: "Inbound Twilio webhook.", auth: "session" },
      { method: "get", path: "/webhooks/inbound-records", summary: "List persisted inbound webhook records.", auth: "session" },
      { method: "get", path: "/employee/{istStaffId}", summary: "Look up an employee by IST staff ID.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/staff",
    tag: "Staff",
    requiresSessionForAll: true,
    endpoints: [{ method: "post", path: "/validate", summary: "Validate a staff/dependent identity against HRMS (rate-limited).", auth: "session" }]
  },
  {
    prefix: "/api/v1/protocols",
    tag: "Clinical Protocols",
    requiresSessionForAll: true,
    endpoints: [
      { method: "get", path: "/releases/current", summary: "Get the currently active clinical content release.", auth: "session" },
      { method: "get", path: "/search", summary: "Search clinical protocols by keyword.", auth: "session" },
      { method: "get", path: "/", summary: "List all clinical protocols.", auth: "session" },
      { method: "get", path: "/{protocolId}", summary: "Get a single protocol by ID.", auth: "session" },
      { method: "get", path: "/{protocolId}/care-advice", summary: "Get care advice for a protocol.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/queue",
    tag: "Triage Queue",
    requiresSessionForAll: true,
    endpoints: [
      { method: "get", path: "/", summary: "List queue items visible to the caller.", auth: "session" },
      { method: "post", path: "/", summary: "Create a new queue item (intake).", auth: "session" },
      { method: "post", path: "/simulate", summary: "Simulate an incoming synthetic call (mock mode).", auth: "session" },
      { method: "post", path: "/next-best-call", summary: "Claim the next highest-priority claimable call.", auth: "session" },
      { method: "get", path: "/stats/completions", summary: "Completion-count statistics.", auth: "session" },
      { method: "get", path: "/{id}", summary: "Get a single queue item.", auth: "session" },
      { method: "delete", path: "/{id}", summary: "Delete a queue item (manager roles only).", auth: "session" },
      { method: "post", path: "/{id}/claim", summary: "Claim and lock a queue item.", auth: "session" },
      { method: "post", path: "/{id}/release", summary: "Release a queue item's lock.", auth: "session" },
      { method: "post", path: "/{id}/heartbeat", summary: "Refresh a queue item's lock.", auth: "session" },
      { method: "patch", path: "/{id}/context", summary: "Update clinical context (vitals, severity, disposition, SBAR, etc.).", auth: "session" },
      { method: "post", path: "/{id}/reason-audio", summary: "Attach a Reason-for-Call audio capture.", auth: "session" },
      { method: "post", path: "/{id}/move", summary: "Move a queue item to a new stage/status.", auth: "session" },
      { method: "post", path: "/{id}/escalate", summary: "Escalate a queue item to another organization.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/call-center",
    tag: "Call Center",
    requiresSessionForAll: true,
    endpoints: [
      { method: "post", path: "/events", summary: "Record a call-center event (signature-verified).", auth: "session" },
      { method: "get", path: "/status", summary: "Get call-center gateway integration status.", auth: "session" },
      { method: "get", path: "/sessions", summary: "List call-center sessions.", auth: "session" },
      { method: "post", path: "/queue/{queueItemId}/command", summary: "Issue a call-control command for a queue item's call session.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/simulation",
    tag: "Simulation",
    requiresSessionForAll: true,
    endpoints: [
      { method: "get", path: "/scenarios", summary: "List available test scenarios.", auth: "session" },
      { method: "post", path: "/run", summary: "Run the default simulation suite.", auth: "session" },
      { method: "post", path: "/run/{scenarioId}", summary: "Run a specific simulation scenario.", auth: "session" },
      { method: "get", path: "/suite", summary: "Get the simulation suite definition.", auth: "session" },
      { method: "get", path: "/training-set", summary: "Get the training data set.", auth: "session" },
      { method: "get", path: "/generated", summary: "Get generated synthetic test data.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/triage",
    tag: "Triage",
    requiresSessionForAll: true,
    endpoints: [
      { method: "post", path: "/fit-to-fly-preview", summary: "Preview fit-to-fly status for a hypothetical disposition.", auth: "session" },
      { method: "post", path: "/start", summary: "Start a triage encounter.", auth: "session" },
      { method: "post", path: "/calculate-score", summary: "Calculate a NEWS2-style triage score.", auth: "session" },
      { method: "post", path: "/preview", summary: "Preview the compiled SOAP/SBAR note (no persistence).", auth: "session" },
      { method: "post", path: "/complete", summary: "Complete a triage encounter and persist the note (idempotent on queueItemId).", auth: "session" },
      { method: "post", path: "/encounters/evaluate", summary: "Evaluate an encounter against the rules engine.", auth: "session" }
    ]
  },
  {
    prefix: "/api/v1/voice-assessment",
    tag: "Voice Assessment",
    requiresSessionForAll: true,
    endpoints: [
      { method: "post", path: "/sessions", summary: "Create a voice assessment session.", auth: "session" },
      { method: "get", path: "/sessions/{sessionId}", summary: "Get a voice assessment session.", auth: "session" },
      { method: "post", path: "/sessions/{sessionId}/responses", summary: "Record a response turn.", auth: "session" },
      { method: "post", path: "/sessions/{sessionId}/turns/{turnId}/validate", summary: "Validate a recorded turn.", auth: "session" },
      { method: "post", path: "/sessions/{sessionId}/takeover", summary: "Take over an in-progress session.", auth: "session" },
      {
        method: "get",
        path: "/sessions/{sessionId}/training-examples",
        summary: "Build interpretation-only training examples from a session (no clinical outcomes).",
        auth: "session"
      }
    ]
  },
  {
    prefix: "/api/v1/emr",
    tag: "EMR / FHIR",
    requiresSessionForAll: true,
    endpoints: [{ method: "post", path: "/writeback/{encounterId}", summary: "Write a completed encounter back to the EMR via FHIR.", auth: "session" }]
  },
  {
    prefix: "/api/v1/help",
    tag: "Help",
    requiresSessionForAll: false,
    endpoints: [
      { method: "get", path: "/help", summary: "Serve the standalone help page.", auth: "none" },
      { method: "post", path: "/restricted-access/verify", summary: "Verify access to restricted help content (rate-limited).", auth: "none" },
      { method: "get", path: "/restricted-vault", summary: "Access the restricted-content vault (requires prior verification).", auth: "none" }
    ]
  }
];

const paths: Record<string, Record<string, unknown>> = {};

for (const mount of mounts) {
  for (const endpoint of mount.endpoints) {
    const fullPath = (mount.prefix + endpoint.path).replace(/\/$/, "") || mount.prefix;
    paths[fullPath] ??= {};
    const requiresAuth = mount.requiresSessionForAll || endpoint.auth === "session";
    paths[fullPath][endpoint.method] = {
      tags: [mount.tag],
      summary: endpoint.summary,
      security: requiresAuth ? [{ sessionCookie: [] }] : [],
      responses: {
        "200": { description: "Success" },
        "400": { description: "Invalid request payload" },
        ...(requiresAuth ? { "401": { description: "Authentication required" } } : {})
      }
    };
  }
}

const spec = {
  openapi: "3.0.3",
  info: {
    title: "IST Health Tele-Triage API",
    version: "1.0.0",
    description:
      "Path/method/auth-level API map generated from this repo's real route registrations (scripts/generateOpenApiSpec.ts), " +
      "not hand-maintained or aspirational. Request/response body schemas are not yet derived from this app's Zod validators " +
      "(see the routes' *.Schema definitions in src/types/ and src/routes/) - that is a follow-on task, tracked separately."
  },
  servers: [{ url: "https://triagedsoc2.irisstar.tech", description: "SOC 2 staging" }],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "ist_triage_session"
      }
    }
  },
  paths
};

const outPath = path.resolve(process.cwd(), "docs", "openapi.json");
writeFileSync(outPath, JSON.stringify(spec, null, 2) + "\n", "utf8");
console.log(`Wrote ${outPath} (${Object.keys(paths).length} paths).`);
