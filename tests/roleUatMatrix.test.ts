import request from "supertest";
import { createApp } from "../src/app.js";
import { signSessionJwt } from "../src/middleware/auth.js";
import {
  authenticateLocal,
  listRoles,
  resetSecurityStoreForTests
} from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

type Persona = {
  roleCode: string;
  username: string;
  label: string;
};

type EndpointSpec = {
  name: string;
  method: "get" | "post";
  path: string;
  body?: Record<string, unknown>;
  allows: (args: { roleCode: string; permissions: Set<string> }) => boolean;
};

type UatCase = {
  persona: Persona;
  spec: EndpointSpec;
  expectedStatus: 200 | 403;
  expectation: "positive" | "negative";
};

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function assertNoDuplicates<T>(
  items: T[],
  getKey: (item: T) => string,
  collectionName: string
) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  }

  if (duplicates.size > 0) {
    throw new Error(
      `Duplicate ${collectionName} found: ${Array.from(duplicates).join(", ")}`
    );
  }
}

const personas: Persona[] = [
  { roleCode: "platform_super_administrator", username: "pa@irisstar.tech", label: "Platform Super Administrator" },
  { roleCode: "organization_administrator", username: "oa@irisstar.tech", label: "Organization Administrator" },
  { roleCode: "system_administrator", username: "sa@irisstar.tech", label: "System Administrator" },
  { roleCode: "security_administrator", username: "sec@irisstar.tech", label: "Security Administrator" },
  { roleCode: "privacy_officer", username: "privacy@irisstar.tech", label: "Privacy Officer / DPO" },
  { roleCode: "compliance_auditor", username: "audit@irisstar.tech", label: "Compliance Auditor" },
  { roleCode: "clinical_governance_lead", username: "governance@irisstar.tech", label: "Clinical Governance Lead" },
  { roleCode: "triage_service_manager", username: "manager@irisstar.tech", label: "Triage Service Manager" },
  { roleCode: "call_intake_coordinator", username: "intake@irisstar.tech", label: "Call Intake Coordinator" },
  { roleCode: "remote_triage_nurse", username: "nurse@irisstar.tech", label: "Remote Triage Nurse" },
  { roleCode: "senior_triage_nurse", username: "senior.nurse@irisstar.tech", label: "Senior Triage Nurse" },
  { roleCode: "pediatric_triage_nurse", username: "pediatric.nurse@irisstar.tech", label: "Pediatric Triage Nurse" },
  { roleCode: "teleconsult_physician", username: "physician@irisstar.tech", label: "Teleconsult Physician" },
  { roleCode: "occupational_health_clinician", username: "oh@irisstar.tech", label: "Occupational Health Clinician" },
  { roleCode: "protocol_content_manager", username: "protocols@irisstar.tech", label: "Protocol Content Manager" },
  { roleCode: "quality_reviewer", username: "quality@irisstar.tech", label: "Quality Reviewer" },
  { roleCode: "integration_administrator", username: "integration@irisstar.tech", label: "Integration Administrator" },
  { roleCode: "reporting_analyst", username: "reports@irisstar.tech", label: "Reporting Analyst" },
  { roleCode: "helpdesk_support", username: "helpdesk@irisstar.tech", label: "Helpdesk Support" }
];

const demoPasswordsByUsername: Record<string, string> = {
  "pa@irisstar.tech": "PlatformAdmin@2026",
  "oa@irisstar.tech": "OrgAdmin@2026",
  "sa@irisstar.tech": "SystemAdmin@2026",
  "sec@irisstar.tech": "SecurityAdmin@2026",
  "privacy@irisstar.tech": "Privacy@2026",
  "audit@irisstar.tech": "Audit@2026",
  "governance@irisstar.tech": "Governance@2026",
  "manager@irisstar.tech": "Manager@2026",
  "intake@irisstar.tech": "Intake@2026",
  "nurse@irisstar.tech": "Nurse@2026",
  "senior.nurse@irisstar.tech": "SeniorNurse@2026",
  "pediatric.nurse@irisstar.tech": "PediatricNurse@2026",
  "physician@irisstar.tech": "Physician@2026",
  "oh@irisstar.tech": "OccupationalHealth@2026",
  "protocols@irisstar.tech": "Protocols@2026",
  "quality@irisstar.tech": "Quality@2026",
  "integration@irisstar.tech": "Integration@2026",
  "reports@irisstar.tech": "Reports@2026",
  "helpdesk@irisstar.tech": "Helpdesk@2026"
};

const controlCenterPermissions = [
  "admin.users.manage",
  "admin.roles.manage",
  "security.sso.manage",
  "privacy.assessment.manage",
  "crypto.policy.manage",
  "audit.events.view",
  "clinical.governance.approve",
  "protocol.library.manage",
  "integration.hrms.manage",
  "integration.emr.manage",
  "reports.view",
  "support.tickets.manage",
  "operations.dashboard.view"
];

function hasAny(permissions: Set<string>, required: string[]) {
  return required.some((permission) => permissions.has(permission));
}

const alwaysAllowed = () => true;

