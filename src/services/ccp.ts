import { validateStaffMember } from "./hrms.js";
import type {
  CcpCommunicationRecord,
  CcpConsentState,
  CcpControllerState,
  CcpGoal,
  CcpVisitThread,
  EmployeeCcpSummary
} from "../types/ccp.js";
import type { StaffProfile } from "../types/triage.js";

const generatedAtIso = "2026-07-10T08:00:00.000Z";

function dependentSummary(profile: StaffProfile): string {
  if (profile.dependents.length === 0) {
    return "No dependents mapped in the demo HRMS directory.";
  }

  return profile.dependents
    .map((dependent) => `${dependent.relationshipType}, age ${dependent.age}`)
    .join("; ");
}

function buildConsent(profile: StaffProfile): CcpConsentState {
  const onLeave = profile.dutyStatus === "on-leave";

  return {
    status: onLeave ? "limited" : "active",
    lastVerifiedIso: onLeave ? "2026-06-20T08:00:00.000Z" : "2026-07-10T07:44:00.000Z",
    lawfulBasis:
      "Employee health operations, duty-of-care response, clinical safety follow-up, and audited support communication.",
    consentNote: onLeave
      ? "Employee is on leave, so duty-status and scheduling messages require manual confirmation before outreach."
      : "Employee communication is enabled for triage, callback, safety precautions, booking support, and audited follow-up.",
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
        channel: "whatsapp",
        label: "WhatsApp",
        status: onLeave ? "limited" : "enabled",
        purpose: "Employee-friendly follow-up where approved by policy and consent.",
        policy: "Use approved templates only after Remote Triage Nurse review and send approval."
      },
      {
        channel: "email",
        label: "Email",
        status: "limited",
        purpose: "Non-urgent appointment, policy, and administrative summaries.",
        policy: "Avoid PHI unless encrypted, clinically appropriate, and nurse-approved for the employee case."
      },
      {
        channel: "portal",
        label: "Secure portal",
        status: "enabled",
        purpose: "Single employee thread, tasks, handoffs, and auditable notes.",
        policy: "Preferred channel for sensitive follow-up and role-scoped internal access."
      }
    ]
  };
}

const currentThreadId = "ccp-thread-2026-07-10-current-call";

function buildCurrentThread(profile: StaffProfile): CcpVisitThread {
  return {
    id: currentThreadId,
    title: "Current tele-triage call",
    visitType: "call",
    status: "active",
    openedAtIso: "2026-07-10T07:35:00.000Z",
    reason:
      profile.department === "Flight Operations"
        ? "Chest tightness and duty-sensitive fit-to-fly review"
        : "Remote triage call with leave-status follow-up",
    routeSummary: "Acuity-first checklist, nurse approval gate, route handoff, and callback precautions.",
    primaryOwnerRole: "Remote Triage Nurse",
    threadHref: `#${currentThreadId}`,
    lastCommunication: {
      occurredAtIso: "2026-07-10T08:20:00.000Z",
      channel: "portal",
      actor: "Occupational Health Clinician",
      subject: "Fit-to-duty follow-up task",
      summary: "Duty-sensitive follow-up task created so the employee case remains visible after the live call."
    }
  };
}

function buildLinkedPreviousThreads(profile: StaffProfile): CcpVisitThread[] {
  const previousThreads: CcpVisitThread[] = [
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
  ];

  if (profile.dependents.length > 0) {
    previousThreads.push({
      id: "ccp-thread-2026-06-09-dependent-pediatric-call",
      title: "Previous dependent pediatric call",
      visitType: "call",
      status: "closed",
      openedAtIso: "2026-06-09T15:30:00.000Z",
      closedAtIso: "2026-06-09T17:20:00.000Z",
      reason: "Child dependent fever triage with guardian callback.",
      routeSummary: "Pediatric route checked; nurse-guided self-care with callback precautions.",
      primaryOwnerRole: "Pediatric Triage Nurse",
      threadHref: "#ccp-thread-2026-06-09-dependent-pediatric-call",
      lastCommunication: {
        occurredAtIso: "2026-06-09T17:20:00.000Z",
        channel: "call",
        actor: "Pediatric Triage Nurse",
        subject: "Guardian callback completed",
        summary:
          "Guardian confirmed fever precautions understood and agreed to seek emergency review if breathing, lethargy, rash, or dehydration signs appeared."
      }
    });
  }

  return previousThreads;
}

