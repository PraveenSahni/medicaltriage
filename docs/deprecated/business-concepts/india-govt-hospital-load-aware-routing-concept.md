# Concept Note: Load-Aware Patient Routing for Indian Government Hospitals

> Deprecated concept note retained outside the authoritative application
> documentation. This capability is not a committed product feature.

> Distinct from the GCC employer/insurance vertical already in the Hub71 deck. Same core clinical engine, different buyer, different problem, different success metric. This is a concept note to evaluate, not a committed roadmap item.

## The problem, restated with the load dimension added

The earlier note covered the *tier-of-care* misrouting problem: patients self-refer to the biggest hospital they can reach because nothing tells them which tier (PHC/CHC/District Hospital/tertiary) actually fits their symptom. That's necessary but not sufficient — even a patient correctly routed to "a district hospital" can still walk into one that's already overloaded that day, while a nearby district hospital or clinic with real spare capacity sits underused, because there's no visibility into *current load* at the point the patient decides where to go.

This is a real, distinct second-order problem: **static tier-routing tells a patient the right *category* of facility; it doesn't tell them the right *specific* facility right now.** A government hospital's OPD load varies hour to hour and day to day (a Monday-morning surge, a specific doctor being on leave, a seasonal outbreak concentrating in one facility) — and today's system has no mechanism to see that load and redirect around it in real time.

## Why AiMLTriage's existing architecture is a real, proven starting point for this

This isn't a new architectural concept for AiMLTriage — it's a generalization of a pattern already built and working in the Nurse Cockpit product for a different resource (nurse capacity, not hospital/clinic capacity):

- **The Service Manager Board already provides real-time, read-only visibility into queue load** — active cases, wait times, staffing coverage — for a supervisor to see where the bottleneck is right now, not retrospectively.
- **The queue-orchestration layer already computes a priority/allocation logic per case** (acuity, wait time, lock/claim state) to decide who handles what next, and already tracks capacity constraints (e.g. the one-nurse-per-active-call lock, the held-call cap) to prevent overload of a single resource.
- **The disposition/routing step already exists** — today it routes a case to a *type* of care (self-care, teleconsult, clinic, ER); extending "routing" to also consider *which specific facility has capacity* is a natural next step on the same decision point, not a new subsystem.

Generalizing this pattern to hospitals: instead of one nurse's queue, the "queue" becomes a facility's OPD/appointment slots; instead of routing a call to a nurse, the system routes a patient to a specific doctor/clinic/hospital that (a) matches their triaged acuity/specialty need and (b) has real, current capacity — using the same real-time-visibility + allocation-logic pattern already proven for the nurse-facing product.

## What this product would actually need to do

1. **Triage at intake** (already the core product): capture symptoms, match to a licensed protocol, determine acuity and specialty need.
2. **Real-time facility/doctor capacity feed**: each participating facility's current OPD queue length, next-available-slot time, and specialty coverage (which doctors are in today) — this is the genuinely new data layer this concept requires, and it's the hard part: it needs real integration with each facility's own scheduling/registration system (or, more realistically at first, a manual/self-reported capacity signal from each facility, similar to how many real-world bed-availability dashboards start before deeper EHR integration).
3. **Load-aware routing decision**: instead of "you need a general physician," the system says "you need a general physician; District Hospital B has a 20-minute wait and an open slot in 30 minutes; District Hospital A (closer) currently has a 3-hour queue" — an actual, actionable redirect, not just a category.
4. **An actual booked/reserved appointment slot** at the chosen facility — closing the loop from "here's where you should go" to "you have a real slot," which is the gap identified in the earlier note (existing tools like ORS/eSanjeevani handle booking but not this kind of triage-plus-load-aware redirect).

## Why this is a distinct initiative, not a slide to add to the Hub71 deck

