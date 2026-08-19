import { mkdir, writeFile } from "node:fs/promises";
import { authenticator } from "otplib";

const API_BASE = (process.env.API_BASE ?? "").replace(/\/$/, "");
const ALLOWED_TARGET = "https://ist-triage-soc2-gv6v4zyvuq-ww.a.run.app";
if (process.env.ALLOW_LIVE_PR007_UAT !== "SOC2") throw new Error("Set ALLOW_LIVE_PR007_UAT=SOC2");
if (API_BASE !== ALLOWED_TARGET) throw new Error(`Refusing non-SOC2 target: ${API_BASE || "<empty>"}`);

const username = process.env.PR007_NURSE_USERNAME ?? "synthetic-monitor@irisstar.tech";
const password = process.env.PR007_NURSE_PASSWORD;
const mfaSecret = process.env.PR007_NURSE_MFA_SECRET;
if (!password || !mfaSecret) throw new Error("Governed SOC2 nurse password and MFA secret are required");

type Jar = { cookie?: string; token?: string };
type Evidence = { id: string; method: string; path: string; expected: number[]; actual: number; pass: boolean };
const evidence: Evidence[] = [];

async function call(jar: Jar, id: string, method: string, path: string, expected: number[], body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-PR-007-UAT": "synthetic-soc2" };
  if (jar.cookie) headers.Cookie = jar.cookie;
  if (jar.token) headers.Authorization = `Bearer ${jar.token}`;
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) jar.cookie = setCookie.split(";")[0];
  const parsed = await response.json().catch(() => ({}));
  const item = { id, method, path, expected, actual: response.status, pass: expected.includes(response.status) };
  evidence.push(item);
  console.log(`${item.pass ? "PASS" : "FAIL"} ${id} ${method} ${path} -> ${response.status}`);
  if (!item.pass) throw new Error(`${id} expected ${expected.join("/")} but received ${response.status}: ${JSON.stringify(parsed)}`);
  return parsed as Record<string, any>;
}

async function main() {
  const jar: Jar = {};
  const login = await call(jar, "AUTH-001", "POST", "/api/v1/auth/login", [202], { username, password });
  const verified = await call(jar, "AUTH-002", "POST", "/api/v1/auth/mfa/verify", [200], {
    challengeId: login.challengeId,
    code: authenticator.generate(mfaSecret!)
  });
  jar.token = verified.accessToken;

  let queueItemId: string | undefined;
  try {
    const created = await call(jar, "PR007-001", "POST", "/api/v1/queue", [201], {
      istStaffId: "IST-00001",
      patientType: "Staff",
      channel: "Phone",
      department: "Clinical UAT",
      jobTitle: "Synthetic Test Record",
      summary: "PR-007 controlled abdominal pain merge and lifecycle UAT",
      reasonNarrative: "Adult with lower abdominal pain for two hours",
      safetyFloorActive: false,
      slaMinutes: 30
    });
    queueItemId = created.item?.id;
    if (!queueItemId) throw new Error("Create response omitted queue item id");

    await call(jar, "PR007-002", "POST", `/api/v1/queue/${queueItemId}/claim`, [200]);
    await call(jar, "PR007-003", "POST", `/api/v1/call-center/queue/${queueItemId}/command`, [200], { action: "ANSWER" });
    await call(jar, "PR007-004", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], { initialAssessmentResponses: { "iaq-location": "lower abdomen" } });
    await call(jar, "PR007-005", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], { initialAssessmentResponses: { "iaq-duration": "two hours" } });
    await call(jar, "PR007-006", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], { taqResponses: { "taq-emergency": false } });
    await call(jar, "PR007-007", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], { taqResponses: { "taq-urgent": true } });
    await call(jar, "PR007-008", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], { clinicalApproval: { terminalQuestionId: "taq-urgent" } });
    await call(jar, "PR007-009", "POST", `/api/v1/call-center/queue/${queueItemId}/command`, [200], { action: "HOLD" });
    await call(jar, "PR007-010", "POST", `/api/v1/call-center/queue/${queueItemId}/command`, [200], { action: "RESUME" });

    const beforeDisposition = await call(jar, "PR007-011", "GET", `/api/v1/queue/${queueItemId}`, [200]);
    const item = beforeDisposition.item;
    if (item.initialAssessmentResponses?.["iaq-location"] !== "lower abdomen" || item.initialAssessmentResponses?.["iaq-duration"] !== "two hours") throw new Error("IAQ merge did not survive hold/resume reload");
    if (item.taqResponses?.["taq-emergency"] !== false || item.taqResponses?.["taq-urgent"] !== true) throw new Error("TAQ merge did not survive hold/resume reload");
    if (item.clinicalApproval?.terminalQuestionId !== "taq-urgent") throw new Error("Approval lineage did not survive hold/resume reload");

    await call(jar, "PR007-012", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], {
      vitals: { heartRate: 88, respiratoryRate: 18, spo2: 98, temperature: 37.2, consciousLevel: "alert" },
      matchedProtocolId: "sample-abdominal-pain-male",
      calculatedSeverity: "URGENT",
      dispositionCode: "HMC_URGENT_REVIEW",
      destinationName: "Hamad Medical Corporation urgent review"
    });
    await call(jar, "PR007-013", "POST", `/api/v1/queue/${queueItemId}/move`, [200], { toStage: "DISPOSITION", toStatus: "IN_PROCESS", reason: "PR-007 assessment completed" });
    await call(jar, "PR007-014", "PATCH", `/api/v1/queue/${queueItemId}/context`, [200], {
      initialAssessmentResponses: { "iaq-duration": "two hours" },
      taqResponses: { "taq-urgent": true },
      clinicalApproval: { approvedAtIso: new Date().toISOString(), approvedBy: "SOC2 Synthetic Monitor" }
    });
    await call(jar, "PR007-015", "PATCH", `/api/v1/queue/${queueItemId}/context`, [409], { taqResponses: { "taq-late-change": false } });

    const locked = await call(jar, "PR007-016", "GET", `/api/v1/queue/${queueItemId}`, [200]);
    if ("taq-late-change" in (locked.item?.taqResponses ?? {})) throw new Error("Rejected late answer was persisted");
    if (locked.item?.initialAssessmentResponses?.["iaq-location"] !== "lower abdomen") throw new Error("Earlier IAQ was lost after disposition");
    await call(jar, "PR007-017", "POST", `/api/v1/queue/${queueItemId}/release`, [200]);
  } finally {
    if (queueItemId) await call(jar, "CLEAN-001", "POST", `/api/v1/queue/${queueItemId}/release`, [200, 409]);
  }

  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const output = { control: "PR-007", target: API_BASE, executedAt: new Date().toISOString(), queueItemId, evidence, passed: evidence.every((item) => item.pass) };
  await mkdir("test-results", { recursive: true });
  const path = `test-results/pr007-soc2-live-uat-${stamp}.json`;
  await writeFile(path, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Evidence: ${path}`);
}

main().catch((error) => { console.error("PR-007 SOC2 UAT failed:", error instanceof Error ? error.message : error); process.exitCode = 1; });
