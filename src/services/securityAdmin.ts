import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { getAdminPassword, isMockMode } from "../config/runtime.js";
import type {
  AdminUser,
  AuditEvent,
  AuthenticatedSession,
  AuthMethod,
  AccountStatus,
  ControlCenterModule,
  DirectoryStatus,
  EncryptionPolicy,
  GovernanceWorkItem,
  IntegrationConnector,
  Permission,
  ProtocolLibraryItem,
  RevealRequest,
  ReportCatalogItem,
  Role,
  SafeAdminUser,
  SecurityDashboard,
  SsoProvider,
  SupportQueueItem,
  Responsibility
} from "../types/security.js";
import {
  getPersistedUserSession,
  persistSecurityAuditEvent,
  persistUserSession,
  revokePersistedSession,
  revokePersistedSessionsForUser
} from "./persistence.js";

const SESSION_COOKIE = "ist_triage_session";
const SESSION_TTL_MS = 30 * 60 * 1000;
const EXTENDED_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type OrganizationDirectoryRecord = {
  id: string;
  code: string;
  name: string;
  mophLicenseNumber: string;
};

// Single-tenant deployment: exactly one organization exists. HMC/PHCC/SIDRA
// are real Qatar hospitals used as disposition/destination routing targets
// only (see dispositionCode/destinationName values throughout
// queueOrchestration.ts and dispositionRouter.ts, e.g. HMC_EMERGENCY_
// DEPARTMENT, SIDRA_PEDIATRIC_ED) - they are NOT tenants and must never be
// listed as organizations here.
const organizationDirectory: OrganizationDirectoryRecord[] = [
  {
    id: "org_ist_tech",
    code: "IST_TECH",
    name: "IST Tech",
    mophLicenseNumber: "IST-TECH-PLATFORM"
  }
];

// Single-tenant deployment: every demo user shares one organization
// (IST_TECH). Splitting demo accounts across PHCC/HMC/SIDRA previously
// caused a manager-generated call to land in a different org than the nurse
// claiming it could see, producing orphaned cross-org queue records that
// never got processed. Multi-tenant RBAC (segregation/escalation across real
// orgs) remains fully implemented and tested - see multiTenantRBAC.test.ts,
// which now exercises it via ad hoc HRMS-synced test identities scoped to
// distinct orgs, not these demo accounts.
const organizationOverrideByUserId: Record<string, string> = {
  usr_platform_admin_10001: "IST_TECH",
  usr_system_admin_10001: "IST_TECH",
  usr_security_admin_10001: "IST_TECH",
  usr_org_admin_10001: "IST_TECH",
  usr_manager_10001: "IST_TECH",
  usr_intake_10001: "IST_TECH",
  usr_nurse_10001: "IST_TECH",
  usr_senior_nurse_10001: "IST_TECH",
  usr_pediatric_nurse_10001: "IST_TECH",
  usr_physician_10001: "IST_TECH",
  usr_occ_health_10001: "IST_TECH"
};

const demoPasswordByEmail: Record<string, string> = {
  "pa@irisstar.tech": "PlatformAdmin@2026",
  "oa@irisstar.tech": "OrgAdmin@2026",
  "sa@irisstar.tech": "SystemAdmin@2026",
  "sec@irisstar.tech": "SecurityAdmin@2026",
  "privacy@irisstar.tech": "Privacy@2026",
  "audit@irisstar.tech": "Audit@2026",
  "governance@irisstar.tech": "Governance@2026",
  "khalid@irisstar.tech": "Khalid@2026",
  "intake@irisstar.tech": "Intake@2026",
  "layla@irisstar.tech": "Layla@2026",
  "fatima@irisstar.tech": "Fatima@2026",
  "sara@irisstar.tech": "Sara@2026",
  "physician@irisstar.tech": "Physician@2026",
  "oh@irisstar.tech": "OccupationalHealth@2026",
  "protocols@irisstar.tech": "Protocols@2026",
  "quality@irisstar.tech": "Quality@2026",
  "integration@irisstar.tech": "Integration@2026",
  "reports@irisstar.tech": "Reports@2026",
  "helpdesk@irisstar.tech": "Helpdesk@2026"
};

function organizationByCode(code?: string): OrganizationDirectoryRecord {
  return (
    organizationDirectory.find((organization) => organization.code === code) ??
    organizationDirectory[0]
  );
}

const permissions: Permission[] = [
  {
    code: "triage.workspace.view",
    module: "Tele-triage",
    action: "view",
    description: "Open assigned tele-triage workspace and queues.",
    risk: "medium"
  },
  {
    code: "triage.recommendation.view",
    module: "Tele-triage",
    action: "view",
    description: "View AI-assisted recommendation and explainability trace.",
    risk: "high"
  },
  {
    code: "triage.disposition.override",
    module: "Tele-triage",
    action: "update",
    description: "Override recommended disposition upward with clinical rationale.",
    risk: "critical"
  },
  {
    code: "triage.call.intake",
    module: "Tele-triage",
    action: "create",
    description: "Register inbound tele-triage calls and capture non-clinical intake details.",
    risk: "medium"
  },
  {
    code: "triage.queue.manage",
    module: "Tele-triage",
    action: "update",
    description: "Assign, reassign, prioritize, and monitor tele-triage queues.",
    risk: "high"
  },
  {
    code: "triage.teleconsult.manage",
    module: "Tele-triage",
    action: "approve",
    description: "Accept clinical escalation and document teleconsult or physician review decisions.",
    risk: "critical"
  },
  {
    code: "triage.pediatric.manage",
    module: "Tele-triage",
    action: "update",
    description: "Manage pediatric and dependent triage pathways with guardian, age, and emergency routing rules.",
    risk: "critical"
  },
  {
    code: "clinical.governance.approve",
    module: "Clinical Governance",
    action: "approve",
    description: "Approve clinical protocols, escalation rules, safety exceptions, and release readiness.",
    risk: "critical"
  },
  {
    code: "protocol.library.manage",
    module: "Clinical Library",
    action: "update",
    description: "Maintain triage protocols, care advice, keywords, and localized clinical library content.",
    risk: "critical"
  },
  {
    code: "operations.dashboard.view",
    module: "Operations",
    action: "view",
    description: "View service-level dashboards, queue health, staffing coverage, and operational trends.",
    risk: "medium"
  },
  {
    code: "integration.hrms.manage",
    module: "Integration",
    action: "administer",
    description: "Configure HRMS, roster, employee, duty-status, and eligibility integration settings.",
    risk: "critical"
  },
  {
    code: "integration.emr.manage",
    module: "Integration",
    action: "administer",
    description: "Configure EMR, appointment, insurance, and clinical handoff integration settings.",
    risk: "critical"
  },
  {
    code: "integration.callcenter.manage",
    module: "Integration",
    action: "administer",
    description: "Configure provider-neutral call-center adapters, signed events, recording governance, and connector health.",
    risk: "critical"
  },
  {
    code: "reports.view",
    module: "Reporting",
    action: "view",
    description: "View de-identified operational, quality, adoption, and safety reports.",
    risk: "medium"
  },
  {
    code: "reports.export",
    module: "Reporting",
    action: "export",
    description: "Export approved de-identified reports under retention and disclosure controls.",
    risk: "high"
  },
  {
    code: "support.tickets.manage",
    module: "Support",
    action: "update",
    description: "Manage helpdesk tickets, access support, and non-clinical user service requests.",
    risk: "medium"
  },
  {
    code: "privacy.assessment.manage",
    module: "Privacy",
    action: "approve",
    description: "Manage privacy assessments, data-processing records, and law-mapping evidence.",
    risk: "critical"
  },
  {
    code: "admin.users.manage",
    module: "Administration",
    action: "administer",
    description: "Create, update, suspend, unlock, and assign users.",
    risk: "critical"
  },
  {
    code: "admin.roles.manage",
    module: "Administration",
    action: "administer",
    description: "Manage roles, responsibilities, access profiles, and effective access.",
    risk: "critical"
  },
  {
    code: "security.sso.manage",
    module: "Security",
    action: "administer",
    description: "Configure SSO providers and group-to-role mappings.",
    risk: "critical"
  },
  {
    code: "privacy.reveal.request",
    module: "Privacy",
    action: "reveal",
    description: "Request controlled personal-data reveal with purpose.",
    risk: "critical"
  },
  {
    code: "audit.events.view",
    module: "Audit",
    action: "view",
    description: "View audit events without decrypted personal values.",
    risk: "high"
  },
  {
    code: "crypto.policy.manage",
    module: "Cryptography",
    action: "administer",
    description: "Manage encryption, masking, reveal, and key-rotation policies.",
    risk: "critical"
  }
];

