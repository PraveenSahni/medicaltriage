import { createServer } from "node:http";
import { createApp } from "../src/app.js";

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