- **Buyer**: a state health department, a public-hospital network operator, or a national digital-health initiative (ABDM-adjacent) — not an employer's insurance budget. Completely different sales motion, procurement cycle, and relationship-building timeline than the GCC enterprise play.
- **Data/integration burden is much higher**: the GCC product integrates with one employer's HRMS/IVR; this needs live capacity signals from *multiple, independently-run* government facilities, which is a real, nontrivial integration and change-management effort (getting each facility to actually report capacity reliably) before the load-aware routing decision means anything.
- **Success metric is different**: not ICR reduction, but measurable reductions in average patient wait time, tertiary-hospital overcrowding, and PHC/CHC utilization — metrics a health department would care about and could be asked to co-validate.
- **Regulatory/data-residency context is different too**: India's own health-data regulations (and Ayushman Bharat Digital Mission's own architecture) would govern this, not UAE Federal Law No. 2 of 2019 (referenced in the GCC deck).

## Recommendation

Treat this as a real, separate future vertical worth exploring on its own merits — the underlying clinical-triage engine is genuinely reusable, which is a strong point in its favor — but it needs its own concept validation (starting conversations with a specific state health department or hospital network, not a generic pitch) before it belongs in any funding deck. Bolting it onto the Hub71/GCC-employer pitch would dilute a narrative that's already been through serious scrutiny (per the v4 deck's reviewer notes) for a single, well-defined ICP.

---

## Addendum: a lean capacity-feed data model, and a self-reported MVP path

### Minimal data model

The temptation is to design this as a full facility-scheduling integration from day one — that's the wrong starting point, because it requires each government facility to expose or adopt a real API before the product proves any value. Instead, the model needs to be lean enough that a facility can start reporting with almost no technical lift (a phone-based or web-form update from a ward clerk), while still being structured enough to drive a real routing decision.

**`FacilityCapacitySnapshot`** (one row per facility, refreshed periodically — not a full scheduling system):

| Field | Type | Notes |
|---|---|---|
| `facilityId` | string | Stable identifier — links to the facility's tier (PHC/CHC/District/Tertiary), location, and specialty coverage, which is mostly static reference data, not something reported daily |
| `reportedAtIso` | timestamp | When this snapshot was last updated — critical, because a 6-hour-old "20 min wait" is meaningless; the routing logic must treat staleness as a first-class signal, not an afterthought |
| `currentQueueLength` | integer | However the facility already counts this today (token number issued minus token number currently being served) — deliberately not asking for anything the facility doesn't already track internally |
| `estimatedWaitMinutes` | integer, optional | Derived if not directly reported (queue length × facility's own historical average consult time) |
| `specialtiesAvailableToday` | string[] | Which departments/doctors are actually staffed today — the single most valuable field, since "doctor on leave" is a huge, invisible-today driver of misrouting |
| `nextAvailableSlotIso` | timestamp, optional | If the facility has any real slot-booking (many will, via ORS/eSanjeevani already) — this is where load-aware routing hands off to *existing* booking infra rather than reinventing it |
| `acceptingWalkIns` | boolean | Some facilities stop accepting new OPD walk-ins past a certain queue depth — a hard cutoff signal, not just "busy" |

This directly generalizes the same shape already proven in the Cockpit's queue model (`TriageQueueItem`'s `lockExpiresAtIso`/`priorityScore`/staffing-load fields) — a snapshot with a real staleness timestamp and a small number of load signals, not a full scheduling engine.

**`RoutingDecision`** (one row per triaged patient, produced by the same disposition step the Cockpit already has):

| Field | Type | Notes |
|---|---|---|
| `triageAcuity` / `specialtyNeeded` | existing disposition fields | Unchanged from the current product |
| `candidateFacilities` | `{facilityId, distanceKm, currentQueueLength, estimatedWaitMinutes}[]` | Ranked shortlist, not a single forced answer — mirrors the existing Cockpit pattern of "top match + alternates, nurse/patient retains final say" rather than a black-box redirect |
| `selectedFacilityId` | string | What the patient was actually routed to |
| `bookedSlotIso` | timestamp, optional | Only populated if the target facility's own booking system (ORS/eSanjeevani, or this snapshot's `nextAvailableSlotIso`) could actually reserve one |

### Self-reported MVP: a real rollout path, ordered by trust and effort

**Phase 0 — no live integration at all.** Publish static reference data only (which facility handles which specialties, tier, location) — this alone already fixes the *tier*-misrouting problem from the first concept note, with zero dependency on any facility actively participating. This is the version that can start proving value literally tomorrow.