const responsibilities: Responsibility[] = [
  {
    code: "verify_employee_id",
    name: "Verify employee identity",
    module: "Tele-triage",
    businessFunction: "Identity and eligibility confirmation",
    risk: "medium",
    classification: "administrative",
    allowedActions: ["view"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: [],
    approvalRequired: false,
    status: "active",
    version: "1.0"
  },
  {
    code: "conduct_nurse_triage",
    name: "Conduct nurse triage",
    module: "Tele-triage",
    businessFunction: "Clinical assessment",
    risk: "high",
    classification: "clinical",
    allowedActions: ["view", "update"],
    prerequisiteResponsibilities: ["verify_employee_id"],
    conflictingResponsibilities: ["quality_review_own_case"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "view_ai_recommendation",
    name: "View AI recommendation",
    module: "Tele-triage",
    businessFunction: "Clinical decision support",
    risk: "high",
    classification: "clinical",
    allowedActions: ["view"],
    prerequisiteResponsibilities: ["conduct_nurse_triage"],
    conflictingResponsibilities: [],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "register_triage_call",
    name: "Register tele-triage call",
    module: "Tele-triage",
    businessFunction: "Call intake",
    risk: "medium",
    classification: "administrative",
    allowedActions: ["create", "view"],
    prerequisiteResponsibilities: ["verify_employee_id"],
    conflictingResponsibilities: [],
    approvalRequired: false,
    status: "active",
    version: "1.0"
  },
  {
    code: "coordinate_triage_queue",
    name: "Coordinate triage queue",
    module: "Tele-triage",
    businessFunction: "Operations management",
    risk: "high",
    classification: "administrative",
    allowedActions: ["view", "update"],
    prerequisiteResponsibilities: ["register_triage_call"],
    conflictingResponsibilities: [],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "perform_pediatric_triage",
    name: "Perform pediatric triage",
    module: "Tele-triage",
    businessFunction: "Clinical assessment",
    risk: "critical",
    classification: "clinical",
    allowedActions: ["view", "update"],
    prerequisiteResponsibilities: ["conduct_nurse_triage"],
    conflictingResponsibilities: ["quality_review_own_case"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "perform_occupational_health_review",
    name: "Perform occupational-health review",
    module: "Tele-triage",
    businessFunction: "Occupational medicine",
    risk: "high",
    classification: "clinical",
    allowedActions: ["view", "update", "approve"],
    prerequisiteResponsibilities: ["conduct_nurse_triage"],
    conflictingResponsibilities: ["quality_review_own_case"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "approve_physician_escalation",
    name: "Approve physician escalation",
    module: "Tele-triage",
    businessFunction: "Clinical escalation",
    risk: "critical",
    classification: "clinical",
    allowedActions: ["view", "approve", "update"],
    prerequisiteResponsibilities: ["view_ai_recommendation"],
    conflictingResponsibilities: ["quality_review_own_case"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "approve_clinical_governance",
    name: "Approve clinical governance",
    module: "Clinical Governance",
    businessFunction: "Medical oversight",
    risk: "critical",
    classification: "clinical",
    allowedActions: ["approve", "view"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: ["approve_own_protocol_change"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "maintain_protocol_library",
    name: "Maintain protocol library",
    module: "Clinical Library",
    businessFunction: "Clinical-content management",
    risk: "critical",
    classification: "clinical",
    allowedActions: ["view", "update"],
    prerequisiteResponsibilities: ["approve_clinical_governance"],
    conflictingResponsibilities: ["approve_own_protocol_change"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "quality_review_completed_case",
    name: "Quality-review completed case",
    module: "Quality",
    businessFunction: "Clinical quality assurance",
    risk: "high",
    classification: "clinical",
    allowedActions: ["view", "approve"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: ["conduct_nurse_triage", "approve_physician_escalation"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "manage_users",
    name: "Manage users",
    module: "Administration",
    businessFunction: "Identity administration",
    risk: "critical",
    classification: "security",
    allowedActions: ["create", "update", "administer"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: ["approve_own_access"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "administer_organization",
    name: "Administer organization",
    module: "Administration",
    businessFunction: "Tenant and facility administration",
    risk: "critical",
    classification: "administrative",
    allowedActions: ["administer", "update"],
    prerequisiteResponsibilities: ["manage_users"],
    conflictingResponsibilities: ["approve_own_access"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "manage_sso",
    name: "Manage SSO",
    module: "Security",
    businessFunction: "Identity-provider administration",
    risk: "critical",
    classification: "security",
    allowedActions: ["update", "administer"],
    prerequisiteResponsibilities: ["manage_users"],
    conflictingResponsibilities: [],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "manage_enterprise_integrations",
    name: "Manage enterprise integrations",
    module: "Integration",
    businessFunction: "HRMS, roster, EMR, and downstream connectivity",
    risk: "critical",
    classification: "integration",
    allowedActions: ["administer", "update", "view"],
    prerequisiteResponsibilities: ["manage_users"],
    conflictingResponsibilities: [],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "view_operational_reports",
    name: "View operational reports",
    module: "Reporting",
    businessFunction: "Service analytics",
    risk: "medium",
    classification: "administrative",
    allowedActions: ["view"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: [],
    approvalRequired: false,
    status: "active",
    version: "1.0"
  },
  {
    code: "export_deidentified_reports",
    name: "Export de-identified reports",
    module: "Reporting",
    businessFunction: "Management reporting",
    risk: "high",
    classification: "administrative",
    allowedActions: ["export"],
    prerequisiteResponsibilities: ["view_operational_reports"],
    conflictingResponsibilities: [],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "provide_helpdesk_support",
    name: "Provide helpdesk support",
    module: "Support",
    businessFunction: "User support",
    risk: "medium",
    classification: "administrative",
    allowedActions: ["view", "update"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: ["approve_own_access"],
    approvalRequired: false,
    status: "active",
    version: "1.0"
  },
  {
    code: "manage_encryption_policy",
    name: "Manage encryption policy",
    module: "Cryptography",
    businessFunction: "Data protection",
    risk: "critical",
    classification: "privacy",
    allowedActions: ["update", "approve", "administer"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: ["approve_own_policy"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "manage_privacy_assessment",
    name: "Manage privacy assessment",
    module: "Privacy",
    businessFunction: "Data protection compliance",
    risk: "critical",
    classification: "privacy",
    allowedActions: ["view", "approve", "update"],
    prerequisiteResponsibilities: ["manage_encryption_policy"],
    conflictingResponsibilities: ["request_own_reveal"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  },
  {
    code: "approve_personal_data_reveal",
    name: "Approve personal-data reveal",
    module: "Privacy",
    businessFunction: "Controlled reveal",
    risk: "critical",
    classification: "privacy",
    allowedActions: ["approve", "reveal"],
    prerequisiteResponsibilities: [],
    conflictingResponsibilities: ["request_own_reveal"],
    approvalRequired: true,
    status: "active",
    version: "1.0"
  }
];

const allPermissionCodes = permissions.map((permission) => permission.code);
const allResponsibilityCodes = responsibilities.map((responsibility) => responsibility.code);

const roles: Role[] = [
  {
    code: "platform_super_administrator",
    name: "Platform Super Administrator",
    description: "Demo-only complete system access for local simulation across triage, administration, security, privacy, audit, and cryptography.",
    permissions: allPermissionCodes,
    responsibilities: allResponsibilityCodes,
    dataScopes: ["organization:IST Tech", "all_users", "all_encounters"],
    clinicalScopes: ["adult", "pediatric", "aviation", "quality_review"],
    integrationScopes: ["sso", "kms", "hrms.read", "insurance.read", "audit"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "organization_administrator",
    name: "Organization Administrator",
    description: "Manages tenant, facility, department, queue, user, and access configuration for IST Tech.",
    permissions: ["admin.users.manage", "admin.roles.manage", "operations.dashboard.view", "reports.view", "audit.events.view"],
    responsibilities: ["administer_organization", "manage_users", "view_operational_reports"],
    dataScopes: ["organization:IST Tech", "facility:*"],
    clinicalScopes: [],
    integrationScopes: ["hrms.read"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "system_administrator",
    name: "System Administrator",
    description: "Configures the application but does not automatically receive clinical-data reveal rights.",
    permissions: ["admin.users.manage", "admin.roles.manage", "support.tickets.manage", "audit.events.view"],
    responsibilities: ["manage_users", "provide_helpdesk_support"],
    dataScopes: ["organization:IST Tech"],
    clinicalScopes: [],
    integrationScopes: [],
    status: "active",
    requiresApproval: true
  },
  {
    code: "security_administrator",
    name: "Security Administrator",
    description: "Manages authentication, SSO, policies, sessions, and security events.",
    permissions: ["security.sso.manage", "crypto.policy.manage", "audit.events.view"],
    responsibilities: ["manage_sso", "manage_encryption_policy"],
    dataScopes: ["organization:IST Tech"],
    clinicalScopes: [],
    integrationScopes: ["sso", "kms"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "privacy_officer",
    name: "Privacy Officer / DPO",
    description: "Owns privacy assessments, purpose-based reveal governance, data-law evidence, and disclosure controls.",
    permissions: ["privacy.assessment.manage", "privacy.reveal.request", "crypto.policy.manage", "audit.events.view", "reports.view"],
    responsibilities: ["manage_privacy_assessment", "approve_personal_data_reveal", "manage_encryption_policy"],
    dataScopes: ["privacy_register", "masked_users", "reveal_requests"],
    clinicalScopes: ["privacy_review"],
    integrationScopes: ["kms", "audit"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "compliance_auditor",
    name: "Compliance Auditor",
    description: "Reviews evidence, access activity, privacy events, audit trails, and management reports without changing clinical records.",
    permissions: ["audit.events.view", "reports.view", "reports.export"],
    responsibilities: ["quality_review_completed_case", "view_operational_reports", "export_deidentified_reports"],
    dataScopes: ["audit_events", "deidentified_reports", "completed_encounters"],
    clinicalScopes: ["quality_review"],
    integrationScopes: ["audit"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "clinical_governance_lead",
    name: "Clinical Governance Lead",
    description: "Approves clinical protocol changes, safety rules, escalation policies, and release governance.",
    permissions: ["clinical.governance.approve", "protocol.library.manage", "triage.recommendation.view", "audit.events.view", "reports.view"],
    responsibilities: ["approve_clinical_governance", "maintain_protocol_library", "quality_review_completed_case"],
    dataScopes: ["protocol_library", "completed_encounters", "governance_register"],
    clinicalScopes: ["adult", "pediatric", "aviation", "quality_review", "governance"],
    integrationScopes: ["audit"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "triage_service_manager",
    name: "Triage Service Manager",
    description: "Monitors queue health, staffing coverage, case allocation, operational KPIs, and escalation throughput.",
    permissions: ["triage.queue.manage", "operations.dashboard.view", "reports.view", "audit.events.view"],
    responsibilities: ["coordinate_triage_queue", "view_operational_reports"],
    dataScopes: ["assigned_queues", "operational_dashboards"],
    clinicalScopes: ["adult", "pediatric", "aviation", "operations"],
    integrationScopes: ["hrms.read", "audit"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "call_intake_coordinator",
    name: "Call Intake Coordinator",
    description: "Registers inbound calls, confirms identity context, captures non-clinical intake details, and routes cases to clinicians.",
    permissions: ["triage.workspace.view", "triage.call.intake"],
    responsibilities: ["register_triage_call"],
    dataScopes: ["intake_queue"],
    clinicalScopes: ["intake"],
    integrationScopes: ["hrms.read"],
    status: "active",
    requiresApproval: false
  },
  {
    code: "remote_triage_nurse",
    name: "Remote Triage Nurse",
    description: "Conducts assigned remote triage encounters with clinical protocol access.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation"],
    dataScopes: ["assigned_queue"],
    clinicalScopes: ["adult", "pediatric", "aviation"],
    integrationScopes: ["hrms.read", "insurance.read"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "senior_triage_nurse",
    name: "Senior Triage Nurse",
    description: "Handles complex nurse triage, queue supervision, protocol adherence, and upward disposition overrides.",
    permissions: ["triage.workspace.view", "triage.call.intake", "triage.recommendation.view", "triage.disposition.override", "triage.queue.manage", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation", "coordinate_triage_queue"],
    dataScopes: ["assigned_queue", "supervised_queue"],
    clinicalScopes: ["adult", "pediatric", "aviation", "escalation"],
    integrationScopes: ["hrms.read", "insurance.read"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "pediatric_triage_nurse",
    name: "Pediatric Triage Nurse",
    description: "Conducts pediatric and dependent triage where age, guardian, emergency routing, and local escalation rules matter.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.pediatric.manage", "privacy.reveal.request"],
    responsibilities: ["conduct_nurse_triage", "perform_pediatric_triage", "view_ai_recommendation"],
    dataScopes: ["assigned_queue", "dependent_encounters"],
    clinicalScopes: ["pediatric", "dependent", "emergency"],
    integrationScopes: ["hrms.read", "insurance.read"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "teleconsult_physician",
    name: "Teleconsult Physician",
    description: "Accepts escalated teleconsults, reviews clinical evidence, and records physician-level disposition decisions.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.teleconsult.manage", "triage.disposition.override", "privacy.reveal.request"],
    responsibilities: ["approve_physician_escalation", "view_ai_recommendation"],
    dataScopes: ["escalated_encounters"],
    clinicalScopes: ["adult", "pediatric", "aviation", "physician_escalation"],
    integrationScopes: ["emr.write", "insurance.read"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "occupational_health_clinician",
    name: "Occupational Health Clinician",
    description: "Reviews fit-to-work, fit-to-fly, sickness, occupational visit, and medical commission pathways.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "triage.disposition.override", "privacy.reveal.request"],
    responsibilities: ["perform_occupational_health_review", "view_ai_recommendation"],
    dataScopes: ["occupational_cases", "assigned_queue"],
    clinicalScopes: ["occupational_health", "aviation", "fit_to_fly", "sickness"],
    integrationScopes: ["hrms.read", "emr.write"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "protocol_content_manager",
    name: "Protocol Content Manager",
    description: "Maintains approved triage algorithms, keyword indexes, care advice, and localized help/library content.",
    permissions: ["protocol.library.manage", "reports.view", "audit.events.view"],
    responsibilities: ["maintain_protocol_library", "view_operational_reports"],
    dataScopes: ["protocol_library", "care_advice", "keyword_index"],
    clinicalScopes: ["adult", "pediatric", "aviation", "content_management"],
    integrationScopes: ["audit"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "quality_reviewer",
    name: "Quality Reviewer",
    description: "Reviews completed encounters without changing signed clinical notes.",
    permissions: ["audit.events.view", "reports.view"],
    responsibilities: ["quality_review_completed_case", "view_operational_reports"],
    dataScopes: ["completed_encounters"],
    clinicalScopes: ["quality_review"],
    integrationScopes: [],
    status: "active",
    requiresApproval: true
  },
  {
    code: "integration_administrator",
    name: "Integration Administrator",
    description: "Owns HRMS, EMR, roster, insurance, SSO connector, and API integration configuration.",
    permissions: ["integration.hrms.manage", "integration.emr.manage", "integration.callcenter.manage", "security.sso.manage", "audit.events.view"],
    responsibilities: ["manage_enterprise_integrations", "manage_sso"],
    dataScopes: ["integration_config", "connector_logs"],
    clinicalScopes: [],
    integrationScopes: ["hrms.manage", "emr.manage", "callcenter.manage", "sso", "insurance.manage"],
    status: "active",
    requiresApproval: true
  },
  {
    code: "reporting_analyst",
    name: "Reporting Analyst",
    description: "Views and exports approved de-identified operating, quality, safety, and adoption reports.",
    permissions: ["reports.view", "reports.export"],
    responsibilities: ["view_operational_reports", "export_deidentified_reports"],
    dataScopes: ["deidentified_reports"],
    clinicalScopes: ["analytics"],
    integrationScopes: [],
    status: "active",
    requiresApproval: true
  },
  {
    code: "helpdesk_support",
    name: "Helpdesk Support",
    description: "Supports users with access issues, device guidance, training questions, and non-clinical service requests.",
    permissions: ["support.tickets.manage"],
    responsibilities: ["provide_helpdesk_support"],
    dataScopes: ["support_tickets", "masked_users"],
    clinicalScopes: [],
    integrationScopes: [],
    status: "active",
    requiresApproval: false
  }
];

const initialUsers: AdminUser[] = [
  {
    id: "usr_platform_admin_10001",
    employeeId: "IST-90001",
    hrmsId: "HCM-90001",
    fullName: "Platform Administrator",
    email: "pa@irisstar.tech",
    mobile: "+97455551234",
    organization: "IST Tech",
    facility: "HIA Midfield",
    department: "Platform Administration",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Platform Administrator",
    professionalCategory: "Administrator",
    manager: "Chief Information Security Officer",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["platform_super_administrator"],
    responsibilities: allResponsibilityCodes,
    queues: ["HIA Staff Tele-triage", "Outstation Support", "Security Administration"],
    accessProfiles: ["platform-super-admin-profile", "security-admin-profile"],
    lastLoginIso: "2026-07-09T09:00:00.000Z",
    createdBy: "bootstrap",
    createdAtIso: "2026-07-01T08:00:00.000Z",
    updatedBy: "bootstrap",
    updatedAtIso: "2026-07-10T08:00:00.000Z"
  },
  {
    id: "usr_system_admin_10001",
    employeeId: "IST-90003",
    hrmsId: "HCM-90003",
    fullName: "System Administrator",
    email: "sa@irisstar.tech",
    mobile: "+97455550003",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Platform Administration",
    clinicalSpecialty: "Not applicable",
    jobTitle: "System Administrator",
    professionalCategory: "Administrator",
    manager: "Platform Administrator",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["system_administrator"],
    responsibilities: ["manage_users", "provide_helpdesk_support"],
    queues: ["User Administration", "Support Administration"],
    accessProfiles: ["system-admin-profile"],
    lastLoginIso: "2026-07-10T06:35:00.000Z",
    createdBy: "bootstrap",
    createdAtIso: "2026-07-01T08:02:00.000Z",
    updatedBy: "bootstrap",
    updatedAtIso: "2026-07-10T08:00:00.000Z"
  },
  {
    id: "usr_security_admin_10001",
    employeeId: "IST-90004",
    hrmsId: "HCM-90004",
    fullName: "Security Administrator",
    email: "sec@irisstar.tech",
    mobile: "+97455550004",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Cyber Security",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Security Administrator",
    professionalCategory: "Security",
    manager: "Platform Administrator",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["security_administrator"],
    responsibilities: ["manage_sso", "manage_encryption_policy"],
    queues: ["Security Administration", "SSO Configuration"],
    accessProfiles: ["security-admin-profile"],
    lastLoginIso: "2026-07-10T06:40:00.000Z",
    createdBy: "bootstrap",
    createdAtIso: "2026-07-01T08:04:00.000Z",
    updatedBy: "bootstrap",
    updatedAtIso: "2026-07-10T08:00:00.000Z"
  },
  {
    id: "usr_nurse_10001",
    employeeId: "IST-10001",
    hrmsId: "HCM-10001",
    fullName: "Layla Hassan",
    email: "layla@irisstar.tech",
    mobile: "+97455554321",
    organization: "IST Tech",
    facility: "HIA Midfield",
    department: "Flight Operations Medical Desk",
    clinicalSpecialty: "Tele-triage",
    jobTitle: "Senior Triage Nurse",
    professionalCategory: "Nurse",
    manager: "Lead Nurse",
    licenceNumber: "QCHP-N-10001",
    licenceAuthority: "QCHP",
    licenceExpiry: "2026-12-31",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["remote_triage_nurse"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation"],
    queues: ["HIA Staff Tele-triage", "Outstation Support"],
    accessProfiles: ["remote-triage-nurse-profile"],
    lastLoginIso: "2026-07-10T07:10:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:20:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_org_admin_10001",
    employeeId: "IST-90002",
    hrmsId: "HCM-90002",
    fullName: "Organization Administrator",
    email: "oa@irisstar.tech",
    mobile: "+97455550002",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Business Administration",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Organization Administrator",
    professionalCategory: "Administrator",
    manager: "Chief Operating Officer",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["organization_administrator"],
    responsibilities: ["administer_organization", "manage_users", "view_operational_reports"],
    queues: ["Organization Administration"],
    accessProfiles: ["organization-admin-profile"],
    lastLoginIso: "2026-07-10T06:30:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:22:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_manager_10001",
    employeeId: "IST-30001",
    hrmsId: "HCM-30001",
    fullName: "Khalid Al-Marri",
    email: "khalid@irisstar.tech",
    mobile: "+97455553001",
    organization: "IST Tech",
    facility: "IST Tele-triage Command Centre",
    department: "Clinical Operations",
    clinicalSpecialty: "Tele-triage operations",
    jobTitle: "Triage Service Manager",
    professionalCategory: "Operations Manager",
    manager: "Clinical Governance Lead",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["triage_service_manager"],
    responsibilities: ["coordinate_triage_queue", "view_operational_reports"],
    queues: ["HIA Staff Tele-triage", "Outstation Support", "Escalation Queue"],
    accessProfiles: ["triage-service-manager-profile"],
    lastLoginIso: "2026-07-10T06:45:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:24:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_intake_10001",
    employeeId: "IST-30002",
    hrmsId: "HCM-30002",
    fullName: "Call Intake Coordinator",
    email: "intake@irisstar.tech",
    mobile: "+97455553002",
    organization: "IST Tech",
    facility: "IST Tele-triage Command Centre",
    department: "Clinical Operations",
    clinicalSpecialty: "Call intake",
    jobTitle: "Call Intake Coordinator",
    professionalCategory: "Coordinator",
    manager: "Triage Service Manager",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["call_intake_coordinator"],
    responsibilities: ["register_triage_call"],
    queues: ["New Calls", "Identity Verification"],
    accessProfiles: ["call-intake-profile"],
    lastLoginIso: "2026-07-10T06:50:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:26:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_senior_nurse_10001",
    employeeId: "IST-10002",
    hrmsId: "HCM-10002",
    fullName: "Fatima Al-Kaabi",
    email: "fatima@irisstar.tech",
    mobile: "+97455551002",
    organization: "IST Tech",
    facility: "IST Tele-triage Command Centre",
    department: "Clinical Operations",
    clinicalSpecialty: "Senior tele-triage",
    jobTitle: "Senior Triage Nurse",
    professionalCategory: "Nurse",
    manager: "Triage Service Manager",
    licenceNumber: "QCHP-N-10002",
    licenceAuthority: "QCHP",
    licenceExpiry: "2027-03-31",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["senior_triage_nurse"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation", "coordinate_triage_queue"],
    queues: ["HIA Staff Tele-triage", "Escalation Queue"],
    accessProfiles: ["senior-triage-nurse-profile"],
    lastLoginIso: "2026-07-10T07:05:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:28:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_pediatric_nurse_10001",
    employeeId: "IST-10003",
    hrmsId: "HCM-10003",
    fullName: "Sara Al-Emadi",
    email: "sara@irisstar.tech",
    mobile: "+97455551003",
    organization: "IST Tech",
    facility: "IST Tele-triage Command Centre",
    department: "Clinical Operations",
    clinicalSpecialty: "Tele-triage",
    jobTitle: "Remote Triage Nurse",
    professionalCategory: "Nurse",
    manager: "Triage Service Manager",
    licenceNumber: "QCHP-N-10003",
    licenceAuthority: "QCHP",
    licenceExpiry: "2027-06-30",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["remote_triage_nurse"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation"],
    queues: ["HIA Staff Tele-triage", "Outstation Support"],
    accessProfiles: ["remote-triage-nurse-profile"],
    lastLoginIso: "2026-07-10T07:08:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:30:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_physician_10001",
    employeeId: "IST-11001",
    hrmsId: "HCM-11001",
    fullName: "Teleconsult Physician",
    email: "physician@irisstar.tech",
    mobile: "+97455551101",
    organization: "IST Tech",
    facility: "IST Tele-triage Command Centre",
    department: "Clinical Operations",
    clinicalSpecialty: "Emergency and aviation medicine",
    jobTitle: "Teleconsult Physician",
    professionalCategory: "Physician",
    manager: "Clinical Governance Lead",
    licenceNumber: "QCHP-M-11001",
    licenceAuthority: "QCHP",
    licenceExpiry: "2027-12-31",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["teleconsult_physician"],
    responsibilities: ["approve_physician_escalation", "view_ai_recommendation"],
    queues: ["Physician Escalation", "Emergency Review"],
    accessProfiles: ["teleconsult-physician-profile"],
    lastLoginIso: "2026-07-10T07:12:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:32:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_occ_health_10001",
    employeeId: "IST-12001",
    hrmsId: "HCM-12001",
    fullName: "Occupational Health Clinician",
    email: "oh@irisstar.tech",
    mobile: "+97455551201",
    organization: "IST Tech",
    facility: "IST Medical Governance",
    department: "Occupational Health",
    clinicalSpecialty: "Occupational and aviation medicine",
    jobTitle: "Occupational Health Clinician",
    professionalCategory: "Clinician",
    manager: "Clinical Governance Lead",
    licenceNumber: "QCHP-C-12001",
    licenceAuthority: "QCHP",
    licenceExpiry: "2027-09-30",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["occupational_health_clinician"],
    responsibilities: ["perform_occupational_health_review", "view_ai_recommendation"],
    queues: ["Fit-to-fly Review", "Sickness Review", "Occupational Visits"],
    accessProfiles: ["occupational-health-profile"],
    lastLoginIso: "2026-07-10T07:14:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:34:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_governance_10001",
    employeeId: "IST-21001",
    hrmsId: "HCM-21001",
    fullName: "Clinical Governance Lead",
    email: "governance@irisstar.tech",
    mobile: "+97455552101",
    organization: "IST Tech",
    facility: "IST Medical Governance",
    department: "Clinical Governance",
    clinicalSpecialty: "Clinical governance",
    jobTitle: "Clinical Governance Lead",
    professionalCategory: "Clinical Governance",
    manager: "Chief Medical Officer",
    licenceNumber: "QCHP-M-21001",
    licenceAuthority: "QCHP",
    licenceExpiry: "2027-08-31",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["clinical_governance_lead"],
    responsibilities: ["approve_clinical_governance", "maintain_protocol_library", "quality_review_completed_case"],
    queues: ["Protocol Approval", "Safety Review"],
    accessProfiles: ["clinical-governance-profile"],
    lastLoginIso: "2026-07-10T07:18:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:36:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_protocol_10001",
    employeeId: "IST-22001",
    hrmsId: "HCM-22001",
    fullName: "Protocol Content Manager",
    email: "protocols@irisstar.tech",
    mobile: "+97455552201",
    organization: "IST Tech",
    facility: "IST Medical Governance",
    department: "Clinical Content",
    clinicalSpecialty: "Clinical protocol management",
    jobTitle: "Protocol Content Manager",
    professionalCategory: "Clinical Content",
    manager: "Clinical Governance Lead",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["protocol_content_manager"],
    responsibilities: ["maintain_protocol_library", "view_operational_reports"],
    queues: ["Protocol Library", "Care Advice Library"],
    accessProfiles: ["protocol-content-profile"],
    lastLoginIso: "2026-07-10T07:20:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:38:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:05:00.000Z"
  },
  {
    id: "usr_reviewer_10001",
    employeeId: "IST-20001",
    hrmsId: "HCM-20001",
    fullName: "Quality Reviewer",
    email: "quality@irisstar.tech",
    mobile: "+97455559876",
    organization: "IST Tech",
    facility: "HIA Midfield",
    department: "Clinical Quality",
    clinicalSpecialty: "Quality review",
    jobTitle: "Clinical Quality Reviewer",
    professionalCategory: "Reviewer",
    manager: "Clinical Governance Lead",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["quality_reviewer"],
    responsibilities: [],
    queues: ["Completed Encounter Review"],
    accessProfiles: ["quality-review-profile"],
    lastLoginIso: "2026-07-10T07:45:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:40:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:10:00.000Z"
  },
  {
    id: "usr_privacy_10001",
    employeeId: "IST-91001",
    hrmsId: "HCM-91001",
    fullName: "Privacy Officer / DPO",
    email: "privacy@irisstar.tech",
    mobile: "+97455559101",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Privacy and Data Protection",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Privacy Officer",
    professionalCategory: "Privacy",
    manager: "Chief Information Security Officer",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["privacy_officer"],
    responsibilities: ["manage_privacy_assessment", "approve_personal_data_reveal", "manage_encryption_policy"],
    queues: ["Privacy Assessment", "Reveal Approval"],
    accessProfiles: ["privacy-officer-profile"],
    lastLoginIso: "2026-07-10T07:50:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:42:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:10:00.000Z"
  },
  {
    id: "usr_compliance_10001",
    employeeId: "IST-92001",
    hrmsId: "HCM-92001",
    fullName: "Compliance Auditor",
    email: "audit@irisstar.tech",
    mobile: "+97455559201",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Compliance and Audit",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Compliance Auditor",
    professionalCategory: "Compliance",
    manager: "Privacy Officer",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["compliance_auditor"],
    responsibilities: ["quality_review_completed_case", "view_operational_reports", "export_deidentified_reports"],
    queues: ["Audit Review", "Compliance Evidence"],
    accessProfiles: ["compliance-auditor-profile"],
    lastLoginIso: "2026-07-10T07:52:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:44:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:10:00.000Z"
  },
  {
    id: "usr_integration_10001",
    employeeId: "IST-93001",
    hrmsId: "HCM-93001",
    fullName: "Integration Administrator",
    email: "integration@irisstar.tech",
    mobile: "+97455559301",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Integration Engineering",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Integration Administrator",
    professionalCategory: "Integration",
    manager: "System Administrator",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["integration_administrator"],
    responsibilities: ["manage_enterprise_integrations", "manage_sso"],
    queues: ["HRMS Integration", "EMR Integration", "API Monitoring"],
    accessProfiles: ["integration-admin-profile"],
    lastLoginIso: "2026-07-10T07:54:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:46:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:10:00.000Z"
  },
  {
    id: "usr_reporting_10001",
    employeeId: "IST-94001",
    hrmsId: "HCM-94001",
    fullName: "Reporting Analyst",
    email: "reports@irisstar.tech",
    mobile: "+97455559401",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Analytics",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Reporting Analyst",
    professionalCategory: "Analytics",
    manager: "Triage Service Manager",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["reporting_analyst"],
    responsibilities: ["view_operational_reports", "export_deidentified_reports"],
    queues: ["Management Reports", "Quality Dashboards"],
    accessProfiles: ["reporting-analyst-profile"],
    lastLoginIso: "2026-07-10T07:56:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:48:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:10:00.000Z"
  },
  {
    id: "usr_helpdesk_10001",
    employeeId: "IST-95001",
    hrmsId: "HCM-95001",
    fullName: "Helpdesk Support",
    email: "helpdesk@irisstar.tech",
    mobile: "+97455559501",
    organization: "IST Tech",
    facility: "IST Tech Operations",
    department: "Service Desk",
    clinicalSpecialty: "Not applicable",
    jobTitle: "Helpdesk Support",
    professionalCategory: "Support",
    manager: "System Administrator",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "enabled",
    accountStatus: "active",
    roles: ["helpdesk_support"],
    responsibilities: ["provide_helpdesk_support"],
    queues: ["User Support", "Access Support"],
    accessProfiles: ["helpdesk-support-profile"],
    lastLoginIso: "2026-07-10T07:58:00.000Z",
    createdBy: "usr_platform_admin_10001",
    createdAtIso: "2026-07-01T08:50:00.000Z",
    updatedBy: "usr_platform_admin_10001",
    updatedAtIso: "2026-07-10T08:10:00.000Z"
  }
];

function normalizedDirectoryUser(user: AdminUser): AdminUser {
  const organization = organizationByCode(user.organizationCode ?? organizationOverrideByUserId[user.id]);
  return {
    ...user,
    organization: organization.name,
    organizationId: organization.id,
    organizationCode: organization.code,
    directoryStatus: user.directoryStatus ?? "active"
  };
}

function cloneInitialUsers(): AdminUser[] {
  return initialUsers.map((user) => normalizedDirectoryUser({ ...user }));
}

let users: AdminUser[] = cloneInitialUsers();

const ssoProviders: SsoProvider[] = [
  {
    id: "entra-qa",
    name: "Microsoft Entra ID - IST Tech",
    protocol: "oidc",
    enabled: false,
    issuerUrl: "https://login.microsoftonline.com/{tenant-id}/v2.0",
    tenantId: "configure-in-secret-manager",
    redirectUri: "/api/v1/auth/sso/entra-qa/callback",
    allowedDomains: ["irisstar.tech", "ist.local", "isttech.local"],
    attributeMappings: {
      email: "preferred_username",
      fullName: "name",
      employeeId: "employeeid",
      groups: "groups"
    },
    groupRoleMappings: {
      "IST-Organization-Admins": "organization_administrator",
      "IST-System-Admins": "system_administrator",
      "IST-Security-Admins": "security_administrator",
      "IST-Privacy-Officers": "privacy_officer",
      "IST-Compliance-Auditors": "compliance_auditor",
      "IST-Clinical-Governance": "clinical_governance_lead",
      "IST-Triage-Managers": "triage_service_manager",
      "IST-Call-Intake": "call_intake_coordinator",
      "IST-Triage-Nurses": "remote_triage_nurse",
      "IST-Senior-Triage-Nurses": "senior_triage_nurse",
      "IST-Pediatric-Triage": "pediatric_triage_nurse",
      "IST-Teleconsult-Physicians": "teleconsult_physician",
      "IST-Occupational-Health": "occupational_health_clinician",
      "IST-Protocol-Managers": "protocol_content_manager",
      "IST-Quality-Reviewers": "quality_reviewer",
      "IST-Integration-Admins": "integration_administrator",
      "IST-Reporting-Analysts": "reporting_analyst",
      "IST-Helpdesk": "helpdesk_support"
    },
    jitProvisioning: true,
    localLoginEnabled: true,
    certificateExpiryIso: "2027-06-30T00:00:00.000Z",
    secretStorage: "GCP Secret Manager / Cloud KMS envelope encryption"
  },
  {
    id: "saml-enterprise",
    name: "Enterprise SAML fallback",
    protocol: "saml",
    enabled: false,
    issuerUrl: "https://idp.example/saml",
    tenantId: "configure-in-secret-manager",
    redirectUri: "/api/v1/auth/sso/saml-enterprise/callback",
    allowedDomains: ["irisstar.tech", "ist.local"],
    attributeMappings: {
      email: "NameID",
      fullName: "displayName",
      employeeId: "employeeNumber",
      groups: "memberOf"
    },
    groupRoleMappings: {},
    jitProvisioning: false,
    localLoginEnabled: true,
    secretStorage: "GCP Secret Manager / Cloud KMS envelope encryption"
  }
];

const encryptionPolicies: EncryptionPolicy[] = [
  {
    id: "enc-personal-data-v1",
    name: "Personal Data Field Encryption",
    version: "1.0",
    dataClassification: "personal-confidential",
    coveredEntities: ["ApplicationUser", "StaffMember", "Dependent"],
    coveredFields: ["employeeId", "mobile", "email", "dependentId", "insuranceMemberNumber"],
    algorithm: "AES-256-GCM",
    keyProvider: "Google Cloud KMS",
    keyAlias: "projects/ist-tech/locations/me-central1/keyRings/triage/cryptoKeys/personal-data",
    rotationDays: 90,
    maskingPolicy: "mask-by-default",
    revealPolicy: "mfa-purpose-audited-reveal",
    dataResidency: "GCP Qatar me-central1",
    approvalRequired: true,
    status: "active"
  },
  {
    id: "enc-health-data-v1",
    name: "Health Data and Notes Encryption",
    version: "1.0",
    dataClassification: "health-confidential",
    coveredEntities: ["AviationTriageEncounter", "SafetyAuditDeviationLog"],
    coveredFields: ["transcriptText", "clipboardPayload", "clinicalNotes", "overrideReasons"],
    algorithm: "AES-256-GCM",
    keyProvider: "Google Cloud KMS",
    keyAlias: "projects/ist-tech/locations/me-central1/keyRings/triage/cryptoKeys/health-data",
    rotationDays: 60,
    maskingPolicy: "clinical-minimum-necessary",
    revealPolicy: "assigned-encounter-purpose-reveal",
    dataResidency: "GCP Qatar me-central1",
    approvalRequired: true,
    status: "pending-approval"
  }
];

const controlCenterModules: ControlCenterModule[] = [
  {
    id: "users",
    label: "Users",
    purpose: "Named-user lifecycle, HRMS directory state, account lock/suspend, and access profile review.",
    primaryRoles: ["Platform Super Administrator", "Organization Administrator", "System Administrator"],
    requiredPermissions: ["admin.users.manage"],
    dataBoundary: "Masked user directory; direct identifiers require purpose-based reveal.",
    prohibitedActions: ["Clinical disposition approval", "Protocol approval", "Unscoped personal-data export"]
  },
  {
    id: "access",
    label: "Access",
    purpose: "Role templates, responsibilities, permissions, access profiles, and segregation-of-duty checks.",
    primaryRoles: ["Platform Super Administrator", "Organization Administrator", "System Administrator"],
    requiredPermissions: ["admin.roles.manage"],
    dataBoundary: "Role metadata and masked named-user assignments.",
    prohibitedActions: ["Self-approval of privileged access", "Clinical record edits"]
  },
  {
    id: "security",
    label: "Security",
    purpose: "SSO providers, session control, MFA posture, key-policy visibility, and security administration.",
    primaryRoles: ["Security Administrator", "Integration Administrator"],
    requiredPermissions: ["security.sso.manage", "crypto.policy.manage"],
    dataBoundary: "Identity-provider metadata and secrets references only; no decrypted secret values.",
    prohibitedActions: ["Personal-data reveal without privacy purpose", "Clinical override approval"]
  },
  {
    id: "privacy",
    label: "Privacy",
    purpose: "Purpose-based reveal requests, privacy assessments, masking policy, and data-law evidence.",
    primaryRoles: ["Privacy Officer / DPO"],
    requiredPermissions: ["privacy.assessment.manage", "privacy.reveal.request", "crypto.policy.manage"],
    dataBoundary: "Masked subjects by default; reveal is logged and time-limited.",
    prohibitedActions: ["Bulk identifier export", "Reveal without purpose", "Clinical disposition entry"]
  },
  {
    id: "audit",
    label: "Audit",
    purpose: "Immutable security, queue, reveal, override, integration, and governance evidence review.",
    primaryRoles: ["Compliance Auditor", "Quality Reviewer", "Security Administrator"],
    requiredPermissions: ["audit.events.view"],
    dataBoundary: "Audit metadata without decrypted personal values.",
    prohibitedActions: ["Changing source events", "Editing signed clinical notes"]
  },
  {
    id: "governance",
    label: "Governance",
    purpose: "Clinical safety policy, protocol release readiness, exception review, and quality governance.",
    primaryRoles: ["Clinical Governance Lead", "Quality Reviewer"],
    requiredPermissions: ["clinical.governance.approve", "audit.events.view"],
    dataBoundary: "Governance evidence, de-identified encounter quality samples, and release controls.",
    prohibitedActions: ["Own-protocol self-approval", "Unreviewed red-floor downgrade"]
  },
  {
    id: "protocol-library",
    label: "Protocol Library",
    purpose: "Clinical algorithms, search words, acuity-ordered questions, care advice, and localized routing data.",
    primaryRoles: ["Protocol Content Manager", "Clinical Governance Lead"],
    requiredPermissions: ["protocol.library.manage"],
    dataBoundary: "Protocol metadata and synthetic/open-source demo content until licensed content is imported.",
    prohibitedActions: ["Publishing unapproved content", "Changing signed encounter notes"]
  },
  {
    id: "integration",
    label: "Integration",
    purpose: "Oracle HRMS, EMR/FHIR, SSO, roster, queue, and downstream connector health.",
    primaryRoles: ["Integration Administrator"],
    requiredPermissions: ["integration.hrms.manage", "integration.emr.manage", "integration.callcenter.manage", "security.sso.manage"],
    dataBoundary: "Connector configuration, masked payload samples, and operational status.",
    prohibitedActions: ["Clinical triage decision entry", "Viewing decrypted clinical payloads without assignment"]
  },
  {
    id: "reports",
    label: "Reports",
    purpose: "De-identified operational, safety, adoption, quality, and integration reports.",
    primaryRoles: ["Reporting Analyst", "Triage Service Manager", "Compliance Auditor"],
    requiredPermissions: ["reports.view", "reports.export", "operations.dashboard.view"],
    dataBoundary: "Aggregate and de-identified report datasets.",
    prohibitedActions: ["PHI export", "Personal-data reveal"]
  },
  {
    id: "support",
    label: "Support",
    purpose: "Helpdesk tickets, user support, device issues, and non-clinical service requests.",
    primaryRoles: ["Helpdesk Support", "System Administrator"],
    requiredPermissions: ["support.tickets.manage"],
    dataBoundary: "Support tickets and masked user identifiers.",
    prohibitedActions: ["Clinical note changes", "Privacy reveal approvals"]
  }
];

const integrationConnectors: IntegrationConnector[] = [
  {
    id: "provider-neutral-call-center",
    name: "Provider-neutral call-center gateway",
    system: "Call Center",
    status: "mock-adapter",
    ownerRole: "Integration Administrator",
    dataHandled: ["masked caller number", "call state", "queue reference", "recording governance metadata"],
    apiSurface: "Signed normalized events plus answer, callback, hold, resume, and end commands",
    lastCheckedIso: "2026-07-17T08:00:00.000Z"
  },
  {
    id: "oracle-fusion-hrms",
    name: "Oracle Fusion HRMS directory sync",
    system: "Oracle HRMS",
    status: "configured",
    ownerRole: "Integration Administrator",
    dataHandled: ["employee ID", "job title", "department", "duty status", "date of birth for age calculation"],
    apiSurface: "Workers, Employment, Assignments, Absences, Work Schedules",
    lastCheckedIso: "2026-07-16T07:30:00.000Z"
  },
  {
    id: "emr-fhir-writeback",
    name: "EMR/FHIR writeback",
    system: "EMR/FHIR",
    status: "pending-approval",
    ownerRole: "Integration Administrator",
    dataHandled: ["SBAR note", "disposition", "care advice acknowledgement", "encounter status"],
    apiSurface: "FHIR Patient, Encounter, Observation, QuestionnaireResponse, DocumentReference",
    lastCheckedIso: "2026-07-16T07:35:00.000Z"
  },
  {
    id: "entra-sso",
    name: "Microsoft Entra ID SSO",
    system: "SSO",
    status: "mock-adapter",
    ownerRole: "Security Administrator",
    dataHandled: ["user principal", "group claim", "MFA state", "role mapping"],
    apiSurface: "OIDC/SAML provider metadata and group-role mapping",
    lastCheckedIso: "2026-07-16T07:40:00.000Z"
  },
  {
    id: "analytics-export",
    name: "De-identified reporting export",
    system: "Analytics",
    status: "configured",
    ownerRole: "Reporting Analyst",
    dataHandled: ["aggregate queue metrics", "de-identified safety outcomes", "quality-review counts"],
    apiSurface: "Reports catalog and governed CSV export",
    lastCheckedIso: "2026-07-16T07:45:00.000Z"
  }
];

const governanceWorkItems: GovernanceWorkItem[] = [
  {
    id: "gov-red-floor",
    title: "Emergency safety-floor rule set",
    ownerRole: "Clinical Governance Lead",
    status: "active",
    control: "Red-floor downgrades are blocked by deterministic rules before AI assistance.",
    evidence: "Safety kernel tests and signed override audit trail."
  },
  {
    id: "gov-fit-to-fly",
    title: "Fit-to-fly routing policy",
    ownerRole: "Occupational Health Clinician",
    status: "requires-review",
    control: "Aviation status is derived after emergency rule-out and disposition selection.",
    evidence: "Synthetic aviation data plan and disposition route library."
  },
  {
    id: "gov-content-release",
    title: "Protocol release readiness",
    ownerRole: "Protocol Content Manager",
    status: "pending-approval",
    control: "Demo clinical content remains synthetic/open-source until licensed STCC content is imported.",
    evidence: "Protocol library release notes and content provenance report."
  }
];

const protocolLibraryItems: ProtocolLibraryItem[] = [
  {
    id: "protocol-adult-chest-pain",
    title: "Chest Pain or Tightness - Adult",
    category: "Adult / emergency rule-out",
    status: "active",
    ownerRole: "Protocol Content Manager",
    release: "2026.07-sample",
    safetyNotes: "Synthetic Phase 1 content. Replace with licensed clinical content before production."
  },
  {
    id: "protocol-pediatric-fever",
    title: "Fever with Fast Breathing - Pediatric",
    category: "Pediatric / dependent",
    status: "draft",
    ownerRole: "Clinical Governance Lead",
    release: "2026.07-sample",
    safetyNotes: "Age-banded pediatric tachypnea and SpO2 safety-floor rules remain deterministic."
  },
  {
    id: "protocol-ankle-foot",
    title: "Ankle and Foot Injury",
    category: "Adult / injury",
    status: "pending-governance",
    ownerRole: "Protocol Content Manager",
    release: "2026.07-synthetic",
    safetyNotes: "Demo sequence follows reason for call, keyword match, acuity questions, disposition, and care advice."
  }
];

const reportCatalogItems: ReportCatalogItem[] = [
  {
    id: "report-queue-health",
    title: "Queue health and service load",
    audience: "Triage Service Manager",
    dataClass: "aggregate",
    exportAllowed: true,
    requiredPermission: "reports.export"
  },
  {
    id: "report-safety-floor",
    title: "Safety-floor trigger review",
    audience: "Clinical Governance Lead",
    dataClass: "de-identified",
    exportAllowed: true,
    requiredPermission: "reports.export"
  },
  {
    id: "report-reveal-audit",
    title: "Privacy reveal audit",
    audience: "Privacy Officer / DPO",
    dataClass: "restricted",
    exportAllowed: false,
    requiredPermission: "audit.events.view"
  }
];

const supportQueueItems: SupportQueueItem[] = [
  {
    id: "support-access-lockout",
    title: "Locked account or MFA issue",
    requesterRole: "Any named user",
    status: "open",
    dataBoundary: "Helpdesk can see masked user profile and access status, not clinical notes."
  },
  {
    id: "support-role-change",
    title: "Role or queue access change",
    requesterRole: "Manager or administrator",
    status: "in-progress",
    dataBoundary: "Requires role approval; no self-approval of privileged access."
  },
  {
    id: "support-integration-ticket",
    title: "Connector error investigation",
    requesterRole: "Integration Administrator",
    status: "waiting-user",
    dataBoundary: "Masked payload samples and connector logs only."
  }
];

const auditEvents: AuditEvent[] = [
  {
    id: "audit-10001",
    timestampIso: "2026-07-10T08:00:00.000Z",
    userId: "usr_security_admin_10001",
    activeRole: "security_administrator",
    organization: "IST Tech",
    facility: "HIA Midfield",
    department: "Information Security",
    action: "SSO_PROVIDER_VIEW",
    module: "Security",
    resource: "AuthenticationProvider:entra-qa",
    purpose: "Administration review",
    ipAddress: "127.0.0.1",
    device: "local-dev",
    success: true,
    risk: "medium"
  },
  {
    id: "audit-10002",
    timestampIso: "2026-07-10T08:05:00.000Z",
    userId: "usr_nurse_10001",
    activeRole: "remote_triage_nurse",
    organization: "IST Tech",
    facility: "HIA Midfield",
    department: "Flight Operations Medical Desk",
    action: "TRIAGE_WORKSPACE_VIEW",
    module: "Tele-triage",
    resource: "Queue:HIA Staff Tele-triage",
    purpose: "Active triage call",
    ipAddress: "127.0.0.1",
    device: "local-dev",
    success: true,
    risk: "medium"
  }
];

const sessions = new Map<string, AuthenticatedSession>();
const failedLoginAttempts = new Map<string, number>();

async function recordAuditEvent(event: AuditEvent): Promise<void> {
  auditEvents.push(event);
  await persistSecurityAuditEvent(event);
}

function maskLast(value: string, visible = 4, mask = "*"): string {
  if (!value) {
    return "";
  }
  const suffix = value.slice(-visible);
  return `${mask.repeat(Math.max(0, value.length - visible))}${suffix}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return maskLast(email);
  }
  return `${local.slice(0, 1)}${"*".repeat(Math.max(1, local.length - 1))}@${domain}`;
}

export function maskMobile(mobile: string): string {
  return mobile.replace(/(\+?\d{3})\d+(\d{3})$/, "$1 *****$2");
}

export function maskUser(user: AdminUser): SafeAdminUser {
  return {
    ...user,
    employeeId: maskLast(user.employeeId),
    email: maskEmail(user.email),
    mobile: maskMobile(user.mobile),
    licenceNumber: user.licenceNumber ? maskLast(user.licenceNumber) : undefined
  };
}

export function listPermissions(): Permission[] {
  return permissions;
}

export function listResponsibilities(): Responsibility[] {
  return responsibilities;
}

export function listRoles(): Role[] {
  return roles;
}

export function listUsers(): SafeAdminUser[] {
  return users.map(maskUser);
}

export function listControlCenterModules(): ControlCenterModule[] {
  return controlCenterModules.map((module) => ({ ...module }));
}

export function listRevealDirectory(): SafeAdminUser[] {
  return users.map(maskUser);
}

export function listIntegrationConnectors(): IntegrationConnector[] {
  return integrationConnectors.map((connector) => ({
    ...connector,
    dataHandled: [...connector.dataHandled]
  }));
}

export function listGovernanceWorkItems(): GovernanceWorkItem[] {
  return governanceWorkItems.map((item) => ({ ...item }));
}

export function listProtocolLibraryItems(): ProtocolLibraryItem[] {
  return protocolLibraryItems.map((item) => ({ ...item }));
}

export function listReportCatalogItems(): ReportCatalogItem[] {
  return reportCatalogItems.map((item) => ({ ...item }));
}

export function listSupportQueueItems(): SupportQueueItem[] {
  return supportQueueItems.map((item) => ({ ...item }));
}

export function listOrganizations(): OrganizationDirectoryRecord[] {
  return organizationDirectory.map((organization) => ({ ...organization }));
}

export function getOrganizationByCode(code: string): OrganizationDirectoryRecord | undefined {
  return organizationDirectory.find((organization) => organization.code === code);
}

export function getOrganizationById(id: string): OrganizationDirectoryRecord | undefined {
  return organizationDirectory.find((organization) => organization.id === id);
}

export function getDirectoryUserByEmployeeId(employeeId: string): AdminUser | undefined {
  return users.find((user) => user.employeeId.toLowerCase() === employeeId.toLowerCase());
}

export type DirectoryUserUpsert = {
  employeeId: string;
  hrmsId?: string;
  email?: string;
  fullName?: string;
  mobile?: string;
  organizationCode?: string;
  facility?: string;
  department?: string;
  clinicalSpecialty?: string;
  jobTitle?: string;
  professionalCategory?: string;
  manager?: string;
  roles?: string[];
  responsibilities?: string[];
  queues?: string[];
  accessProfiles?: string[];
  directoryStatus?: DirectoryStatus;
  accountStatus?: AccountStatus;
};

function directoryStatusToAccountStatus(status: DirectoryStatus): AccountStatus {
  return status === "active" ? "active" : "deactivated";
}

export function upsertDirectoryUserFromHrms(input: DirectoryUserUpsert): { user: SafeAdminUser; created: boolean } {
  const existingIndex = users.findIndex((user) => user.employeeId.toLowerCase() === input.employeeId.toLowerCase());
  const organization = organizationByCode(input.organizationCode);
  const timestampIso = new Date().toISOString();
  const directoryStatus = input.directoryStatus ?? "active";
  const accountStatus = input.accountStatus ?? directoryStatusToAccountStatus(directoryStatus);

  if (existingIndex >= 0) {
    const existing = users[existingIndex];
    const updated: AdminUser = {
      ...existing,
      hrmsId: input.hrmsId ?? existing.hrmsId,
      fullName: input.fullName ?? existing.fullName,
      email: input.email ?? existing.email,
      mobile: input.mobile ?? existing.mobile,
      organization: organization.name,
      organizationId: organization.id,
      organizationCode: organization.code,
      facility: input.facility ?? existing.facility,
      department: input.department ?? existing.department,
      clinicalSpecialty: input.clinicalSpecialty ?? existing.clinicalSpecialty,
      jobTitle: input.jobTitle ?? existing.jobTitle,
      professionalCategory: input.professionalCategory ?? existing.professionalCategory,
      manager: input.manager ?? existing.manager,
      accountStatus,
      directoryStatus,
      roles: input.roles ?? existing.roles,
      responsibilities: input.responsibilities ?? existing.responsibilities,
      queues: input.queues ?? existing.queues,
      accessProfiles: input.accessProfiles ?? existing.accessProfiles,
      updatedBy: "oracle-hrms-sync",
      updatedAtIso: timestampIso
    };
    users[existingIndex] = updated;
    return { user: maskUser(updated), created: false };
  }

  const created: AdminUser = {
    id: `usr_hrms_${input.employeeId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    employeeId: input.employeeId,
    hrmsId: input.hrmsId ?? input.employeeId,
    fullName: input.fullName ?? input.email ?? input.employeeId,
    email: input.email ?? `${input.employeeId.toLowerCase()}@irisstar.tech`,
    mobile: input.mobile ?? "+97400000000",
    organization: organization.name,
    organizationId: organization.id,
    organizationCode: organization.code,
    facility: input.facility ?? "Oracle HRMS directory",
    department: input.department ?? "Clinical Operations",
    clinicalSpecialty: input.clinicalSpecialty ?? "Tele-triage",
    jobTitle: input.jobTitle ?? "Remote Triage Nurse",
    professionalCategory: input.professionalCategory ?? "Nurse",
    manager: input.manager ?? "Triage Service Manager",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "pending",
    accountStatus,
    directoryStatus,
    roles: input.roles ?? ["remote_triage_nurse"],
    responsibilities: input.responsibilities ?? ["conduct_nurse_triage", "view_ai_recommendation"],
    queues: input.queues ?? ["HIA Staff Tele-triage"],
    accessProfiles: input.accessProfiles ?? ["remote-triage-nurse-profile"],
    createdBy: "oracle-hrms-sync",
    createdAtIso: timestampIso,
    updatedBy: "oracle-hrms-sync",
    updatedAtIso: timestampIso
  };
  users.push(created);
  return { user: maskUser(created), created: true };
}

export async function revokeSessionsForUser(userId: string): Promise<number> {
  let revoked = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.delete(sessionId);
      revoked += 1;
    }
  }
  await revokePersistedSessionsForUser(userId);
  return revoked;
}

export async function setDirectoryStatusForEmployee(
  employeeId: string,
  directoryStatus: DirectoryStatus
): Promise<{ user?: SafeAdminUser; sessionsRevoked: number }> {
  const user = getDirectoryUserByEmployeeId(employeeId);
  if (!user) {
    return { sessionsRevoked: 0 };
  }
  user.directoryStatus = directoryStatus;
  user.accountStatus = directoryStatusToAccountStatus(directoryStatus);
  user.updatedBy = "oracle-hrms-sync";
  user.updatedAtIso = new Date().toISOString();
  const sessionsRevoked = directoryStatus === "active" ? 0 : await revokeSessionsForUser(user.id);
  return { user: maskUser(user), sessionsRevoked };
}

export function resetSecurityStoreForTests(): void {
  users = cloneInitialUsers();
  sessions.clear();
  failedLoginAttempts.clear();
}

export function listSsoProviders(): SsoProvider[] {
  return ssoProviders.map((provider) => ({
    ...provider,
    tenantId: maskLast(provider.tenantId, 6),
    secretStorage: provider.secretStorage
  }));
}

export function listEncryptionPolicies(): EncryptionPolicy[] {
  return encryptionPolicies;
}

export function listAuditEvents(): AuditEvent[] {
  return [...auditEvents].sort((left, right) => right.timestampIso.localeCompare(left.timestampIso));
}

export function getSecurityDashboard(): SecurityDashboard {
  return {
    activeUsers: users.filter((user) => user.accountStatus === "active").length,
    suspendedUsers: users.filter((user) => user.accountStatus === "suspended").length,
    lockedUsers: users.filter((user) => user.accountStatus === "locked").length,
    expiringAccess: 1,
    activeSessions: sessions.size,
    failedLoginAttempts: [...failedLoginAttempts.values()].reduce((total, count) => total + count, 0),
    pendingAccessApprovals: 3,
    pendingRoleApprovals: 2,
    breakGlassEvents: 0,
    recentReveals: auditEvents.filter((event) => event.action.includes("REVEAL")).length,
    identifiableExports: 0,
    keysNearingExpiry: 1,
    overdueKeyRotations: 0,
    failedCryptoOperations: 0,
    certificateExpiryWarnings: 1,
    openPrivacyRequests: 2,
    openSecurityIncidents: 0
  };
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function roleByCode(roleCode: string): Role | undefined {
  return roles.find((role) => role.code === roleCode);
}

function toSession(user: AdminUser, authMethod: AuthMethod, rememberMe: boolean, simulateRole?: string): AuthenticatedSession {
  const sessionId = randomBytes(32).toString("base64url");
  const ttlMs = rememberMe ? EXTENDED_SESSION_TTL_MS : SESSION_TTL_MS;
  const activeRole = simulateRole && user.roles.includes(simulateRole) ? simulateRole : user.roles[0] ?? "read_only";
  const activeRoleDefinition = roleByCode(activeRole);
  return {
    sessionId,
    user: maskUser(user),
    activeRole,
    permissions: [...new Set(activeRoleDefinition?.permissions ?? [])],
    responsibilities: [...new Set(activeRoleDefinition?.responsibilities ?? user.responsibilities)],
    expiresAtIso: new Date(Date.now() + ttlMs).toISOString(),
    authMethod,
    mfaVerified: user.mfaStatus === "enabled"
  };
}

export async function authenticateLocal(args: {
  username: string;
  password: string;
  rememberMe: boolean;
  simulateRole?: string;
  ipAddress: string;
  device: string;
}): Promise<{ ok: true; session: AuthenticatedSession } | { ok: false; message: string; locked?: boolean; forbidden?: boolean }> {
  const username = args.username.trim().toLowerCase();
  const user = users.find((candidate) => candidate.email.toLowerCase() === username || candidate.employeeId.toLowerCase() === username);
  const genericMessage = "Invalid username or password.";
  const currentFailures = failedLoginAttempts.get(username) ?? 0;

  if (currentFailures >= 5) {
    return { ok: false, message: "Account is temporarily locked. Contact the helpdesk.", locked: true };
  }

  // Local credential gate for development and UAT scaffolding. Live mode must
  // provide ADMIN_PASSWORD through the deployment environment or Secret Manager.
  const configuredPassword = getAdminPassword();
  const adminPasswordOk = configuredPassword.length > 0 && safeCompare(args.password, configuredPassword);
  const demoPassword = user ? demoPasswordByEmail[user.email.toLowerCase()] : undefined;
  const demoPasswordOk = Boolean(isMockMode() && demoPassword && safeCompare(args.password, demoPassword));
  const passwordOk = adminPasswordOk || demoPasswordOk;
  if (!user || !passwordOk) {
    failedLoginAttempts.set(username, currentFailures + 1);
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: user?.id ?? "unknown",
      activeRole: user?.roles[0] ?? "unknown",
      organization: user?.organization ?? "unknown",
      facility: user?.facility ?? "unknown",
      department: user?.department ?? "unknown",
      action: "FAILED_LOGIN",
      module: "Authentication",
      resource: "local",
      ipAddress: args.ipAddress,
      device: args.device,
      success: false,
      risk: "high"
    });
    return { ok: false, message: genericMessage };
  }

  if (user.accountStatus !== "active" || (user.directoryStatus && user.directoryStatus !== "active")) {
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: user.id,
      activeRole: user.roles[0] ?? "unknown",
      organization: user.organization,
      facility: user.facility,
      department: user.department,
      action: "DIRECTORY_LOGIN_BLOCKED",
      module: "Authentication",
      resource: "local",
      ipAddress: args.ipAddress,
      device: args.device,
      success: false,
      risk: "critical"
    });
    return {
      ok: false,
      message: "Account is disabled by HRMS directory status. Contact the triage service manager.",
      forbidden: true
    };
  }

  if (args.simulateRole && !user.roles.includes(args.simulateRole)) {
    return { ok: false, message: "Selected simulation role is not assigned to this demo account." };
  }

  failedLoginAttempts.delete(username);
  const session = toSession(user, "local", args.rememberMe, args.simulateRole);
  sessions.set(session.sessionId, session);
  await persistUserSession({
    session,
    ipAddress: args.ipAddress,
    device: args.device
  });
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: user.id,
    activeRole: session.activeRole,
    organization: user.organization,
    facility: user.facility,
    department: user.department,
    action: "LOGIN",
    module: "Authentication",
    resource: "local",
    ipAddress: args.ipAddress,
    device: args.device,
    success: true,
    risk: "medium"
  });
  return { ok: true, session };
}

export function getSession(sessionId?: string): AuthenticatedSession | undefined {
  if (!sessionId) {
    return undefined;
  }
  const session = sessions.get(sessionId);
  if (!session) {
    return undefined;
  }
  if (new Date(session.expiresAtIso).getTime() < Date.now()) {
    sessions.delete(sessionId);
    return undefined;
  }
  return session;
}

export async function getSessionFromStore(sessionId?: string): Promise<AuthenticatedSession | undefined> {
  const localSession = getSession(sessionId);
  if (localSession) {
    return localSession;
  }

  const persistedSession = await getPersistedUserSession(sessionId);
  if (!persistedSession) {
    return undefined;
  }

  sessions.set(persistedSession.sessionId, persistedSession);
  return getSession(persistedSession.sessionId);
}

export async function revokeSession(sessionId?: string): Promise<void> {
  if (sessionId) {
    sessions.delete(sessionId);
    await revokePersistedSession(sessionId);
  }
}

export function parseSessionCookie(headers: IncomingHttpHeaders): string | undefined {
  const cookie = headers.cookie;
  if (!cookie) {
    return undefined;
  }
  const parts = cookie.split(";").map((part) => part.trim());
  const sessionCookie = parts.find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return sessionCookie?.slice(SESSION_COOKIE.length + 1);
}

export function sessionCookie(sessionId: string, rememberMe: boolean, secure: boolean): string {
  const maxAge = Math.floor((rememberMe ? EXTENDED_SESSION_TTL_MS : SESSION_TTL_MS) / 1000);
  const secureFlag = secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secureFlag}`;
}

export function expiredSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function recordReveal(request: RevealRequest, session: AuthenticatedSession): Promise<{
  decision: "approved" | "denied";
  value?: string;
  audit: AuditEvent;
}> {
  const canReveal = session.permissions.includes("privacy.reveal.request") || session.permissions.includes("admin.users.manage");
  const audit: AuditEvent = {
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: session.user.id,
    activeRole: session.activeRole,
    organization: session.user.organization,
    facility: session.user.facility,
    department: session.user.department,
    action: canReveal ? "PERSONAL_DATA_REVEAL" : "FAILED_PERSONAL_DATA_REVEAL",
    module: "Privacy",
    resource: `${request.resourceType}:${request.resourceId}:${request.field}`,
    purpose: request.purpose,
    ipAddress: "request-context",
    device: "request-context",
    success: canReveal,
    risk: "critical"
  };
  await recordAuditEvent(audit);

  if (!canReveal) {
    return { decision: "denied", audit };
  }

  const user = users.find((candidate) => candidate.id === request.resourceId);
  const value = user && request.field in user ? String(user[request.field as keyof AdminUser] ?? "") : "No demo value";
  return { decision: "approved", value, audit };
}

export function testSsoProvider(providerId: string): { ok: boolean; message: string } {
  const provider = ssoProviders.find((item) => item.id === providerId);
  if (!provider) {
    return { ok: false, message: "Provider not found." };
  }
  if (!provider.enabled) {
    return { ok: false, message: "Provider is configured but disabled pending secrets and metadata approval." };
  }
  return { ok: true, message: "Provider metadata is reachable." };
}

export { SESSION_COOKIE };