const endpointSpecs: EndpointSpec[] = [
  { name: "restore active session", method: "get", path: "/api/v1/auth/session", allows: alwaysAllowed },
  {
    name: "view Control Center module catalog",
    method: "get",
    path: "/api/v1/admin/control-modules",
    allows: ({ permissions }) => hasAny(permissions, controlCenterPermissions)
  },
  {
    name: "view Control Center dashboard summary",
    method: "get",
    path: "/api/v1/admin/summary",
    allows: ({ permissions }) => permissions.has("audit.events.view")
  },
  {
    name: "view user administration",
    method: "get",
    path: "/api/v1/admin/users",
    allows: ({ permissions }) => permissions.has("admin.users.manage")
  },
  {
    name: "view role templates",
    method: "get",
    path: "/api/v1/admin/roles",
    allows: ({ permissions }) => permissions.has("admin.roles.manage")
  },
  {
    name: "view responsibility catalog",
    method: "get",
    path: "/api/v1/admin/responsibilities",
    allows: ({ permissions }) => permissions.has("admin.roles.manage")
  },
  {
    name: "view permission catalog",
    method: "get",
    path: "/api/v1/admin/permissions",
    allows: ({ permissions }) => permissions.has("admin.roles.manage")
  },
  {
    name: "view SSO provider configuration",
    method: "get",
    path: "/api/v1/admin/sso-providers",
    allows: ({ permissions }) => permissions.has("security.sso.manage")
  },
  {
    name: "view encryption policies",
    method: "get",
    path: "/api/v1/admin/encryption-policies",
    allows: ({ permissions }) => permissions.has("crypto.policy.manage")
  },
  {
    name: "view audit events",
    method: "get",
    path: "/api/v1/admin/audit-events",
    allows: ({ permissions }) => permissions.has("audit.events.view")
  },
  {
    name: "view privacy reveal directory",
    method: "get",
    path: "/api/v1/admin/reveal-directory",
    allows: ({ permissions }) => hasAny(permissions, ["privacy.assessment.manage", "admin.users.manage"])
  },
  {
    name: "view governance work items",
    method: "get",
    path: "/api/v1/admin/governance",
    allows: ({ permissions }) => hasAny(permissions, ["clinical.governance.approve", "protocol.library.manage", "audit.events.view"])
  },
  {
    name: "view protocol library status",
    method: "get",
    path: "/api/v1/admin/protocol-library",
    allows: ({ permissions }) => hasAny(permissions, ["protocol.library.manage", "clinical.governance.approve"])
  },
  {
    name: "view integration connector status",
    method: "get",
    path: "/api/v1/admin/integrations",
    allows: ({ permissions }) => hasAny(permissions, ["integration.hrms.manage", "integration.emr.manage", "security.sso.manage"])
  },
  {
    name: "view report catalog",
    method: "get",
    path: "/api/v1/admin/reports",
    allows: ({ permissions }) => hasAny(permissions, ["reports.view", "operations.dashboard.view"])
  },
  {
    name: "view support queue",
    method: "get",
    path: "/api/v1/admin/support",
    allows: ({ permissions }) => hasAny(permissions, ["support.tickets.manage", "admin.users.manage"])
  },
  {
    name: "view clinical call queue",
    method: "get",
    path: "/api/v1/queue",
    allows: ({ permissions }) => hasAny(permissions, ["triage.workspace.view", "triage.queue.manage", "admin.users.manage"])
  },
  {
    name: "view current clinical content release",
    method: "get",
    path: "/api/v1/protocols/releases/current",
    allows: alwaysAllowed
  },
  {
    name: "search protocol keywords",
    method: "get",
    path: "/api/v1/protocols/search?q=chest&limit=3",
    allows: alwaysAllowed
  },
  {
    name: "list protocol library summaries",
    method: "get",
    path: "/api/v1/protocols",
    allows: alwaysAllowed
  },
  {
    name: "view simulation scenarios",
    method: "get",
    path: "/api/v1/simulation/scenarios",
    allows: alwaysAllowed
  },
  {
    name: "run simulation suite",
    method: "get",
    path: "/api/v1/simulation/suite",
    allows: alwaysAllowed
  },
  {
    name: "view CCP communication status",
    method: "get",
    path: "/api/v1/ccp/communication/status",
    allows: alwaysAllowed
  },
  {
    name: "validate staff from HRMS directory",
    method: "post",
    path: "/api/v1/staff/validate",
    body: { ist_staff_id: "IST-10001" },
    allows: alwaysAllowed
  },
  {
    name: "calculate deterministic triage score",
    method: "post",
    path: "/api/v1/triage/calculate-score",
    body: {
      ist_staff_id: "IST-10001",
      heart_rate: 82,
      respiratory_rate: 16,
      spo2: 98,
      temperature: 36.8,
      conscious_level: "alert"
    },
    allows: alwaysAllowed
  }
];

assertNoDuplicates(personas, (persona) => persona.roleCode, "role personas");
assertNoDuplicates(personas, (persona) => persona.username, "role persona usernames");
assertNoDuplicates(
  endpointSpecs,
  (spec) => `${spec.method}:${spec.path}:${stableJson(spec.body ?? {})}`,
  "endpoint UAT specifications"
);

