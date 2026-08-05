const rolePermissionCreateMock = jest.fn();
const rolePermissionFindManyMock = jest.fn();
const revealRequestUpsertMock = jest.fn();
const revealRequestFindUniqueMock = jest.fn();
const revealApprovalCreateMock = jest.fn();
const userSessionUpdateManyMock = jest.fn();

jest.mock("../src/db.js", () => ({
  prisma: {
    rolePermission: {
      create: (...args: unknown[]) => rolePermissionCreateMock(...args),
      findMany: (...args: unknown[]) => rolePermissionFindManyMock(...args)
    },
    revealRequest: {
      upsert: (...args: unknown[]) => revealRequestUpsertMock(...args),
      findUnique: (...args: unknown[]) => revealRequestFindUniqueMock(...args)
    },
    revealApproval: {
      create: (...args: unknown[]) => revealApprovalCreateMock(...args)
    },
    userSession: {
      updateMany: (...args: unknown[]) => userSessionUpdateManyMock(...args)
    }
  }
}));

import {
  getPersistedRolePermissionOverrides,
  getPersistedRevealRequest,
  persistRolePermissionOverride,
  persistRevealRequest,
  revokePersistedSessionsForUser
} from "../src/services/persistence.js";

// Closes the multi-instance authorization/functional gaps found in the
// dedicated persistence-gating sweep: role-permission overrides and reveal
// requests had no cross-instance read-fallback at all (worse than the
// earlier MFA gap, which at least best-effort persisted), and session
// revocation checked the wrong gating flag entirely.
describe("Persistence-gating sweep: role-permission, reveal workflow, session revocation", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    rolePermissionCreateMock.mockReset();
    rolePermissionFindManyMock.mockReset();
    revealRequestUpsertMock.mockReset();
    revealRequestFindUniqueMock.mockReset();
    revealApprovalCreateMock.mockReset();
    userSessionUpdateManyMock.mockReset();
    rolePermissionCreateMock.mockResolvedValue({ id: "rp_1" });
    revealRequestUpsertMock.mockResolvedValue({ id: "rr_1" });
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe("Role-permission overrides", () => {
    it("does not write or read when ROLE_PERMISSION_DB_PERSISTENCE is unset, even under MOCK_MODE=false", async () => {
      process.env.MOCK_MODE = "false";
      delete process.env.ROLE_PERMISSION_DB_PERSISTENCE;

      const writeResult = await persistRolePermissionOverride({
        roleCode: "remote_triage_nurse",
        permissionCode: "reports.view",
        action: "GRANT",
        grantedBy: "usr_admin",
        reason: "test"
      });
      expect(writeResult.persisted).toBe(false);
      expect(rolePermissionCreateMock).not.toHaveBeenCalled();

      const readResult = await getPersistedRolePermissionOverrides("remote_triage_nurse");
      expect(readResult).toEqual([]);
      expect(rolePermissionFindManyMock).not.toHaveBeenCalled();
    });

    it("writes and reads real rows when ROLE_PERMISSION_DB_PERSISTENCE=true, even under MOCK_MODE=true (the exact soc2 bug)", async () => {
      process.env.MOCK_MODE = "true";
      process.env.ROLE_PERMISSION_DB_PERSISTENCE = "true";
      rolePermissionFindManyMock.mockResolvedValue([
        {
          roleCode: "remote_triage_nurse",
          permissionCode: "reports.view",
          action: "GRANT",
          createdAt: new Date("2026-08-05T00:00:00.000Z")
        }
      ]);

      const writeResult = await persistRolePermissionOverride({
        roleCode: "remote_triage_nurse",
        permissionCode: "reports.view",
        action: "GRANT",
        grantedBy: "usr_admin",
        reason: "test"
      });
      expect(writeResult.persisted).toBe(true);

      const readResult = await getPersistedRolePermissionOverrides("remote_triage_nurse");
      expect(readResult).toHaveLength(1);
      expect(readResult[0].permissionCode).toBe("reports.view");
      expect(readResult[0].action).toBe("GRANT");

      const queryArgs = rolePermissionFindManyMock.mock.calls[0][0];
      expect(queryArgs.where.status).toBe("active");
    });
  });

  describe("Reveal workflow", () => {
    it("does not write or read when REVEAL_WORKFLOW_DB_PERSISTENCE is unset", async () => {
      delete process.env.REVEAL_WORKFLOW_DB_PERSISTENCE;

      const writeResult = await persistRevealRequest({
        id: "rr_1",
        requesterUserId: "usr_nurse",
        resourceType: "AdminUser",
        resourceId: "usr_nurse",
        fieldName: "email",
        purpose: "verification",
        status: "pending"
      });
      expect(writeResult.persisted).toBe(false);
      expect(revealRequestUpsertMock).not.toHaveBeenCalled();

      const readResult = await getPersistedRevealRequest("rr_1");
      expect(readResult).toBeUndefined();
      expect(revealRequestFindUniqueMock).not.toHaveBeenCalled();
    });

    it("writes and reads real rows when REVEAL_WORKFLOW_DB_PERSISTENCE=true - proves cross-instance visibility of a request created elsewhere", async () => {
      process.env.REVEAL_WORKFLOW_DB_PERSISTENCE = "true";
      revealRequestFindUniqueMock.mockResolvedValue({
        id: "rr_1",
        requesterUserId: "usr_nurse",
        resourceType: "AdminUser",
        resourceId: "usr_nurse",
        fieldName: "email",
        purpose: "verification",
        status: "pending",
        expiresAt: null
      });

      const readResult = await getPersistedRevealRequest("rr_1");
      expect(readResult).toBeDefined();
      expect(readResult?.requesterUserId).toBe("usr_nurse");
      expect(readResult?.status).toBe("pending");
    });
  });

  describe("Session revocation gate", () => {
    it("uses the dedicated session-persistence flag, not the generic MOCK_MODE gate", async () => {
      process.env.MOCK_MODE = "true";
      delete process.env.SESSION_DB_PERSISTENCE;

      await revokePersistedSessionsForUser("usr_nurse");
      expect(userSessionUpdateManyMock).not.toHaveBeenCalled();

      process.env.SESSION_DB_PERSISTENCE = "true";
      await revokePersistedSessionsForUser("usr_nurse");
      expect(userSessionUpdateManyMock).toHaveBeenCalledTimes(1);
    });
  });
});
