import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { sanitizeForLog } from "../utils/logSanitizer.js";
import {
  allowInsecureRequests,
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  enableNonRepudiationChecks,
  randomNonce,
  randomPKCECodeVerifier,
  randomState
} from "openid-client";
import { authenticator } from "otplib";
import { createIncidentCandidate } from "./privacyIncidentWorkflow.js";
import {
  areDemoCredentialsEnabled,
  getAdminPassword,
  getAuthAnomalyFailureThreshold,
  getAuthAnomalyWindowSeconds,
  getRevealAnomalyThreshold,
  getRevealAnomalyWindowSeconds,
  isMfaMandatory,
  isMockMode,
  shouldPersistRevealAnomalyCountersInDatabase,
  shouldPersistRolePermissionOverridesInDatabase,
  shouldPersistSecurityAnomalyCountersInDatabase,
  shouldUseDatabasePersistence
} from "../config/runtime.js";
import { decryptMfaSecret, encryptMfaSecret } from "./mfaCrypto.js";
import { verifyGovernedPassword } from "./governedAccountCrypto.js";
import {
  findGovernedAccount,
  listGovernedAccounts,
  persistGovernedAccount,
  persistGovernedAccountStatus
} from "./governedAccountPersistence.js";
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
  getAuthenticationProviderConfig,
  getPersistedUserSession,
  getPersistedMfaCredential,
  persistMfaCredential,
  persistRevealApproval,
  persistRevealEvent,
  getPersistedRevealRequest,
  recordAndCountRevealAnomalyEvents,
  recordAndCountSecurityAnomalyEvents,
  persistRevealRequest,
  getPersistedRolePermissionOverrides,
  loadPersistedCustomRoles,
  listPersistedAuditEvents,
  persistCustomRole,
  persistRolePermissionOverride,
  persistSecurityThresholdOverride,
  persistSecurityAuditEvent,
  persistUserSession,
  revokePersistedSession,
  revokePersistedSessionsForUser
} from "./persistence.js";

const SESSION_COOKIE = "ist_triage_session";
// Configurable via env var per deployment (e.g. QR's required inactivity
// timeout) rather than a fixed constant. Falls back to the previous
// defaults (30 min / 8 hr) when unset or invalid.
function minutesFromEnv(name: string, fallbackMinutes: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallbackMinutes;
}
const SESSION_TTL_MS = minutesFromEnv("SESSION_TIMEOUT_MINUTES", 30) * 60 * 1000;
const EXTENDED_SESSION_TTL_MS = minutesFromEnv("EXTENDED_SESSION_TIMEOUT_MINUTES", 8 * 60) * 60 * 1000;

// Closes NFR-020 ("ability to restrict max number of concurrent sessions") -
// configurable per deployment; falls back to a reasonable default. Multiple
// concurrent sessions per user remain supported (unchanged) - this only
// caps how many can be active at once, evicting the oldest beyond the cap.
function maxConcurrentSessionsFromEnv(): number {
  const raw = Number(process.env.MAX_CONCURRENT_SESSIONS_PER_USER);
  return Number.isFinite(raw) && raw > 0 ? raw : 5;
}

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
  usr_manager_10001: "IST_TECH",
  usr_nurse_10001: "IST_TECH",
  usr_senior_nurse_10001: "IST_TECH",
  usr_pediatric_nurse_10001: "IST_TECH"
};

const demoPasswordByEmail: Record<string, string> = {
  "rishma@irisstar.tech": "PlatformAdmin@2026",
  "khalid@irisstar.tech": "Khalid@2026",
  "layla@irisstar.tech": "Layla@2026",
  "fatima@irisstar.tech": "Fatima@2026",
  "sara@irisstar.tech": "Sara@2026"
};

// Emails added to demoPasswordByEmail by createUser() below (as opposed to
// the 20 seed entries above) - tracked separately so resetSecurityStoreForTests()
// can strip only the dynamically-created ones without touching the fixed seed set.
const dynamicallyCreatedUserEmails = new Set<string>();

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
    code: "privacy.reveal.approve",
    module: "Privacy",
    action: "approve",
    // Deliberately a separate permission from privacy.reveal.request - real
    // dual control needs two distinct accounts, not just two permission
    // checks against the same session (see the self-approval guard in
    // revealWorkflow.ts).
    description: "Approve or deny a pending personal-data reveal request from a different account.",
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
const roles: Role[] = [
  {
    code: "platform_super_administrator",
    name: "Platform Super Administrator",
    description: "Demo-only complete system access for local simulation across triage, administration, security, privacy, audit, and cryptography.",
    permissions: allPermissionCodes,
    responsibilities: ["manage_users", "administer_organization", "manage_sso", "manage_enterprise_integrations", "manage_encryption_policy"],
    dataScopes: ["organization:IST Tech", "all_users", "all_encounters"],
    clinicalScopes: ["adult", "pediatric", "aviation", "quality_review"],
    integrationScopes: ["sso", "kms", "hrms.read", "insurance.read", "audit"],
    status: "active",
    requiresApproval: true,
    system: true
  },
  {
    code: "triage_service_manager",
    name: "Triage Service Manager",
    description: "Monitors queue health, staffing coverage, case allocation, operational KPIs, and escalation throughput.",
    // privacy.reveal.approve added here (not remote_triage_nurse, which
    // already holds privacy.reveal.request) so real dual-control - a
    // requester and approver being distinct people - is actually possible
    // with the seeded roles. Previously only platform_super_administrator
    // held this permission, so a nurse's reveal request could only ever be
    // approved by the same super-admin account that can also request one,
    // making the "distinct approver" segregation-of-duties guarantee
    // untestable and, in a real deployment, practically unusable for the
    // common case of a nurse's request needing an operational manager's
    // sign-off rather than the platform's top-level administrator.
    permissions: [
      "triage.queue.manage",
      "operations.dashboard.view",
      "reports.view",
      "audit.events.view",
      "privacy.reveal.approve"
    ],
    responsibilities: ["verify_employee_id", "register_triage_call", "coordinate_triage_queue", "view_operational_reports"],
    dataScopes: ["assigned_queues", "operational_dashboards"],
    clinicalScopes: ["adult", "pediatric", "aviation", "operations"],
    integrationScopes: ["hrms.read", "audit"],
    status: "active",
    requiresApproval: true,
    system: true
  },
  {
    code: "remote_triage_nurse",
    name: "Remote Triage Nurse",
    description: "Conducts assigned remote triage encounters with clinical protocol access.",
    permissions: ["triage.workspace.view", "triage.recommendation.view", "privacy.reveal.request"],
    responsibilities: ["verify_employee_id", "conduct_nurse_triage", "view_ai_recommendation"],
    dataScopes: ["assigned_queue"],
    clinicalScopes: ["adult", "pediatric", "aviation"],
    integrationScopes: ["hrms.read", "insurance.read"],
    status: "active",
    requiresApproval: true,
    system: true
  },
];

const SYSTEM_ROLE_CODES = new Set(roles.map((role) => role.code));
let customRoles: Role[] = [];

