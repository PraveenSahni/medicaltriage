# Emerging Technology Review Process (NFR-082)

_Written 2026-08-07. Closes the literal requirement: "System should
adopt new/emerging technologies fast and in a timely manner, to enhance
productivity and user experience."_

## What already existed before this document

Real, current dependency hygiene (confirmed, not aspirational):
- `pnpm audit` blocking CI on high/critical vulnerabilities.
- SBOM generation on every build.
- All runtime dependencies confirmed on maintained, non-EOL versions.

This is real security/currency hygiene, but it is reactive (patching
known issues), not a process for proactively evaluating and adopting
genuinely new technologies. That gap is what this document closes.

## The process

A lightweight, recurring technology-radar review, run quarterly
alongside the existing risk-register review cadence (same owners,
same meeting, no new standing commitment):

1. **Candidate identification** - each quarter, the engineering lead
   reviews: (a) major version releases of core dependencies already in
   use (React, Express, Prisma, Playwright, etc.), (b) genuinely new
   capabilities that could measurably improve productivity or UX for
   this specific application (not adoption for its own sake).
2. **Classification** - each candidate is placed in one of 4 buckets,
   using the standard technology-radar vocabulary:
   - **Adopt** - proven, low-risk, clear benefit; schedule the upgrade.
   - **Trial** - promising but unproven for this codebase; build a
     small, scoped, real proof-of-concept (matching this engagement's
     own precedent - the RAG-shadow/semantic-matching work was built
     and run exactly this way, as a real shadow-only trial that never
     touched a live clinical decision).
   - **Assess** - worth tracking, not yet worth engineering time.
   - **Hold** - explicitly not adopting, with the reason recorded (so
     the decision isn't silently re-litigated every quarter).
3. **Recording** - the outcome of each quarterly review is appended to
   this document's log below, with real dates and real decisions - not
   a separate document that can silently go stale.
4. **Action** - any "Adopt" candidate becomes a real, tracked follow-up
   item (same mechanism as every other engineering item this
   engagement - a real PR/commit, not just a decision on paper).

## Review log

_First real entry to be added at the next quarterly review. This
document itself, and the process it defines, is the closure evidence
for this requirement - the log accumulates real entries going forward
rather than being backfilled with invented history._

| Date | Reviewer | Decision | Notes |
|---|---|---|---|
| _(pending first quarterly cycle)_ | | | |
