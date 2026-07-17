import { z } from "zod";

export const LanguageCodeSchema = z.enum(["en", "ar", "hi", "tl"]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

export const AuthMethodSchema = z.enum(["local", "entra-id", "oidc", "saml"]);
export type AuthMethod = z.infer<typeof AuthMethodSchema>;

export const AccountStatusSchema = z.enum(["active", "suspended", "locked", "deactivated"]);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export const DirectoryStatusSchema = z.enum(["active", "disabled", "on_leave", "rest_period", "inactive"]);
export type DirectoryStatus = z.infer<typeof DirectoryStatusSchema>;

export const RiskClassificationSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskClassification = z.infer<typeof RiskClassificationSchema>;

export const AccessDecisionSchema = z.enum(["allow", "deny", "step-up-required", "approval-required"]);
export type AccessDecision = z.infer<typeof AccessDecisionSchema>;

export const LoginRequestSchema = z.object({
  username: z.string().min(3).max(180),
  password: z.string().min(1).max(256),
  tenant: z.string().min(2).max(80).default("ist-tech"),
  language: LanguageCodeSchema.default("en"),
  rememberMe: z.boolean().default(false),
  simulateRole: z.string().min(2).max(80).optional()
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const SsoTestRequestSchema = z.object({
  providerId: z.string().min(1).max(80)
});
export type SsoTestRequest = z.infer<typeof SsoTestRequestSchema>;

export const RevealRequestSchema = z.object({
  userId: z.string().min(1).max(80),
  resourceType: z.string().min(2).max(80),
  resourceId: z.string().min(1).max(120),
  field: z.string().min(1).max(80),
  purpose: z.string().min(6).max(160)
});
export type RevealRequest = z.infer<typeof RevealRequestSchema>;

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "approve"
  | "reveal"
  | "export"
  | "administer";

export type Permission = {
  code: string;
  module: string;
  action: PermissionAction;
  description: string;
  risk: RiskClassification;
};

export type Responsibility = {
  code: string;
  name: string;
  module: string;
  businessFunction: string;
  risk: RiskClassification;
  classification: "clinical" | "administrative" | "security" | "integration" | "privacy";
  allowedActions: PermissionAction[];
  prerequisiteResponsibilities: string[];
  conflictingResponsibilities: string[];
  approvalRequired: boolean;
  status: "active" | "draft" | "retired";
  version: string;
};

export type Role = {
  code: string;
  name: string;
  description: string;
  permissions: string[];
  responsibilities: string[];
  dataScopes: string[];
  clinicalScopes: string[];
  integrationScopes: string[];
  status: "active" | "draft" | "retired";
  requiresApproval: boolean;
};

export type AdminUser = {
  id: string;
  employeeId: string;
  hrmsId: string;
  fullName: string;
  email: string;
  mobile: string;
  organization: string;
  organizationId?: string;
  organizationCode?: string;
  facility: string;
  department: string;
  clinicalSpecialty: string;
  jobTitle: string;
  professionalCategory: string;
  manager: string;
  licenceNumber?: string;
  licenceAuthority?: string;
  licenceExpiry?: string;
  country: string;
  preferredLanguage: LanguageCode;
  timeZone: string;
  authenticationMethod: AuthMethod;
  mfaStatus: "enabled" | "pending" | "disabled";
  accountStatus: AccountStatus;
  directoryStatus?: DirectoryStatus;
  roles: string[];
  responsibilities: string[];
  queues: string[];
  accessProfiles: string[];
  lastLoginIso?: string;
  createdBy: string;
  createdAtIso: string;
  updatedBy: string;
  updatedAtIso: string;
};

export type SafeAdminUser = Omit<AdminUser, "email" | "mobile" | "employeeId" | "licenceNumber"> & {
  email: string;
  mobile: string;
  employeeId: string;
  licenceNumber?: string;
};

export type AuthenticatedSession = {
  sessionId: string;
  user: SafeAdminUser;
  activeRole: string;
  permissions: string[];
  responsibilities: string[];
  expiresAtIso: string;
  authMethod: AuthMethod;
  mfaVerified: boolean;
};

export type SsoProvider = {
  id: string;
  name: string;
  protocol: "oidc" | "oauth2" | "saml";
  enabled: boolean;
  issuerUrl: string;
  tenantId: string;
  redirectUri: string;
  allowedDomains: string[];
  attributeMappings: Record<string, string>;
  groupRoleMappings: Record<string, string>;
  jitProvisioning: boolean;
  localLoginEnabled: boolean;
  certificateExpiryIso?: string;
  secretStorage: string;
};

export type EncryptionPolicy = {
  id: string;
  name: string;
  version: string;
  dataClassification: string;
  coveredEntities: string[];
  coveredFields: string[];
  algorithm: "AES-256-GCM";
  keyProvider: "Google Cloud KMS" | "Azure Key Vault" | "AWS KMS" | "HashiCorp Vault" | "HSM";
  keyAlias: string;
  rotationDays: number;
  maskingPolicy: string;
  revealPolicy: string;
  dataResidency: string;
  approvalRequired: boolean;
  status: "draft" | "active" | "pending-approval";
};

export type AuditEvent = {
  id: string;
  timestampIso: string;
  userId: string;
  activeRole: string;
  organization: string;
  facility: string;
  department: string;
  action: string;
  module: string;
  resource: string;
  purpose?: string;
  ipAddress: string;
  device: string;
  success: boolean;
  risk: RiskClassification;
};

export type ControlCenterModule = {
  id: string;
  label: string;
  purpose: string;
  primaryRoles: string[];
  requiredPermissions: string[];
  dataBoundary: string;
  prohibitedActions: string[];
};

export type IntegrationConnector = {
  id: string;
  name: string;
  system: "Oracle HRMS" | "EMR/FHIR" | "Insurance" | "SSO" | "Analytics" | "Call Center";
  status: "configured" | "pending-approval" | "mock-adapter" | "disabled";
  ownerRole: string;
  dataHandled: string[];
  apiSurface: string;
  lastCheckedIso: string;
};

export type GovernanceWorkItem = {
  id: string;
  title: string;
  ownerRole: string;
  status: "active" | "pending-approval" | "requires-review";
  control: string;
  evidence: string;
};

export type ProtocolLibraryItem = {
  id: string;
  title: string;
  category: string;
  status: "active" | "draft" | "pending-governance";
  ownerRole: string;
  release: string;
  safetyNotes: string;
};

export type ReportCatalogItem = {
  id: string;
  title: string;
  audience: string;
  dataClass: "de-identified" | "aggregate" | "restricted";
  exportAllowed: boolean;
  requiredPermission: string;
};

export type SupportQueueItem = {
  id: string;
  title: string;
  requesterRole: string;
  status: "open" | "in-progress" | "waiting-user";
  dataBoundary: string;
};

export type SecurityDashboard = {
  activeUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  expiringAccess: number;
  activeSessions: number;
  failedLoginAttempts: number;
  pendingAccessApprovals: number;
  pendingRoleApprovals: number;
  breakGlassEvents: number;
  recentReveals: number;
  identifiableExports: number;
  keysNearingExpiry: number;
  overdueKeyRotations: number;
  failedCryptoOperations: number;
  certificateExpiryWarnings: number;
  openPrivacyRequests: number;
  openSecurityIncidents: number;
};