const initialUsers: AdminUser[] = [
  {
    id: "usr_platform_admin_10001",
    employeeId: "IST-90001",
    hrmsId: "HCM-90001",
    fullName: "Rishma M Sangma",
    email: "rishma@irisstar.tech",
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
    responsibilities: [...roles[0].responsibilities],
    queues: ["HIA Staff Tele-triage", "Outstation Support", "Security Administration"],
    accessProfiles: ["platform-super-admin-profile", "security-admin-profile"],
    lastLoginIso: "2026-07-09T09:00:00.000Z",
    createdBy: "bootstrap",
    createdAtIso: "2026-07-01T08:00:00.000Z",
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
    roles: ["remote_triage_nurse"],
    responsibilities: ["conduct_nurse_triage", "view_ai_recommendation"],
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
      "IST-Platform-Admins": "platform_super_administrator",
      "IST-Triage-Managers": "triage_service_manager",
      "IST-Triage-Nurses": "remote_triage_nurse"
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
    userId: "usr_platform_admin_10001",
    activeRole: "platform_super_administrator",
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

// Real TOTP MFA state (closes AR.06/AR.13) - in-memory first (mock-mode
// tests, and the primary read path for an already-running process), with
// best-effort DB persistence via persistMfaCredential(), same dual-layer
// shape as sessions/failedLoginAttempts above.
type MfaCredentialState = {
  secret: string;
  // "reset_required" (closes AR.13's enrollment/recovery gap): a durable,
  // distinct state from "pending" (a self-service enrollment never
  // finished) - set only by an administrator-assisted reset, and the only
  // status besides "no credential at all" that forces a user back through
  // the pre-auth enrollment-token flow below rather than a normal login.
  status: "pending" | "enabled" | "disabled" | "reset_required";
  failedAttempts: number;
  lockedUntil?: number;
};
const mfaCredentials = new Map<string, MfaCredentialState>();

// Real, single-use, short-lived pre-authentication enrollment token (closes
// AR.13's circular-dependency gap: mandatory MFA blocked login before an
// unenrolled user could ever reach the session-gated /mfa/enroll routes).
// Server-state-backed (same convention as pendingMfaChallenges below) rather
// than a signed JWT - simpler, and this codebase already treats a random,
// unguessable, server-tracked id as the security boundary for the
// equivalent MFA-challenge token, so this token gets the same treatment.
// Deliberately NOT a session and NOT a bearer access token - the two routes
// that accept it (mfa/enroll, mfa/enroll/confirm) are the only places that
// ever look this map up; every other route continues to require a real
// AuthenticatedSession and would reject this token outright.
type PendingEnrollmentToken = {
  userId: string;
  organizationId: string;
  expiresAt: number;
  used: boolean;
};
const pendingEnrollmentTokens = new Map<string, PendingEnrollmentToken>();
const ENROLLMENT_TOKEN_TTL_MS = 15 * 60 * 1000;

// In-memory-first, DB-fallback read for MFA credential state - without this,
// enrollment recorded by one Cloud Run instance (or revision) is invisible
// to any other instance/revision handling a later request, since
// persistMfaCredential() alone is write-only. Found during AR.13's
// production-activation validation (an admin enrolled against one canary
// revision, then was incorrectly told to re-enroll on another). Mirrors the
// same in-memory-first/DB-fallback shape already used for sessions via
// getPersistedUserSession().
async function resolveMfaCredential(userId: string): Promise<MfaCredentialState | undefined> {
  const cached = mfaCredentials.get(userId);
  if (cached) {
    return cached;
  }
  const persisted = await getPersistedMfaCredential(userId);
  if (!persisted) {
    return undefined;
  }
  const hydrated: MfaCredentialState = { secret: persisted.secret, status: persisted.status, failedAttempts: 0 };
  mfaCredentials.set(userId, hydrated);
  return hydrated;
}

type PendingMfaChallenge = {
  userId: string;
  rememberMe: boolean;
  simulateRole?: string;
  expiresAt: number;
  ipAddress: string;
  device: string;
};
const pendingMfaChallenges = new Map<string, PendingMfaChallenge>();
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MFA_ENROLLMENT_CONFIRM_MAX_ATTEMPTS = 5;

// Real OIDC SSO state (closes the OAuth-provider-integration gap). Keyed by
// the OIDC `state` parameter - CSRF/replay protection is a core, non-optional
// part of the authorization-code flow, not an extra.
type OidcPendingLogin = {
  providerId: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: number;
};
const oidcStateStore = new Map<string, OidcPendingLogin>();
const OIDC_STATE_TTL_MS = 10 * 60 * 1000;

// Closes NFR-169 - binds each session to the IP/User-Agent that created it,
// re-validated on every authenticated request (see middleware/auth.ts).
// User-Agent rarely changes mid-session (low false-positive risk), so a
// mismatch there is rejected outright as likely session-token theft/replay.
// IP alone is NOT rejected - mobile/CGNAT/VPN users legitimately change IP
// mid-session - but a real IP change IS recorded as an audit event so it's
// visible, not silently ignored.
type SessionContext = { ipAddress: string; userAgent: string };
const sessionContextBySessionId = new Map<string, SessionContext>();

export type SessionContextCheck = "ok" | "user-agent-mismatch" | "ip-changed";

export function recordSessionContext(sessionId: string, ipAddress: string, userAgent: string): void {
  sessionContextBySessionId.set(sessionId, { ipAddress, userAgent });
}

export async function validateSessionContext(
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<SessionContextCheck> {
  const bound = sessionContextBySessionId.get(sessionId);
  if (!bound) {
    // No context was ever recorded for this session (e.g. a session
    // restored from a different process/restart) - nothing to compare
    // against, so this is not itself a rejection reason.
    return "ok";
  }
  if (bound.userAgent !== userAgent) {
    return "user-agent-mismatch";
  }
  if (bound.ipAddress !== ipAddress) {
    const session = sessions.get(sessionId);
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: session?.user.id ?? "unknown",
      activeRole: session?.activeRole ?? "unknown",
      organization: "",
      facility: "",
      department: "",
      action: "SESSION_IP_CHANGED",
      module: "Authentication",
      resource: sessionId,
      purpose: `IP changed from ${bound.ipAddress} to ${ipAddress} mid-session`,
      ipAddress,
      device: userAgent,
      success: true,
      risk: "medium"
    });
    // Update the bound IP so this doesn't re-fire on every subsequent
    // request from the same (new) IP for the rest of the session.
    sessionContextBySessionId.set(sessionId, { ipAddress, userAgent });
    return "ip-changed";
  }
  return "ok";
}

// CSQ IS.13 ("metrics which track the speed with which access rights are
// removed"): a durable, in-process metric record for every material
// access-removal path (account status change, role-permission revoke,
// single-session termination, HRMS/JML-driven deprovisioning). Kept as a
// dedicated store rather than overloading AuditEvent, since AuditEvent has
// no numeric-duration field and this needs cheap p50/p95/max aggregation.
export type AccessRevocationType =
  | "ACCOUNT_STATUS_CHANGE"
  | "ROLE_PERMISSION_REVOKE"
  | "SESSION_TERMINATION"
  | "JML_DEPROVISION";

export type AccessRevocationOutcome = "SUCCESS" | "FAILURE";

export type AccessRevocationMetric = {
  id: string;
  correlationId: string;
  requestedAtIso: string;
  completedAtIso: string;
  durationMs: number;
  revocationType: AccessRevocationType;
  outcome: AccessRevocationOutcome;
  organization: string;
  actorUserId: string;
  targetUserId?: string;
  targetRoleCode?: string;
  sessionsRevoked?: number;
  failureReason?: string;
};

let accessRevocationMetrics: AccessRevocationMetric[] = [];

/**
 * Records one completed (or failed) access-removal operation. `requestedAt`
 * must be captured by the caller at the start of the operation so the
 * duration reflects the real elapsed time of the revocation itself, not
 * just this function call. Never accepts credentials/tokens/session
 * values - only the identifiers needed to attribute and time the removal.
 */
function recordAccessRevocationMetric(input: {
  requestedAt: number;
  revocationType: AccessRevocationType;
  outcome: AccessRevocationOutcome;
  organization: string;
  actorUserId: string;
  targetUserId?: string;
  targetRoleCode?: string;
  sessionsRevoked?: number;
  failureReason?: string;
}): void {
  const completedAt = Date.now();
  accessRevocationMetrics.push({
    id: randomUUID(),
    correlationId: randomUUID(),
    requestedAtIso: new Date(input.requestedAt).toISOString(),
    completedAtIso: new Date(completedAt).toISOString(),
    durationMs: Math.max(0, completedAt - input.requestedAt),
    revocationType: input.revocationType,
    outcome: input.outcome,
    organization: input.organization,
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    targetRoleCode: input.targetRoleCode,
    sessionsRevoked: input.sessionsRevoked,
    failureReason: input.failureReason
  });
}

function percentile(sortedDurations: number[], p: number): number {
  if (sortedDurations.length === 0) {
    return 0;
  }
  const index = Math.min(sortedDurations.length - 1, Math.ceil((p / 100) * sortedDurations.length) - 1);
  return sortedDurations[Math.max(0, index)];
}

export type AccessRevocationMetricsReport = {
  periodStartIso: string;
  periodEndIso: string;
  organization: string | "all";
  completedCount: number;
  failedCount: number;
  p50DurationMs: number | null;
  p95DurationMs: number | null;
  maxDurationMs: number | null;
  byType: Record<AccessRevocationType, { completed: number; failed: number }>;
  dataComplete: boolean;
  note: string;
};

/**
 * CSQ IS.13's reporting surface. Reports MEASURED performance only - no
 * approved revocation-time target/SLA has been agreed with Qatar Airways,
 * so this deliberately does not invent one (a `targetMs` field is left
 * `null`/undefined pending that approval, per explicit instruction not to
 * fabricate an SLA).
 */
export function getAccessRevocationMetricsReport(params: {
  days: number;
  organization?: string;
}): AccessRevocationMetricsReport {
  const days = Math.max(1, Math.min(365, params.days));
  const periodEnd = Date.now();
  const periodStart = periodEnd - days * 24 * 60 * 60 * 1000;

  const inWindow = accessRevocationMetrics.filter((metric) => {
    const ts = new Date(metric.completedAtIso).getTime();
    if (ts < periodStart || ts > periodEnd) {
      return false;
    }
    if (params.organization && params.organization !== "all" && metric.organization !== params.organization) {
      return false;
    }
    return true;
  });

  const completed = inWindow.filter((m) => m.outcome === "SUCCESS");
  const failed = inWindow.filter((m) => m.outcome === "FAILURE");
  const durations = completed.map((m) => m.durationMs).sort((a, b) => a - b);

  const byType: AccessRevocationMetricsReport["byType"] = {
    ACCOUNT_STATUS_CHANGE: { completed: 0, failed: 0 },
    ROLE_PERMISSION_REVOKE: { completed: 0, failed: 0 },
    SESSION_TERMINATION: { completed: 0, failed: 0 },
    JML_DEPROVISION: { completed: 0, failed: 0 }
  };
  for (const metric of inWindow) {
    if (metric.outcome === "SUCCESS") {
      byType[metric.revocationType].completed += 1;
    } else {
      byType[metric.revocationType].failed += 1;
    }
  }

  return {
    periodStartIso: new Date(periodStart).toISOString(),
    periodEndIso: new Date(periodEnd).toISOString(),
    organization: params.organization && params.organization !== "all" ? params.organization : "all",
    completedCount: completed.length,
    failedCount: failed.length,
    p50DurationMs: durations.length ? percentile(durations, 50) : null,
    p95DurationMs: durations.length ? percentile(durations, 95) : null,
    maxDurationMs: durations.length ? durations[durations.length - 1] : null,
    byType,
    dataComplete: inWindow.length > 0,
    note:
      inWindow.length === 0
        ? "No access-removal operations recorded in this period - report is empty, not an error."
        : "Measured performance only. No Qatar-Airways-approved revocation-time target/SLA exists yet; this report shows real elapsed durations, not conformance to a target."
  };
}

export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  auditEvents.push(event);
  // A failure to persist the audit record (DB outage, network blip, a
  // misconfigured DATABASE_URL) must never block the primary action this
  // event describes (e.g. authentication) - audit logging is best-effort,
  // not a hard dependency of the action itself. Found via a real CI
  // failure: this previously unhandled rejection made login itself fail
  // whenever the audit-event DB write failed.
  try {
    await persistSecurityAuditEvent(event);
  } catch (error) {
    console.error("Failed to persist audit event (action itself still succeeds):", sanitizeForLog(error));
  }
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

function allRoles(): Role[] {
  return [...roles, ...customRoles];
}

export function listRoles(): Role[] {
  return allRoles().map(applyRolePermissionOverrides);
}

export class DuplicateRoleCodeError extends Error {}
export class InvalidRoleDefinitionError extends Error {
  constructor(message: string, readonly conflicts: string[] = []) {
    super(message);
  }
}

export type CreateCustomRoleInput = {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  responsibilities: string[];
  dataScopes?: string[];
  clinicalScopes?: string[];
  integrationScopes?: string[];
  requiresApproval?: boolean;
};

const CONFLICTING_PERMISSION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["privacy.reveal.request", "privacy.reveal.approve"],
  ["protocol.library.manage", "clinical.governance.approve"]
];

export function validateRoleDefinition(input: Pick<CreateCustomRoleInput, "permissions" | "responsibilities">): void {
  const selectedPermissions = new Set(input.permissions);
  const selectedResponsibilities = new Set(input.responsibilities);
  const knownPermissions = new Set(permissions.map((permission) => permission.code));
  const knownResponsibilities = new Map(responsibilities.map((responsibility) => [responsibility.code, responsibility]));
  const findings: string[] = [];

  for (const code of selectedPermissions) {
    if (!knownPermissions.has(code)) findings.push(`Unknown permission: ${code}`);
  }
  for (const code of selectedResponsibilities) {
    const responsibility = knownResponsibilities.get(code);
    if (!responsibility) {
      findings.push(`Unknown responsibility: ${code}`);
      continue;
    }
    for (const prerequisite of responsibility.prerequisiteResponsibilities) {
      if (!selectedResponsibilities.has(prerequisite)) {
        findings.push(`${code} requires responsibility ${prerequisite}`);
      }
    }
    for (const conflict of responsibility.conflictingResponsibilities) {
      if (knownResponsibilities.has(conflict) && selectedResponsibilities.has(conflict)) {
        findings.push(`${code} conflicts with responsibility ${conflict}`);
      }
    }
  }
  for (const [left, right] of CONFLICTING_PERMISSION_PAIRS) {
    if (selectedPermissions.has(left) && selectedPermissions.has(right)) {
      findings.push(`${left} conflicts with ${right}`);
    }
  }
  if (findings.length > 0) {
    throw new InvalidRoleDefinitionError("Role violates segregation-of-duties policy.", [...new Set(findings)]);
  }
}

function validateRoleAssignments(roleCodes: string[]): void {
  const assignedRoles = roleCodes.map((code) => allRoles().find((role) => role.code === code));
  if (assignedRoles.some((role) => !role)) {
    throw new InvalidRoleCodeError("One or more requested role codes are not recognized.");
  }
  // The existing demo platform administrator is a protected break-glass-like
  // system role whose transactional self-approval guards remain enforced at
  // each workflow. Do not reinterpret that single established role as a new
  // assignment conflict; adding any second role is still evaluated below.
  if (assignedRoles.length === 1 && assignedRoles[0]?.system) {
    return;
  }
  validateRoleDefinition({
    permissions: assignedRoles.flatMap((role) => role?.permissions ?? []),
    responsibilities: assignedRoles.flatMap((role) => role?.responsibilities ?? [])
  });
}

export async function createCustomRole(
  input: CreateCustomRoleInput,
  actor: { userId: string; activeRole: string; reason: string }
): Promise<Role> {
  const code = input.code.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{2,63}$/.test(code)) {
    throw new InvalidRoleDefinitionError("Role code must be 3-64 lowercase letters, numbers, or underscores and start with a letter.");
  }
  if (allRoles().some((role) => role.code === code)) {
    throw new DuplicateRoleCodeError(`Role code ${code} already exists.`);
  }
  validateRoleDefinition(input);
  const role: Role = {
    code,
    name: input.name.trim(),
    description: input.description.trim(),
    permissions: [...new Set(input.permissions)],
    responsibilities: [...new Set(input.responsibilities)],
    dataScopes: [...new Set(input.dataScopes ?? [])],
    clinicalScopes: [...new Set(input.clinicalScopes ?? [])],
    integrationScopes: [...new Set(input.integrationScopes ?? [])],
    status: "active",
    requiresApproval: input.requiresApproval ?? true,
    system: false
  };

  try {
    await persistCustomRole(role, actor.userId);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new DuplicateRoleCodeError(`Role code ${code} already exists.`);
    }
    throw error;
  }
  customRoles.push(role);
  await recordAuditEvent({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: actor.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: "CUSTOM_ROLE_CREATED",
    module: "AccessGovernance",
    resource: `Role:${code}`,
    purpose: actor.reason,
    ipAddress: "",
    device: "",
    success: true,
    risk: "high"
  });
  return role;
}

