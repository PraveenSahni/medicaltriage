import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type RequestWithId = Request & { requestId: string };

// Closes the "no request-id propagation across service boundaries" gap
// (NFR-116/117/150) - the minimum real correlation-id instrumentation needed
// before a single request can be traced end-to-end across this app's own
// logs (and, if an upstream/downstream service already sends its own
// X-Request-Id, threaded through rather than overwritten). This is
// correlation-id propagation, not a full distributed-tracing/APM view (no
// span model, no trace visualization) - that remains a separate, larger gap
// requiring a real APM/Cloud Trace integration, honestly out of scope here.
export function requestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.get("x-request-id");
    const requestId = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    (req as RequestWithId).requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  };
}
