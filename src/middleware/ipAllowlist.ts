import type { NextFunction, Request, Response } from "express";

// Optional IP allowlisting (NFR-027: "restrict access outside QR network to
// provided IP range only"). Off by default - only enforced when
// IP_ALLOWLIST is configured, so it never breaks an existing deployment
// that hasn't opted in. Supports exact IPv4 addresses and IPv4 CIDR ranges
// (e.g. "10.0.0.0/8"); IPv6 entries are matched by exact string only (no
// CIDR parsing) since none of this app's current deployments use IPv6.

type Ipv4Range = { network: number; mask: number };

function ipv4ToInt(ip: string): number | undefined {
  const parts = ip.split(".");
  if (parts.length !== 4) {
    return undefined;
  }
  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return undefined;
    }
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

function parseEntry(entry: string): Ipv4Range | string | undefined {
  const trimmed = entry.trim();
  if (!trimmed) {
    return undefined;
  }
  const [address, prefixRaw] = trimmed.split("/");
  const addressInt = ipv4ToInt(address);
  if (addressInt === undefined) {
    // Not IPv4 (e.g. an IPv6 literal) - fall back to exact string match.
    return trimmed;
  }
  const prefix = prefixRaw !== undefined ? Number(prefixRaw) : 32;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return undefined;
  }
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return { network: addressInt & mask, mask };
}

export function parseAllowlist(raw: string | undefined): Array<Ipv4Range | string> {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map(parseEntry)
    .filter((entry): entry is Ipv4Range | string => entry !== undefined);
}

function matches(ip: string, entries: Array<Ipv4Range | string>): boolean {
  const normalizedIp = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const ipInt = ipv4ToInt(normalizedIp);
  return entries.some((entry) => {
    if (typeof entry === "string") {
      return entry === normalizedIp;
    }
    return ipInt !== undefined && (ipInt & entry.mask) === entry.network;
  });
}

export function ipAllowlist(rawAllowlist: string | undefined) {
  const entries = parseAllowlist(rawAllowlist);
  return (req: Request, res: Response, next: NextFunction) => {
    if (entries.length === 0) {
      return next();
    }
    const clientIp = req.ip ?? "";
    if (matches(clientIp, entries)) {
      return next();
    }
    return res.status(403).json({ error: "Access from this network is not permitted." });
  };
}
