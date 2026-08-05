import {
  calculateSlis,
  formatReportText,
  loadSliReportConfig,
  SliReportConfigError,
  type SliReportConfig
} from "../src/services/sliReportService.js";

// Mocks the PrismaClient used internally by sliReportService.ts (a
// dedicated client for standalone-job audit events, same pattern as
// purgeExpiredQueueData.ts) - no real DB connection needed for these tests.
const auditEvents: Array<Record<string, unknown>> = [];
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      auditEvent: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          auditEvents.push(data);
          return data;
        }),
        findMany: jest.fn(async ({ where }: { where: { action: string; resource: string } }) =>
          auditEvents.filter((e) => e.action === where.action && e.resource === where.resource)
        )
      },
      $disconnect: jest.fn(async () => undefined)
    }))
  };
});

const sendMock = jest.fn(async () => ({ success: true, providerMessageId: "dry-run" }));
jest.mock("../src/services/communicationAdapters.js", () => ({
  getEmailAdapter: () => ({ name: "dry-run-email", live: false, send: sendMock })
}));

// generateMonthlyReport() constructs its own MetricServiceClient internally
// (a real Cloud Monitoring client, not injectable at the call site) - mocked
// here at the module level so the generateMonthlyReport-specific tests below
// don't make a real network call. The calculateSlis() tests above pass their
// own mock client directly instead, since that function does accept one.
const listTimeSeriesMock = jest.fn(async () => [[]]);
jest.mock("@google-cloud/monitoring", () => ({
  MetricServiceClient: jest.fn().mockImplementation(() => ({
    projectPath: (id: string) => `projects/${id}`,
    listTimeSeries: () => listTimeSeriesMock()
  }))
}));

import { generateMonthlyReport } from "../src/services/sliReportService.js";

function fakePoint(value: number) {
  return { value: { doubleValue: value } };
}

function makeMockMonitoringClient(responses: Record<string, number[]>) {
  return {
    projectPath: (id: string) => `projects/${id}`,
    listTimeSeries: jest.fn(async ({ filter }: { filter: string }) => {
      const key = Object.keys(responses).find((k) => filter.includes(k));
      const values = key ? responses[key] : [];
      return [values.length ? [{ points: values.map(fakePoint) }] : []];
    })
  };
}

const baseConfig: SliReportConfig = {
  gcpProjectId: "test-project",
  environmentLabel: "test-env",
  cloudRunServiceName: "ist-triage-soc2",
  uptimeCheckId: "test-uptime-check",
  cloudSqlDatabaseId: "test-project:test-instance",
  cloudSqlMaxConnections: 25,
  recipientEmail: undefined,
  senderIdentityNote: "test",
  lookbackDays: 30,
  dryRun: true
};

describe("sliReportService: configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws a precise error when GCP_PROJECT_ID is missing", () => {
    delete process.env.GCP_PROJECT_ID;
    expect(() => loadSliReportConfig()).toThrow(SliReportConfigError);
  });

  it("throws a precise error when SLI_REPORT_UPTIME_CHECK_ID is missing", () => {
    process.env.GCP_PROJECT_ID = "p";
    delete process.env.SLI_REPORT_UPTIME_CHECK_ID;
    expect(() => loadSliReportConfig()).toThrow(/SLI_REPORT_UPTIME_CHECK_ID/);
  });

  it("loads valid configuration with real env vars", () => {
    process.env.GCP_PROJECT_ID = "p";
    process.env.SLI_REPORT_UPTIME_CHECK_ID = "check-1";
    process.env.SLI_REPORT_CLOUDSQL_DATABASE_ID = "p:db";
    const config = loadSliReportConfig();
    expect(config.gcpProjectId).toBe("p");
    expect(config.dryRun).toBe(true);
  });
});

describe("sliReportService: SLI calculation", () => {
  it("calculates a passing SLO when metrics are healthy", async () => {
    const client = makeMockMonitoringClient({
      uptime_check: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      request_duration_ms: [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600],
      "5xx": [],
      request_count: [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000],
      num_backends: [3, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5, 4]
    });
    const slis = await calculateSlis(client as never, baseConfig, "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z");
    const availability = slis.find((s) => s.id === "availability")!;
    expect(availability.status).toBe("pass");
    const latency = slis.find((s) => s.id === "latency")!;
    expect(latency.status).toBe("pass");
    const errorRate = slis.find((s) => s.id === "errorRate")!;
    expect(errorRate.status).toBe("pass");
    const saturation = slis.find((s) => s.id === "saturation")!;
    expect(saturation.status).toBe("pass");
  });

  it("calculates a failing SLO when latency exceeds target", async () => {
    const client = makeMockMonitoringClient({
      uptime_check: [1, 1],
      request_duration_ms: [4000, 5000, 6000],
      "5xx": [],
      request_count: [100, 100],
      num_backends: [2]
    });
    const slis = await calculateSlis(client as never, baseConfig, "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z");
    const latency = slis.find((s) => s.id === "latency")!;
    expect(latency.status).toBe("fail");
    expect(latency.result).toBeGreaterThan(3000);
  });

  it("returns no-data status when a metric series is empty, never upgrading it to pass", async () => {
    const client = makeMockMonitoringClient({});
    const slis = await calculateSlis(client as never, baseConfig, "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z");
    for (const sli of slis) {
      expect(sli.status).toBe("no-data");
      expect(sli.dataCompleteness).toBe("none");
      expect(sli.result).toBeUndefined();
    }
  });

  it("marks partial data completeness when fewer than 12 data points exist", async () => {
    const client = makeMockMonitoringClient({
      uptime_check: [1, 1, 1],
      request_duration_ms: [],
      "5xx": [],
      request_count: [],
      num_backends: []
    });
    const slis = await calculateSlis(client as never, baseConfig, "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z");
    const availability = slis.find((s) => s.id === "availability")!;
    expect(availability.dataCompleteness).toBe("partial");
  });

  it("calculates a failing error-rate SLO when 5xx responses exceed 1%", async () => {
    const client = makeMockMonitoringClient({
      uptime_check: [1],
      request_duration_ms: [],
      "5xx": [50],
      request_count: [1000],
      num_backends: []
    });
    const slis = await calculateSlis(client as never, baseConfig, "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z");
    const errorRate = slis.find((s) => s.id === "errorRate")!;
    expect(errorRate.status).toBe("fail");
    expect(errorRate.result).toBeCloseTo(5, 0);
  });
});

