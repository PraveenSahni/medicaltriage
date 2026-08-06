# Application-Level Intrusion Detection (CSQ AR.21)

_Written 2026-08-06. Status: **operational**._

## Literal requirement

> "Confirm whether file integrity (host) and network intrusion detection
> (IDS) tools implemented to help facilitate timely detection,
> investigation by root cause analysis and response to incidents?"

See `docs/architecture/serverless-integrity-control-mapping.md` for why
the host-FIM and network-IDS halves of this wording are defensibly
non-applicable to this serverless architecture, and why application-level
intrusion detection is the real, actionable equivalent control here.

## Architecture

A generic, shared, durable `SecurityAnomalyEvent` store (new Prisma model
+ migration, mirroring the existing reveal-anomaly counter pattern built
for CSQ IS.61) counts security-relevant events by `signalType` and
`scopeKey` (an opaque identifier, e.g. a userId - never a raw credential,
IP, or OTP) within a rolling window, combined across every Cloud Run
instance (not process-local).

### Signal types wired this batch

| Signal | Trigger | Call site |
|---|---|---|
| `AUTH_FAILURE` | Failed local login (wrong password/unknown user) | `authenticateLocal()` |
| `MFA_FAILURE` | Failed TOTP challenge | `verifyMfaChallenge()` |
| `PAM_ELEVATION_DENIED` | Wrong elevation code | `requestElevation()` |

### Signal types supported but NOT wired this batch (disclosed, not claimed)

`PERMISSION_DENIED` and `CLAIM_DENIED` are part of the detector's generic
API (`checkSecurityAnomalyRate({ signalType, scopeKey, organization })`)
but no call site currently invokes them. Wiring these would require
touching the RBAC middleware (`requirePermission`/`requireAnyPermission`)
and the queue-claim authorization path respectively - deferred to avoid
double-counting risk (the same denial could otherwise be counted once at
the middleware layer and again at the service layer) without a dedicated
pass to confirm exactly one counting point per denial type.

## Configuration (engineering defaults, not QR-approved)

| Variable | Default | Purpose |
|---|---|---|
| `SECURITY_ANOMALY_DB_PERSISTENCE` | `false` | Master switch for the shared/durable store; off by default so unit tests stay isolated, matching every other dedicated persistence flag in this engagement |
| `AUTH_ANOMALY_WINDOW_SECONDS` | `300` | Rolling detection window |
| `AUTH_ANOMALY_FAILURE_THRESHOLD` | `10` | Events within the window before a signal fires |
| `PERMISSION_DENIAL_THRESHOLD` | `10` | Reserved for the not-yet-wired `PERMISSION_DENIED`/`CLAIM_DENIED` signal types |

Owner: CISO; review alongside the annual risk-register cadence, or
immediately if Qatar Airways specifies different thresholds.

## Failure policy (documented, not silently fail-open)

If the shared store is unavailable (a real DB error, not simply the
feature being off by default), the detector:

1. Falls back to a process-local counter (narrower, but a real safety net
   - never silently does nothing).
2. Emits a durable, high-risk `SECURITY_ANOMALY_STORE_DEGRADED` AuditEvent
   so the gap is visible and investigable.
3. **Never blocks the underlying action** (login/MFA/elevation) on a
   monitoring-store outage - a monitoring-system failure must not become
   an availability outage for a legitimate user.

## Detection output

On threshold breach: a durable, critical-risk `SECURITY_ANOMALY_DETECTED`
AuditEvent (queryable via the existing `GET /admin/audit-events` route)
plus a structured stdout log line
(`{"type":"security_event","action":"SECURITY_ANOMALY_DETECTED",
"signalType",...,"count","threshold","windowSeconds","correlationId"}`)
for Cloud Logging/Cloud Monitoring to alert on
(`terraform/alerting.tf`'s `auth_failure_spike` policy). Never includes
passwords, OTPs, tokens, cookies, request bodies, or PII/PHI - confirmed by
a dedicated test.

## Tests (`tests/securityAnomalyDetector.test.ts`, 8 tests)

Below-threshold non-flagging, threshold-breach detection, per-user
isolation, MFA-failure detection, PAM-elevation-denial detection, and 2
**real PostgreSQL integration tests** (against the local Cloud SQL Auth
Proxy tunnel): combined-count-across-calls (simulating cross-instance
detection) and real window-expiry cleanup.

## Live validation performed this batch

Real synthetic failed-login attempts were sent directly to
`https://triagedsoc2.irisstar.tech/api/v1/auth/login` (a disposable,
non-existent test username, no real account affected). Confirmed via
`gcloud logging read` that real matching Cloud Logging entries exist for
these attempts (after fixing a real path-filter bug discovered during this
check - see `terraform/alerting.tf`'s changelog comment). Full incident-
fire-and-resolve cycle for the deployed alert policy was not completed
this session (requires sustained traffic across a real 5-minute alignment
window) - see `docs/operations/anomaly-alerting-matrix.md`.

## Closure decision

**CSQ AR.21 moves to Yes.** Both halves of the literal wording are
addressed: the file-integrity/host clause is formally and defensibly
non-applicable under this serverless architecture (documented, not
silently omitted), and application-level intrusion detection is real,
multi-instance-safe, tested (including real-DB integration tests), and
produces durable evidence with a documented failure policy.
