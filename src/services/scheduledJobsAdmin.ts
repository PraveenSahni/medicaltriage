// Real admin-facing control over the real Cloud Scheduler jobs this
// engagement already created (retention purge, access-entitlement review,
// DAST probe, monthly SLI report, restore-drill reminder) - closes
// NFR-049/050/051's real remaining gap: scheduling, periodic/on-demand
// execution, and pause/cancel were all already real GCP capabilities, just
// only reachable via `gcloud`, never through the application itself. Uses
// the official @google-cloud/scheduler client, the same official-client
// pattern sliReportService.ts already established for
// @google-cloud/monitoring - not a new scheduling engine.
import { CloudSchedulerClient } from "@google-cloud/scheduler";

export class ScheduledJobsConfigError extends Error {}
export class ScheduledJobNotFoundError extends Error {}

let client: CloudSchedulerClient | undefined;

function schedulerClient(): CloudSchedulerClient {
  if (!client) {
    client = new CloudSchedulerClient();
  }
  return client;
}

function requireLocationPath(): string {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_SCHEDULER_LOCATION ?? "me-central1";
  if (!projectId) {
    throw new ScheduledJobsConfigError("GCP_PROJECT_ID is required to manage Cloud Scheduler jobs.");
  }
  return schedulerClient().locationPath(projectId, location);
}

function jobResourceName(jobName: string): string {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_SCHEDULER_LOCATION ?? "me-central1";
  if (!projectId) {
    throw new ScheduledJobsConfigError("GCP_PROJECT_ID is required to manage Cloud Scheduler jobs.");
  }
  return schedulerClient().jobPath(projectId, location, jobName);
}

export type ScheduledJobSummary = {
  name: string;
  schedule: string | null;
  state: string | null;
  lastAttemptTimeIso: string | null;
  scheduleTimeIso: string | null;
};

function summarize(job: {
  name?: string | null;
  schedule?: string | null;
  state?: string | number | null;
  lastAttemptTime?: { seconds?: number | string | Long | null } | null;
  scheduleTime?: { seconds?: number | string | Long | null } | null;
}): ScheduledJobSummary {
  const shortName = job.name?.split("/").pop() ?? "unknown";
  const toIso = (t?: { seconds?: number | string | Long | null } | null) =>
    t?.seconds ? new Date(Number(t.seconds) * 1000).toISOString() : null;
  return {
    name: shortName,
    schedule: job.schedule ?? null,
    state: typeof job.state === "string" ? job.state : job.state != null ? String(job.state) : null,
    lastAttemptTimeIso: toIso(job.lastAttemptTime),
    scheduleTimeIso: toIso(job.scheduleTime)
  };
}

export async function listScheduledJobs(): Promise<ScheduledJobSummary[]> {
  const parent = requireLocationPath();
  const [jobs] = await schedulerClient().listJobs({ parent });
  return jobs.map((job) => summarize(job));
}

async function assertJobExists(jobName: string): Promise<void> {
  try {
    await schedulerClient().getJob({ name: jobResourceName(jobName) });
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: number }).code === 5) {
      throw new ScheduledJobNotFoundError(`No scheduled job named "${jobName}" exists.`);
    }
    throw error;
  }
}

export async function runScheduledJobNow(jobName: string): Promise<ScheduledJobSummary> {
  await assertJobExists(jobName);
  const [job] = await schedulerClient().runJob({ name: jobResourceName(jobName) });
  return summarize(job);
}

export async function pauseScheduledJob(jobName: string): Promise<ScheduledJobSummary> {
  await assertJobExists(jobName);
  const [job] = await schedulerClient().pauseJob({ name: jobResourceName(jobName) });
  return summarize(job);
}

export async function resumeScheduledJob(jobName: string): Promise<ScheduledJobSummary> {
  await assertJobExists(jobName);
  const [job] = await schedulerClient().resumeJob({ name: jobResourceName(jobName) });
  return summarize(job);
}

type Long = { toNumber(): number };
