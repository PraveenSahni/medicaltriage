import request from "supertest";
import { createApp } from "../src/app.js";
import { signSessionJwt } from "../src/middleware/auth.js";
import { authenticateLocal, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_PASSWORD = "ResponsibilitySeparation!2026";
process.env.ADMIN_PASSWORD = TEST_PASSWORD;

const app = createApp();

async function tokenFor(username: string) {
  const result = await authenticateLocal({
    username,
    password: TEST_PASSWORD,
    rememberMe: false,
    ipAddress: "responsibility-separation-test",
    device: "jest"
  });
  if (!result.ok || "mfaRequired" in result) throw new Error(`Unable to authenticate ${username}`);
  return `Bearer ${signSessionJwt(result.session)}`;
}

describe("Triage responsibility separation", () => {
  beforeEach(() => resetSecurityStoreForTests());
  afterAll(() => resetSecurityStoreForTests());

  it("denies a Service Manager access to nurse triage calculations", async () => {
    const response = await request(app)
      .post("/api/v1/triage/calculate-score")
      .set("Authorization", await tokenFor("khalid@irisstar.tech"))
      .send({});

    expect(response.status).toBe(403);
  });

  it("denies a Service Manager access to nurse queue context mutations", async () => {
    const response = await request(app)
      .patch("/api/v1/queue/nonexistent/context")
      .set("Authorization", await tokenFor("khalid@irisstar.tech"))
      .send({ reasonNarrative: "Attempted manager edit" });

    expect(response.status).toBe(403);
  });

  it("allows a Triage Nurse through the clinical permission gate", async () => {
    const response = await request(app)
      .post("/api/v1/triage/calculate-score")
      .set("Authorization", await tokenFor("layla@irisstar.tech"))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid triage vital-sign payload");
  });
});
