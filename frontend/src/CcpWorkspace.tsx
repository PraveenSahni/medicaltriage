import {
  Clock3,
  Link2,
  Mail,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRoundCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CcpChannelStatus = "enabled" | "limited" | "disabled";
type CcpGoalStatus = "open" | "waiting-human" | "scheduled" | "completed" | "blocked";

type CommunicationTransportStatus = {
  mode: "dry-run" | "live";
  provider: string;
  configured: boolean;
  live: boolean;
  notes: string[];
};

type CommunicationStatus = {
  mode: "dry-run" | "live";
  outboundGate: string;
  inboundGate: string;
  messaging: CommunicationTransportStatus & {
    channels: Array<"sms" | "whatsapp">;
    inboundWebhookPath: string;
  };
  email: CommunicationTransportStatus & {
    channel: "email";
  };
  safety: string[];
};

type CcpVisitThread = {
  id: string;
  title: string;
  visitType: "call" | "clinic-visit" | "teleconsult" | "follow-up";
  status: "active" | "closed" | "follow-up-open";
  openedAtIso: string;
  closedAtIso?: string;
  reason: string;
  routeSummary: string;
  primaryOwnerRole: string;
  threadHref: string;
  lastCommunication: {
    occurredAtIso: string;
    channel: string;
    actor: string;
    subject: string;
    summary: string;
  };
};

type StaffProfile = {
  id: string;
  istStaffId: string;
  department: string;
  jobTitle: string;
  dutyStatus: string;
  insuranceProvider?: string;
  insuranceEligibilityStatus: string;
  dependents: Array<{
    id: string;
    relationshipType: string;
    age: number;
    biologicalSex: string;
  }>;
};

type EmployeeCcpSummary = {
  generatedAtIso: string;
  pipelineName: "CCP";
  pipelineMeaning: "Continuous Communication Pipeline";
  subject: {
    staff: StaffProfile;
    displayName: string;
    primaryContext: string;
    dependentSummary: string;
    communicationScope: string;
  };
  metrics: {
    activeChannels: number;
    openGoals: number;
    completedGoals: number;
    totalCommunications: number;
    totalThreads: number;
    linkedPreviousThreads: number;
    lastContactIso: string;
    nextAction: string;
  };
  currentThread: CcpVisitThread;
  linkedPreviousThreads: CcpVisitThread[];
  consent: {
    status: "active" | "limited" | "needs-review";
    lastVerifiedIso: string;
    lawfulBasis: string;
    consentNote: string;
    channels: Array<{
      channel: string;
      label: string;
      status: CcpChannelStatus;
      purpose: string;
      policy: string;
    }>;
  };
  goals: Array<{
    id: string;
    threadId: string;
    title: string;
    status: CcpGoalStatus;
    ownerRole: string;
    priority: "high" | "medium" | "normal";
    dueIso: string;
    description: string;
    settlePoint: string;
    nextAction: string;
  }>;
  timeline: Array<{
    id: string;
    threadId: string;
    occurredAtIso: string;
    direction: "inbound" | "outbound" | "internal";
    kind: string;
    channel: string;
    actor: string;
    subject: string;
    summary: string;
    linkedGoalId?: string;
    auditTags: string[];
    approval?: {
      status: "not-required" | "pending-nurse-review" | "approved";
      requiredRole: string;
      approvedByRole?: string;
      approvedAtIso?: string;
      note: string;
    };
  }>;
  controller: {
    controllerName: string;
    rules: string[];
    hardFloors: string[];
    humanGates: string[];
    auditMode: string;
  };
};

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

const fallbackCommunicationStatus: CommunicationStatus = {
  mode: "dry-run",
  outboundGate:
    "Draft -> Remote Triage Nurse review -> consent/channel guard -> optional test redirect -> provider adapter.",
  inboundGate: "Verify provider signature -> parse text/media -> persist inbound record -> acknowledge provider quickly.",
  messaging: {
    mode: "dry-run",
    provider: "dry-run-messaging",
    configured: false,
    live: false,
    channels: ["sms", "whatsapp"],
    inboundWebhookPath: "/api/v1/ccp/webhooks/twilio",
    notes: [
      "Twilio is the live WhatsApp/SMS adapter when CCP_TRANSPORT_MODE=live and TWILIO_* secrets are configured.",
      "Dry-run mode records approval and dispatch intent without sending an external message."
    ]
  },
  email: {
    mode: "dry-run",
    provider: "dry-run-email",
    configured: false,
    live: false,
    channel: "email",
    notes: [
      "Microsoft Graph sendMail is the live email adapter when MS_GRAPH_* and EMAIL_FROM are configured.",
      "Dry-run mode records approval and dispatch intent without sending an external email."
    ]
  },
  safety: [
    "Every employee-facing outbound message must have Remote Triage Nurse approval before dispatch.",
    "Consent and channel eligibility are checked before the adapter is invoked."
  ]
};

const fallbackSummary: EmployeeCcpSummary = {
  generatedAtIso: "2026-07-10T08:00:00.000Z",
  pipelineName: "CCP",
  pipelineMeaning: "Continuous Communication Pipeline",
  subject: {
    staff: {
      id: "staff_demo_10001",
      istStaffId: "IST-10001",
      department: "Flight Operations",
      jobTitle: "Cabin Crew",
      dutyStatus: "active",
      insuranceProvider: "IST Staff Health Plan",
      insuranceEligibilityStatus: "eligible",
      dependents: [{ id: "dep_demo_10001_child", relationshipType: "child", age: 8, biologicalSex: "female" }]
    },
    displayName: "Cabin Crew IST-10001",
    primaryContext: "Flight Operations | active",
    dependentSummary: "child, age 8",
    communicationScope:
      "One employee CCP index with a separate thread for each visit, call, teleconsult, or clinic encounter; prior threads remain linked for nurse review."
  },
  metrics: {
    activeChannels: 4,
    openGoals: 4,
    completedGoals: 0,
    totalCommunications: 5,
    totalThreads: 3,
    linkedPreviousThreads: 2,
    lastContactIso: "2026-07-10T08:20:00.000Z",
    nextAction: "Place callback and mark acknowledgement outcome."
  },
  currentThread: {
    id: "ccp-thread-2026-07-10-current-call",
    title: "Current tele-triage call",
    visitType: "call",
    status: "active",
    openedAtIso: "2026-07-10T07:35:00.000Z",
    reason: "Chest tightness and duty-sensitive fit-to-fly review",
    routeSummary: "Acuity-first checklist, nurse approval gate, route handoff, and callback precautions.",
    primaryOwnerRole: "Remote Triage Nurse",
    threadHref: "#ccp-thread-2026-07-10-current-call",
    lastCommunication: {
      occurredAtIso: "2026-07-10T08:20:00.000Z",
      channel: "portal",
      actor: "Occupational Health Clinician",
      subject: "Fit-to-duty follow-up task",
      summary: "Duty-sensitive follow-up task created so the employee case remains visible after the live call."
    }
  },
  linkedPreviousThreads: [
    {
      id: "ccp-thread-2026-07-03-vaccination-follow-up",
      title: "Previous vaccination reaction follow-up",
      visitType: "follow-up",
      status: "closed",
      openedAtIso: "2026-07-03T06:20:00.000Z",
      closedAtIso: "2026-07-03T16:45:00.000Z",
      reason: "Post-vaccination fever and local arm swelling after duty roster update.",
      routeSummary: "Routine nurse callback with red-flag precautions; no duty escalation required.",
      primaryOwnerRole: "Remote Triage Nurse",
      threadHref: "#ccp-thread-2026-07-03-vaccination-follow-up",
      lastCommunication: {
        occurredAtIso: "2026-07-03T16:45:00.000Z",
        channel: "sms",
        actor: "Remote Triage Nurse approved; CCP controller delivered",
        subject: "Closed callback precaution",
        summary:
          "Nurse-approved callback text confirmed symptoms improving and reminded the employee to call back for fever, breathing symptoms, rash, or swelling progression."
      }
    },
    {
      id: "ccp-thread-2026-06-18-sickness-validation",
      title: "Previous sickness validation call",
      visitType: "teleconsult",
      status: "closed",
      openedAtIso: "2026-06-18T09:05:00.000Z",
      closedAtIso: "2026-06-18T13:10:00.000Z",
      reason: "Sickness validation and fit-to-duty review for duty-sensitive staff case.",
      routeSummary: "Teleconsult completed; occupational health outcome documented.",
      primaryOwnerRole: "Occupational Health Clinician",
      threadHref: "#ccp-thread-2026-06-18-sickness-validation",
      lastCommunication: {
        occurredAtIso: "2026-06-18T13:10:00.000Z",
        channel: "portal",
        actor: "Occupational Health Clinician",
        subject: "Fit-to-duty closure note",
        summary:
          "Occupational health closed the thread after documenting fit-to-duty outcome and employee callback instructions."
      }
    }
  ],
  consent: {
    status: "active",
    lastVerifiedIso: "2026-07-10T07:44:00.000Z",
    lawfulBasis:
      "Employee health operations, duty-of-care response, clinical safety follow-up, and audited support communication.",
    consentNote:
      "Employee communication is enabled for triage, callback, safety precautions, booking support, and audited follow-up.",
    channels: [
      {
        channel: "call",
        label: "Verified phone call",
        status: "enabled",
        purpose: "Live triage, callbacks, urgent clarification, and emergency escalation.",
        policy: "Nurse or physician identity confirmation required before clinical discussion."
      },
      {
        channel: "sms",
        label: "SMS",
        status: "enabled",
        purpose: "Callback reminders, red-flag precautions, appointment prompts, and short operational updates.",
        policy: "No sensitive diagnosis text; send only nurse-reviewed and nurse-approved callback instructions."
      },
      {
        channel: "portal",
        label: "Secure portal",
        status: "enabled",
        purpose: "Single employee thread, tasks, handoffs, and auditable notes.",
        policy: "Preferred channel for sensitive follow-up and role-scoped internal access."
      }
    ]
  },
  goals: [
    {
      id: "ccp-goal-red-flag-precautions",
      threadId: "ccp-thread-2026-07-10-current-call",
      title: "Confirm red-flag precautions understood",
      status: "open",
      ownerRole: "Remote Triage Nurse",
      priority: "high",
      dueIso: "2026-07-10T09:00:00.000Z",
      description: "Confirm emergency precautions and callback instruction.",
      settlePoint: "Employee acknowledges emergency precautions.",
      nextAction: "Place callback and mark acknowledgement outcome."
    },
    {
      id: "ccp-goal-clinical-route",
      threadId: "ccp-thread-2026-07-10-current-call",
      title: "Close disposition route handoff",
      status: "waiting-human",
      ownerRole: "Senior Triage Nurse",
      priority: "high",
      dueIso: "2026-07-10T10:30:00.000Z",
      description: "Make sure the chosen clinical route is accepted, escalated, or changed.",
      settlePoint: "Disposition is clinically validated.",
      nextAction: "Review encounter trace and confirm route."
    }
  ],
  timeline: [
    {
      id: "ccp-comm-001",
      threadId: "ccp-thread-2026-07-10-current-call",
      occurredAtIso: "2026-07-10T07:35:00.000Z",
      direction: "inbound",
      kind: "call",
      channel: "call",
      actor: "Employee",
      subject: "Initial tele-triage contact",
      summary: "Employee identity and preferred callback path captured.",
      linkedGoalId: "ccp-goal-red-flag-precautions",
      auditTags: ["identity-confirmed", "tele-triage-started"]
    },
    {
      id: "ccp-comm-003",
      threadId: "ccp-thread-2026-07-10-current-call",
      occurredAtIso: "2026-07-10T07:50:00.000Z",
      direction: "outbound",
      kind: "sms",
      channel: "sms",
      actor: "Remote Triage Nurse approved; CCP controller delivered",
      subject: "Callback precaution message",
      summary: "Non-diagnostic callback message was sent only after Remote Triage Nurse review and approval.",
      linkedGoalId: "ccp-goal-red-flag-precautions",
      auditTags: ["nurse-approved", "template-controlled", "no-diagnosis"],
      approval: {
        status: "approved",
        requiredRole: "Remote Triage Nurse",
        approvedByRole: "Remote Triage Nurse",
        approvedAtIso: "2026-07-10T07:49:00.000Z",
        note: "Employee-facing SMS was reviewed and approved by the nurse before send."
      }
    }
  ],
  controller: {
    controllerName: "CCP employee communication controller",
    rules: [
      "Each visit, call, teleconsult, or clinic encounter opens a separate CCP thread under the same employee CCP index.",
      "The nurse sees linked previous threads and their last communication, but the current visit/call remains a separate active thread.",
      "Employee-facing outbound messages stay queued until nurse review and approval.",
      "WhatsApp, SMS, and email are transport adapters under the CCP gate; callers create drafts and never invoke Twilio or Graph directly."
    ],
    hardFloors: [
      "Emergency and red-flag precautions are never delayed by routine cadence rules.",
      "No SMS, WhatsApp, email, or employee portal message is sent before Remote Triage Nurse approval is recorded."
    ],
    humanGates: [
      "Remote Triage Nurse reviews and approves every employee-facing message before send.",
      "Remote Triage Nurse validates live clinical advice."
    ],
    auditMode: "MVP demo summary only; production should persist the single-writer ledger."
  }
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function statusLabel(status: string) {
  return status.replace(/-/g, " ");
}

function channelStatusClass(status: CcpChannelStatus) {
  if (status === "enabled") {
    return "ccp-status ccp-status-enabled";
  }
  if (status === "limited") {
    return "ccp-status ccp-status-limited";
  }
  return "ccp-status ccp-status-disabled";
}

function goalStatusClass(status: CcpGoalStatus) {
  if (status === "completed") {
    return "ccp-status ccp-status-enabled";
  }
  if (status === "blocked" || status === "waiting-human") {
    return "ccp-status ccp-status-limited";
  }
  return "ccp-status ccp-status-open";
}

export default function CcpWorkspace() {
  const [staffId, setStaffId] = useState("IST-10001");
  const [lookupId, setLookupId] = useState("IST-10001");
  const [summary, setSummary] = useState<EmployeeCcpSummary>(fallbackSummary);
  const [status, setStatus] = useState("CCP demo thread loaded locally.");
  const [communicationStatus, setCommunicationStatus] = useState<CommunicationStatus>(fallbackCommunicationStatus);
  const [loading, setLoading] = useState(false);
  const [selectedPreviousThreadId, setSelectedPreviousThreadId] = useState(
    fallbackSummary.linkedPreviousThreads[0]?.id ?? ""
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/v1/ccp/employee/${encodeURIComponent(lookupId)}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("CCP endpoint returned an error.");
        }

        const payload = (await response.json()) as EmployeeCcpSummary;
        setSummary(payload);
        setSelectedPreviousThreadId(payload.linkedPreviousThreads[0]?.id ?? "");
        setStatus(`CCP loaded for ${payload.subject.staff.istStaffId}.`);
      } catch {
        if (!controller.signal.aborted) {
          setSummary(fallbackSummary);
          setSelectedPreviousThreadId(fallbackSummary.linkedPreviousThreads[0]?.id ?? "");
          setStatus("API not available. Showing the local CCP demonstration thread.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSummary();
    return () => controller.abort();
  }, [lookupId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCommunicationStatus() {
      try {
        const response = await fetch(`${apiBase}/api/v1/ccp/communication/status`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error("Communication status endpoint returned an error.");
        }

        const payload = (await response.json()) as CommunicationStatus;
        setCommunicationStatus(payload);
      } catch {
        if (!controller.signal.aborted) {
          setCommunicationStatus(fallbackCommunicationStatus);
        }
      }
    }

    loadCommunicationStatus();
    return () => controller.abort();
  }, []);

  const nextGoal = useMemo(
    () => summary.goals.find((goal) => goal.status !== "completed") ?? summary.goals[0],
    [summary.goals]
  );
  const selectedPreviousThread = useMemo(
    () =>
      summary.linkedPreviousThreads.find((thread) => thread.id === selectedPreviousThreadId) ??
      summary.linkedPreviousThreads[0],
    [selectedPreviousThreadId, summary.linkedPreviousThreads]
  );

  return (
    <section className="ccp-shell">
      <div className="ccp-command-bar">
        <div>
          <span className="tag-label">CCP EMPLOYEE THREAD</span>
          <h2>{summary.pipelineName} - {summary.pipelineMeaning}</h2>
          <p>{summary.subject.communicationScope}</p>
        </div>
        <form
          className="ccp-lookup"
          onSubmit={(event) => {
            event.preventDefault();
            setLookupId(staffId.trim() || "IST-10001");
          }}
        >
          <label className="field-label" htmlFor="ccp-staff-id">Employee ID</label>
          <div className="ccp-lookup-row">
            <input
              id="ccp-staff-id"
              className="input-control"
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
              placeholder="IST-10001"
            />
            <button className="primary-button" type="submit" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Load
            </button>
          </div>
          <small>{status}</small>
        </form>
      </div>

      <div className="ccp-metric-grid">
        <MetricCard label="Active channels" value={summary.metrics.activeChannels} icon={PhoneCall} />
        <MetricCard label="Open goals" value={summary.metrics.openGoals} icon={Clock3} />
        <MetricCard label="Communications" value={summary.metrics.totalCommunications} icon={MessageSquare} />
        <MetricCard label="Linked threads" value={summary.metrics.linkedPreviousThreads} icon={Link2} />
      </div>

      <div className="ccp-main-grid">
        <article className="ccp-panel ccp-panel-accent">
          <div className="ccp-panel-heading">
            <span className="help-icon">
              <UserRoundCheck className="h-5 w-5" />
            </span>
            <div>
              <span className="tag-label">EMPLOYEE</span>
              <h3>{summary.subject.displayName}</h3>
              <p>{summary.subject.primaryContext}</p>
            </div>
          </div>
          <dl className="ccp-definition-grid">
            <div>
              <dt>Insurance</dt>
              <dd>{summary.subject.staff.insuranceProvider ?? "Not configured"}</dd>
            </div>
            <div>
              <dt>Eligibility</dt>
              <dd>{statusLabel(summary.subject.staff.insuranceEligibilityStatus)}</dd>
            </div>
            <div>
              <dt>Dependents</dt>
              <dd>{summary.subject.dependentSummary}</dd>
            </div>
            <div>
              <dt>Last contact</dt>
              <dd>{formatDateTime(summary.metrics.lastContactIso)}</dd>
            </div>
          </dl>
        </article>

        <article className="ccp-panel">
          <div className="ccp-panel-heading">
            <span className="help-icon">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <span className="tag-label">NEXT ACTION</span>
              <h3>{nextGoal?.title ?? "No open action"}</h3>
              <p>{summary.metrics.nextAction}</p>
            </div>
          </div>
          {nextGoal && (
            <div className="ccp-next-box">
              <span className={goalStatusClass(nextGoal.status)}>{statusLabel(nextGoal.status)}</span>
              <strong>{nextGoal.ownerRole}</strong>
              <small>Due {formatDateTime(nextGoal.dueIso)}</small>
            </div>
          )}
        </article>
      </div>

      <article className="ccp-panel">
        <div className="ccp-panel-heading">
          <span className="help-icon">
            <Link2 className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">THREAD CONTINUITY</span>
            <h3>Separate thread for this visit, linked history for the nurse</h3>
            <p>
              A new visit or call opens a new CCP thread. Previous threads remain closed and
              separate, but the nurse can open the last communication link for context.
            </p>
          </div>
        </div>

        <div className="ccp-thread-grid">
          <div className="ccp-current-thread" id={summary.currentThread.id}>
            <span className={goalStatusClass(summary.currentThread.status === "active" ? "open" : "completed")}>
              {statusLabel(summary.currentThread.status)}
            </span>
            <h4>{summary.currentThread.title}</h4>
            <p>{summary.currentThread.reason}</p>
            <dl>
              <div>
                <dt>Opened</dt>
                <dd>{formatDateTime(summary.currentThread.openedAtIso)}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{summary.currentThread.primaryOwnerRole}</dd>
              </div>
              <div>
                <dt>Route</dt>
                <dd>{summary.currentThread.routeSummary}</dd>
              </div>
            </dl>
          </div>

          <div className="ccp-linked-thread-panel">
            <h4>Linked previous threads</h4>
            <div className="ccp-thread-list" aria-label="Linked previous CCP threads">
              {summary.linkedPreviousThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`ccp-thread-card ${
                    selectedPreviousThread?.id === thread.id ? "ccp-thread-card-active" : ""
                  }`}
                  onClick={() => setSelectedPreviousThreadId(thread.id)}
                >
                  <span>{statusLabel(thread.status)}</span>
                  <strong>{thread.title}</strong>
                  <small>Last communication {formatDateTime(thread.lastCommunication.occurredAtIso)}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedPreviousThread && (
          <div className="ccp-last-communication">
            <div>
              <span className="tag-label">LAST COMMUNICATION LINK</span>
              <a href={selectedPreviousThread.threadHref}>
                {selectedPreviousThread.title} - {selectedPreviousThread.lastCommunication.subject}
              </a>
              <p>{selectedPreviousThread.lastCommunication.summary}</p>
            </div>
            <div className="ccp-chip-row">
              <code>{selectedPreviousThread.lastCommunication.channel}</code>
              <code>{selectedPreviousThread.lastCommunication.actor}</code>
              <code>{formatDateTime(selectedPreviousThread.lastCommunication.occurredAtIso)}</code>
            </div>
          </div>
        )}
      </article>

      <div className="ccp-main-grid">
        <article className="ccp-panel">
          <div className="ccp-panel-heading">
            <span className="help-icon">
              <PhoneCall className="h-5 w-5" />
            </span>
            <div>
              <span className="tag-label">CHANNEL CONTROL</span>
              <h3>Consent and communication access</h3>
              <p>{summary.consent.consentNote}</p>
            </div>
          </div>
          <div className="ccp-channel-list">
            {summary.consent.channels.map((channel) => (
              <div key={channel.label} className="ccp-channel-row">
                <div>
                  <strong>{channel.label}</strong>
                  <span>{channel.purpose}</span>
                  <small>{channel.policy}</small>
                </div>
                <span className={channelStatusClass(channel.status)}>{statusLabel(channel.status)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ccp-panel">
          <div className="ccp-panel-heading">
            <span className="help-icon">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <span className="tag-label">SETTLE POINTS</span>
              <h3>Open employee communication goals</h3>
              <p>Each goal has an owner, due time, next action, and closure condition.</p>
            </div>
          </div>
          <div className="ccp-goal-list">
            {summary.goals.map((goal) => (
              <div key={goal.id} className="ccp-goal-row">
                <div>
                  <span className={goalStatusClass(goal.status)}>{statusLabel(goal.status)}</span>
                  <strong>{goal.title}</strong>
                  <p>{goal.description}</p>
                  <small>{goal.settlePoint}</small>
                </div>
                <div className="ccp-goal-meta">
                  <b>{goal.ownerRole}</b>
                  <span>{goal.priority} priority</span>
                  <small>{formatDateTime(goal.dueIso)}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="ccp-panel ccp-panel-wide">
          <div className="ccp-panel-heading">
            <span className="help-icon">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <span className="tag-label">COMMUNICATION INTEGRATION</span>
              <h3>WhatsApp, SMS, and email adapter posture</h3>
              <p>{communicationStatus.outboundGate}</p>
            </div>
          </div>
          <div className="ccp-transport-grid">
            <TransportCard
              icon={MessageSquare}
              label="WhatsApp / SMS"
              status={communicationStatus.messaging}
              detail={`Inbound ${communicationStatus.messaging.inboundWebhookPath}`}
            />
            <TransportCard
              icon={Mail}
              label="Email"
              status={communicationStatus.email}
              detail="Microsoft Graph sendMail adapter"
            />
          </div>
          <div className="ccp-integration-note">
            <strong>{communicationStatus.mode === "live" ? "Live mode" : "Dry-run mode"}</strong>
            <span>{communicationStatus.safety[0]}</span>
            <small>{communicationStatus.inboundGate}</small>
          </div>
        </article>
      </div>

      <article className="ccp-panel">
        <div className="ccp-panel-heading">
          <span className="help-icon">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">COMMUNICATION LEDGER</span>
            <h3>Current visit/call thread timeline</h3>
            <p>
              Inbound, outbound, and internal communication for the active thread stays together.
              Previous thread context is available through the linked last-communication panel above.
            </p>
          </div>
        </div>
        <div className="ccp-timeline">
          {summary.timeline.map((item) => (
            <div key={item.id} className="ccp-timeline-row">
              <time>{formatDateTime(item.occurredAtIso)}</time>
              <div>
                <span className="ccp-direction">{item.direction} | {item.channel}</span>
                <strong>{item.subject}</strong>
                <p>{item.summary}</p>
                <div className="ccp-chip-row">
                  <code>{item.actor}</code>
                  {item.approval && <code>{statusLabel(item.approval.status)}</code>}
                  {item.auditTags.map((tag) => (
                    <code key={`${item.id}-${tag}`}>{tag}</code>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="ccp-panel">
        <div className="ccp-panel-heading">
          <span className="help-icon">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <span className="tag-label">CONTROLLER</span>
            <h3>{summary.controller.controllerName}</h3>
            <p>{summary.controller.auditMode}</p>
          </div>
        </div>
        <div className="ccp-controller-grid">
          <ControllerList title="Operating rules" items={summary.controller.rules} />
          <ControllerList title="Hard floors" items={summary.controller.hardFloors} />
          <ControllerList title="Human gates" items={summary.controller.humanGates} />
        </div>
      </article>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: number;
  icon: typeof PhoneCall;
}) {
  return (
    <article className="ccp-metric-card">
      <Icon className="h-4 w-4" />
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function TransportCard({
  icon: Icon,
  label,
  status,
  detail
}: {
  icon: typeof PhoneCall;
  label: string;
  status: CommunicationTransportStatus;
  detail: string;
}) {
  return (
    <div className="ccp-transport-card">
      <Icon className="h-4 w-4" />
      <div>
        <strong>{label}</strong>
        <span>{status.provider}</span>
        <small>{detail}</small>
      </div>
      <span className={status.live ? "ccp-status ccp-status-enabled" : "ccp-status ccp-status-limited"}>
        {status.live ? "live" : status.configured ? "configured dry-run" : "dry-run"}
      </span>
    </div>
  );
}

function ControllerList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="ccp-controller-list">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
