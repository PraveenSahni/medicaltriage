import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

// Closes the "no request-id propagation across service boundaries" gap
// (NFR-116/117/150) - proves a real correlation id is generated, returned to
// the caller, threaded into the structured duration log, and - critically -
// an already-present incoming X-Request-Id is propagated rather than
// overwritten (cross-service correlation, not just a local id).
describe("Request-ID correlation middleware", () => {
  it("generates a real request id and returns it on the response", async () => {
    const response = await request(app).get("/healthz").expect(200);
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
    expect(response.headers["x-request-id"].length).toBeGreaterThan(0);
  });

  it("propagates an incoming X-Request-Id instead of overwriting it", async () => {
    const response = await request(app).get("/healthz").set("X-Request-Id", "test-fixed-id-123").expect(200);
    expect(response.headers["x-request-id"]).toBe("test-fixed-id-123");
  });

  it("assigns a different id to each request with no incoming header", async () => {
    const first = await request(app).get("/healthz").expect(200);
    const second = await request(app).get("/healthz").expect(200);
    expect(first.headers["x-request-id"]).not.toBe(second.headers["x-request-id"]);
  });

  it("threads the request id into the structured request-duration log", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      const response = await request(app).get("/healthz").set("X-Request-Id", "log-thread-check").expect(200);
      const durationLogCall = logSpy.mock.calls.find((call) => {
        try {
          return JSON.parse(call[0] as string).type === "request_duration";
        } catch {
          return false;
        }
      });
      expect(durationLogCall).toBeDefined();
      const parsed = JSON.parse(durationLogCall![0] as string);
      expect(parsed.requestId).toBe(response.headers["x-request-id"]);
    } finally {
      logSpy.mockRestore();
    }
  });
});
