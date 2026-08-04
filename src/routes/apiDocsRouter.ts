import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Router } from "express";

// Closes NFR-002 (API Management: API Discovery) - a real, self-hosted
// discovery portal reading the existing, real, machine-generated
// docs/openapi.json (scripts/generateOpenApiSpec.ts) - no new npm
// dependency, no external CDN. Renders a clean, human-browsable endpoint
// list (grouped by path, one row per method/summary) and also serves the
// raw spec for tooling (Postman, other OpenAPI-aware clients) to import.
const OPENAPI_SPEC_PATH = path.resolve(process.cwd(), "docs", "openapi.json");

type OpenApiOperation = { summary?: string; description?: string; tags?: string[] };
type OpenApiSpec = {
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, Record<string, OpenApiOperation>>;
};

function loadSpec(): OpenApiSpec | undefined {
  if (!existsSync(OPENAPI_SPEC_PATH)) {
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(OPENAPI_SPEC_PATH, "utf8")) as OpenApiSpec;
  } catch {
    return undefined;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderDiscoveryHtml(spec: OpenApiSpec): string {
  const paths = spec.paths ?? {};
  const rows = Object.entries(paths)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([routePath, operations]) =>
      Object.entries(operations).map(
        ([method, operation]) =>
          `<tr><td class="method method-${escapeHtml(method)}">${escapeHtml(method.toUpperCase())}</td>` +
          `<td class="path"><code>${escapeHtml(routePath)}</code></td>` +
          `<td class="summary">${escapeHtml(operation.summary ?? operation.description ?? "")}</td></tr>`
      )
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(spec.info?.title ?? "API Discovery")}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f7f6f3; color: #1f1e1c; }
  h1 { margin: 0 0 4px; font-size: 1.4rem; }
  .version { color: #6b6a66; font-size: 0.85rem; margin-bottom: 16px; }
  .description { max-width: 760px; color: #4a4945; margin-bottom: 24px; font-size: 0.9rem; }
  table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #e0dfd9; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eceae4; font-size: 0.85rem; vertical-align: top; }
  th { background: #f1efe9; }
  .method { font-weight: 700; white-space: nowrap; }
  .method-get { color: #1e7a3d; }
  .method-post { color: #b06a00; }
  .method-patch { color: #7a4de0; }
  .method-delete { color: #c0392b; }
  code { font-size: 0.85em; }
  .spec-link { font-size: 0.85rem; margin-bottom: 20px; display: inline-block; }
</style>
</head>
<body>
  <h1>${escapeHtml(spec.info?.title ?? "API Discovery")}</h1>
  <div class="version">Version ${escapeHtml(spec.info?.version ?? "unknown")}</div>
  <div class="description">${escapeHtml(spec.info?.description ?? "")}</div>
  <a class="spec-link" href="/api-docs/openapi.json">Download the raw OpenAPI 3.0 spec (openapi.json)</a>
  <table>
    <thead><tr><th>Method</th><th>Path</th><th>Summary</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
</body>
</html>`;
}

export function createApiDocsRouter(): Router {
  const router = Router();

  router.get("/api-docs", (_req, res) => {
    const spec = loadSpec();
    if (!spec) {
      return res
        .status(503)
        .type("html")
        .send("<!doctype html><title>API docs unavailable</title><body>docs/openapi.json has not been generated yet - run scripts/generateOpenApiSpec.ts.</body>");
    }
    return res.type("html").send(renderDiscoveryHtml(spec));
  });

  router.get("/api-docs/openapi.json", (_req, res) => {
    const spec = loadSpec();
    if (!spec) {
      return res.status(503).json({ error: "docs/openapi.json has not been generated yet" });
    }
    return res.json(spec);
  });

  return router;
}
