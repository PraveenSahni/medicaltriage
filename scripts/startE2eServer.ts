import { createServer } from "node:http";

function readPort(): number {
  const portArgument = process.argv.find((argument) => argument.startsWith("--port="));
  const port = Number(portArgument?.split("=")[1] ?? process.env.PORT ?? "18080");
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
    throw new Error(`Invalid E2E server port: ${String(port)}`);
  }
  return port;
}

process.env.MOCK_MODE ??= "true";
process.env.APP_ENVIRONMENT ??= "simulation";
process.env.APP_DATA_PROFILE ??= "synthetic-e2e";
process.env.CALL_CENTER_GATEWAY_ENABLED ??= "true";
process.env.CALL_CENTER_PROVIDER ??= "dry-run";
// Cap this server's Prisma connection-pool size. DATABASE_URL here is a
// Cloud SQL Auth Proxy tunnel (127.0.0.1:5433) to a **shared production
// Cloud SQL instance** with only 25 max_connections total, already serving
// the live demo/soc2 Cloud Run environments and a DR replica - Prisma's
// default pool size (num_cpus*2+1) alone was enough to exhaust the handful
// of connections actually free (a real failure hit while first adding
// per-browser servers, before consolidating to the single shared server
// this file now backs - see playwright.config.ts). Capping the pool keeps
// this e2e run from starving those real, concurrently-running environments.
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("connection_limit")) {
  const separator = process.env.DATABASE_URL.includes("?") ? "&" : "?";
  process.env.DATABASE_URL = `${process.env.DATABASE_URL}${separator}connection_limit=3`;
}

// `../src/app.js` (transitively `clinicalContent.ts`/`db.ts`) reads
// DATABASE_URL/CLINICAL_CONTENT_SOURCE at module-evaluation time - a static
// top-level import would be hoisted and run before the assignments above,
// silently undoing this override. A dynamic import defers evaluation until
// this line actually executes.
const { createApp } = await import("../src/app.js");

const port = readPort();
const server = createServer(createApp());

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`IST Health E2E server listening on http://127.0.0.1:${port}\n`);
});

function shutdown(signal: string): void {
  process.stdout.write(`Stopping IST Health E2E server after ${signal}\n`);
  server.close((error) => {
    process.exit(error ? 1 : 0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
