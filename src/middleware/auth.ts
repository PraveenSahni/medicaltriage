import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedSession } from "../types/security.js";
import { getSessionFromStore, parseSessionCookie } from "../services/securityAdmin.js";

const JWT_TTL_SECONDS = 30 * 60;

export type AuthenticatedRequest = Request & {
  securitySession?: AuthenticatedSession;
};

function jwtSecret(): string {
  return process.env.AUTH_JWT_SECRET ?? "mock-dev-only-ist-triage-jwt-secret";
}

function encodePart(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", jwtSecret()).update(data).digest("base64url");
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function decodePart<T>(part: string): T | undefined {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as T;
  } catch {
    return undefined;
  }
}

export function signSessionJwt(session: AuthenticatedSession): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodePart({ alg: "HS256", typ: "JWT" });
  const payload = encodePart({
    sub: session.user.id,
    sid: session.sessionId,
    role: session.activeRole,
    iat: now,
    exp: now + JWT_TTL_SECONDS
  });
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

// Shared by both the Authorization header path (sessionFromBearerToken) and
// the query-string path (sessionFromTokenString, used by the standalone
// /help page - see its comment for why a plain top-level navigation can
// carry a token here but not as a header).
export async function sessionFromTokenString(token: string | undefined): Promise<AuthenticatedSession | undefined> {
  if (!token) {
    return undefined;
  }

  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) {
    return undefined;
  }

  const expectedSignature = sign(`${header}.${payload}`);
  if (!safeEquals(signature, expectedSignature)) {
    return undefined;
  }

  const decoded = decodePart<{ sid?: string; exp?: number }>(payload);
  if (!decoded?.sid || typeof decoded.exp !== "number" || decoded.exp <= Math.floor(Date.now() / 1000)) {
    return undefined;
  }

  return getSessionFromStore(decoded.sid);
}

async function sessionFromBearerToken(req: Request): Promise<AuthenticatedSession | undefined> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }
  return sessionFromTokenString(authorization.slice("Bearer ".length).trim());
}

export async function readAuthenticatedSession(req: Request): Promise<AuthenticatedSession | undefined> {
  return (await getSessionFromStore(parseSessionCookie(req.headers))) ?? (await sessionFromBearerToken(req));
}

export async function requireAuthenticatedSession(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await readAuthenticatedSession(req);
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.securitySession = session;
    return next();
  } catch (error) {
    return next(error);
  }
}