// Closes NFR-144's real remaining gap: the same opt-in limit/offset
// pagination pattern already added to GET /api/v1/queue and
// GET /api/v1/protocols, extended to this list endpoint - backward
// compatible (omitted params return every user, as before).
export function listUsers(pagination?: { limit?: number; offset?: number }): { users: SafeAdminUser[]; totalCount: number } {
  const masked = users.map(maskUser);
  const totalCount = masked.length;
  if (pagination?.limit === undefined && pagination?.offset === undefined) {
    return { users: masked, totalCount };
  }
  const offset = pagination?.offset ?? 0;
  const limit = pagination?.limit ?? totalCount;
  return { users: masked.slice(offset, offset + limit), totalCount };
}

function cacheGovernedUser(user: AdminUser): void {
  const index = users.findIndex((candidate) => candidate.id === user.id || candidate.email.toLowerCase() === user.email.toLowerCase());
  if (index >= 0) users[index] = user;
  else users.push(user);
  dynamicallyCreatedUserEmails.add(user.email.toLowerCase());
}

export async function hydrateGovernedUsers(): Promise<void> {
  const accounts = await listGovernedAccounts();
  for (const account of accounts) cacheGovernedUser(account.user);
}

export class UserNotFoundError extends Error {}
export class SelfStatusChangeError extends Error {}
export class DuplicateUserEmailError extends Error {}
export class InvalidRoleCodeError extends Error {}
export class InvalidEmailDomainError extends Error {}

// Every real named-user account here is an IST Tech employee/contractor -
// checked again at this layer (not just the route's zod schema) so any
// future caller of createUser() can't bypass the domain restriction.
const ORGANIZATION_EMAIL_DOMAIN = "@irisstar.tech";

export type CreateUserInput = {
  fullName: string;
  email: string;
  mobile: string;
  organization: string;
  facility: string;
  department: string;
  jobTitle: string;
  roles: string[];
};

/**
 * The only place in this application that mints a new named-user account -
 * closes the real gap that every AdminUser today is static seed data with
 * zero create path. Consistent with this codebase's existing "in-memory
 * mock user store is out of scope for real persistence" posture (the whole
 * `users` array is unpersisted), so this stays in-memory too, not a new
 * Prisma model. A real, random temporary password is minted and wired into
 * the same demoPasswordByEmail map authenticateLocal() already reads in
 * mock mode, so the new account can genuinely sign in immediately - a
 * cosmetic "created" row with no way to log in would defeat the point.
 */
export async function createUser(
  input: CreateUserInput,
  actor: { userId: string; reason: string }
): Promise<{ user: SafeAdminUser; temporaryPassword: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email.endsWith(ORGANIZATION_EMAIL_DOMAIN)) {
    throw new InvalidEmailDomainError(`Email must be on the ${ORGANIZATION_EMAIL_DOMAIN} domain.`);
  }
  if (users.some((candidate) => candidate.email.toLowerCase() === email)) {
    throw new DuplicateUserEmailError(`A user with email ${email} already exists.`);
  }
  const requestedRoles = [...new Set(input.roles)];
  if (requestedRoles.length === 0) {
    throw new InvalidRoleCodeError("One or more requested role codes are not recognized.");
  }
  validateRoleAssignments(requestedRoles);

  const nowIso = new Date().toISOString();
  const newUser: AdminUser = {
    id: `usr_${randomBytes(8).toString("hex")}`,
    employeeId: `IST-${randomBytes(4).toString("hex").toUpperCase()}`,
    hrmsId: "",
    fullName: input.fullName.trim(),
    email,
    mobile: input.mobile.trim(),
    organization: input.organization.trim(),
    facility: input.facility.trim(),
    department: input.department.trim(),
    clinicalSpecialty: "Not applicable",
    jobTitle: input.jobTitle.trim(),
    professionalCategory: "Administrator",
    manager: "",
    country: "QA",
    preferredLanguage: "en",
    timeZone: "Asia/Qatar",
    authenticationMethod: "local",
    mfaStatus: "disabled",
    accountStatus: "active",
    directoryStatus: "active",
    roles: requestedRoles,
    responsibilities: [],
    queues: [],
    accessProfiles: [],
    createdBy: actor.userId,
    createdAtIso: nowIso,
    updatedBy: actor.userId,
    updatedAtIso: nowIso
  };
  const temporaryPassword = randomBytes(9).toString("base64url");
  await persistGovernedAccount(newUser, temporaryPassword);
  users.push(newUser);
  demoPasswordByEmail[email] = temporaryPassword;
  dynamicallyCreatedUserEmails.add(email);

  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: nowIso,
    userId: actor.userId,
    activeRole: "platform_super_administrator",
    organization: newUser.organization,
    facility: newUser.facility,
    department: newUser.department,
    action: "USER_ACCOUNT_CREATED",
    module: "AccessGovernance",
    resource: `UserAccount:${newUser.id}`,
    purpose: actor.reason,
    ipAddress: "",
    device: "",
    success: true,
    risk: "medium"
  });

  return { user: maskUser(newUser), temporaryPassword };
}

/**
 * Real account-status mutation (suspend/reactivate/deactivate) - closes
 * part of the access-entitlement remediation gap (CSQ IS.18: "if users are
 * found to have inappropriate entitlements, are all remediation actions
 * recorded?"). Writes a real AuditEvent (via recordAuditEvent, which also
 * persists to the database in DB-persistence mode) so a status change is
 * itself an auditable action, not a silent mutation.
 */
export async function updateUserAccountStatus(
  userId: string,
  status: AccountStatus,
  actor: { userId: string; reason: string }
): Promise<SafeAdminUser> {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new UserNotFoundError(`No user found with id ${userId}`);
  }
  // Prevents an admin from locking themselves out (accidentally or via a
  // compromised session) by suspending/deactivating/locking their own
  // account through this endpoint - self-reactivation to "active" is
  // harmless and stays allowed.
  if (user.id === actor.userId && status !== "active") {
    throw new SelfStatusChangeError("Cannot suspend, lock, or deactivate your own account.");
  }
  user.accountStatus = status;
  user.updatedBy = actor.userId;
  user.updatedAtIso = new Date().toISOString();
  await persistGovernedAccountStatus(user);

  // A suspended/locked/deactivated account must not be able to keep using
  // an already-established session - without this, the status change is
  // cosmetic until that session naturally expires. Mirrors the same
  // revocation already triggered by HRMS-driven deactivation.
  const revocationRequestedAt = Date.now();
  let sessionsRevoked = 0;
  if (status !== "active") {
    sessionsRevoked = await revokeSessionsForUser(user.id);
    recordAccessRevocationMetric({
      requestedAt: revocationRequestedAt,
      revocationType: "ACCOUNT_STATUS_CHANGE",
      outcome: "SUCCESS",
      organization: user.organization ?? "",
      actorUserId: actor.userId,
      targetUserId: user.id,
      sessionsRevoked
    });
  }

  await recordAuditEvent({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: "platform_super_administrator",
    organization: user.organization ?? "",
    facility: "",
    department: "",
    action: "USER_ACCOUNT_STATUS_CHANGED",
    module: "AccessGovernance",
    resource: `UserAccount:${user.id}`,
    purpose: sessionsRevoked > 0 ? `${actor.reason} (${sessionsRevoked} active session(s) revoked)` : actor.reason,
    ipAddress: "",
    device: "",
    success: true,
    risk: status === "suspended" || status === "deactivated" ? "medium" : "low"
  });

  return maskUser(user);
}

export class RoleNotFoundError extends Error {}
export class PermissionNotFoundError extends Error {}
export class SelfPermissionRevocationError extends Error {}

async function mutateRolePermission(
  roleCode: string,
  permissionCode: string,
  action: "GRANT" | "REVOKE",
  actor: { userId: string; activeRole: string; reason: string }
): Promise<Role> {
  const baseRole = allRoles().find((candidate) => candidate.code === roleCode);
  if (!baseRole) {
    throw new RoleNotFoundError(`No role found with code ${roleCode}`);
  }
  if (!permissions.some((candidate) => candidate.code === permissionCode)) {
    throw new PermissionNotFoundError(`No permission found with code ${permissionCode}`);
  }
  if (roleCode !== "platform_super_administrator") {
    const effective = applyRolePermissionOverrides(baseRole);
    const prospectivePermissions = new Set(effective.permissions);
    if (action === "GRANT") prospectivePermissions.add(permissionCode);
    else prospectivePermissions.delete(permissionCode);
    validateRoleDefinition({ permissions: [...prospectivePermissions], responsibilities: effective.responsibilities });
  }
  // Prevents an admin from revoking admin.roles.manage from their own
  // currently-active role, which would lock them out of the Control
  // Center's role administration entirely through this same endpoint -
  // same reasoning as SelfStatusChangeError above.
  if (action === "REVOKE" && actor.activeRole === roleCode && permissionCode === "admin.roles.manage") {
    throw new SelfPermissionRevocationError(
      "Cannot revoke admin.roles.manage from your own currently-active role."
    );
  }

  const revocationRequestedAt = Date.now();
  rolePermissionOverrides.push({ roleCode, permissionCode, action });
  try {
    await persistRolePermissionOverride({
      roleCode,
      permissionCode,
      action,
      grantedBy: actor.userId,
      reason: actor.reason
    });
  } catch (error) {
    console.error("Failed to persist role-permission override (change still applies in-memory):", sanitizeForLog(error));
  }

  // session.permissions is a snapshot taken at login (see toSession()) and
  // is never re-derived - without this, a grant/revoke here would be
  // invisible to anyone already logged in under the affected role.
  const sessionsRevoked = await revokeSessionsForRole(roleCode);
  if (action === "REVOKE") {
    recordAccessRevocationMetric({
      requestedAt: revocationRequestedAt,
      revocationType: "ROLE_PERMISSION_REVOKE",
      outcome: "SUCCESS",
      organization: "",
      actorUserId: actor.userId,
      targetRoleCode: roleCode,
      sessionsRevoked
    });
  }

  await recordAuditEvent({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: actor.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: action === "GRANT" ? "ROLE_PERMISSION_GRANTED" : "ROLE_PERMISSION_REVOKED",
    module: "AccessGovernance",
    resource: `Role:${roleCode}:${permissionCode}`,
    purpose: sessionsRevoked > 0 ? `${actor.reason} (${sessionsRevoked} active session(s) revoked)` : actor.reason,
    ipAddress: "",
    device: "",
    success: true,
    risk: "medium"
  });

  return roleByCode(roleCode) as Role;
}

export async function grantPermissionToRole(
  roleCode: string,
  permissionCode: string,
  actor: { userId: string; activeRole: string; reason: string }
): Promise<Role> {
  return mutateRolePermission(roleCode, permissionCode, "GRANT", actor);
}

export async function revokePermissionFromRole(
  roleCode: string,
  permissionCode: string,
  actor: { userId: string; activeRole: string; reason: string }
): Promise<Role> {
  return mutateRolePermission(roleCode, permissionCode, "REVOKE", actor);
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
  if (input.roles) {
    validateRoleAssignments([...new Set(input.roles)]);
  }
  if (input.responsibilities) {
    validateRoleDefinition({ permissions: [], responsibilities: input.responsibilities });
  }
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

// Enforces MAX_CONCURRENT_SESSIONS_PER_USER after a new session is issued -
// `sessions` is a Map, so iteration order is insertion order; the oldest
// sessions for this user are the ones still earliest in that order.
async function enforceMaxConcurrentSessions(userId: string): Promise<void> {
  const maxConcurrentSessions = maxConcurrentSessionsFromEnv();
  const userSessionIds = [...sessions.entries()]
    .filter(([, session]) => session.user.id === userId)
    .map(([sessionId]) => sessionId);
  const excess = userSessionIds.length - maxConcurrentSessions;
  if (excess <= 0) {
    return;
  }
  for (const sessionId of userSessionIds.slice(0, excess)) {
    sessions.delete(sessionId);
    sessionContextBySessionId.delete(sessionId);
    elevatedSessions.delete(sessionId);
    await revokePersistedSession(sessionId);
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId,
      activeRole: "system",
      organization: "",
      facility: "",
      department: "",
      action: "SESSION_EVICTED_CONCURRENT_LIMIT",
      module: "AccessGovernance",
      resource: `Session:${sessionId}`,
      purpose: `Oldest session evicted - exceeded MAX_CONCURRENT_SESSIONS_PER_USER (${maxConcurrentSessions})`,
      ipAddress: "",
      device: "",
      success: true,
      risk: "low"
    });
  }
}