const rolePermissionMap = new Map(
  listRoles().map((role) => [role.code, new Set(role.permissions)])
);

const uatCases: UatCase[] = personas.flatMap((persona) => {
  const permissions = rolePermissionMap.get(persona.roleCode);
  if (!permissions) {
    throw new Error(`Missing role in seeded role catalog: ${persona.roleCode}`);
  }

  return endpointSpecs.map((spec) => {
    const allowed = spec.allows({ roleCode: persona.roleCode, permissions });
    return {
      persona,
      spec,
      expectedStatus: allowed ? 200 : 403,
      expectation: allowed ? "positive" : "negative"
    };
  });
});

assertNoDuplicates(
  uatCases,
  (testCase) =>
    [
      testCase.persona.roleCode,
      testCase.spec.method,
      testCase.spec.path,
      stableJson(testCase.spec.body ?? {}),
      testCase.expectedStatus
    ].join("|"),
  "role-action UAT cases"
);

const summary = {
  roles: personas.length,
  endpoints: endpointSpecs.length,
  total: uatCases.length,
  positive: uatCases.filter((testCase) => testCase.expectation === "positive").length,
  negative: uatCases.filter((testCase) => testCase.expectation === "negative").length
};

describe("Comprehensive role-based UAT matrix", () => {
  const tokensByRole = new Map<string, string>();

  beforeAll(async () => {
    resetSecurityStoreForTests();

    for (const persona of personas) {
      const result = await authenticateLocal({
        username: persona.username,
        password: TEST_ADMIN_PASSWORD,
        rememberMe: false,
        ipAddress: "uat-matrix",
        device: "jest-role-uat"
      });

      if (!result.ok) {
        throw new Error(`Unable to authenticate ${persona.label}: ${result.message}`);
      }

      expect(result.session.activeRole).toBe(persona.roleCode);
      tokensByRole.set(persona.roleCode, `Bearer ${signSessionJwt(result.session)}`);
    }
  });

  afterAll(() => {
    resetSecurityStoreForTests();
  });

  it(`covers ${summary.total} UAT cases across ${summary.roles} roles and ${summary.endpoints} endpoints (${summary.positive} positive, ${summary.negative} negative)`, () => {
    expect(summary.total).toBeGreaterThanOrEqual(100);
    expect(summary.positive).toBeGreaterThan(0);
    expect(summary.negative).toBeGreaterThan(0);
  });

  it("contains no duplicate personas, endpoint specifications, or role-action cases", () => {
    expect(new Set(personas.map((persona) => persona.roleCode)).size).toBe(personas.length);
    expect(new Set(personas.map((persona) => persona.username)).size).toBe(personas.length);
    expect(
      new Set(
        endpointSpecs.map((spec) => `${spec.method}:${spec.path}:${stableJson(spec.body ?? {})}`)
      ).size
    ).toBe(endpointSpecs.length);
    expect(
      new Set(
        uatCases.map((testCase) =>
          [
            testCase.persona.roleCode,
            testCase.spec.method,
            testCase.spec.path,
            stableJson(testCase.spec.body ?? {}),
            testCase.expectedStatus
          ].join("|")
        )
      ).size
    ).toBe(uatCases.length);
  });

  it("rejects role override when the selected user is not assigned that role", async () => {
    const result = await authenticateLocal({
      username: "nurse@irisstar.tech",
      password: TEST_ADMIN_PASSWORD,
      rememberMe: false,
      simulateRole: "platform_super_administrator",
      ipAddress: "uat-matrix",
      device: "jest-role-uat"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Selected simulation role is not assigned to this demo account.");
    }
  });

  it("accepts the selected user's simulation password and rejects another user's password", async () => {
    const seniorNurseLogin = await authenticateLocal({
      username: "senior.nurse@irisstar.tech",
      password: demoPasswordsByUsername["senior.nurse@irisstar.tech"],
      rememberMe: false,
      ipAddress: "uat-matrix",
      device: "jest-role-uat"
    });

    expect(seniorNurseLogin.ok).toBe(true);
    if (seniorNurseLogin.ok) {
      expect(seniorNurseLogin.session.activeRole).toBe("senior_triage_nurse");
    }

    const wrongPasswordLogin = await authenticateLocal({
      username: "senior.nurse@irisstar.tech",
      password: demoPasswordsByUsername["nurse@irisstar.tech"],
      rememberMe: false,
      ipAddress: "uat-matrix",
      device: "jest-role-uat"
    });

    expect(wrongPasswordLogin.ok).toBe(false);
  });

  test.each(uatCases)(
    "$expectation | $persona.label | $spec.name",
    async ({ persona, spec, expectedStatus }) => {
      const authorization = tokensByRole.get(persona.roleCode);
      if (!authorization) {
        throw new Error(`Missing authorization token for ${persona.roleCode}`);
      }

      const operation =
        spec.method === "get"
          ? request(app).get(spec.path)
          : request(app).post(spec.path).send(spec.body ?? {});

      const response = await operation.set("Authorization", authorization);
      expect(response.status).toBe(expectedStatus);
    }
  );
});
