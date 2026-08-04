import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

// Closes NFR-002 (API Discovery) - proves the real, self-hosted discovery
// page and raw spec endpoint both work, unauthenticated (a developer
// reference, same access level as /help).
describe("API discovery portal", () => {
  it("renders a real HTML page listing real endpoints from openapi.json", async () => {
    const response = await request(app).get("/api-docs").expect(200);
    expect(response.type).toBe("text/html");
    expect(response.text).toContain("/api/v1/auth/session");
    expect(response.text).toContain("openapi.json");
  });

  it("serves the raw OpenAPI spec as JSON", async () => {
    const response = await request(app).get("/api-docs/openapi.json").expect(200);
    expect(response.body.openapi).toEqual(expect.any(String));
    expect(response.body.paths["/api/v1/auth/session"]).toBeDefined();
  });
});