describe("sliReportService: report formatting", () => {
  it("never includes patient, staff, or credential data in the formatted report", async () => {
    const client = makeMockMonitoringClient({
      uptime_check: [1],
      request_duration_ms: [500],
      "5xx": [],
      request_count: [100],
      num_backends: [3]
    });
    const slis = await calculateSlis(client as never, baseConfig, "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z");
    const text = formatReportText({
      reportId: "r1",
      environment: "test-env",
      gcpProjectId: "test-project",
      periodStartIso: "2026-07-01T00:00:00Z",
      periodEndIso: "2026-08-01T00:00:00Z",
      generatedAtIso: "2026-08-01T00:00:01Z",
      overallStatus: "pass",
      slis
    });
    expect(text).toContain("no patient, staff, or operational record data");
    expect(text).not.toMatch(/password|secret|token|ssn|patient name/i);
  });
});

describe("sliReportService: generateMonthlyReport (audit trail + idempotency + email)", () => {
  beforeEach(() => {
    auditEvents.length = 0;
    sendMock.mockClear();
  });

  const healthyConfig: SliReportConfig = {
    ...baseConfig,
    recipientEmail: "ops@example.test",
    dryRun: false
  };

  it("records a generation-started and generated audit event, and emails the report", async () => {
    const result = await generateMonthlyReport(healthyConfig, {
      periodStartIso: "2026-07-01T00:00:00Z",
      periodEndIso: "2026-08-01T00:00:00Z"
    });
    expect(result.emailed).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const actions = auditEvents.map((e) => e.action);
    expect(actions).toContain("SLI_REPORT_GENERATION_STARTED");
    expect(actions).toContain("SLI_REPORT_GENERATED");
    expect(actions).toContain("SLI_REPORT_EMAILED");
  });

  it("does not email when in dry-run mode, but still generates the report", async () => {
    const result = await generateMonthlyReport(
      { ...healthyConfig, dryRun: true },
      { periodStartIso: "2026-07-01T00:00:00Z", periodEndIso: "2026-08-01T00:00:00Z" }
    );
    expect(result.emailed).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
    expect(result.report.slis).toHaveLength(4);
  });

  it("does not email when no recipient is configured", async () => {
    const result = await generateMonthlyReport(
      { ...healthyConfig, recipientEmail: undefined },
      { periodStartIso: "2026-07-01T00:00:00Z", periodEndIso: "2026-08-01T00:00:00Z" }
    );
    expect(result.emailed).toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("prevents duplicate email delivery for the same environment+period", async () => {
    const first = await generateMonthlyReport(healthyConfig, {
      periodStartIso: "2026-07-01T00:00:00Z",
      periodEndIso: "2026-08-01T00:00:00Z"
    });
    expect(first.emailed).toBe(true);

    const second = await generateMonthlyReport(healthyConfig, {
      periodStartIso: "2026-07-05T00:00:00Z",
      periodEndIso: "2026-08-01T00:00:00Z"
    });
    expect(second.emailed).toBe(false);
    expect(second.skippedDuplicate).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("allows a forced resend for the same period, bypassing duplicate-period prevention", async () => {
    await generateMonthlyReport(healthyConfig, {
      periodStartIso: "2026-07-01T00:00:00Z",
      periodEndIso: "2026-08-01T00:00:00Z"
    });
    const forced = await generateMonthlyReport(healthyConfig, {
      periodStartIso: "2026-07-01T00:00:00Z",
      periodEndIso: "2026-08-01T00:00:00Z",
      force: true
    });
    expect(forced.emailed).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("records a failure audit event and rethrows when email delivery fails", async () => {
    sendMock.mockRejectedValueOnce(new Error("Graph API unavailable"));
    await expect(
      generateMonthlyReport(healthyConfig, {
        periodStartIso: "2026-07-01T00:00:00Z",
        periodEndIso: "2026-08-01T00:00:00Z"
      })
    ).rejects.toThrow("Graph API unavailable");
    const actions = auditEvents.map((e) => e.action);
    expect(actions).toContain("SLI_REPORT_EMAIL_FAILED");
  });
});
