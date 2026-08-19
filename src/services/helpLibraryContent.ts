import type { AuthenticatedSession } from "../types/security.js";
import { TECHNICAL_TOPIC_GROUPS } from "./helpLibraryTechnicalContent.js";

/**
 * Renders the standalone IST Health Teletriage Help & Library page. Design
 * language (tokens, topbar, topic-list, article layout) follows
 * docs/IST-Health-Teletriage-Help-*.html (the approved reference). Content
 * below describes only what is actually implemented today - see the
 * "Current System Baseline" text embedded in the Getting Started article for
 * the exact source-of-truth references.
 *
 * This is server-rendered (not part of the Vite SPA bundle) specifically so
 * `<a href="/help" target="_blank">` opens a genuinely separate page: closing
 * it, or leaving it open in a background tab, never touches the Nurse
 * Cockpit's or Service Manager Board's live state in the other tab.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type TopicArticle = {
  id: string;
  title: string;
  body: string; // pre-escaped HTML fragment
};

type TopicGroup = {
  id: string;
  label: string;
  articles: TopicArticle[];
};

const TOPIC_GROUPS: TopicGroup[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    articles: [
      {
        id: "getting-started-overview",
        title: "Signing in and choosing a workspace",
        body: `
          <p>Sign in with your assigned username and password at the application root URL. The workspace you land on depends on your session's active role (<code>session.activeRole</code>), evaluated in <code>frontend/src/App.tsx</code>:</p>
          <ul>
            <li>An active role of <code>triage_service_manager</code> lands directly on the Triage Service Manager Board.</li>
            <li><code>remote_triage_nurse</code> (or <code>triage_service_manager</code> itself) can also open the Nurse Cockpit.</li>
            <li>Other roles land on the existing Triage workspace or Control Center, depending on their permissions.</li>
          </ul>
          <p>If your account holds both a nurse role and the Triage Service Manager role, a topbar button lets you switch between the Nurse Cockpit and the Service Manager Board without signing out.</p>
        `
      },
      {
        id: "getting-started-baseline",
        title: "Current system baseline (source of truth)",
        body: `
          <p>This Help page describes the application as implemented today. Where this page and any other document disagree, the source code and this baseline are authoritative:</p>
          <ul>
            <li><strong>Nurse Cockpit:</strong> <code>frontend/src/cockpit/CockpitApp.tsx</code>, route <code>#/cockpit</code>.</li>
            <li><strong>Triage Service Manager Board:</strong> <code>frontend/src/serviceManagerBoard/TriageServiceManagerBoard.tsx</code>, route <code>#/service-manager-board</code>.</li>
            <li><strong>Shared queue data:</strong> <code>frontend/src/QueueContext.tsx</code> (<code>useQueue()</code>), polling <code>GET /api/v1/queue</code> and <code>GET /api/v1/call-center/sessions</code> every 15 seconds.</li>
            <li><strong>Role gates:</strong> <code>frontend/src/cockpit/roles.ts</code> (<code>canAccessNurseCockpit</code>, <code>canAccessServiceManagerBoard</code>).</li>
          </ul>
        `
      }
    ]
  },
  {
    id: "nurse-cockpit",
    label: "Nurse Cockpit",
    articles: [
      {
        id: "cockpit-queue",
        title: "The Open Calls queue",
        body: `
          <p>The left sidebar (<code>frontend/src/cockpit/Sidebar.tsx</code>) lists incoming calls under two tabs: <strong>Open Calls</strong> and <strong>Completed</strong>. Each open call shows a state pill (<em>Waiting</em>, <em>In Progress</em>, <em>On Hold</em>, or <em>Closed</em>), a live wait clock, and the patient's age/gender/employment type once HRMS identity validation completes.</p>
          <p>Use the search box to filter by staff ID, reason, or protocol. The sort control offers Smart Priority, Longest Waiting, Newest First, and Oldest First. The filter control narrows by priority (Urgent/Routine), availability, and patient type. All of these operate only on the already-loaded queue list - they do not change what other nurses see.</p>
        `
      },
      {
        id: "cockpit-answer",
        title: "Answering and holding a call",
        body: `
          <p>Click <strong>Answer call</strong> on a waiting call to claim it (<code>POST /api/v1/queue/:id/claim</code>). The cockpit allows only one active call at a time; a call already locked by another nurse shows their name instead of an answer button. Claiming, releasing, and heartbeat lock-refresh are all backend queue actions (<code>src/routes/queueRouter.ts</code>): <code>POST /:id/claim</code>, <code>POST /:id/release</code>, <code>POST /:id/heartbeat</code>.</p>
          <p><strong>Hold/resume is a frontend-only concept</strong> - there is no dedicated "hold" or "resume" backend endpoint. Placing a call on hold keeps it claimed under your lock while the cockpit's own UI state (and the call-center session) tracks it as held; a configured cap, <code>MAX_HELD_CALLS = 1</code> (defined in both <code>frontend/src/cockpit/CockpitApp.tsx</code> and <code>frontend/src/components/Triage/NurseWorkspaceRedesign.tsx</code>), blocks placing a second call on hold, or answering a new call, once you already have one held.</p>
          <p>Your claim lock is kept alive by a periodic heartbeat call while the item's status is <code>IN_PROCESS</code>; if the lock lapses without a heartbeat, the call can become claimable by another nurse again.</p>
        `
      },
      {
        id: "cockpit-stages",
        title: "The four workflow stages",
        body: `
          <p>Once a call is open, work moves through four stage tabs in <code>frontend/src/cockpit/CockpitApp.tsx</code>, corresponding to the backend's <code>currentStage</code> field (<code>INTAKE</code>/<code>IDENTITY</code>/<code>VITALS</code> → <code>PROTOCOL</code> → <code>DISPOSITION</code> → <code>SBAR</code>):</p>
          <ol>
            <li><strong>Reason &amp; Rule-Out</strong> - captures the reason for the call, HRMS identity/employment validation, vitals, and screens for emergency red flags.</li>
            <li><strong>Questions</strong> - the STCC-compatible Initial Assessment (IAQ) and Triage Acuity (TAQ) questions for the matched protocol.</li>
            <li><strong>Disposition &amp; Advice</strong> - the resulting disposition (one of eight destination codes - see below) and approved care advice (Give Now / Send Later).</li>
            <li><strong>SBAR / Complete</strong> - the SBAR summary and the final Complete Call action.</li>
          </ol>
          <p><strong>Severity levels</strong> (<code>calculatedSeverity</code>): <code>EMERGENCY</code>, <code>URGENT</code>, <code>ROUTINE</code>, <code>SELF_CARE</code>. A nurse cannot silently downgrade severity below the level the system already computed - a blocked downgrade is itself recorded as a safety-audit event (see <a href="#" data-topic="privacy">Privacy &amp; Data Protection</a>).</p>
          <p><strong>Disposition codes</strong> (where a case is ultimately sent): <code>SIDRA_PEDIATRIC_ED</code>, <code>HMC_EMERGENCY_DEPARTMENT</code>, <code>HMC_URGENT_REVIEW</code>, <code>IST_HIA_MIDFIELD_MEDICAL_CENTRE</code>, <code>IST_OLD_AIRPORT_MEDICAL_COMMISSION</code>, <code>PHCC_URGENT_CARE_OR_TELECONSULT</code>, <code>OUTSTATION_TELECONSULT_ESCALATION</code>, <code>SELF_CARE_WITH_CALLBACK_PRECAUTIONS</code>.</p>
          <p>An emergency safety floor, once triggered, is shown prominently in the call header and cannot be silently downgraded. Its source is recorded as one of <code>vitals</code>, <code>symptom</code>, or <code>judgment</code> (<code>safetyFloorSource</code>).</p>
        `
      },
      {
        id: "cockpit-fit-to-fly",
        title: "Fit-to-Fly decision requirements",
        body: `
          <p><strong>Fit-to-Fly is a separate governed aviation decision and can never weaken the clinical disposition.</strong> The exact terminal protocol question's <code>calculatedSeverity</code> is authoritative. A routing destination is not an acuity classification: for example, <code>PHCC_URGENT_CARE_OR_TELECONSULT</code> is shared by both Urgent and Routine STCC levels, so the destination code must not be used by itself to decide clearance.</p>
          <table>
            <thead><tr><th>Clinical or governance condition</th><th>Required Fit-to-Fly result</th></tr></thead>
            <tbody>
              <tr><td><code>EMERGENCY</code></td><td><code>RESTRICTED</code></td></tr>
              <tr><td><code>URGENT</code></td><td><code>RESTRICTED</code></td></tr>
              <tr><td><code>ROUTINE</code> plus safety-sensitive crew</td><td><code>MEDICAL_REVIEW_REQUIRED</code></td></tr>
              <tr><td><code>SELF_CARE</code> plus <code>fit-to-fly-review</code>, <code>duty-restriction</code>, or <code>sickness-validation</code></td><td><code>MEDICAL_REVIEW_REQUIRED</code></td></tr>
              <tr><td>Missing calculated severity</td><td><code>MEDICAL_REVIEW_REQUIRED</code>; never automatic clearance</td></tr>
            </tbody>
          </table>
          <p>Safety-sensitive role coverage includes <strong>Pilot, Captain, First Officer, Flight Deck, Cabin Crew, and Cabin Supervisor</strong>. A structured crew category is preferred where available; the governed job-title mapping is the compatibility fallback.</p>
          <p><code>CLEARED</code> is permitted only when the required severity is present and no clinical, role, duty, sickness, or review rule requires restriction or medical review. The Disposition preview and final Completion request must carry the same calculated severity so their results remain consistent.</p>
        `
      },
      {
        id: "cockpit-identity",
        title: "HRMS identity and employment validation",
        body: `
          <p>The Reason &amp; Rule-Out stage looks up the caller against the HRMS staff directory (<code>src/services/hrms.ts</code>, currently a simulation layer over a locally-generated, Oracle-Fusion-HCM-shaped data set - not a live Oracle connection). The lookup can return, for the staff member: department, job title, duty status (<code>active</code>/<code>on-leave</code>/<code>suspended</code>/<code>inactive</code>), date of birth, biological sex, insurance provider, and insurance eligibility status - and, for a dependent caller, relationship type, age, date of birth, and biological sex.</p>
          <p>A staff member whose duty status is <code>inactive</code> or <code>suspended</code> is flagged for manual verification rather than auto-validated. Patient age is calculated from date of birth when available, otherwise from a dependent's recorded age field - the cockpit shows which source was used.</p>
        `
      },
      {
        id: "cockpit-back",
        title: "Returning to the Service Manager Board",
        body: `
          <p>If your session's active role is <code>triage_service_manager</code>, a back arrow next to Sign Out returns you to the Service Manager Board. For other roles, this control is not shown, since there is nowhere else for it to send them.</p>
        `
      }
    ]
  },
  {
    id: "service-manager-board",
    label: "Triage Service Manager Board",
    articles: [
      {
        id: "smb-overview",
        title: "What the board is for",
        body: `
          <p><strong>The Triage Service Manager Board is read-only and does not expose or initiate clinical or queue mutation actions.</strong> It shares the exact same live queue data as the Nurse Cockpit (<code>useQueue()</code> / <code>QueueContext.tsx</code>) but never calls claim, move, context-update, release, or connect-call endpoints against an existing record.</p>
          <p>The one deliberate, narrow exception is the <strong>Generate Calls</strong> toggle described below - it creates brand-new synthetic demo calls, but never edits or advances an existing one.</p>
        `
      },
      {
        id: "smb-columns",
        title: "Workflow columns",
        body: `
          <p>The board has six columns, mapped from the existing backend <code>status</code>/<code>currentStage</code> fields by <code>frontend/src/serviceManagerBoard/boardMapping.ts</code>'s <code>mapExistingStatusToBoardColumn()</code>:</p>
          <table class="ref-table">
            <thead><tr><th>Column</th><th>Backend condition</th></tr></thead>
            <tbody>
              <tr><td>Waiting Calls</td><td><code>status === "INCOMING"</code></td></tr>
              <tr><td>Reason &amp; Rule-Out</td><td><code>currentStage</code> in <code>INTAKE</code>, <code>IDENTITY</code>, <code>VITALS</code></td></tr>
              <tr><td>Questions</td><td><code>currentStage === "PROTOCOL"</code></td></tr>
              <tr><td>Disposition &amp; Advice</td><td><code>currentStage === "DISPOSITION"</code></td></tr>
              <tr><td>SBAR / Complete</td><td><code>currentStage === "SBAR"</code> and still in progress</td></tr>
              <tr><td>Closed</td><td><code>status === "COMPLETED"</code> (its own terminal column, separate from active SBAR calls)</td></tr>
            </tbody>
          </table>
        `
      },
      {
        id: "smb-summary",
        title: "Summary tiles",
        body: `
          <p>Four tiles above the board are computed locally from the already-loaded queue array (no separate backend aggregation endpoint):</p>
          <ul>
            <li><strong>Waiting Calls</strong> - count of items in the Waiting Calls column, plus the longest current wait.</li>
            <li><strong>In Clinical Flow</strong> - open, non-waiting items.</li>
            <li><strong>Safety Alerts</strong> - open items with <code>safetyFloorActive: true</code>.</li>
            <li><strong>Assigned Nurses</strong> - the count of <em>distinct</em> nurses (<code>lockedBy</code>/<code>assignedNurseId</code>) currently holding an open call. This is an assignment count, not a live nurse-presence or availability signal - no such data is available from the current API.</li>
          </ul>
        `
      },
      {
        id: "smb-safety",
        title: "Safety-floor attention strip",
        body: `
          <p>When one or more open calls have <code>safetyFloorActive: true</code>, a red strip appears above the board with a count and a <strong>Locate on board</strong> button. Clicking it applies the "Needs attention" filter locally and scrolls the board into view - it does not change any record, notify anyone, or alter the underlying queue.</p>
        `
      },
      {
        id: "smb-search",
        title: "Search, sort, and filter",
        body: `
          <p>All three operate only on the already-loaded queue array in the browser - no query parameters are sent to the API and no refetch is triggered:</p>
          <ul>
            <li><strong>Search</strong> matches masked ID, title, reason narrative, protocol, assigned nurse, station, patient type, and channel.</li>
            <li><strong>Sort</strong> offers Smart Priority, Longest Waiting, and Recently Added.</li>
            <li><strong>Filter</strong> narrows by priority, assignment, nurse, station, and a "Needs attention only" toggle, with an active-filter count badge and a Reset control.</li>
          </ul>
          <p>An empty result after filtering shows "No matching calls"; a genuinely empty column (no filter applied) shows "No calls in this stage".</p>
        `
      },
      {
        id: "smb-drawer",
        title: "Read-only call detail",
        body: `
          <p>Clicking a card opens a temporary drawer (never a permanent side panel) showing the masked case ID, current stage, assigned nurse, patient type/age, station, protocol, priority, and - for closed calls - the disposition. A five-segment progress bar shows how far the call has moved through the six columns.</p>
          <p>Opening or closing the drawer makes no API call and changes no record. Identifiers (case ID, HRMS staff ID) are masked to a fixed width (8 mask characters + the last 4 real characters) everywhere on the board, so every masked value renders at the same width regardless of the underlying ID's length.</p>
        `
      },
      {
        id: "smb-generate",
        title: "Generate Calls (demo data only)",
        body: `
          <p>The topbar toggle labeled <strong>Generate Calls</strong> is the one control on this board that calls a mutation endpoint (<code>POST /api/v1/queue</code>) - and only to create a brand-new synthetic demo call, using realistic reason narratives spanning the protocol content this system has (including the licensed STCC "Abdominal Pain - Male" protocol). It never edits, claims, or advances an existing call. While toggled on, it generates approximately one new call every 20 seconds; toggling off stops it immediately. The generated organization defaults to your own session's organization automatically.</p>
        `
      }
    ]
  },
  {
    id: "roles-access",
    label: "Roles, Responsibilities & Access",
    articles: [
      {
        id: "roles-overview",
        title: "How roles determine what you see",
        body: `
          <p>Every simulated demo user is attached to one named role, email, and password. Frontend route gates (<code>frontend/src/cockpit/roles.ts</code>) check your session's exact active role - not general role membership - before showing the Nurse Cockpit or Service Manager Board.</p>
          <p>These frontend checks sit on top of, not instead of, backend permission checks: every API request is independently authorized against your session's permissions. The queue API (<code>src/routes/queueRouter.ts</code>) requires at least one of <code>triage.workspace.view</code>, <code>triage.queue.manage</code>, or <code>admin.users.manage</code> on every route - claim, release, heartbeat, context update, move, and escalate all sit behind this same gate. See <a href="#" data-topic="troubleshooting">Troubleshooting</a> if you see an "Access denied" response.</p>
        `
      },
      {
        id: "roles-catalog",
        title: "The 3 role codes and their permissions",
        body: `
          <p>Every account is assigned one or more of these role codes; the permission list is what backend routes actually check.</p>
          <table class="ref-table">
            <thead><tr><th>Role</th><th>Key permissions</th></tr></thead>
            <tbody>
              <tr><td>platform_super_administrator</td><td>Every permission in the system</td></tr>
              <tr><td>triage_service_manager</td><td>triage.queue.manage, operations.dashboard.view, reports.view, audit.events.view</td></tr>
              <tr><td>remote_triage_nurse</td><td>triage.workspace.view, triage.recommendation.view, privacy.reveal.request</td></tr>
            </tbody>
          </table>
          <p>Of these, the roles that can open the Nurse Cockpit or use the queue API are the ones holding <code>triage.workspace.view</code>, <code>triage.queue.manage</code>, or <code>admin.users.manage</code>: <code>remote_triage_nurse</code>, <code>triage_service_manager</code>, and <code>platform_super_administrator</code>.</p>
        `
      },
      {
        id: "roles-session",
        title: "Sessions and sign-in",
        body: `
          <p>A signed-in session is tracked by an <code>ist_triage_session</code> cookie. A normal session lasts 30 minutes; checking "remember me" at sign-in extends it to 8 hours. When a session expires you'll need to sign in again - no data is lost, since the Nurse Cockpit and Service Manager Board only ever display what the backend queue currently holds.</p>
        `
      }
    ]
  },
  {
    id: "control-center",
    label: "Control Center",
    articles: [
      {
        id: "cc-overview",
        title: "What the Control Center is for",
        body: `
          <p>The Control Center (<code>frontend/src/AdminPortal.tsx</code>, route <code>#/admin</code>) is a named-user access and enterprise-controls surface split into 11 tabs: Overview, Users, Access, Security, Privacy, Audit, Governance, Protocol Library, Integration, Reports, and Support. Each tab is shown only if your session holds the permission it requires - a tab you lack permission for is not shown disabled, it is simply absent from the tab bar.</p>
          <p><strong>Across all 11 tabs, the only action that actually changes anything server-side today is the masked-data "Reveal" request</strong> (on the Users and Privacy tabs). Every other tab - Overview, Access, Security, Audit, Governance, Protocol Library, Integration, Reports, Support - is read-only reporting: it displays data fetched from <code>src/routes/admin.ts</code>'s <code>GET</code> endpoints. There are no account-lock, role-edit, or approval-workflow controls wired up in the Control Center as it stands.</p>
          <p><strong>Access is further restricted by role</strong>, independent of individual tab permissions: the clinical role (<code>remote_triage_nurse</code>) cannot open the Control Center at all, even though it individually holds a permission like <code>privacy.reveal.request</code>.</p>
          <p>The "31 ACCESS CONTROLS" figure shown on the Control Center banner is a fixed label, not a live count derived from any permission, role, or responsibility list in this system - don't treat it as an enumerable total.</p>
        `
      },
      {
        id: "cc-users",
        title: "Users tab",
        body: `
          <p>Lists user accounts (name, email, mobile, facility/department/specialty, account status, roles). Requires <code>admin.users.manage</code>. A "Reveal" button per row requests the real value behind a masked email (see the Privacy tab article for how reveal works); an "Effective access" button is present but not wired to any action.</p>
        `
      },
      {
        id: "cc-access",
        title: "Access tab",
        body: `
          <p>A read-only "Role Access Bifurcation Matrix": every role with its permission count and first few permission scopes, a responsibilities list (risk level, business function, conflict count), and the full permission catalog as chips. Requires <code>admin.roles.manage</code>. There is no create/edit control for roles or permissions here - this tab reports the current configuration, it does not change it.</p>
        `
      },
      {
        id: "cc-security",
        title: "Security tab",
        body: `
          <p>Shows configured SSO providers (issuer, redirect URI, where the secret is stored - never the secret value itself, enabled/disabled) and encryption/masking policies (key provider, data residency, rotation interval, which fields each policy covers). Requires <code>security.sso.manage</code> or <code>crypto.policy.manage</code>. View-only - no enable/disable or edit controls.</p>
        `
      },
      {
        id: "cc-privacy",
        title: "Privacy tab and the reveal-request flow",
        body: `
          <p>Shows a "Purpose-Based Reveal Requests" table of masked users, each with Email/Mobile reveal buttons, plus the same encryption/masking policy list as Security. Requires <code>privacy.assessment.manage</code> or <code>crypto.policy.manage</code> to view the tab.</p>
          <p><strong>How a reveal actually works</strong> (<code>POST /api/v1/admin/reveal</code>): any session holding <code>privacy.reveal.request</code> <em>or</em> <code>admin.users.manage</code> is authorized - there is no separate human-approval queue in the current implementation, despite the UI's "approval" language. Every attempt, granted or denied, is written to the audit trail as a <code>critical</code>-risk event (<code>PERSONAL_DATA_REVEAL</code> or <code>FAILED_PERSONAL_DATA_REVEAL</code>), which is also what feeds the Overview tab's "Recent reveals" metric.</p>
          <p>A granted reveal is labeled "(auto-remask in 60s)" in the UI, but this is guidance text only - there is currently no server-side timer or client-side mechanism that actually re-masks or expires the displayed value after 60 seconds. Treat the label as a handling instruction for the person viewing it, not a system-enforced guarantee.</p>
        `
      },
      {
        id: "cc-audit",
        title: "Audit tab",
        body: `
          <p>Lists audit events (action, timestamp, user, module, resource, risk level, success/failure) from the persisted audit trail described in <a href="#" data-topic="privacy">Privacy &amp; Data Protection</a>. Requires <code>audit.events.view</code>. View-only.</p>
        `
      },
      {
        id: "cc-governance",
        title: "Governance tab",
        body: `
          <p>Shows governance work items - status, control description, owning role, evidence reference. Requires <code>clinical.governance.approve</code> or <code>audit.events.view</code>. View-only.</p>
        `
      },
      {
        id: "cc-protocol-library",
        title: "Protocol Library tab",
        body: `
          <p>Catalog of protocol content entries (title, safety notes, category, release, status). Requires <code>protocol.library.manage</code> or <code>clinical.governance.approve</code>. View-only - editing protocol content happens outside this tab.</p>
        `
      },
      {
        id: "cc-integration",
        title: "Integration tab",
        body: `
          <p>Cards for each integration connector (system, API surface, status, owning role, last-checked time, what data classes it handles) - e.g. the HRMS/Oracle simulation layer, EMR/FHIR, and SSO connectors. Requires <code>integration.hrms.manage</code>, <code>integration.emr.manage</code>, or <code>security.sso.manage</code>. View-only status reporting, not a live connector health check.</p>
        `
      },
      {
        id: "cc-reports",
        title: "Reports tab",
        body: `
          <p>A catalog of available reports - title, the permission required to run each one, intended audience, data classification, and whether export is allowed. Requires <code>reports.view</code> or <code>operations.dashboard.view</code>. The catalog itself is browsable here; no export button is wired into this tab.</p>
        `
      },
      {
        id: "cc-support",
        title: "Support tab",
        body: `
          <p>Shows the support ticket queue - status, title, data boundary, and requester role. Requires <code>support.tickets.manage</code> or <code>admin.users.manage</code>. View-only.</p>
        `
      }
    ]
  },
  {
    id: "privacy",
    label: "Privacy & Data Protection",
    articles: [
      {
        id: "privacy-masking",
        title: "Identifier masking",
        body: `
          <p>Patient and employee identifiers are masked by default across both workspaces. On the Service Manager Board, every masked value is exactly 8 mask characters followed by the last 4 real characters, regardless of the source identifier's length. A permitted role (any role holding <code>privacy.reveal.request</code>) may request a time-limited, audited reveal for an approved purpose through the Control Center - this Help page never displays a reveal control itself.</p>
        `
      },
      {
        id: "privacy-audit-trail",
        title: "Audit trail",
        body: `
          <p>Security-relevant events - sign-ins, permission changes, and safety-relevant clinical overrides - are written to a persisted audit table (<code>AuditEvent</code>, via <code>src/services/persistence.ts</code>), viewable by any role holding <code>audit.events.view</code>. When a clinician's disposition differs from the system's own recommendation, or a downgrade of the calculated severity is blocked, that event is also captured as a distinct safety-audit record with one of these status flags: <code>RULES_ENGINE_FINAL</code>, <code>NURSE_OVERRIDE_DOWN_BLOCKED</code>, <code>NURSE_OVERRIDE_UP</code>, or <code>AI_RECOMMENDATION_DIFFERED</code>.</p>
          <p>The credential-metadata section further down this Help page, visible only to Security/Privacy/Compliance/Governance roles, keeps its own access log as a deliberate, disclosed exception: it is written only as structured console log lines, not to that persisted table, since no new database schema was introduced for this specific feature.</p>
        `
      },
      {
        id: "privacy-safety-floor",
        title: "Safety floor and severity downgrade protection",
        body: `
          <p>An emergency safety floor, once set, cannot be silently lowered - the system blocks any attempt to downgrade severity below what it already calculated, and records the blocked attempt in the audit trail described above. The floor's source is recorded as <code>vitals</code>, <code>symptom</code>, or <code>judgment</code>, so a reviewer can see what triggered it.</p>
        `
      }
    ]
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    articles: [
      {
        id: "troubleshooting-common",
        title: "Common messages and what they mean",
        body: `
          <ul>
            <li><strong>"Unable to load the triage service board."</strong> - the queue GET request failed, most often because your session expired (sessions last 30 minutes, or 8 hours with "remember me"). Refresh the page and sign in again.</li>
            <li><strong>"Authentication required" in the Nurse Cockpit sidebar</strong> - same cause as above; sign in again.</li>
            <li><strong>"Access Denied"</strong> after navigating directly to a route - your session's active role is not on the allow-list for that workspace, or your permissions don't include <code>triage.workspace.view</code>, <code>triage.queue.manage</code>, or <code>admin.users.manage</code>.</li>
            <li><strong>A call shows another nurse's name instead of Answer call</strong> - it is already locked by that nurse; it will become available again if released or its lock expires (locks are kept alive by a periodic heartbeat while a call is open).</li>
            <li><strong>"Rate limit exceeded" (HTTP 429) with a Retry-After value</strong> - seen on the credential-metadata section's secondary-password check after repeated attempts. The limiter is a fixed time window per requesting IP address; wait for the window to reset and try again.</li>
          </ul>
        `
      }
    ]
  },
  ...TECHNICAL_TOPIC_GROUPS,
  {
    id: "faq",
    label: "Frequently Asked Questions",
    articles: [
      {
        id: "faq-general",
        title: "FAQ",
        body: `
          <p><strong>Does the Service Manager Board ever change a call?</strong> No, except for the explicit Generate Calls demo toggle, which only creates new synthetic calls and never touches existing ones.</p>
          <p><strong>Why don't Waiting Calls show a "time in stage"?</strong> The system does not have a reliable stage-entry timestamp to calculate that from - only a call's original creation time is available, so only wait time (for waiting calls) is shown.</p>
          <p><strong>Can I use the Service Manager Board and Nurse Cockpit at the same time?</strong> Yes, if your account holds both roles - use the topbar button to switch; each keeps its own state.</p>
          <p><strong>Is the clinical content in this demo the fully licensed STCC protocol library?</strong> No. Treat the demo package as synthetic/open-source engineering and UAT content. A provenance value of <code>licensedContentIncluded: false</code> is authoritative; licensed content requires controlled import, release evidence, and named clinical approval before production activation.</p>
          <p><strong>Is the HRMS/employment lookup connected to the real Oracle Fusion HCM system?</strong> No. It's a simulation layer that reads a locally-generated, Oracle-shaped data set (tens of thousands of synthetic employee records) with the same field names Oracle would return, not a live Oracle connection.</p>
          <p><strong>Why was my "hold" call still tied up when I tried to answer a new one?</strong> Holding is a frontend/UI-tracked state, capped at <code>MAX_HELD_CALLS = 1</code> - with one call already held, answering another or holding a second is blocked until the held call is resumed or completed.</p>
        `
      }
    ]
  }
];

function renderArticleHtml(article: TopicArticle): string {
  return `<article class="help-article" id="article-${escapeHtml(article.id)}" data-search="${escapeHtml(
    article.title
  )}">
    <h3>${escapeHtml(article.title)}</h3>
    ${article.body}
  </article>`;
}

function renderTopicGroupNav(group: TopicGroup): string {
  return `<div class="topic-group">
    <h2>${escapeHtml(group.label)}</h2>
    <div class="topic-list">
      ${group.articles
        .map(
          (article) =>
            `<button type="button" class="topic-button" data-target="article-${escapeHtml(article.id)}" data-group="${escapeHtml(
              group.id
            )}">${escapeHtml(article.title)}</button>`
        )
        .join("\n")}
    </div>
  </div>`;
}

function renderRestrictedVaultSection(): string {
  return `<section id="restricted-vault" class="restricted-vault">
    <h2>Restricted Operations Vault</h2>
    <p class="vault-note">This section is limited to Security, Privacy, Compliance, and Governance roles, and requires a
      secondary password on top of your existing sign-in. It never displays actual secret values - only where each
      credential is managed, who owns it, and its rotation policy.</p>
    <div id="vault-locked" class="vault-locked">
      <label for="vault-password">Restricted-access password</label>
      <input id="vault-password" type="password" autocomplete="off" />
      <button id="vault-unlock-button" type="button">Unlock</button>
      <p id="vault-error" class="vault-error" role="alert"></p>
    </div>
    <div id="vault-content" class="vault-content" hidden></div>
  </section>`;
}

export function renderHelpLibraryHtml(
  session: AuthenticatedSession,
  hasRestrictedVaultAccess: boolean,
  accessToken: string
): string {
  const userName = escapeHtml(session.user.fullName ?? session.user.id);
  const roleLabel = escapeHtml(session.activeRole.replace(/_/g, " "));
  // Embedded so help.js can attach it as an Authorization header on its own
  // fetch calls (restricted vault verify/read) - Firebase Hosting's rewrite
  // proxy to Cloud Run does not forward the Cookie header (see authToken.ts),
  // so `credentials: "include"` alone never authenticates on the custom
  // domain. Kept alongside credentials:"include" as a harmless fallback for
  // any deployment where cookies do work.
  const escapedAccessToken = escapeHtml(accessToken);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>IST Health Teletriage — Help &amp; Library</title>
<style>
  :root {
    --bg: #f7f6f3; --bg-soft: #f1efe9; --surface: #ffffff; --ink: #1a1a19;
    --muted: #65645f; --subtle: #98968f; --line: #dfddd6; --accent: #185fa5;
    --accent-soft: #e7f1fb; --accent-border: #9cc2e8; --gold: #e4c454;
    --danger: #a32d2d; --danger-soft: #fcebeb;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; font-family: "Segoe UI", system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--ink); }
  body { font-size: 14px; line-height: 1.55; }
  button, input { font: inherit; }
  code { background: var(--bg-soft); border-radius: 4px; padding: 1px 5px; font-size: 0.92em; }
  .topbar { height: 64px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; background: var(--surface); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 10; }
  .brand strong { color: var(--accent); font-size: 19px; }
  .brand span { color: var(--muted); font-size: 12.5px; margin-left: 8px; }
  .session-chip { color: var(--muted); font-size: 12.5px; }
  .search-wrap { padding: 18px 28px 0; max-width: 640px; }
  #global-search { width: 100%; height: 42px; border: 1px solid var(--line); border-radius: 8px; padding: 0 14px; background: var(--surface); }
  #global-search:focus { outline: none; border-color: var(--accent); }
  .hero { padding: 26px 28px 6px; }
  .hero h1 { margin: 0; font-family: Georgia, serif; font-weight: 500; font-size: 30px; }
  .hero p { color: var(--muted); max-width: 720px; }
  .workspace { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 0; margin: 20px 28px 40px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; }
  .topic-panel { padding: 22px 14px; background: var(--bg-soft); border-right: 1px solid var(--line); overflow-y: auto; max-height: calc(100vh - 220px); }
  .topic-group { margin-bottom: 18px; }
  .topic-group h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--subtle); margin: 0 10px 8px; }
  .topic-list { display: flex; flex-direction: column; gap: 3px; }
  .topic-button { text-align: left; border: 0; background: transparent; padding: 9px 12px; border-radius: 6px; cursor: pointer; color: var(--ink); font-weight: 600; font-size: 13px; }
  .topic-button:hover, .topic-button.active { background: var(--accent-soft); color: var(--accent); }
  .article-panel { padding: 30px 34px; overflow-y: auto; max-height: calc(100vh - 220px); }
  .help-article { display: none; max-width: 780px; }
  .help-article.active { display: block; }
  .help-article h3 { font-size: 20px; margin-top: 0; }
  .ref-table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
  .ref-table th, .ref-table td { border: 1px solid var(--line); padding: 8px 10px; text-align: left; }
  .ref-table th { background: var(--bg-soft); }
  .restricted-vault { margin-top: 36px; padding-top: 24px; border-top: 2px solid var(--line); }
  .vault-note { color: var(--muted); font-size: 13px; max-width: 720px; }
  .vault-locked { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
  #vault-password { height: 40px; border: 1px solid var(--line); border-radius: 6px; padding: 0 12px; width: 260px; }
  #vault-unlock-button { height: 40px; padding: 0 16px; border-radius: 6px; border: 1px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; font-weight: 700; }
  .vault-error { color: var(--danger); font-size: 12.5px; margin-left: 8px; }
  .vault-content table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12.5px; }
  .vault-content th, .vault-content td { border: 1px solid var(--line); padding: 7px 9px; text-align: left; }
  .vault-content th { background: var(--bg-soft); }
</style>
</head>
<body data-token="${escapedAccessToken}">
  <header class="topbar">
    <div class="brand"><strong>IST Health</strong><span>Teletriage — Help &amp; Library</span></div>
    <div class="session-chip">${userName} · ${roleLabel}</div>
  </header>
  <div class="search-wrap">
    <input id="global-search" type="text" placeholder="Search Help &amp; Library..." />
  </div>
  <section class="hero">
    <h1>IST Health Teletriage<br />Help &amp; Clinical Library</h1>
    <p>Find guidance for the Nurse Cockpit, Triage Service Manager Board, clinical workflows, safety, access, privacy and common support questions.</p>
  </section>
  <div class="workspace">
    <nav class="topic-panel">
      ${TOPIC_GROUPS.map(renderTopicGroupNav).join("\n")}
    </nav>
    <main class="article-panel" id="article-panel">
      ${TOPIC_GROUPS.flatMap((group) => group.articles.map(renderArticleHtml)).join("\n")}
      ${hasRestrictedVaultAccess ? renderRestrictedVaultSection() : ""}
    </main>
  </div>
  <script src="/help.js"></script>
</body>
</html>`;
}

/**
 * Served as a separate same-origin file (GET /help.js) rather than an inline
 * <script> block, because the app's existing Content-Security-Policy
 * (helmet, src/app.ts) sets `script-src 'self'` with no `'unsafe-inline'` -
 * an inline script on this page would be silently blocked by the browser,
 * leaving every article permanently hidden. A same-origin external file
 * satisfies `'self'` without loosening the CSP anywhere else in the app.
 */