export class SessionNotFoundError extends Error {}

export type ActiveSessionSummary = {
  sessionId: string;
  userId: string;
  activeRole: string;
  authMethod: AuthMethod;
  mfaVerified: boolean;
  expiresAtIso: string;
};

// Closes NFR-021's "terminate this one specific session" gap -
// revokeSessionsForUser()/revokeSessionsForRole() above only ever revoke
// every session for a user/role at once. This lists/terminates exactly one.
export function listActiveSessionsForUser(userId: string): ActiveSessionSummary[] {
  const summaries: ActiveSessionSummary[] = [];
  for (const [sessionId, session] of sessions.entries()) {
    if (session.user.id === userId) {
      summaries.push({
        sessionId,
        userId,
        activeRole: session.activeRole,
        authMethod: session.authMethod,
        mfaVerified: session.mfaVerified,
        expiresAtIso: session.expiresAtIso
      });
    }
  }
  return summaries;
}

export async function revokeSessionById(
  sessionId: string,
  actor: { userId: string; activeRole: string }
): Promise<{ userId: string; activeRole: string }> {
  const revocationRequestedAt = Date.now();
  const session = sessions.get(sessionId);
  if (!session) {
    recordAccessRevocationMetric({
      requestedAt: revocationRequestedAt,
      revocationType: "SESSION_TERMINATION",
      outcome: "FAILURE",
      organization: "",
      actorUserId: actor.userId,
      failureReason: "Session not found"
    });
    throw new SessionNotFoundError(`No active session found with id ${sessionId}`);
  }
  sessions.delete(sessionId);
  sessionContextBySessionId.delete(sessionId);
  elevatedSessions.delete(sessionId);
  await revokePersistedSession(sessionId);
  recordAccessRevocationMetric({
    requestedAt: revocationRequestedAt,
    revocationType: "SESSION_TERMINATION",
    outcome: "SUCCESS",
    organization: session.user.organization ?? "",
    actorUserId: actor.userId,
    targetUserId: session.user.id,
    sessionsRevoked: 1
  });
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: actor.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: "SESSION_TERMINATED",
    module: "AccessGovernance",
    resource: `Session:${sessionId}`,
    purpose: `Terminated session belonging to user ${session.user.id}`,
    ipAddress: "",
    device: "",
    success: true,
    risk: "medium"
  });
  return { userId: session.user.id, activeRole: session.activeRole };
}

export async function revokeSessionsForUser(userId: string): Promise<number> {
  let revoked = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.delete(sessionId);
      sessionContextBySessionId.delete(sessionId);
      revoked += 1;
    }
  }
  await revokePersistedSessionsForUser(userId);
  return revoked;
}

export async function revokeSessionsForRole(roleCode: string): Promise<number> {
  let revoked = 0;
  const affectedUserIds = new Set<string>();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.activeRole === roleCode) {
      sessions.delete(sessionId);
      sessionContextBySessionId.delete(sessionId);
      affectedUserIds.add(session.user.id);
      revoked += 1;
    }
  }
  for (const userId of affectedUserIds) {
    await revokePersistedSessionsForUser(userId);
  }
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
  const revocationRequestedAt = Date.now();
  user.directoryStatus = directoryStatus;
  user.accountStatus = directoryStatusToAccountStatus(directoryStatus);
  user.updatedBy = "oracle-hrms-sync";
  user.updatedAtIso = new Date().toISOString();
  const sessionsRevoked = directoryStatus === "active" ? 0 : await revokeSessionsForUser(user.id);
  if (directoryStatus !== "active") {
    recordAccessRevocationMetric({
      requestedAt: revocationRequestedAt,
      revocationType: "JML_DEPROVISION",
      outcome: "SUCCESS",
      organization: user.organization ?? "",
      actorUserId: "oracle-hrms-sync",
      targetUserId: user.id,
      sessionsRevoked
    });
  }
  return { user: maskUser(user), sessionsRevoked };
}

export function resetSecurityStoreForTests(): void {
  users = cloneInitialUsers();
  for (const email of dynamicallyCreatedUserEmails) {
    delete demoPasswordByEmail[email];
  }
  dynamicallyCreatedUserEmails.clear();
  sessions.clear();
  failedLoginAttempts.clear();
  rolePermissionOverrides = [];
  customRoles = [];
  mfaCredentials.clear();
  pendingMfaChallenges.clear();
  pendingEnrollmentTokens.clear();
  oidcStateStore.clear();
  sessionContextBySessionId.clear();
  revealRequestsById.clear();
  revealValuesById.clear();
  elevatedSessions.clear();
  revealRequestTimestampsByUser.clear();
  accessRevocationMetrics = [];
  localSecurityAnomalyTimestamps.clear();
  securityThresholdOverrides.clear();
}

// Closes NFR-119 - a real, QR-facing capability to configure the app's
// own anomaly-detection thresholds at runtime, without a redeploy.
// Terraform/Cloud Monitoring alert-policy thresholds (terraform/
// alerting.tf) stay engineer-owned IaC - this is a separate,
// application-level layer the two real anomaly-rate checks below read
// from first, falling back to the existing env-var defaults untouched.
export type SecurityThresholdKey = "AUTH_ANOMALY_FAILURE_THRESHOLD" | "REVEAL_ANOMALY_THRESHOLD";
export const SECURITY_THRESHOLD_KEYS: SecurityThresholdKey[] = [
  "AUTH_ANOMALY_FAILURE_THRESHOLD",
  "REVEAL_ANOMALY_THRESHOLD"
];

const securityThresholdOverrides = new Map<string, number>();

function effectiveThreshold(key: SecurityThresholdKey, envDefault: number): number {
  return securityThresholdOverrides.get(key) ?? envDefault;
}

export async function setSecurityThreshold(
  key: SecurityThresholdKey,
  value: number,
  actor: { userId: string; activeRole: string }
): Promise<void> {
  if (!Number.isInteger(value) || value <= 0) {
    throw new InvalidThresholdValueError(`${key} must be a positive integer`);
  }
  securityThresholdOverrides.set(key, value);
  if (shouldPersistSecurityAnomalyCountersInDatabase()) {
    try {
      await persistSecurityThresholdOverride(key, value, actor.userId);
    } catch (error) {
      console.error("Failed to persist security threshold override", error);
    }
  }
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: actor.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: "SECURITY_THRESHOLD_UPDATED",
    module: "AccessGovernance",
    resource: `SecurityThreshold:${key}`,
    purpose: `Set ${key} to ${value}`,
    ipAddress: "",
    device: "",
    success: true,
    risk: "medium"
  });
}

export function listSecurityThresholds(): Array<{ key: SecurityThresholdKey; value: number; isOverridden: boolean }> {
  return SECURITY_THRESHOLD_KEYS.map((key) => {
    const envDefault = key === "AUTH_ANOMALY_FAILURE_THRESHOLD" ? getAuthAnomalyFailureThreshold() : getRevealAnomalyThreshold();
    return { key, value: effectiveThreshold(key, envDefault), isOverridden: securityThresholdOverrides.has(key) };
  });
}

export class InvalidThresholdValueError extends Error {}

export class ReviewCertificationNotFoundError extends Error {}

// Closes NFR-036's real remaining gap - a human stakeholder explicitly
// acknowledging a specific access-entitlement-review certification,
// distinct from the existing automated certification record itself.
export async function acknowledgeAccessEntitlementReview(
  certificationId: string,
  actor: { userId: string; activeRole: string }
): Promise<void> {
  const certification = shouldUseDatabasePersistence()
    ? (await listPersistedAuditEvents(200, { action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED" })).find(
        (event) => event.id === certificationId
      )
    : listAuditEvents().find((event) => event.action === "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED" && event.id === certificationId);
  if (!certification) {
    throw new ReviewCertificationNotFoundError(`No access-entitlement-review certification found with id ${certificationId}`);
  }

  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: actor.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: "ACCESS_ENTITLEMENT_REVIEW_ACKNOWLEDGED",
    module: "AccessGovernance",
    resource: `AuditEvent:${certificationId}`,
    purpose: `certificationId=${certificationId}`,
    ipAddress: "",
    device: "",
    success: true,
    risk: "low"
  });
}

// Real JIT privileged-access elevation (closes NFR-180's PAM capability gap:
// just-in-time elevation + MFA + a real, queryable audit trail). A small,
// explicit set of the highest-risk mutation permissions built this session
// require a second, time-boxed elevation step (fresh TOTP re-verification)
// on top of the standing session-permission model - everything else is
// untouched. No dedicated third-party PAM tool exists here; this closes the
// underlying capability, not the "own a commercial PAM product" ask.
export const PRIVILEGED_PERMISSIONS = new Set([
  "admin.users.manage",
  "admin.roles.manage",
  "crypto.policy.manage",
  "security.sso.manage",
  "privacy.reveal.approve"
]);

const PAM_ELEVATION_TTL_MS = 15 * 60 * 1000;

type ElevationState = { expiresAt: number; elevationId: string };
const elevatedSessions = new Map<string, ElevationState>();

export class MfaNotEnrolledError extends Error {}
export class InvalidElevationCodeError extends Error {}

