import request from "supertest";
import express from "express";
import { ipAllowlist } from "../src/middleware/ipAllowlist.js";

function appWithAllowlist(raw: string | undefined) {
  const app = express();
  app.set("trust proxy", true);
  app.use(ipAllowlist(raw));
  app.get("/ping", (_req, res) => res.json({ ok: true }));
  return app;
}

describe("ipAllowlist middleware", () => {
  it("is a no-op (allows everything) when unconfigured", async () => {
    const app = appWithAllowlist(undefined);
    await request(app).get("/ping").expect(200);
  });

  it("allows an exact IPv4 match", async () => {
    const app = appWithAllowlist("127.0.0.1");
    await request(app).get("/ping").expect(200);
  });

  it("rejects an IP outside the allowlist", async () => {
    const app = appWithAllowlist("10.0.0.0/8");
    const res = await request(app).get("/ping");
    expect(res.status).toBe(403);
  });

  it("allows an IP inside a configured CIDR range", async () => {
    // supertest connects from 127.0.0.1 - allow the whole loopback /8.
    const app = appWithAllowlist("127.0.0.0/8,10.0.0.0/8");
    await request(app).get("/ping").expect(200);
  });

  it("parseAllowlist ignores blank/malformed entries without throwing", async () => {
    const app = appWithAllowlist(" , 127.0.0.0/8 , not-an-ip/40 ");
    await request(app).get("/ping").expect(200);
  });
});
