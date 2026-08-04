import type { NextFunction, Request, Response } from "express";

// Structured request-duration logging - closes the "Latency SLI is not
// measured" gap in docs/sli-slo-definitions.md. Emits one JSON line per
// request to stdout, which Cloud Run already ships to Cloud Logging without
// any additional wiring - this is the minimum real instrumentation needed
// before a p95/p99 latency metric/alert can be built on top of it (log-based
// metrics or a structured-log sink), not the dashboard/alert itself.
export function requestDurationLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      console.log(
        JSON.stringify({
          type: "request_duration",
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs * 100) / 100
        })
      );
    });
    next();
  };
}
