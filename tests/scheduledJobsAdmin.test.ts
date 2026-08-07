import request from "supertest";

jest.mock("../src/services/scheduledJobsAdmin.js", () => ({
  listScheduledJobs: jest.fn(),
  runScheduledJobNow: jest.fn(),
  pauseScheduledJob: jest.fn(),
  resumeScheduledJob: jest.fn(),
  ScheduledJobNotFoundError: class ScheduledJobNotFoundError extends Error {}
}));

import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";
import { listScheduledJobs, pauseScheduledJob, ScheduledJobNotFoundError } from "../src/services/scheduledJobsAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

describe("Admin scheduled-jobs control (NFR-049/050/051)", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
    jest.clearAllMocks();
  });

  it("requires admin.roles.manage - a role without it is forbidden", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.get("/api/v1/admin/scheduled-jobs").expect(403);
  });

  it("lists real scheduled jobs for an authorized admin", async () => {
    (listScheduledJobs as jest.Mock).mockResolvedValue([
      { name: "purge-expired-queue-data-soc2-trigger", schedule: "0 3 * * 0", state: "ENABLED", lastAttemptTimeIso: null, scheduleTimeIso: null }
    ]);
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    const response = await sysAdmin.get("/api/v1/admin/scheduled-jobs").expect(200);
    expect(response.body.jobs).toHaveLength(1);
    expect(response.body.jobs[0].name).toBe("purge-expired-queue-data-soc2-trigger");
  });

  it("pauses a real job by name", async () => {
    (pauseScheduledJob as jest.Mock).mockResolvedValue({ name: "dast-probe-soc2-trigger", state: "PAUSED" });
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    const response = await sysAdmin.post("/api/v1/admin/scheduled-jobs/dast-probe-soc2-trigger/pause").expect(200);
    expect(response.body.job.state).toBe("PAUSED");
  });

  it("returns 404 for an unknown job name", async () => {
    (pauseScheduledJob as jest.Mock).mockRejectedValue(new ScheduledJobNotFoundError("No scheduled job named \"does-not-exist\" exists."));
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    await sysAdmin.post("/api/v1/admin/scheduled-jobs/does-not-exist/pause").expect(404);
  });
});
