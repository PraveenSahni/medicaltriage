import { mkdir, writeFile } from "node:fs/promises";
import { authenticator } from "otplib";
import { stccLicensedContent } from "../data/stccLicensedContent/index.js";

const base = process.env.API_BASE?.replace(/\/$/, "");
const allowed = "https://pr010-restart---ist-triage-soc2-gv6v4zyvuq-ww.a.run.app";
const password = process.env.PR006_PASSWORD;
const mfaSecret = process.env.PR006_MFA_SECRET;
if (process.env.ALLOW_LIVE_PR006_VERIFY !== "SOC2") throw new Error("Set ALLOW_LIVE_PR006_VERIFY=SOC2");
if (base !== allowed) throw new Error(`Refusing non-SOC2 PR-006 target: ${base ?? "<empty>"}`);
if (!password || !mfaSecret) throw new Error("Missing governed SOC2 monitor credentials");

type Evidence = { id: string; expected: number; actual: number; passed: boolean; detail: string };
const evidence: Evidence[] = [];
let accessToken = "";

async function get(id: string, path: string, expected: number) {
  const response = await fetch(`${base}${path}`, { headers: { "x-pr-006-uat": "soc2-read-only", ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}) } });
  const body = await response.json().catch(() => ({})) as Record<string, any>;
  evidence.push({ id, expected, actual: response.status, passed: response.status === expected, detail: body.code ?? body.selectionMode ?? "" });
  return { response, body };
}

async function main() {
  const runtime = await get("RUNTIME", "/api/v1/runtime/environment", 200);
  if (runtime.body.provenance?.gitSha !== "74985a1b165326d3a7a330a2339b5e881ba49fa6") {
    throw new Error(`Unexpected deployed Git SHA: ${runtime.body.provenance?.gitSha ?? "missing"}`);
  }
  const login = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pr-006-uat": "soc2-read-only" },
    body: JSON.stringify({ username: "synthetic-monitor@irisstar.tech", password })
  });
  const challenge = await login.json() as { challengeId?: string };
  if (login.status !== 202 || !challenge.challengeId) throw new Error(`Login expected 202, received ${login.status}`);
  const verify = await fetch(`${base}/api/v1/auth/mfa/verify`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pr-006-uat": "soc2-read-only" },
    body: JSON.stringify({ challengeId: challenge.challengeId, code: authenticator.generate(mfaSecret!) })
  });
  const session = await verify.json() as { accessToken?: string };
  if (verify.status !== 200 || !session.accessToken) throw new Error(`MFA expected 200, received ${verify.status}`);
  accessToken = session.accessToken;
  const matrix = Array.from({ length: Math.max(...stccLicensedContent.protocols.map((protocol) => protocol.questions.length)) })
    .flatMap((_, index) => stccLicensedContent.protocols.flatMap((protocol) => protocol.questions[index] ? [{ protocol, question: protocol.questions[index] }] : []))
    .slice(0, 30);
  if (matrix.length !== 30 || new Set(matrix.map(({ protocol }) => protocol.id)).size !== 5) throw new Error("Matrix must contain 30 cases across exactly five protocols");

  for (const { protocol, question } of matrix) {
    const result = await get(`${protocol.id}/${question.id}`, `/api/v1/protocols/${encodeURIComponent(protocol.id)}/care-advice?positiveQuestionIds=${encodeURIComponent(question.id)}`, 200);
    const expectedIds = (protocol.careAdvice ?? []).filter((advice) => (question.careAdviceIds ?? []).includes(advice.id)).map((advice) => advice.id).sort();
    const actualIds = (result.body.careAdvice ?? []).map((advice: { id: string }) => advice.id).sort();
    if (result.response.status !== 200 || result.body.selectionMode !== "EXACT_QUESTION" || result.body.protocolId !== protocol.id || JSON.stringify(result.body.questionIds) !== JSON.stringify([question.id]) || JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
      throw new Error(`Lineage mismatch for ${protocol.id}/${question.id}`);
    }
  }

  const [first, second] = stccLicensedContent.protocols;
  await get("NEG-MISSING", `/api/v1/protocols/${encodeURIComponent(first.id)}/care-advice`, 422);
  await get("NEG-UNKNOWN", `/api/v1/protocols/${encodeURIComponent(first.id)}/care-advice?positiveQuestionIds=not-a-real-question`, 422);
  await get("NEG-CROSS", `/api/v1/protocols/${encodeURIComponent(first.id)}/care-advice?positiveQuestionIds=${encodeURIComponent(second.questions[0].id)}`, 422);
  const failed = evidence.filter((item) => !item.passed);
  if (failed.length) throw new Error(`HTTP failures: ${failed.map((item) => item.id).join(", ")}`);

  const result = { control: "PR-006", executedAt: new Date().toISOString(), target: base, gitSha: runtime.body.provenance.gitSha, protocolCount: 5, positiveCases: 30, negativeCases: 3, evidence, passed: true };
  await mkdir("test-results", { recursive: true });
  const path = `test-results/pr006-soc2-live-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}.json`;
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...result, evidence: undefined }));
  console.log(`Evidence: ${path}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
