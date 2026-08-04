import type { NextFunction, Request, Response } from "express";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}

export function rateLimit(args: {
  name: string;
  windowMs: number;
  maxRequests: number;
  // Closes NFR-004 (Throttling by product/consumer) - an optional per-tier
  // override on top of the default maxRequests. `tierResolver` reads
  // whatever already identifies the caller (e.g. the authenticated
  // session's role) and returns a tier name; `tierMaxRequests` maps that
  // name to its own request budget. A request whose tier isn't in the map
  // (or that has no resolver) falls back to the flat `maxRequests` - no
  // change for any existing call site that doesn't opt in.
  tierResolver?: (req: Request) => string | undefined;
  tierMaxRequests?: Record<string, number>;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const tier = args.tierResolver?.(req);
    const effectiveMax = (tier ? args.tierMaxRequests?.[tier] : undefined) ?? args.maxRequests;
    const key = `${args.name}:${tier ?? "default"}:${req.ip ?? "unknown"}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + args.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > effectiveMax) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfterSeconds
      });
    }

    return next();
  };
}
