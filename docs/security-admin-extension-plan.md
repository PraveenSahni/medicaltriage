# Security, Privacy, and Administration Extension Plan

## Existing Architecture Summary

- Frontend: React 18 with Vite, TypeScript, Tailwind CSS, Lucide icons, and a shared custom stylesheet in `frontend/src/global.css`.
- Backend: Express 4 API in TypeScript with Helmet, CORS, JSON payload parsing, and Morgan logging.
- Database/ORM: Prisma configured for PostgreSQL through `prisma/schema.prisma`.
- Existing clinical APIs: `/api/v1/staff`, `/api/v1/protocols`, and `/api/v1/triage`.
- Existing clinical modules: staff validation, protocol search, triage start/evaluate, deterministic disposition routing, aviation rules, insurance mock adapter, SBAR compiler, clinical content importer.
- Existing audit: safety audit draft generation and `SafetyAuditDeviationLog` schema for clinical deviations.
- Existing UI navigation: single React shell with workspace/help views and icon buttons.
- Existing deployment/configuration: `package.json` scripts for API, web, build, Prisma, and clinical content import; `.env.example` contains GCP Qatar and Oracle HCM connector targets.

## Modules and Files Extended

- `src/index.ts`: added `/api/v1/auth` and `/api/v1/admin` route registration.
- `src/types/security.ts`: new security, identity, SSO, role, responsibility, policy, and audit types.
- `src/services/securityAdmin.ts`: new session, masking, role/responsibility, SSO metadata, policy, audit, and reveal service.
- `src/services/authorization.ts`: new central authorization helper and permission middleware.
- `src/routes/auth.ts`: new login, logout, session, and SSO test endpoints.
- `src/routes/admin.ts`: new administration endpoints for dashboard, users, roles, responsibilities, permissions, SSO, encryption policies, audit, and reveal.
- `frontend/src/LoginPage.tsx`: new login module.
- `frontend/src/AdminPortal.tsx`: new administration portal.
- `frontend/src/App.tsx`: integrated authentication, session restore, admin view, and sign-out.
- `frontend/src/global.css`: added login and administration styling.
- `prisma/schema.prisma`: additive security/privacy/admin schema models.

## Database Changes

The Prisma schema was extended additively. No existing clinical tables were removed or renamed.

New model families:

- Identity: `ApplicationUser`, `UserSession`, `AuthenticationProvider`
- Access control: `Role`, `Responsibility`, `Permission`, `AccessProfile`, `UserRole`, `UserResponsibility`, `UserAccessProfile`
- Scopes: `AccessScope`, `ClinicalScope`, `IntegrationScope`, `UserQueueAssignment`
- Approval and segregation of duties: `AccessRequest`, `AccessApproval`, `SegregationOfDutyRule`, `AccessConflict`, `TemporaryAccess`, `BreakGlassAccess`
- Privacy and cryptography: `DataClassification`, `SensitiveDataField`, `EncryptionPolicy`, `EncryptionPolicyVersion`, `MaskingPolicy`, `RevealPolicy`, `RevealRequest`, `RevealApproval`, `RevealEvent`, `CryptographicKeyReference`, `KeyRotationRecord`
- Governance: `PrivacyRequest`, `RetentionPolicy`, `LegalHold`, `SensitiveExportRequest`, `AuditEvent`

## Security and Migration Risks

- The current clinical system still uses mock HRMS and sample clinical content. Security administration must not be treated as production-ready until enterprise identity, KMS, database persistence, and audit storage are connected.
- Local login currently uses a development demo gate and must be replaced by Argon2id-backed credential verification or enterprise identity before production.
- Current sessions are in memory for the first increment. Production needs persistent session storage, revocation, refresh rotation, and distributed deployment support.
- The schema introduces encrypted-field storage patterns but does not migrate existing plaintext data. A controlled batch migration is still required.
- Menu hiding is not sufficient security. Backend authorization middleware has been added for the new admin APIs; existing clinical APIs are not yet hard-enforced to avoid breaking current demos.
- Reveal workflow is audited and permission-gated, but production reveal must integrate MFA step-up, approval rules, KMS decryption, remasking, and watermarking.

## Implementation Sequence

1. Inspect current architecture, database, APIs, frontend shell, and clinical modules.
2. Add additive Prisma schema extensions for identity, RBAC/RBAC responsibilities, privacy, encryption policy, reveal, audit, and SSO metadata.
3. Add central authorization middleware and security administration service contracts.
4. Add authentication/session endpoints and admin endpoints.
5. Add login page and administration portal into the existing React app.
6. Validate TypeScript, web build, backend build, and Prisma schema.
7. Next increment: persist identity/admin data through Prisma, add real password hashing, add SSO callback handlers, harden clinical API guards, add automated tests, and add migration SQL.

## File-by-File Code Changes

- `prisma/schema.prisma`: added security, privacy, RBAC, SSO, reveal, key, retention, export, and audit models.
- `src/types/security.ts`: added request schemas and shared security/admin types.
- `src/services/securityAdmin.ts`: added masked demo admin data, sessions, login, SSO metadata, policies, audit events, reveal audit.
- `src/services/authorization.ts`: added central session extraction and permission checks.
- `src/routes/auth.ts`: added session, login, logout, SSO test endpoints.
- `src/routes/admin.ts`: added protected admin endpoints.
- `src/index.ts`: mounted new route modules.
- `frontend/src/LoginPage.tsx`: added accessible login page with tenant, language, password reveal, remember device, SSO action, notices, helpdesk, terms, and privacy links.
- `frontend/src/AdminPortal.tsx`: added dashboard, users, access, SSO, privacy/encryption, and audit pages.
- `frontend/src/App.tsx`: added session restore, authenticated routing, admin navigation, and logout.
- `frontend/src/global.css`: added responsive styling for login/admin pages.
