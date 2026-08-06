# Answer-Call Workflow: Intended Architecture (call-center gateway remediation)

_Written 2026-08-06, following the NFR-004 UX cross-browser validation
batch's discovery that the answer-call → SBAR e2e tests expected a
different endpoint than the one the live UI actually calls._

## Established model: Model A

**Queue `claim` + `context` is the authoritative, currently-shipped
"answer call" workflow.** The call-center-gateway `/command` endpoint is
real and correctly used elsewhere in the same UI (Hold/Resume), but was
never wired to the initial answer action - the e2e tests asserting on
`/command` for that specific button were stale, most likely copy-pasted
from the Hold/Resume tests before `answerCall()` was implemented.

### Evidence

- `frontend/src/cockpit/Sidebar.tsx`'s `answerCall()` calls only
  `claimItem()` → `POST /api/v1/queue/:id/claim`. Confirmed via direct live
  network inspection (not assumption).
- `connectCall()` (→ `POST /api/v1/call-center/queue/:id/command`) exists
  and is real, but is wired only to `ActiveCallHeader.tsx`'s Hold/Resume
  button and `Sidebar.tsx`'s `resumeCall()` - never to the initial answer
  action.
- `executeQueueCallCommand()` (`src/services/callCenterGateway.ts`) already
  auto-claims the queue item if not yet locked, meaning `/command` is a
  self-sufficient *superset* action (claim + telephony/PBX session control +
  recording-consent governance), not a required prerequisite step before
  claim/context can run. This rules out "the frontend is missing a
  bootstrap step" (Model B).
- Git history: `claim`/`context` predate the call-center-gateway feature by
  a full commit; the gateway was added later as a richer telephony
  integration layer, with Hold/Resume migrated onto it but Answer never
  migrated.
- `remote_triage_nurse`'s permissions
  (`triage.workspace.view`, `triage.recommendation.view`,
  `privacy.reveal.request`) don't include `integration.callcenter.manage`,
  `triage.queue.manage`, or `audit.events.view` - the three permissions
  `GET /api/v1/call-center/sessions` accepts. This 403 is real but
  **incidental**: the frontend's 15-second session-polling call
  (`refreshCallCenterSessions()`) is wrapped in a try/catch and silently
  degrades (hold-state badges just stay stale) - it was never part of the
  claim/answer contract, and granting a nurse role broader
  call-center-integration permissions merely to silence this poll would be
  scope creep unrelated to the actual defect.

## What was fixed

The 3 e2e tests asserting on `/command` for the initial answer action
(`WEB-005`, `WEB-006`, `API-008`) were updated to assert on the real
`/claim` response shape (`{ item, lock: { lockedBy, lockExpiresAtIso } }`)
instead. `API-007`'s existing `/command` permission-denial test for the
intake persona was left untouched - it's real, correct coverage of the
`/command` endpoint's own authorization, unrelated to the answer-call path.

Additionally, a **real, confirmed audit gap** was found and fixed while
verifying this workflow: `recordQueueAuditEvent()` (the queue
orchestration audit helper) was a complete no-op unless
`QUEUE_DB_PERSISTENCE=true` - meaning claim, context-update, and
move/complete actions left **zero** audit trail in the default mock/
in-memory mode. This is now always recorded in-memory first (matching the
established pattern in `securityAdmin.ts`'s `recordAuditEvent`), with the
richer Prisma write remaining an additional, DB-mode-only step. A new
`QUEUE_ITEM_CLAIM_DENIED` audit event was also added for the
role-denied-claim path, which previously had no audit trail at all.

## Second, deeper finding (confirmed after the endpoint fix)

Fixing the `/claim` vs `/command` endpoint mismatch was not sufficient -
`WEB-005` still times out waiting for a `POST /api/v1/triage/calculate-score`
request that never fires. Root cause, fully confirmed:

- `POST /api/v1/triage/calculate-score` is only ever called from
  `frontend/src/components/Triage/NurseWorkspace.tsx` and
  `NurseWorkspaceRedesign.tsx` - confirmed by grep, zero call sites in
  `frontend/src/cockpit/`.
- The `role="dialog" aria-label="Active triage focus"` modal these tests
  wait for exists **only** in those same two legacy components.
- `App.tsx` only renders `NurseWorkspaceRedesign` when `activeView ===
  "cockpitV2"` (the separate `#/cockpit-v2` route) - never for the default
  `activeView === "cockpit"` view that `canAccessNurseCockpit`/
  `NURSE_COCKPIT_ALLOWED_ROLES` actually routes `remote_triage_nurse` to on
  login (confirmed by `tests/e2e/fixtures.ts`'s own comment:
  `landingView: "cockpit"`).
- `WEB-005`/`WEB-007`/`WEB-008` never navigate to `#/cockpit-v2` - they log
  in and interact with whatever renders by default, so the modal dialog and
  its auto-calculated score can never appear for a real login journey.

**Conclusion**: these 4 tests were written against an alternate/legacy UI
surface (`NurseWorkspaceRedesign` via `#/cockpit-v2`) that a real nurse
login never reaches. This is a materially larger fixture/architecture
mismatch than the original `/claim` vs `/command` issue - not something
this batch's remaining time can respons­ibly rewrite against the real
stage-tab Cockpit board (`Reason & Rule-Out` → `Questions` → `Disposition
& Advice` → `SBAR/Complete`) without a dedicated investigation of that
UI's actual DOM structure and API call sequence. **Disclosed, not fixed
this batch.** The `/claim`-endpoint correction made to these tests is still
objectively correct progress (it fixed the first, shallower defect these
tests hit), but they will continue to fail until rewritten against the
real default Cockpit UI in a follow-up batch.

## Explicitly not changed

- The call-center-gateway `/sessions`/`/command` endpoints' own permission
  requirements - unrelated to the confirmed defect, and changing them
  wasn't necessary to fix the answer-call workflow.
- Cross-tenant queue-access tests - this is a confirmed, deliberate,
  pre-existing single-tenant product decision
  (`tests/multiTenantRBAC.test.ts`'s own header comment: "exactly one
  organization exists... cross-tenant segregation/escalation tests were
  removed along with the second tenant fixture per explicit product
  decision"). Reintroducing a synthetic second tenant to satisfy a generic
  test-coverage checklist item would contradict an already-made product
  decision, so this item is honestly reported as architecturally
  inapplicable rather than faked.