function buildGoals(profile: StaffProfile): CcpGoal[] {
  const goals: CcpGoal[] = [
    {
      id: "ccp-goal-red-flag-precautions",
      threadId: currentThreadId,
      title: "Confirm red-flag precautions understood",
      status: "open",
      ownerRole: "Remote Triage Nurse",
      priority: "high",
      dueIso: "2026-07-10T09:00:00.000Z",
      description:
        "Confirm the employee knows when to call emergency services or return to the triage line if symptoms worsen.",
      settlePoint: "Employee acknowledges emergency precautions or nurse records a second callback attempt.",
      nextAction: "Place callback and mark acknowledgement outcome."
    },
    {
      id: "ccp-goal-clinical-route",
      threadId: currentThreadId,
      title: "Close disposition route handoff",
      status: "waiting-human",
      ownerRole: "Senior Triage Nurse",
      priority: "high",
      dueIso: "2026-07-10T10:30:00.000Z",
      description:
        "Make sure the chosen clinical route is accepted, escalated, or changed by the clinician before the encounter is closed.",
      settlePoint: "Disposition is clinically validated and the SBAR handoff is copied or transferred.",
      nextAction: "Review encounter trace and confirm route."
    },
    {
      id: "ccp-goal-fit-to-duty",
      threadId: currentThreadId,
      title: "Track fit-to-duty or sickness follow-up",
      status: profile.department === "Flight Operations" ? "scheduled" : "open",
      ownerRole: "Occupational Health Clinician",
      priority: profile.department === "Flight Operations" ? "high" : "medium",
      dueIso: "2026-07-10T13:00:00.000Z",
      description:
        "Keep duty-sensitive follow-up visible until the occupational health or clinical reviewer closes the case.",
      settlePoint: "Fit-to-duty, sickness validation, or occupational follow-up outcome is documented.",
      nextAction: "Confirm duty-sensitive review requirement with occupational health."
    }
  ];

  if (profile.dependents.length > 0) {
    goals.push({
      id: "ccp-goal-dependent-context",
      threadId: currentThreadId,
      title: "Validate dependent communication context",
      status: "open",
      ownerRole: "Remote Triage Nurse",
      priority: "medium",
      dueIso: "2026-07-10T12:00:00.000Z",
      description:
        "For dependent cases, keep guardian identity, age band, and pediatric route selection attached to the same employee thread.",
      settlePoint: "Dependent context is confirmed and linked to the employee communication timeline.",
      nextAction: "Confirm whether the active case is for the employee or dependent."
    });
  }

  return goals;
}

function buildTimeline(profile: StaffProfile): CcpCommunicationRecord[] {
  const employeeContext =
    profile.department === "Flight Operations"
      ? "Cabin crew triage and duty-sensitive follow-up"
      : "Ground services triage and leave-status follow-up";

  return [
    {
      id: "ccp-comm-001",
      threadId: currentThreadId,
      occurredAtIso: "2026-07-10T07:35:00.000Z",
      direction: "inbound",
      kind: "call",
      channel: "call",
      actor: "Employee",
      subject: "Initial tele-triage contact",
      summary: `${employeeContext}. Employee identity and preferred callback path captured.`,
      linkedGoalId: "ccp-goal-red-flag-precautions",
      auditTags: ["identity-confirmed", "tele-triage-started"]
    },
    {
      id: "ccp-comm-002",
      threadId: currentThreadId,
      occurredAtIso: "2026-07-10T07:42:00.000Z",
      direction: "internal",
      kind: "emr-note",
      channel: "emr",
      actor: "Remote Triage Nurse",
      subject: "SBAR draft prepared",
      summary:
        "Acuity-first checklist, local route rationale, insurance snapshot, and aviation context are packaged for clinician validation.",
      linkedGoalId: "ccp-goal-clinical-route",
      auditTags: ["sbar-draft", "human-approval-required"]
    },
    {
      id: "ccp-comm-003",
      threadId: currentThreadId,
      occurredAtIso: "2026-07-10T07:50:00.000Z",
      direction: "outbound",
      kind: "sms",
      channel: "sms",
      actor: "Remote Triage Nurse approved; CCP controller delivered",
      subject: "Callback precaution message",
      summary:
        "Non-diagnostic callback message was sent only after Remote Triage Nurse review and approval.",
      linkedGoalId: "ccp-goal-red-flag-precautions",
      auditTags: ["nurse-approved", "template-controlled", "no-diagnosis"],
      approval: {
        status: "approved",
        requiredRole: "Remote Triage Nurse",
        approvedByRole: "Remote Triage Nurse",
        approvedAtIso: "2026-07-10T07:49:00.000Z",
        note: "Employee-facing SMS was reviewed and approved by the nurse before send."
      }
    },
    {
      id: "ccp-comm-004",
      threadId: currentThreadId,
      occurredAtIso: "2026-07-10T08:05:00.000Z",
      direction: "internal",
      kind: "task",
      channel: "portal",
      actor: "Senior Triage Nurse",
      subject: "Disposition route review",
      summary:
        "Clinical route held for human validation; AI draft cannot close or downgrade the disposition.",
      linkedGoalId: "ccp-goal-clinical-route",
      auditTags: ["controller-gate", "clinical-review"]
    },
    {
      id: "ccp-comm-005",
      threadId: currentThreadId,
      occurredAtIso: "2026-07-10T08:20:00.000Z",
      direction: "internal",
      kind: "portal-note",
      channel: "portal",
      actor: "Occupational Health Clinician",
      subject: "Fit-to-duty follow-up task",
      summary:
        "Duty-sensitive follow-up task created so the employee case remains visible after the live call.",
      linkedGoalId: "ccp-goal-fit-to-duty",
      auditTags: ["fit-to-duty", "follow-up"]
    }
  ];
}

