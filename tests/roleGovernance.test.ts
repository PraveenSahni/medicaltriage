import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { confirmMfaEnrollment, enrollMfa, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
const app = createApp();

async function login(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

async function elevate(agent: request.Agent) {
  const secret = enrollMfa("usr_platform_admin_10001").secret;
  confirmMfaEnrollment("usr_platform_admin_10001", authenticator.generate(secret));
  await agent.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
}

const validCustomRole = {
  code: "reporting_specialist",
  name: "Reporting Specialist",
  description: "Views approved operational reports.",
  permissions: ["reports.view"],
  responsibilities: ["view_operational_reports"],
  reason: "Approved reporting requirement"
};

describe("PR-004/PR-005 governed role catalog", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("exposes exactly three protected system roles", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    const response = await admin.get("/api/v1/admin/roles").expect(200);
    const systemRoles = response.body.roles.filter((role: { system: boolean }) => role.system);
    expect(systemRoles.map((role: { code: string }) => role.code).sort()).toEqual([
      "platform_super_administrator",
      "remote_triage_nurse",
      "triage_service_manager"
    ]);
  });

  it("lets an elevated platform administrator create a governed custom role", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    const created = await admin.post("/api/v1/admin/roles").send(validCustomRole).expect(201);
    expect(created.body.role).toMatchObject({ code: "reporting_specialist", system: false });
    const listed = await admin.get("/api/v1/admin/roles").expect(200);
    expect(listed.body.roles.some((role: { code: string }) => role.code === "reporting_specialist")).toBe(true);
  });

  it("makes a newly created custom role available for named-user assignment", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    await admin.post("/api/v1/admin/roles").send(validCustomRole).expect(201);
    const createdUser = await admin.post("/api/v1/admin/users").send({
      fullName: "Reporting User",
      email: "reporting.user@irisstar.tech",
      mobile: "+97455550001",
      organization: "IST Tech",
      facility: "HQ",
      department: "Reporting",
      jobTitle: "Reporting Specialist",
      roles: ["reporting_specialist"],
      reason: "Approved reporting requirement"
    }).expect(201);
    expect(createdUser.body.user.roles).toEqual(["reporting_specialist"]);
  });

  it("rejects a duplicate or protected role code", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    await admin.post("/api/v1/admin/roles").send({ ...validCustomRole, code: "remote_triage_nurse" }).expect(409);
  });

  it("rejects request-and-approve permission combinations", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    const response = await admin.post("/api/v1/admin/roles").send({
      ...validCustomRole,
      code: "unsafe_reveal_role",
      permissions: ["privacy.reveal.request", "privacy.reveal.approve"]
    }).expect(409);
    expect(response.body.conflicts.join(" ")).toMatch(/privacy\.reveal\.request/);
  });

  it("rejects responsibilities whose prerequisites are absent", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    const response = await admin.post("/api/v1/admin/roles").send({
      ...validCustomRole,
      code: "unsafe_triage_role",
      responsibilities: ["conduct_nurse_triage"]
    }).expect(409);
    expect(response.body.conflicts.join(" ")).toMatch(/verify_employee_id/);
  });

  it("prevents a nurse from creating roles", async () => {
    const nurse = await login("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.post("/api/v1/admin/roles").send(validCustomRole).expect(403);
  });

  it("blocks adding approval authority to the requester system role", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send({
      permissionCode: "privacy.reveal.approve",
      reason: "negative segregation test"
    }).expect(409);
  });

  it("blocks assigning conflicting requester and approver roles to one new user", async () => {
    const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(admin);
    await admin.post("/api/v1/admin/users").send({
      fullName: "Conflict Test",
      email: "conflict.test@irisstar.tech",
      mobile: "+97455550000",
      organization: "IST Tech",
      facility: "Test",
      department: "Test",
      jobTitle: "Test",
      roles: ["remote_triage_nurse", "triage_service_manager"],
      reason: "negative segregation test"
    }).expect(409);
  });
});