export const HELP_LIBRARY_CLIENT_JS = `(function () {
  var buttons = document.querySelectorAll(".topic-button");
  var articles = document.querySelectorAll(".help-article");
  function activate(targetId) {
    articles.forEach(function (a) { a.classList.toggle("active", a.id === targetId); });
    buttons.forEach(function (b) { b.classList.toggle("active", b.dataset.target === targetId); });
  }
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      activate(button.dataset.target);
      button.scrollIntoView({ block: "nearest" });
    });
  });
  if (articles.length) activate(articles[0].id);

  document.querySelectorAll("a[data-topic]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var topicId = link.dataset.topic;
      var targetButton = document.querySelector('.topic-button[data-target="article-' + topicId + '"]') ||
        document.querySelector('.topic-button[data-group="' + topicId + '"]');
      if (targetButton) {
        activate(targetButton.dataset.target);
        targetButton.scrollIntoView({ block: "center" });
        var articlePanel = document.getElementById("article-panel");
        if (articlePanel) articlePanel.scrollTop = 0;
      }
    });
  });

  var search = document.getElementById("global-search");
  search.addEventListener("input", function () {
    var query = search.value.trim().toLowerCase();
    if (!query) return;
    var firstMatch = Array.from(articles).find(function (a) {
      return a.textContent.toLowerCase().includes(query);
    });
    if (firstMatch) activate(firstMatch.id);
  });

  var authToken = document.body.dataset.token;
  var authHeader = authToken ? { "Authorization": "Bearer " + authToken } : {};

  var unlockButton = document.getElementById("vault-unlock-button");
  if (unlockButton) {
    unlockButton.addEventListener("click", function () {
      var password = document.getElementById("vault-password").value;
      var errorEl = document.getElementById("vault-error");
      errorEl.textContent = "";
      fetch("/api/v1/help/restricted-access/verify", {
        method: "POST",
        credentials: "include",
        headers: Object.assign({ "Content-Type": "application/json" }, authHeader),
        body: JSON.stringify({ password: password })
      })
        .then(function (response) {
          if (!response.ok) return response.json().then(function (body) { throw new Error(body.error || "Access denied"); });
          return fetch("/api/v1/help/restricted-vault", { credentials: "include", headers: authHeader });
        })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (!data.entries) return;
          var rows = data.entries.map(function (entry) {
            return "<tr><td>" + entry.system + "</td><td>" + entry.credentialType + "</td><td>" + entry.owner +
              "</td><td>" + entry.storageLocation + "</td><td>" + entry.environment + "</td><td>" + entry.rotationFrequency + "</td></tr>";
          }).join("");
          document.getElementById("vault-content").innerHTML =
            "<table><thead><tr><th>System</th><th>Credential type</th><th>Owner</th><th>Storage location</th><th>Environment</th><th>Rotation</th></tr></thead><tbody>" +
            rows + "</tbody></table>";
          document.getElementById("vault-content").hidden = false;
          document.getElementById("vault-locked").hidden = true;
        })
        .catch(function (error) { errorEl.textContent = error.message; });
    });
  }
})();
`;