**Phase 1 — manual, low-frequency self-reporting.** A facility's ward clerk or registration desk updates `currentQueueLength` and `specialtiesAvailableToday` a few times a day via a simple form (phone call to a coordinator, SMS, or a one-field web form) — deliberately not asking for anything beyond what a token-counter already shows them. This is where the `reportedAtIso` staleness field earns its keep: the routing logic should visibly downweight or exclude a facility whose snapshot is more than, say, 4-6 hours old, rather than silently trusting stale data.

**Phase 2 — light automation for facilities that already have *some* digital system.** Many government facilities already run a basic token-display system or use ORS for a subset of departments; Phase 2 is a small connector pulling `currentQueueLength` from whatever they already have, removing the manual-reporting burden for that subset of facilities while Phase 1's manual path continues covering everyone else.

**Phase 3 — real booking handoff.** Once a facility has real slot availability (via ORS/eSanjeevani or a direct connector), `nextAvailableSlotIso` becomes real and `bookedSlotIso` can actually be written — this is the point where the product delivers on "not just where to go, but a real appointment," which is the gap identified in the original concept note.

**Why this order matters for a pilot pitch to a health department**: Phase 0 alone is a real, demonstrable, zero-integration-risk starting point — you can show a working tier-routing demo before asking any facility to change a single internal process. Phase 1 asks for the smallest possible behavior change (a clerk answers a form a few times a day) before any facility needs to touch their own systems. This ordering is the honest answer to "how do you get government hospitals to actually participate" — you don't start by asking for API integration, you start by asking for almost nothing and prove value first.

---

## Addendum: beyond India — Africa and other structurally similar public-health systems

The underlying problem this concept targets — a tiered public referral system that exists on paper but gets bypassed in practice, overwhelming tertiary/referral hospitals while lower-tier facilities sit underused, with no real triage or load visibility at the point a patient decides where to go — is not unique to India. It's a well-documented pattern across most low- and middle-income countries with a formally tiered public health system and low doctor-to-population ratios, which makes the same phased, low-integration-burden approach (Phase 0 static routing → Phase 1 self-reported load → Phase 2/3 real integration) broadly relevant rather than India-specific. That reusability is a genuine argument for treating this as "a public-health-tier-routing product for structurally similar health systems," not a single-country bet.

**Plausible analogue markets, at a structural level** (not claiming specific verified statistics for any of these — each would need its own real research before being used in any pitch, the same way the India section above draws on well-known structural facts rather than invented numbers):

- **Sub-Saharan Africa** (e.g. Nigeria, Kenya, Ethiopia, Tanzania): formally tiered systems (health post/dispensary → health center → district/county hospital → national referral hospital) with the same well-documented pattern of self-referral bypass and severe overcrowding at the top tier, plus generally very low physician-to-population ratios that make any load-aware routing especially valuable — there's even less spare capacity to misallocate.
- **Southeast Asia** (e.g. Philippines, Indonesia, Vietnam): similarly tiered public systems (barangay health station/puskesmas → district/regional hospital → national/tertiary hospital) with comparable referral-bypass dynamics, often compounded by geographic fragmentation (island nations) that makes "which facility is actually reachable and has capacity" even more valuable a question than in a contiguous landmass.
- **Other South Asian markets** (Bangladesh, Pakistan, Nepal): very close structural analogues to India's own tiered system and referral-bypass problem, likely the most direct extensions of any India-proven playbook.

**Why this matters for how the concept is framed, not just where it's sold**: if this becomes a real initiative, it's worth designing the Phase-0/Phase-1 data model (above) to be country-agnostic from the start — the `FacilityCapacitySnapshot` and `RoutingDecision` shapes don't reference anything India-specific, which was a deliberate choice. The tier taxonomy (PHC/CHC/District/Tertiary) is the one genuinely India-specific naming convention in this note; a real multi-country version would need a small, configurable tier-naming layer per country rather than hardcoding India's terms.

**The honest caveat**: expanding the target-market list before validating even the India case with a single real health department conversation is a real risk — it's easy to make a concept note *sound* more investable by widening the addressable geography, without adding any actual validated demand. This section is included because you asked for it and the structural analogy is genuinely real, not because breadth substitutes for depth here. The recommended next step is still the same: validate with one real government/health-department conversation (India or otherwise) before treating any of this — including the multi-country framing — as more than a well-reasoned hypothesis.