export async function requestElevation(
  session: AuthenticatedSession,
  code: string
): Promise<{ elevated: true; elevationId: string; expiresAt: string }> {
  const credential = await resolveMfaCredential(session.user.id);
  if (credential?.status !== "enabled") {
    throw new MfaNotEnrolledError("Privileged elevation requires TOTP MFA to already be enrolled and enabled.");
  }
  // Same real TOTP verification call already used by confirmMfaEnrollment/
  // verifyMfaChallenge - elevation reuses this exact second factor, not a
  // new one.
  const isValid = authenticator.verify({ token: code, secret: credential.secret });
  if (!isValid) {
    await checkSecurityAnomalyRate({
      signalType: "PAM_ELEVATION_DENIED",
      scopeKey: session.user.id,
      organization: session.user.organization
    });
    throw new InvalidElevationCodeError("Invalid authentication code.");
  }

  const elevationId = `elevation-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const expiresAt = Date.now() + PAM_ELEVATION_TTL_MS;
  elevatedSessions.set(session.sessionId, { expiresAt, elevationId });

  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: session.user.id,
    activeRole: session.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: "PAM_ELEVATION_GRANTED",
    module: "AccessGovernance",
    resource: elevationId,
    ipAddress: "",
    device: "",
    success: true,
    risk: "medium"
  });

  return { elevated: true, elevationId, expiresAt: new Date(expiresAt).toISOString() };
}

export async function endElevation(session: AuthenticatedSession): Promise<void> {
  const state = elevatedSessions.get(session.sessionId);
  elevatedSessions.delete(session.sessionId);
  if (!state) {
    return;
  }
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: session.user.id,
    activeRole: session.activeRole,
    organization: "",
    facility: "",
    department: "",
    action: "PAM_ELEVATION_ENDED",
    module: "AccessGovernance",
    resource: state.elevationId,
    ipAddress: "",
    device: "",
    success: true,
    risk: "low"
  });
}

export function isElevated(sessionId: string): { elevated: boolean; expiresAt?: string; elevationId?: string } {
  const state = elevatedSessions.get(sessionId);
  if (!state) {
    return { elevated: false };
  }
  if (state.expiresAt < Date.now()) {
    elevatedSessions.delete(sessionId);
    return { elevated: false };
  }
  return { elevated: true, expiresAt: new Date(state.expiresAt).toISOString(), elevationId: state.elevationId };
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

export function listAuditEvents(filter?: {
  userId?: string;
  resource?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}): AuditEvent[] {
  const filtered = [...auditEvents]
    .filter((event) => {
      if (filter?.userId && event.userId !== filter.userId) {
        return false;
      }
      if (filter?.resource && event.resource !== filter.resource) {
        return false;
      }
      if (filter?.since && event.timestampIso < filter.since) {
        return false;
      }
      if (filter?.until && event.timestampIso > filter.until) {
        return false;
      }
      return true;
    })
    .sort((left, right) => right.timestampIso.localeCompare(left.timestampIso));
  if (filter?.limit === undefined && filter?.offset === undefined) {
    return filtered;
  }
  const offset = filter?.offset ?? 0;
  const limit = filter?.limit ?? filtered.length;
  return filtered.slice(offset, offset + limit);
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

// Persistent grant/revoke overrides layered on top of the hardcoded role
// baseline above - closes NFR-030/031/032 ("Administrators add/remove
// access to screens/data/API endpoints for roles"), which previously
// required a source change + redeploy (see the historical comment on the
// GET /roles route this replaces). The baseline `roles` array stays the
// source-controlled default; this only records explicit deltas from it.
// In-memory first (read on every roleByCode()/listRoles() call), with
// best-effort DB persistence - same shape as recordAuditEvent().
type RolePermissionOverrideRecord = {
  roleCode: string;
  permissionCode: string;
  action: "GRANT" | "REVOKE";
};

let rolePermissionOverrides: RolePermissionOverrideRecord[] = [];

// Loads the current durable role-permission override state into this
// instance's in-memory cache - call once at process startup (src/index.ts).
// Found during the persistence-gating sweep: without this, a grant/revoke
// persisted by one Cloud Run instance was never visible to any other
// instance's permission resolution, a genuine authorization-bypass risk.
// This closes the "new instance starts from stale/empty state" case; it
// does not make an already-running instance see a grant/revoke made after
// it started (a disclosed residual limitation - would need a periodic
// refresh or a pub/sub invalidation signal to close fully).
export async function hydrateRolePermissionOverridesFromDatabase(): Promise<void> {
  if (!shouldPersistRolePermissionOverridesInDatabase()) {
    return;
  }
  const persistedCustomRoles = await loadPersistedCustomRoles();
  customRoles = persistedCustomRoles.filter((role) => {
    if (SYSTEM_ROLE_CODES.has(role.code)) {
      console.error(`Ignored persisted custom role that collides with protected system role ${role.code}.`);
      return false;
    }
    try {
      validateRoleDefinition(role);
      return true;
    } catch (error) {
      console.error(`Ignored invalid persisted custom role ${role.code}:`, sanitizeForLog(error));
      return false;
    }
  });
  const roleCodes = new Set(allRoles().map((role) => role.code));
  const hydrated: RolePermissionOverrideRecord[] = [];
  for (const roleCode of roleCodes) {
    try {
      const persisted = await getPersistedRolePermissionOverrides(roleCode);
      for (const override of persisted) {
        hydrated.push({ roleCode: override.roleCode, permissionCode: override.permissionCode, action: override.action });
      }
    } catch (error) {
      console.error(`Failed to hydrate role-permission overrides for ${roleCode}:`, sanitizeForLog(error));
    }
  }
  if (hydrated.length > 0) {
    rolePermissionOverrides = hydrated;
  }
}

export function startRoleCatalogRefresh(): void {
  if (!shouldPersistRolePermissionOverridesInDatabase()) {
    return;
  }
  const rawSeconds = Number(process.env.ROLE_CATALOG_REFRESH_SECONDS ?? 30);
  const intervalMs = (Number.isFinite(rawSeconds) && rawSeconds >= 5 ? rawSeconds : 30) * 1_000;
  const timer = setInterval(() => {
    void hydrateRolePermissionOverridesFromDatabase().catch((error) => {
      console.error("Failed to refresh durable role catalog:", sanitizeForLog(error));
    });
  }, intervalMs);
  timer.unref();
}

function applyRolePermissionOverrides(role: Role): Role {
  const grants = new Set<string>();
  const revokes = new Set<string>();
  for (const override of rolePermissionOverrides) {
    if (override.roleCode !== role.code) {
      continue;
    }
    if (override.action === "GRANT") {
      grants.add(override.permissionCode);
      revokes.delete(override.permissionCode);
    } else {
      revokes.add(override.permissionCode);
      grants.delete(override.permissionCode);
    }
  }
  if (grants.size === 0 && revokes.size === 0) {
    return role;
  }
  const merged = new Set([...role.permissions, ...grants]);
  for (const revoked of revokes) {
    merged.delete(revoked);
  }
  return { ...role, permissions: [...merged] };
}

function roleByCode(roleCode: string): Role | undefined {
  const role = allRoles().find((candidate) => candidate.code === roleCode);
  return role ? applyRolePermissionOverrides(role) : undefined;
}

function toSession(
  user: AdminUser,
  authMethod: AuthMethod,
  rememberMe: boolean,
  simulateRole?: string,
  mfaVerified = false
): AuthenticatedSession {
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
    // Real verification status (closes AR.06/AR.13's cosmetic-only gap):
    // true only when this session was actually issued after a verified TOTP
    // challenge (verifyMfaChallenge) or a real SSO assertion - never copied
    // from a static user-profile label.
    mfaVerified
  };
}

export type AuthenticateLocalResult =
  | { ok: true; session: AuthenticatedSession }
  | { ok: true; mfaRequired: true; challengeId: string }
  | {
      ok: false;
      message: string;
      locked?: boolean;
      forbidden?: boolean;
      mfaEnrollmentRequired?: boolean;
      enrollmentToken?: string;
    };

export async function authenticateLocal(args: {
  username: string;
  password: string;
  rememberMe: boolean;
  simulateRole?: string;
  ipAddress: string;
  device: string;
}): Promise<AuthenticateLocalResult> {
  const username = args.username.trim().toLowerCase();
  const persistedGovernedAccount = await findGovernedAccount(username);
  if (persistedGovernedAccount) cacheGovernedUser(persistedGovernedAccount.user);
  const user = users.find((candidate) => candidate.email.toLowerCase() === username || candidate.employeeId.toLowerCase() === username);
  const genericMessage = "Invalid username or password.";
  const currentFailures = failedLoginAttempts.get(username) ?? 0;

  if (currentFailures >= 5) {
    return { ok: false, message: "Account is temporarily locked. Contact the helpdesk.", locked: true };
  }

  // Seeded/shared credentials are permitted only in explicitly enabled local
  // simulation. NODE_ENV=production fails closed even when MOCK_MODE=true.
  // A separately configured ADMIN_PASSWORD remains restricted to the platform
  // bootstrap account and is still subject to the MFA gate below.
  const configuredPassword = getAdminPassword();
  const isAdminBootstrapAccount = Boolean(user?.roles.includes("platform_super_administrator"));
  const adminPasswordOk =
    (areDemoCredentialsEnabled() || isAdminBootstrapAccount) &&
    configuredPassword.length > 0 &&
    safeCompare(args.password, configuredPassword);
  const demoPassword = user ? demoPasswordByEmail[user.email.toLowerCase()] : undefined;
  const demoPasswordOk = Boolean(areDemoCredentialsEnabled() && demoPassword && safeCompare(args.password, demoPassword));
  const inMemoryGovernedPasswordOk = Boolean(
    user && dynamicallyCreatedUserEmails.has(user.email.toLowerCase()) && demoPassword && safeCompare(args.password, demoPassword)
  );
  const persistedGovernedPasswordOk = Boolean(
    persistedGovernedAccount && verifyGovernedPassword(args.password, persistedGovernedAccount.passwordHash)
  );
  const passwordOk = adminPasswordOk || demoPasswordOk || inMemoryGovernedPasswordOk || persistedGovernedPasswordOk;
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
    // scopeKey is the normalized username, not a raw credential - counts
    // per-account, consistent with the existing failedLoginAttempts
    // lockout's own keying.
    await checkSecurityAnomalyRate({
      signalType: "AUTH_FAILURE",
      scopeKey: username,
      organization: user?.organization
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

  // Real MFA gate (closes AR.06/AR.13) - opt-in per user, not org-mandated
  // in this phase (the questionnaire rows require the capability to exist
  // and be enforceable, not a forced global rollout). A user with
  // status "enabled" must complete a second, TOTP-verified step before a
  // real session is issued; users without MFA enrolled (or still
  // "pending"/"disabled") proceed exactly as before.
  const mfaCredential = await resolveMfaCredential(user.id);
  if (mfaCredential?.status === "enabled") {
    const challengeId = randomBytes(32).toString("base64url");
    pendingMfaChallenges.set(challengeId, {
      userId: user.id,
      rememberMe: args.rememberMe,
      simulateRole: args.simulateRole,
      expiresAt: Date.now() + MFA_CHALLENGE_TTL_MS,
      ipAddress: args.ipAddress,
      device: args.device
    });
    return { ok: true, mfaRequired: true, challengeId };
  }

  // Real org-wide enforcement path for Cloud CSQ AR.13 ("MFA required for
  // all remote user access") - off by default (see isMfaMandatory()), so
  // today's opt-in behavior is unchanged unless an operator deliberately
  // turns this on for a given environment. When on, a user without MFA
  // enrolled/enabled cannot complete a normal login - they get a distinct,
  // actionable response (not a generic auth failure) directing them to
  // enroll, rather than silently being let in.
  if (isMfaMandatory()) {
    // Real pre-auth enrollment token (closes AR.13's circular-dependency
    // gap) - a real, unauthenticated user cannot be handed a dead end here;
    // this token is the ONLY thing that lets them reach the session-gated
    // /mfa/enroll routes without already having a session. It authorizes
    // nothing else (see pendingEnrollmentTokens' own comment above).
    const enrollmentToken = randomBytes(32).toString("base64url");
    pendingEnrollmentTokens.set(enrollmentToken, {
      userId: user.id,
      organizationId: user.organization,
      expiresAt: Date.now() + ENROLLMENT_TOKEN_TTL_MS,
      used: false
    });
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: user.id,
      activeRole: user.roles[0] ?? "unknown",
      organization: user.organization,
      facility: user.facility,
      department: user.department,
      action: "MFA_ENROLLMENT_TOKEN_ISSUED",
      module: "Authentication",
      resource: "local",
      ipAddress: args.ipAddress,
      device: args.device,
      success: true,
      risk: "high"
    });
    return {
      ok: false,
      message: "Multi-factor authentication is required for this account. Enroll in MFA to continue.",
      mfaEnrollmentRequired: true,
      enrollmentToken
    };
  }

  const session = toSession(user, "local", args.rememberMe, args.simulateRole);
  sessions.set(session.sessionId, session);
  await enforceMaxConcurrentSessions(session.user.id);
  recordSessionContext(session.sessionId, args.ipAddress, args.device);
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

export class MfaChallengeNotFoundError extends Error {}
export class MfaChallengeExpiredError extends Error {}
export class EnrollmentTokenInvalidError extends Error {}

// Validates a pre-auth enrollment token (see pendingEnrollmentTokens above)
// without consuming it - enrollMfa (re-)issuing a secret can be called
// multiple times against the same token (a user may scan the QR again
// before confirming); only a successful confirmMfaEnrollment consumes it.
function resolveEnrollmentToken(token: string): PendingEnrollmentToken {
  const entry = pendingEnrollmentTokens.get(token);
  if (!entry || entry.used || entry.expiresAt < Date.now()) {
    if (entry?.used) {
      void recordAuditEvent({
        id: randomUUID(),
        timestampIso: new Date().toISOString(),
        userId: entry.userId,
        activeRole: "self-service",
        organization: entry.organizationId,
        facility: "unknown",
        department: "unknown",
        action: "MFA_ENROLLMENT_TOKEN_REPLAYED",
        module: "Authentication",
        resource: "local",
        ipAddress: "n/a",
        device: "n/a",
        success: false,
        risk: "critical"
      }).catch(() => {});
    } else if (entry) {
      void recordAuditEvent({
        id: randomUUID(),
        timestampIso: new Date().toISOString(),
        userId: entry.userId,
        activeRole: "self-service",
        organization: entry.organizationId,
        facility: "unknown",
        department: "unknown",
        action: "MFA_ENROLLMENT_TOKEN_EXPIRED",
        module: "Authentication",
        resource: "local",
        ipAddress: "n/a",
        device: "n/a",
        success: false,
        risk: "medium"
      }).catch(() => {});
    }
    throw new EnrollmentTokenInvalidError("Enrollment token is invalid, expired, or already used.");
  }
  return entry;
}

export function enrollMfa(userId: string): { secret: string; otpauthUrl: string } {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new UserNotFoundError(`No user found with id ${userId}`);
  }
  const secret = authenticator.generateSecret();
  mfaCredentials.set(userId, { secret, status: "pending", failedAttempts: 0 });
  void persistMfaCredential({ userId, secretCiphertext: encryptMfaSecret(secret), status: "pending" }).catch(
    (error) => console.error("Failed to persist MFA credential (change still applies in-memory):", sanitizeForLog(error))
  );
  void recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: user.id,
    activeRole: "self-service",
    organization: user.organization,
    facility: user.facility,
    department: user.department,
    action: "MFA_ENROLLMENT_STARTED",
    module: "Authentication",
    resource: "UserMfaCredential",
    ipAddress: "n/a",
    device: "n/a",
    success: true,
    risk: "medium"
  }).catch((error) => console.error("Failed to record MFA enrollment audit event:", sanitizeForLog(error)));
  const otpauthUrl = authenticator.keyuri(user.email, "IST Health Tele-Triage", secret);
  return { secret, otpauthUrl };
}

// The enrollment-confirmation guard is deliberately separate from, and
// lighter-weight than, the login-time failedLoginAttempts lockout (see
// verifyMfaChallenge below) - this is a self-service setup step, not a
// login gate, so a spent enrollment attempt just requires restarting
// enrollment rather than a helpdesk-mediated account unlock.
export function confirmMfaEnrollment(userId: string, code: string): boolean {
  const credential = mfaCredentials.get(userId);
  if (!credential) {
    throw new UserNotFoundError(`No pending MFA enrollment for user ${userId}`);
  }
  const isValid = authenticator.verify({ token: code, secret: credential.secret });
  if (!isValid) {
    credential.failedAttempts += 1;
    if (credential.failedAttempts >= MFA_ENROLLMENT_CONFIRM_MAX_ATTEMPTS) {
      mfaCredentials.delete(userId);
    }
    return false;
  }
  credential.status = "enabled";
  credential.failedAttempts = 0;
  void persistMfaCredential({
    userId,
    secretCiphertext: encryptMfaSecret(credential.secret),
    status: "enabled",
    enrolledAt: new Date().toISOString()
  }).catch((error) => console.error("Failed to persist MFA credential (change still applies in-memory):", sanitizeForLog(error)));
  const enrolledUser = users.find((candidate) => candidate.id === userId);
  void recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId,
    activeRole: "self-service",
    organization: enrolledUser?.organization ?? "unknown",
    facility: enrolledUser?.facility ?? "unknown",
    department: enrolledUser?.department ?? "unknown",
    action: "MFA_ENROLLMENT_CONFIRMED",
    module: "Authentication",
    resource: "UserMfaCredential",
    ipAddress: "n/a",
    device: "n/a",
    success: true,
    risk: "medium"
  }).catch((error) => console.error("Failed to record MFA enrollment audit event:", sanitizeForLog(error)));
  return true;
}

// Pre-auth variants of enrollMfa/confirmMfaEnrollment, gated by a real
// enrollment token instead of a session (see pendingEnrollmentTokens above).
// These are the only functions in this module that ever read that map -
// every other capability (queue, admin, reveal, etc.) still requires a real
// AuthenticatedSession and would never accept this token.
export function enrollMfaWithToken(token: string): { secret: string; otpauthUrl: string } {
  const entry = resolveEnrollmentToken(token);
  return enrollMfa(entry.userId);
}

export function confirmMfaEnrollmentWithToken(token: string, code: string): boolean {
  const entry = resolveEnrollmentToken(token);
  const confirmed = confirmMfaEnrollment(entry.userId, code);
  if (confirmed) {
    entry.used = true;
    void recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: entry.userId,
      activeRole: "self-service",
      organization: entry.organizationId,
      facility: "unknown",
      department: "unknown",
      action: "MFA_ENROLLMENT_TOKEN_CONSUMED",
      module: "Authentication",
      resource: "local",
      ipAddress: "n/a",
      device: "n/a",
      success: true,
      risk: "medium"
    }).catch(() => {});
  }
  return confirmed;
}

export class SelfMfaResetError extends Error {}
export class CrossTenantMfaResetError extends Error {}

// Real administrator-assisted MFA reset (closes AR.13's recovery gap: today
// there is no way to recover a user who lost their authenticator device
// other than deleting/re-seeding data by hand). Deliberately does NOT read
// or return the existing secret - the credential is simply deleted and the
// user is marked "reset_required", forcing them back through the same
// pre-auth enrollment-token flow a never-enrolled user goes through. Every
// active session for the user is revoked immediately, and the action is
// always durably audited as high-risk. The caller (the route) is
// responsible for the actual permission/elevation gate - this function
// enforces the two guards that must never be bypassable by permission
// alone: no self-reset, and no cross-tenant reset.
export async function resetMfaForUser(
  targetUserId: string,
  actor: { userId: string; organization: string },
  reason: string
): Promise<{ sessionsRevoked: number }> {
  if (targetUserId === actor.userId) {
    throw new SelfMfaResetError("Administrators cannot reset their own MFA credential through this action.");
  }
  const targetUser = users.find((candidate) => candidate.id === targetUserId);
  if (!targetUser) {
    throw new UserNotFoundError(`No user found with id ${targetUserId}`);
  }
  if (targetUser.organization !== actor.organization) {
    throw new CrossTenantMfaResetError("Cannot reset MFA for a user outside the requester's organization.");
  }

  mfaCredentials.set(targetUserId, { secret: "", status: "reset_required", failedAttempts: 0 });
  void persistMfaCredential({ userId: targetUserId, secretCiphertext: "", status: "reset_required" }).catch((error) =>
    console.error("Failed to persist MFA reset (change still applies in-memory):", sanitizeForLog(error))
  );

  const sessionsRevoked = await revokeSessionsForUser(targetUserId);

  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: actor.userId,
    activeRole: "administrator",
    organization: actor.organization,
    facility: targetUser.facility,
    department: targetUser.department,
    action: "MFA_RESET_COMPLETED",
    module: "Authentication",
    resource: `UserMfaCredential:${targetUserId}`,
    purpose: `${reason} (sessionsRevoked=${sessionsRevoked})`,
    ipAddress: "n/a",
    device: "n/a",
    success: true,
    risk: "high"
  });

  return { sessionsRevoked };
}

export async function verifyMfaChallenge(
  challengeId: string,
  code: string
): Promise<{ ok: true; session: AuthenticatedSession } | { ok: false; message: string; locked?: boolean }> {
  const challenge = pendingMfaChallenges.get(challengeId);
  if (!challenge) {
    throw new MfaChallengeNotFoundError("MFA challenge not found or already used.");
  }
  if (challenge.expiresAt < Date.now()) {
    pendingMfaChallenges.delete(challengeId);
    throw new MfaChallengeExpiredError("MFA challenge has expired - sign in again.");
  }

  const user = users.find((candidate) => candidate.id === challenge.userId);
  const credential = await resolveMfaCredential(challenge.userId);
  const username = user?.email.toLowerCase() ?? challenge.userId;

  // A wrong TOTP code reuses the same username-keyed failedLoginAttempts
  // lockout as a wrong password, rather than a second, differently-behaved
  // counter for the same account - one consistent lockout semantic, not two.
  const isValid = Boolean(credential && authenticator.verify({ token: code, secret: credential.secret }));
  if (!isValid) {
    const currentFailures = failedLoginAttempts.get(username) ?? 0;
    failedLoginAttempts.set(username, currentFailures + 1);
    const locked = currentFailures + 1 >= 5;
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: challenge.userId,
      activeRole: user?.roles[0] ?? "unknown",
      organization: user?.organization ?? "unknown",
      facility: user?.facility ?? "unknown",
      department: user?.department ?? "unknown",
      action: "LOGIN_MFA_FAILED",
      module: "Authentication",
      resource: "local",
      ipAddress: challenge.ipAddress,
      device: challenge.device,
      success: false,
      risk: locked ? "critical" : "high"
    });
    await checkSecurityAnomalyRate({
      signalType: "MFA_FAILURE",
      scopeKey: username,
      organization: user?.organization
    });
    if (locked) {
      pendingMfaChallenges.delete(challengeId);
      return { ok: false, message: "Account is temporarily locked. Contact the helpdesk.", locked: true };
    }
    return { ok: false, message: "Invalid authentication code." };
  }

  pendingMfaChallenges.delete(challengeId);
  failedLoginAttempts.delete(username);

  if (!user) {
    throw new UserNotFoundError(`No user found with id ${challenge.userId}`);
  }
  const session = toSession(user, "local", challenge.rememberMe, challenge.simulateRole, true);
  sessions.set(session.sessionId, session);
  await enforceMaxConcurrentSessions(session.user.id);
  recordSessionContext(session.sessionId, challenge.ipAddress, challenge.device);
  await persistUserSession({ session, ipAddress: challenge.ipAddress, device: challenge.device });
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: user.id,
    activeRole: session.activeRole,
    organization: user.organization,
    facility: user.facility,
    department: user.department,
    action: "LOGIN_MFA_VERIFIED",
    module: "Authentication",
    resource: "local",
    ipAddress: challenge.ipAddress,
    device: challenge.device,
    success: true,
    risk: "low"
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
    sessionContextBySessionId.delete(sessionId);
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

// Real two-step approval-gated reveal (closes R-04) - replaces the old
// single-step recordReveal(), which returned the plaintext value in the
// same call that requested it ("approval" meant only "the requester
// already holds a permission", not a distinct second party reviewing this
// specific request). Wires the previously-orphaned RevealRequest/
// RevealApproval/RevealEvent Prisma tables to real logic for the first
// time. Only fields maskUser() already knows how to mask are revealable -
// this is the same allow-list, not a separate one invented here.
const REVEALABLE_FIELDS = ["employeeId", "email", "mobile", "licenceNumber"] as const;
type RevealableField = (typeof REVEALABLE_FIELDS)[number];

export class FieldNotRevealableError extends Error {}
export class RevealRequestNotFoundError extends Error {}
export class SelfApprovalError extends Error {}
export class RevealNotApprovedError extends Error {}
export class RevealAlreadyFulfilledError extends Error {}
export class RevealExpiredError extends Error {}
export class RevealForbiddenError extends Error {}

const REVEAL_TTL_MS = 60 * 1000;

type PendingRevealRequest = {
  id: string;
  requesterUserId: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  purpose: string;
  status: "pending" | "approved" | "denied" | "fulfilled" | "expired";
  createdAt: string;
};
const revealRequestsById = new Map<string, PendingRevealRequest>();
const revealValuesById = new Map<string, { value: string; expiresAt: number }>();

// In-memory-first, DB-fallback read for a reveal request's metadata -
// without this, a request created on one Cloud Run instance was invisible
// to an approver whose request landed on a different instance. Found
// during the persistence-gating sweep. Note: the approved plaintext value
// itself (revealValuesById) is intentionally NEVER persisted - hydrating
// the request record here does not make an already-computed value
// fetchable from a third instance that never computed it; that remains a
// real, disclosed limitation (see docs/operations/persistence-gating-inventory.md),
// not something to fix by persisting plaintext, which would be a worse
// security regression than the gap it would close.
async function resolveRevealRequest(revealRequestId: string): Promise<PendingRevealRequest | undefined> {
  const cached = revealRequestsById.get(revealRequestId);
  if (cached) {
    return cached;
  }
  const persisted = await getPersistedRevealRequest(revealRequestId);
  if (!persisted) {
    return undefined;
  }
  const hydrated: PendingRevealRequest = {
    id: persisted.id,
    requesterUserId: persisted.requesterUserId,
    resourceType: persisted.resourceType,
    resourceId: persisted.resourceId,
    fieldName: persisted.fieldName,
    purpose: persisted.purpose,
    status: persisted.status as PendingRevealRequest["status"],
    createdAt: new Date().toISOString()
  };
  revealRequestsById.set(revealRequestId, hydrated);
  return hydrated;
}

async function recordRevealEvent(args: {
  revealRequestId?: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  purpose: string;
  success: boolean;
}): Promise<void> {
  try {
    await persistRevealEvent({ ...args, ipAddress: "request-context", device: "request-context" });
  } catch (error) {
    console.error("Failed to persist reveal event (in-memory state still consistent):", sanitizeForLog(error));
  }
}

// Closes CSQ IS.61 ("systems in place to monitor for privacy breaches and
// notify customers expeditiously") - a real, local detection mechanism: an
// unusually high rate of PII-reveal requests from one account within a
// short window (a real indicator of a compromised/misused account) writes
// a distinct, high-severity AuditEvent - visible via the existing
// GET /api/v1/admin/audit-events endpoint, the same real "notification"
// surface every other alert-worthy event in this app already uses. This is
// not a live-paging/external-notification system (see the honest scope
// note in docs/qr-questionnaire-backlog-tracker.md) - it is a genuine
// detection-and-record mechanism, not aspirational.
// Local, process-scoped fallback only - used when the shared counter is
// off (unit tests, or REVEAL_ANOMALY_DB_PERSISTENCE unset) or when the
// shared store is temporarily unavailable. NOT the primary mechanism on
// any environment where cross-instance detection matters - see
// docs/security/reveal-anomaly-detection.md for the full failure policy.
const revealRequestTimestampsByUser = new Map<string, number[]>();

function countLocalRevealAttempts(requesterUserId: string, windowMs: number): number {
  const now = Date.now();
  const timestamps = (revealRequestTimestampsByUser.get(requesterUserId) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );
  timestamps.push(now);
  revealRequestTimestampsByUser.set(requesterUserId, timestamps);
  return timestamps.length;
}

// CSQ AR.21's application-level intrusion-detection equivalent (closes
// alongside NFR-118's authentication-anomaly alert). Generalizes
// checkRevealAnomalyRate's exact shared/durable/local-fallback pattern to
// any security-relevant signal type, rather than duplicating it per
// signal. Signal types wired this batch: AUTH_FAILURE (failed local
// login), MFA_FAILURE (failed TOTP challenge), PAM_ELEVATION_DENIED
// (wrong elevation code). PERMISSION_DENIED and CLAIM_DENIED signal types
// are supported by this function's generic API but are NOT wired to a
// call site this batch - disclosed, not silently claimed, in
// docs/security/application-intrusion-detection.md.
const localSecurityAnomalyTimestamps = new Map<string, number[]>();

function countLocalSecurityAnomalyEvents(signalType: string, scopeKey: string, windowMs: number): number {
  const now = Date.now();
  const key = `${signalType}:${scopeKey}`;
  const timestamps = (localSecurityAnomalyTimestamps.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );
  timestamps.push(now);
  localSecurityAnomalyTimestamps.set(key, timestamps);
  return timestamps.length;
}

export type SecurityAnomalySignalType =
  | "AUTH_FAILURE"
  | "MFA_FAILURE"
  | "PERMISSION_DENIED"
  | "CLAIM_DENIED"
  | "PAM_ELEVATION_DENIED";

async function checkSecurityAnomalyRate(args: {
  signalType: SecurityAnomalySignalType;
  scopeKey: string;
  organization?: string;
}): Promise<void> {
  const windowSeconds = getAuthAnomalyWindowSeconds();
  const threshold = effectiveThreshold("AUTH_ANOMALY_FAILURE_THRESHOLD", getAuthAnomalyFailureThreshold());

  // Failure policy (documented, not silently fail-open) - identical
  // reasoning to checkRevealAnomalyRate: never deny the underlying action
  // (a login attempt, an MFA challenge, an elevation request) just because
  // the shared monitoring store is unavailable - fall back to this
  // instance's local counter and emit a distinct, durable, high-risk
  // AuditEvent flagging the degraded mode.
  let count: number;
  let degradedMode = false;
  if (shouldPersistSecurityAnomalyCountersInDatabase()) {
    try {
      const result = await recordAndCountSecurityAnomalyEvents({
        signalType: args.signalType,
        scopeKey: args.scopeKey,
        organization: args.organization,
        windowSeconds
      });
      count = result.count;
    } catch (error) {
      console.error("Shared security-anomaly counter unavailable, falling back to local counter:", sanitizeForLog(error));
      count = countLocalSecurityAnomalyEvents(args.signalType, args.scopeKey, windowSeconds * 1000);
      degradedMode = true;
    }
  } else {
    count = countLocalSecurityAnomalyEvents(args.signalType, args.scopeKey, windowSeconds * 1000);
  }

  const correlationId = randomUUID();

  if (degradedMode) {
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: args.scopeKey,
      activeRole: "unknown",
      organization: args.organization ?? "",
      facility: "",
      department: "",
      action: "SECURITY_ANOMALY_STORE_DEGRADED",
      module: "SecurityMonitoring",
      resource: `${args.signalType}:${args.scopeKey}`,
      purpose: `Shared security-anomaly counter unavailable for signal ${args.signalType} - falling back to a process-local counter; cross-instance detection is temporarily narrower than normal. correlationId=${correlationId}`,
      ipAddress: "",
      device: "",
      success: false,
      risk: "high"
    });
  }

  if (count <= threshold) {
    return;
  }

  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: args.scopeKey,
    activeRole: "unknown",
    organization: args.organization ?? "",
    facility: "",
    department: "",
    action: "SECURITY_ANOMALY_DETECTED",
    module: "SecurityMonitoring",
    resource: `${args.signalType}:${args.scopeKey}`,
    purpose: `${count} ${args.signalType} events within ${windowSeconds / 60} minutes - exceeds the ${threshold}-event anomaly threshold. correlationId=${correlationId}`,
    ipAddress: "",
    device: "",
    success: true,
    risk: "critical"
  });

  // Structured stdout emission (mirrors requestDurationLogger's and the
  // privacy-reveal-anomaly pattern) - gives NFR-118's authentication-
  // anomaly alert policy (terraform/alerting.tf) a real field to filter
  // on. Deliberately excludes anything sensitive - only the signal type,
  // an opaque scope key (already a userId, never a raw credential/IP/OTP),
  // count, threshold, window, and correlation id.
  console.log(
    JSON.stringify({
      type: "security_event",
      action: "SECURITY_ANOMALY_DETECTED",
      signalType: args.signalType,
      count,
      threshold,
      windowSeconds,
      correlationId
    })
  );
}

async function checkRevealAnomalyRate(requesterUserId: string): Promise<void> {
  const windowSeconds = getRevealAnomalyWindowSeconds();
  const threshold = effectiveThreshold("REVEAL_ANOMALY_THRESHOLD", getRevealAnomalyThreshold());
  const requestingUser = users.find((candidate) => candidate.id === requesterUserId);

  // Failure policy (documented, not silently fail-open): the shared,
  // durable counter is the primary mechanism whenever it's enabled. If the
  // database write/read fails, we do NOT deny the reveal request itself
  // (reveal is a legitimate clinical/privacy workflow; failing it closed
  // on a monitoring-store outage would turn a detection-system problem
  // into a care-delivery outage, a worse outcome) - instead we fall back
  // to this instance's local counter (a real, if narrower, safety net) AND
  // emit a distinct high-risk audit event flagging the degraded mode, so
  // the gap is visible and investigable rather than silent.
  let count: number;
  let degradedMode = false;
  if (shouldPersistRevealAnomalyCountersInDatabase()) {
    try {
      const result = await recordAndCountRevealAnomalyEvents({
        userId: requesterUserId,
        organization: requestingUser?.organization,
        windowSeconds
      });
      count = result.count;
    } catch (error) {
      console.error("Shared reveal-anomaly counter unavailable, falling back to local counter:", sanitizeForLog(error));
      count = countLocalRevealAttempts(requesterUserId, windowSeconds * 1000);
      degradedMode = true;
    }
  } else {
    count = countLocalRevealAttempts(requesterUserId, windowSeconds * 1000);
  }

  if (degradedMode) {
    await recordAuditEvent({
      id: randomUUID(),
      timestampIso: new Date().toISOString(),
      userId: requesterUserId,
      activeRole: "unknown",
      organization: requestingUser?.organization ?? "",
      facility: requestingUser?.facility ?? "",
      department: requestingUser?.department ?? "",
      action: "PRIVACY_REVEAL_ANOMALY_STORE_DEGRADED",
      module: "PrivacyMonitoring",
      resource: `User:${requesterUserId}`,
      purpose: "Shared reveal-anomaly counter unavailable - falling back to a process-local counter for this request; org-wide detection is temporarily narrower than normal.",
      ipAddress: "",
      device: "",
      success: false,
      risk: "high"
    });
  }

  if (count <= threshold) {
    return;
  }
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: requesterUserId,
    activeRole: "unknown",
    organization: requestingUser?.organization ?? "",
    facility: requestingUser?.facility ?? "",
    department: requestingUser?.department ?? "",
    action: "PRIVACY_REVEAL_ANOMALY_DETECTED",
    module: "PrivacyMonitoring",
    resource: `User:${requesterUserId}`,
    purpose: `${count} reveal requests within ${windowSeconds / 60} minutes - exceeds the ${threshold}-request anomaly threshold`,
    ipAddress: "",
    device: "",
    success: true,
    risk: "critical"
  });

  // Structured stdout emission (mirrors requestDurationLogger's pattern) -
  // Cloud Run ships this to Cloud Logging with no extra wiring, giving the
  // NFR-118 privacy-reveal-anomaly log-based metric/alert policy
  // (terraform/alerting.tf) a real field to filter on. Without this line,
  // that alert policy has nothing to fire on - AuditEvent alone is only
  // persisted in-memory/DB, never emitted to stdout.
  console.log(
    JSON.stringify({
      type: "security_event",
      action: "PRIVACY_REVEAL_ANOMALY_DETECTED",
      requesterUserId,
      count,
      windowSeconds
    })
  );

  // Closes IS.61's second half: detection creates a durable incident
  // CANDIDATE for human review - it never bypasses review to directly
  // notify anyone. See src/services/privacyIncidentWorkflow.ts.
  try {
    await createIncidentCandidate({
      organization: requestingUser?.organization,
      detectionSource: "reveal_anomaly",
      severity: "high",
      evidenceReferences: { requesterUserId, count, threshold, windowSeconds }
    });
  } catch (error) {
    console.error("Failed to create privacy-incident candidate (anomaly audit event still recorded):", sanitizeForLog(error));
  }
}

export async function requestReveal(
  requesterUserId: string,
  request: RevealRequest
): Promise<{ id: string; status: "pending" }> {
  if (!REVEALABLE_FIELDS.includes(request.field as RevealableField)) {
    throw new FieldNotRevealableError(`Field "${request.field}" is not revealable.`);
  }
  await checkRevealAnomalyRate(requesterUserId);

  const id = `reveal-${Date.now()}-${randomBytes(6).toString("hex")}`;
  const record: PendingRevealRequest = {
    id,
    requesterUserId,
    resourceType: request.resourceType,
    resourceId: request.resourceId,
    fieldName: request.field,
    purpose: request.purpose,
    status: "pending",
    createdAt: new Date().toISOString()
  };
  revealRequestsById.set(id, record);
  try {
    await persistRevealRequest({
      id,
      requesterUserId,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      fieldName: request.field,
      purpose: request.purpose,
      status: "pending"
    });
  } catch (error) {
    console.error("Failed to persist reveal request (in-memory state still consistent):", sanitizeForLog(error));
  }

  return { id, status: "pending" };
}

export function listPendingRevealRequests(): PendingRevealRequest[] {
  return [...revealRequestsById.values()].filter((request) => request.status === "pending");
}

export async function decideReveal(
  revealRequestId: string,
  approverUserId: string,
  decision: "approved" | "denied",
  comments?: string
): Promise<{ status: "approved" | "denied" }> {
  const record = await resolveRevealRequest(revealRequestId);
  if (!record) {
    throw new RevealRequestNotFoundError(`No reveal request found with id ${revealRequestId}`);
  }
  // Real dual control: two distinct human accounts, not just two
  // permission checks against the same session.
  if (approverUserId === record.requesterUserId) {
    throw new SelfApprovalError("Cannot approve or deny your own reveal request.");
  }

  record.status = decision;
  try {
    await persistRevealApproval({ revealRequestId, approverUserId, decision, comments });
    await persistRevealRequest({
      id: record.id,
      requesterUserId: record.requesterUserId,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      fieldName: record.fieldName,
      purpose: record.purpose,
      status: decision
    });
  } catch (error) {
    console.error("Failed to persist reveal approval (in-memory state still consistent):", sanitizeForLog(error));
  }

  if (decision === "approved") {
    const user = users.find((candidate) => candidate.id === record.resourceId);
    const value = user ? String(user[record.fieldName as keyof AdminUser] ?? "") : "";
    revealValuesById.set(revealRequestId, { value, expiresAt: Date.now() + REVEAL_TTL_MS });
  }

  return { status: decision };
}

// Only the original requester may fetch, and only once (single-use) within
// the TTL window - closes the gap where the old flow's `remaskAfterSeconds`
// was a purely cosmetic client-side hint with nothing server-side enforcing
// it. Every attempt (success or failure) writes a real RevealEvent row -
// the permanent "who saw what PII, when, and why" audit trail.
export async function fetchApprovedRevealValue(revealRequestId: string, requesterUserId: string): Promise<string> {
  const record = await resolveRevealRequest(revealRequestId);
  if (!record) {
    throw new RevealRequestNotFoundError(`No reveal request found with id ${revealRequestId}`);
  }
  if (record.requesterUserId !== requesterUserId) {
    throw new RevealForbiddenError("Only the original requester may fetch this reveal value.");
  }

  const eventArgs = {
    revealRequestId,
    userId: requesterUserId,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    fieldName: record.fieldName,
    purpose: record.purpose
  };

  if (record.status === "fulfilled") {
    await recordRevealEvent({ ...eventArgs, success: false });
    throw new RevealAlreadyFulfilledError("This reveal value has already been fetched (single-use).");
  }
  if (record.status !== "approved") {
    await recordRevealEvent({ ...eventArgs, success: false });
    throw new RevealNotApprovedError(`This reveal request is not approved (status: ${record.status}).`);
  }

  const stored = revealValuesById.get(revealRequestId);
  if (!stored || stored.expiresAt < Date.now()) {
    revealValuesById.delete(revealRequestId);
    record.status = "expired";
    await persistRevealRequestStatus(record);
    await recordRevealEvent({ ...eventArgs, success: false });
    throw new RevealExpiredError("This reveal has expired - request again.");
  }

  revealValuesById.delete(revealRequestId);
  record.status = "fulfilled";
  await persistRevealRequestStatus(record);
  await recordRevealEvent({ ...eventArgs, success: true });
  return stored.value;
}

async function persistRevealRequestStatus(record: PendingRevealRequest): Promise<void> {
  try {
    await persistRevealRequest({
      id: record.id,
      requesterUserId: record.requesterUserId,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      fieldName: record.fieldName,
      purpose: record.purpose,
      status: record.status
    });
  } catch (error) {
    console.error("Failed to persist reveal request status (in-memory state still consistent):", sanitizeForLog(error));
  }
}

// http:// issuers only occur in this repo's own local mock-IdP test harness
// (tests/helpers/mockOidcIdp.ts) - a real deployment's issuerUrl is always
// https:// and never takes this branch.
//
// enableNonRepudiationChecks is deliberately turned on: oauth4webapi (which
// openid-client uses internally) does NOT verify the ID token's JWS
// signature by default for the authorization-code/token-endpoint flow -
// per spec this is optional there, since the token endpoint response is
// already delivered over a TLS- and client-authenticated channel. This
// gap was found and confirmed the hard way (a hand-tampered ID token, with
// a completely different signing key, was accepted and JIT-provisioned a
// real session before this flag was added - see
// tests/ssoOidcFlow.test.ts's tamper-signature test). Enabling this closes
// it and forces an explicit cryptographic signature check against the
// provider's real JWKS on every login.
async function discoverProvider(issuerUrl: string, clientId: string, clientSecret: string) {
  const isInsecure = issuerUrl.startsWith("http://");
  const config = await discovery(
    new URL(issuerUrl),
    clientId,
    clientSecret,
    undefined,
    isInsecure ? { execute: [allowInsecureRequests] } : undefined
  );
  enableNonRepudiationChecks(config);
  return config;
}

type LoadedSsoProviderConfig = {
  provider: SsoProvider;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
};

// Reads a real, DB-backed AuthenticationProvider row (closes the
// "OAuth Provider Integration" gap) when one exists and is enabled -
// otherwise falls back to the static in-memory ssoProviders entries, which
// are always disabled placeholders with no real config to build a live
// flow from. clientIdCiphertext is decrypted with the same generic
// AES-256-GCM helper used for MFA secrets; clientSecretRef holds the
// plaintext secret directly for this dev/test scope, mirroring how
// demoPasswordByEmail stores plaintext credentials for mock-mode testing
// elsewhere in this file - a real deployment would resolve this via a
// real secret manager reference instead.
async function loadSsoProviderConfig(providerId: string): Promise<LoadedSsoProviderConfig | undefined> {
  const dbConfig = await getAuthenticationProviderConfig(providerId);
  if (dbConfig && dbConfig.enabled && dbConfig.issuerUrl && dbConfig.clientIdCiphertext) {
    return {
      provider: {
        id: dbConfig.providerKey,
        name: dbConfig.name,
        protocol: dbConfig.protocol as SsoProvider["protocol"],
        enabled: dbConfig.enabled,
        issuerUrl: dbConfig.issuerUrl,
        tenantId: "",
        redirectUri: dbConfig.redirectUri ?? "",
        allowedDomains: (dbConfig.allowedDomains as string[] | null) ?? [],
        attributeMappings: (dbConfig.attributeMappings as Record<string, string> | null) ?? {},
        groupRoleMappings: (dbConfig.groupMappings as Record<string, string> | null) ?? {},
        jitProvisioning: dbConfig.jitProvisioning,
        localLoginEnabled: dbConfig.localLoginEnabled,
        secretStorage: "database"
      },
      issuerUrl: dbConfig.issuerUrl,
      clientId: decryptMfaSecret(dbConfig.clientIdCiphertext),
      clientSecret: dbConfig.clientSecretRef ?? ""
    };
  }
  return undefined;
}

export async function testSsoProvider(providerId: string): Promise<{ ok: boolean; message: string }> {
  const config = await loadSsoProviderConfig(providerId);
  if (!config) {
    const fallback = ssoProviders.find((item) => item.id === providerId);
    if (!fallback) {
      return { ok: false, message: "Provider not found." };
    }
    if (!fallback.enabled) {
      return { ok: false, message: "Provider is configured but disabled pending secrets and metadata approval." };
    }
    return { ok: false, message: "Provider is enabled but has no real configuration to test." };
  }
  try {
    await discoverProvider(config.issuerUrl, config.clientId, config.clientSecret);
    return { ok: true, message: "Provider metadata is reachable." };
  } catch (error) {
    return { ok: false, message: `Discovery failed: ${(error as Error).message}` };
  }
}

export class SsoProviderNotConfiguredError extends Error {}
export class SsoStateInvalidError extends Error {}

export async function buildSsoAuthorizationUrl(providerId: string, redirectUri: string): Promise<string> {
  const config = await loadSsoProviderConfig(providerId);
  if (!config) {
    throw new SsoProviderNotConfiguredError(`No enabled SSO provider configuration for ${providerId}`);
  }
  const openidConfig = await discoverProvider(config.issuerUrl, config.clientId, config.clientSecret);
  const state = randomState();
  const nonce = randomNonce();
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

  oidcStateStore.set(state, {
    providerId,
    nonce,
    codeVerifier,
    redirectUri,
    expiresAt: Date.now() + OIDC_STATE_TTL_MS
  });

  const url = buildAuthorizationUrl(openidConfig, {
    redirect_uri: redirectUri,
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });
  return url.toString();
}

function roleForOidcGroups(provider: SsoProvider, groups: string[]): string {
  for (const group of groups) {
    const mapped = provider.groupRoleMappings[group];
    if (mapped) {
      return mapped;
    }
  }
  return "read_only";
}

// Completes a real authorization-code + PKCE exchange, verifies the ID
// token (signature/iss/aud/nonce/exp - enforced by openid-client itself),
// and JIT-provisions or looks up the user from its claims via the
// provider's real attributeMappings/groupMappings. Never issues a session
// from an unverified token - authorizationCodeGrant throws on any mismatch.
export async function completeSsoLogin(
  providerId: string,
  callbackUrl: URL,
  ipAddress: string,
  device: string
): Promise<{ ok: true; session: AuthenticatedSession } | { ok: false; message: string }> {
  const state = callbackUrl.searchParams.get("state");
  if (!state) {
    throw new SsoStateInvalidError("Missing state parameter.");
  }
  const pending = oidcStateStore.get(state);
  // Single-use: delete immediately so a replayed callback with the same
  // state can never succeed twice.
  oidcStateStore.delete(state);
  if (!pending || pending.providerId !== providerId) {
    throw new SsoStateInvalidError("Unknown or already-used state parameter.");
  }
  if (pending.expiresAt < Date.now()) {
    throw new SsoStateInvalidError("SSO login attempt has expired - sign in again.");
  }

  const config = await loadSsoProviderConfig(providerId);
  if (!config) {
    throw new SsoProviderNotConfiguredError(`No enabled SSO provider configuration for ${providerId}`);
  }
  const openidConfig = await discoverProvider(config.issuerUrl, config.clientId, config.clientSecret);

  const tokenResponse = await authorizationCodeGrant(openidConfig, callbackUrl, {
    expectedNonce: pending.nonce,
    expectedState: state,
    pkceCodeVerifier: pending.codeVerifier
  });
  const claims = tokenResponse.claims();
  if (!claims?.email || typeof claims.email !== "string") {
    return { ok: false, message: "ID token did not contain a usable email claim." };
  }

  const email = claims.email.toLowerCase();
  const groups = Array.isArray(claims.groups) ? (claims.groups as string[]) : [];
  let user = users.find((candidate) => candidate.email.toLowerCase() === email);

  if (!user) {
    if (!config.provider.jitProvisioning) {
      return { ok: false, message: "No existing account for this identity, and just-in-time provisioning is disabled." };
    }
    const nowIso = new Date().toISOString();
    user = {
      id: `usr_sso_${randomBytes(8).toString("hex")}`,
      employeeId: email,
      hrmsId: email,
      fullName: typeof claims.name === "string" ? claims.name : email,
      email,
      mobile: "",
      organization: "IST Health",
      facility: "",
      department: "",
      clinicalSpecialty: "",
      jobTitle: "",
      professionalCategory: "",
      manager: "",
      country: "",
      preferredLanguage: "en",
      timeZone: "Asia/Qatar",
      authenticationMethod: config.provider.protocol === "oidc" ? "oidc" : "entra-id",
      // SSO is itself the strong second factor - a JIT-provisioned account
      // isn't additionally gated behind the separate local TOTP flow.
      mfaStatus: "disabled",
      accountStatus: "active",
      roles: [roleForOidcGroups(config.provider, groups)],
      responsibilities: [],
      queues: [],
      accessProfiles: [],
      createdBy: `sso:${providerId}`,
      createdAtIso: nowIso,
      updatedBy: `sso:${providerId}`,
      updatedAtIso: nowIso
    };
    users.push(user);
  }

  const session = toSession(user, config.provider.protocol === "oidc" ? "oidc" : "entra-id", false, undefined, true);
  sessions.set(session.sessionId, session);
  await enforceMaxConcurrentSessions(session.user.id);
  recordSessionContext(session.sessionId, ipAddress, device);
  await persistUserSession({ session, ipAddress, device });
  await recordAuditEvent({
    id: randomUUID(),
    timestampIso: new Date().toISOString(),
    userId: user.id,
    activeRole: session.activeRole,
    organization: user.organization,
    facility: user.facility,
    department: user.department,
    action: "LOGIN_SSO",
    module: "Authentication",
    resource: providerId,
    ipAddress,
    device,
    success: true,
    risk: "low"
  });
  return { ok: true, session };
}

export { SESSION_COOKIE };