function buildController(): CcpControllerState {
  return {
    controllerName: "CCP employee communication controller",
    rules: [
      "Each visit, call, teleconsult, or clinic encounter opens a separate CCP thread under the same employee CCP index.",
      "The nurse sees linked previous threads and their last communication, but the current visit/call remains a separate active thread.",
      "Inbound channel content is detected and summarized, but employee-facing outbound messages stay queued until nurse review and approval.",
      "WhatsApp, SMS, and email are transport adapters under the CCP gate; callers create drafts and never invoke Twilio or Graph directly.",
      "Every communication links to a goal, a channel, an actor, and an audit tag so the case can be reviewed quickly."
    ],
    hardFloors: [
      "Emergency and red-flag precautions are never delayed by routine cadence rules.",
      "No SMS, WhatsApp, email, or employee portal message is sent before Remote Triage Nurse approval is recorded.",
      "A new visit/call cannot overwrite or merge into a closed previous thread; it links back to prior context for review only.",
      "AI text can draft summaries but cannot approve a clinical disposition, fit-to-duty result, or sickness validation.",
      "Sensitive employee health content uses the secure portal or approved encrypted handoff, not plain SMS."
    ],
    humanGates: [
      "Remote Triage Nurse reviews and approves every employee-facing message before send.",
      "Remote Triage Nurse validates live clinical advice.",
      "Senior Triage Nurse or physician validates escalated route changes.",
      "Occupational Health Clinician validates fit-to-duty and sickness follow-up.",
      "Privacy or security roles control reveal, export, and non-standard disclosure."
    ],
    auditMode:
      "MVP demo summary only; production should persist the single-writer ledger, immutable events, retention state, and channel delivery receipts."
  };
}

export async function getEmployeeCcpSummary(istStaffId: string): Promise<EmployeeCcpSummary | null> {
  const validation = await validateStaffMember(istStaffId);
  if (!validation.valid || !validation.profile) {
    return null;
  }

  const profile = validation.profile;
  const consent = buildConsent(profile);
  const currentThread = buildCurrentThread(profile);
  const linkedPreviousThreads = buildLinkedPreviousThreads(profile);
  const goals = buildGoals(profile);
  const timeline = buildTimeline(profile);
  const completedGoals = goals.filter((goal) => goal.status === "completed").length;
  const openGoals = goals.length - completedGoals;

  return {
    generatedAtIso,
    pipelineName: "CCP",
    pipelineMeaning: "Continuous Communication Pipeline",
    subject: {
      staff: profile,
      displayName: `${profile.jobTitle} ${profile.istStaffId}`,
      primaryContext: `${profile.department} | ${profile.dutyStatus}`,
      dependentSummary: dependentSummary(profile),
      communicationScope:
        "One employee CCP index with a separate thread for each visit, call, teleconsult, or clinic encounter; prior threads remain linked for nurse review."
    },
    metrics: {
      activeChannels: consent.channels.filter((channel) => channel.status === "enabled").length,
      openGoals,
      completedGoals,
      totalCommunications: timeline.length,
      totalThreads: 1 + linkedPreviousThreads.length,
      linkedPreviousThreads: linkedPreviousThreads.length,
      lastContactIso: timeline[timeline.length - 1]?.occurredAtIso ?? generatedAtIso,
      nextAction: goals.find((goal) => goal.status !== "completed")?.nextAction ?? "No open CCP actions."
    },
    currentThread,
    linkedPreviousThreads,
    consent,
    goals,
    timeline,
    controller: buildController()
  };
}
