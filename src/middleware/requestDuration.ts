import type { NextFunction, Request, Response } from "express";

// The two endpoints docs/sli-slo-definitions.md names explicitly as the
// Latency SLI's target ("critical clinical-workflow endpoints (queue claim,
// triage complete)") - tagged so a log-based metric can filter to just these
// two instead of only ever seeing a site-wide p95.
const CRITICAL_ENDPOINT_PATTERNS: Array<{ label: string; test: (req: Request) => boolean }> = [
  { label: "queue_claim", test: (req) => req.method === "POST" && /^\/api\/v1\/queue\/[^/]+\/claim$/.test(req.path) },
  { label: "triage_complete", test: (req) => req.method === "POST" && req.path === "/api/v1/triage/complete" }
];

function criticalEndpointLabel(req: Request): string | undefined {
  return CRITICAL_ENDPOINT_PATTERNS.find((pattern) => pattern.test(req))?.label;
}

// Structured request-duration logging - closes the "Latency SLI is not
// measured" gap in docs/sli-slo-definitions.md. Emits one JSON line per
// request to stdout, which Cloud Run already ships to Cloud Logging without
// any additional wiring - this is the minimum real instrumentation needed
// before a p95/p99 latency metric/alert can be built on top of it (log-based
// metrics or a structured-log sink), not the dashboard/alert itself.
export function requestDurationLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    const criticalEndpoint = criticalEndpointLabel(req);
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      console.log(
        JSON.stringify({
          type: "request_duration",
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100,
          ...(criticalEndpoint ? { criticalEndpoint } : {})
        })
      );
    });
    next();
  };
}
