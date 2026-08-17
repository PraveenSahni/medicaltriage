import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { confirmMfaEnrollment, enrollMfa, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "Pr014BoundaryOnly!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();
const adminId = "usr_platform_admin_10001";

const validUser = (suffix = "base") => ({
  fullName: "PR-014 Boundary User",
  email: `pr014.${suffix}@irisstar.tech`,
  mobile: "+97455550140",
  organization: "IST Tech",
  facility: "QA",
  department: "Security UAT",
  jobTitle: "Boundary Tester",
  roles: ["remote_triage_nurse"],
  reason: "PR-014 automated boundary validation"
});

async function login(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

async function elevatedAdmin() {
  const agent = await login("rishma@irisstar.tech", "platform_super_administrator");
  const { secret } = enrollMfa(adminId);
  confirmMfaEnrollment(adminId, authenticator.generate(secret));
  await agent.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
  return agent;
}

describe("PR-014 live-admin contract boundaries", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  describe("POST /api/v1/admin/users authorization and elevation", () => {
    it("returns 401 without authentication", async () => {
      await request(app).post("/api/v1/admin/users").send(validUser("anonymous")).expect(401);
    });

    it.each([
      ["layla@irisstar.tech", "remote_triage_nurse"],
      ["khalid@irisstar.tech", "triage_service_manager"]
    ])("returns 403 for non-admin role %s", async (username, role) => {
      const agent = await login(username, role);
      await agent.post("/api/v1/admin/users").send(validUser(role)).expect(403);
    });

    it("returns 403 when the platform administrator has not elevated", async () => {
      const agent = await login("rishma@irisstar.tech", "platform_super_administrator");
      await agent.post("/api/v1/admin/users").send(validUser("not-elevated")).expect(403);
    });
  });

  describe("POST /api/v1/admin/users field boundaries", () => {
    const fields: Array<keyof ReturnType<typeof validUser>> = [
      "fullName", "mobile", "organization", "facility", "department", "jobTitle", "reason"
    ];

    it.each(fields)("accepts the minimum one-character %s", async (field) => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser(`min-${field}`), [field]: "x" }).expect(201);
    });

    it.each(fields)("rejects an empty %s", async (field) => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser(`empty-${field}`), [field]: "" }).expect(400);
    });

    it.each(["fullName", "organization", "facility", "department", "jobTitle"] as const)(
      "accepts the maximum 200-character %s",
      async (field) => {
        const admin = await elevatedAdmin();
        await admin.post("/api/v1/admin/users").send({ ...validUser(`max-${field}`), [field]: "x".repeat(200) }).expect(201);
      }
    );

    it.each(["fullName", "organization", "facility", "department", "jobTitle"] as const)(
      "rejects a 201-character %s",
      async (field) => {
        const admin = await elevatedAdmin();
        await admin.post("/api/v1/admin/users").send({ ...validUser(`over-${field}`), [field]: "x".repeat(201) }).expect(400);
      }
    );

    it("accepts mobile length 40 and rejects length 41", async () => {
      let admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser("mobile40"), mobile: "1".repeat(40) }).expect(201);
      resetSecurityStoreForTests(); resetRateLimitBucketsForTests();
      admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser("mobile41"), mobile: "1".repeat(41) }).expect(400);
    });

    it("accepts reason length 500 and rejects length 501", async () => {
      let admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser("reason500"), reason: "x".repeat(500) }).expect(201);
      resetSecurityStoreForTests(); resetRateLimitBucketsForTests();
      admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser("reason501"), reason: "x".repeat(501) }).expect(400);
    });

    it.each(["not-an-email", "user@example.com", "user@irisstar.tech.example"])("rejects invalid/out-of-domain email %s", async (email) => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser("bad-email"), email }).expect(400);
    });

    it("normalizes a valid mixed-case domain email", async () => {
      const admin = await elevatedAdmin();
      const response = await admin.post("/api/v1/admin/users").send({ ...validUser("mixed"), email: "PR014.Mixed@IRISSTAR.TECH" }).expect(201);
      expect(response.body.user.email).toMatch(/^p\*+@irisstar\.tech$/);
      await request(app).post("/api/v1/auth/login").send({
        username: "pr014.mixed@irisstar.tech",
        password: response.body.temporaryPassword,
        simulateRole: "remote_triage_nurse"
      }).expect(200);
    });

    it("rejects missing, empty, and more-than-ten role arrays", async () => {
      const variants = [undefined, [], Array.from({ length: 11 }, () => "remote_triage_nurse")];
      for (let index = 0; index < variants.length; index += 1) {
        resetSecurityStoreForTests(); resetRateLimitBucketsForTests();
        const admin = await elevatedAdmin();
        const body: Record<string, unknown> = validUser(`roles-${index}`);
        if (variants[index] === undefined) delete body.roles;
        else body.roles = variants[index];
        await admin.post("/api/v1/admin/users").send(body).expect(400);
      }
    });

    it.each(["remote_triage_nurse", "triage_service_manager", "platform_super_administrator"])(
      "creates a user with protected system role %s",
      async (role) => {
        const admin = await elevatedAdmin();
        const response = await admin.post("/api/v1/admin/users").send({ ...validUser(`role-${role}`), roles: [role] }).expect(201);
        expect(response.body.user.roles).toEqual([role]);
        expect(response.body.temporaryPassword).toEqual(expect.any(String));
      }
    );

    it("rejects an unknown role", async () => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({ ...validUser("unknown-role"), roles: ["not_a_role"] }).expect(400);
    });

    it("rejects a conflicting multi-role assignment", async () => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send({
        ...validUser("conflict"), roles: ["remote_triage_nurse", "triage_service_manager"]
      }).expect(409);
    });

    it("deduplicates repeated role codes", async () => {
      const admin = await elevatedAdmin();
      const response = await admin.post("/api/v1/admin/users").send({
        ...validUser("duplicate-role"), roles: ["remote_triage_nurse", "remote_triage_nurse"]
      }).expect(201);
      expect(response.body.user.roles).toEqual(["remote_triage_nurse"]);
    });

    it("rejects a duplicate email case-insensitively", async () => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send(validUser("duplicate")).expect(201);
      await admin.post("/api/v1/admin/users").send({ ...validUser("duplicate-2"), email: "PR014.DUPLICATE@IRISSTAR.TECH" }).expect(409);
    });

    it("does not expose the temporary password in the user-list response", async () => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/users").send(validUser("password-mask")).expect(201);
      const listed = await admin.get("/api/v1/admin/users").expect(200);
      expect(JSON.stringify(listed.body)).not.toContain("temporaryPassword");
    });
  });

  describe("POST /api/v1/admin/roles/:code/permissions boundaries", () => {
    const grant = { permissionCode: "reports.view", reason: "PR-014 permission boundary test" };

    it("returns 401 without authentication", async () => {
      await request(app).post("/api/v1/admin/roles/remote_triage_nurse/permissions").send(grant).expect(401);
    });

    it.each([
      ["layla@irisstar.tech", "remote_triage_nurse"],
      ["khalid@irisstar.tech", "triage_service_manager"]
    ])("returns 403 for non-admin role %s", async (username, role) => {
      const agent = await login(username, role);
      await agent.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send(grant).expect(403);
    });

    it("returns 403 for an admin without elevation", async () => {
      const admin = await login("rishma@irisstar.tech", "platform_super_administrator");
      await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send(grant).expect(403);
    });

    it("accepts reason lengths 1 and 500", async () => {
      for (const length of [1, 500]) {
        resetSecurityStoreForTests(); resetRateLimitBucketsForTests();
        const admin = await elevatedAdmin();
        await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions")
          .send({ ...grant, reason: "x".repeat(length) }).expect(200);
      }
    });

    it.each([0, 501])("rejects reason length %i", async (length) => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions")
        .send({ ...grant, reason: "x".repeat(length) }).expect(400);
    });

    it("rejects missing and empty permission codes", async () => {
      for (const permissionCode of [undefined, ""]) {
        resetSecurityStoreForTests(); resetRateLimitBucketsForTests();
        const admin = await elevatedAdmin();
        await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions")
          .send({ permissionCode, reason: "test" }).expect(400);
      }
    });

    it("returns 404 for unknown roles and permissions", async () => {
      let admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/roles/not_a_role/permissions").send(grant).expect(404);
      resetSecurityStoreForTests(); resetRateLimitBucketsForTests();
      admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions")
        .send({ permissionCode: "not.a.permission", reason: "test" }).expect(404);
    });

    it("is idempotent when the same permission is granted twice", async () => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send(grant).expect(200);
      const second = await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send(grant).expect(200);
      expect(second.body.role.permissions.filter((value: string) => value === "reports.view")).toHaveLength(1);
    });

    it("blocks a segregation-of-duties conflict", async () => {
      const admin = await elevatedAdmin();
      const response = await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send({
        permissionCode: "privacy.reveal.approve", reason: "PR-014 negative SoD test"
      }).expect(409);
      expect(response.body.conflicts).toEqual(expect.any(Array));
    });

    it("applies the permission immediately and returns no-store role data", async () => {
      const admin = await elevatedAdmin();
      await admin.post("/api/v1/admin/roles/remote_triage_nurse/permissions").send(grant).expect(200);
      const roles = await admin.get("/api/v1/admin/roles").expect(200);
      expect(roles.headers["cache-control"]).toContain("no-store");
      expect(roles.body.roles.find((role: { code: string }) => role.code === "remote_triage_nurse").permissions).toContain("reports.view");
    });

    it("rate-limits the 21st mutation in one minute", async () => {
      const admin = await elevatedAdmin();
      for (let index = 0; index < 20; index += 1) {
        await admin.post("/api/v1/admin/roles/not_a_role/permissions").send(grant).expect(404);
      }
      const limited = await admin.post("/api/v1/admin/roles/not_a_role/permissions").send(grant).expect(429);
      expect(limited.headers["retry-after"]).toBeDefined();
    });
  });
});
