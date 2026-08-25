# PR-010 Append-Only Audit Ledger

This control applies to the SOC2 remediation environment in GCP project
`triage-502706`, Cloud Run service `ist-triage-soc2`, and logical database
`ist_triage_soc2`. Demo is excluded from current remediation changes.

## Security boundary

- Two complementary HMAC controls are intentionally present. `src/services/safetyKernel.ts` signs individual clinical/HITL payloads with `auditSignatureFor()` so their authenticity can be checked independently. `src/services/auditLedger.ts` is the persisted database-ledger control: it feeds the predecessor hash into each new event hash under a PostgreSQL advisory lock. A payload signature is not a substitute for the ledger chain, and the two mechanisms must not be described as competing audit writers.
- The live durable security-audit path is `securityAdmin.recordAuditEvent()` -> `persistence.persistSecurityAuditEvent()` -> `auditLedger.appendAuditEvent()`. Operational audit writers use `appendOperationalAuditEvent()`, which delegates to the same `appendAuditEvent()` implementation.
- `DATABASE_URL` remains the normal application connection.
- `AUDIT_DATABASE_URL` uses a distinct Cloud SQL login that is a member of `ist_audit_writer` and has no application-table mutation grants.
- `AUDIT_HMAC_SECRET` is supplied through Secret Manager and never stored in PostgreSQL.
- `AUDIT_HMAC_KEY_VERSION` identifies the active key version. Previous verification keys are supplied as a Secret Manager-backed JSON map in `AUDIT_HMAC_KEYS_JSON`; do not overwrite a key version identifier.
- PostgreSQL triggers are the database enforcement boundary. Application RBAC alone is not accepted as append-only enforcement.

## Safe deployment order

1. Restore the latest demo backup into an isolated validation database.
2. Run `prisma migrate deploy` and confirm migration `20260817190000_add_append_only_audit_chain` succeeds.
3. As the approved database administrator, run `scripts/configureAuditWriterRole.sql`, create a dedicated Cloud SQL login and grant it `ist_audit_writer`; do not grant it the normal application role.
4. Store its connection string in a dedicated Secret Manager secret and configure it as `AUDIT_DATABASE_URL` on a no-traffic revision.
5. Configure `AUDIT_HMAC_SECRET` and `AUDIT_HMAC_KEY_VERSION`; keep the existing HMAC secret version available during rollback.
6. Generate representative login, MFA, role, queue, clinical integration and scheduled-job events.
7. Run `node dist/scripts/verifyAuditLedger.js` and call `GET /api/v1/admin/audit-events/integrity` with an authorized account.
8. Attempt `UPDATE`, `DELETE`, `TRUNCATE`, an unsigned `INSERT`, and an insert with an incorrect predecessor. All must fail.
9. Verify the audit login cannot update application records and the main application login cannot mutate audit rows.
10. Shift traffic only after the chain survives a restart and the previous revision remains a valid rollback target.

## SOC2 execution evidence

The provisioning SQL is an executable control artifact, not by itself proof of execution: its final login-membership grant is intentionally a DBA-supplied template so credentials and environment-specific principal names are not committed. The SOC2 execution record is maintained in `docs/production-readiness-remediation-register-2026-08-17.md`. It records that `ist_audit_writer_soc2` received only membership in the restricted audit role; live verification found 2,376 explicitly bounded legacy unsigned rows, a valid signed/linked chain, and a denied `UPDATE`. Security Architecture approval remains a separate closure gate and must not be inferred from technical execution.

## Legacy records and key rotation

Rows written before this migration receive sequence numbers but no fabricated signatures. Verification reports them as `legacyUnsignedEvents`. Authenticity begins at the first chained record.

Three immutable v1 `QUEUE_ITEM_CREATE` rows were signed with an undefined
`stationCode` metadata property that JSON persistence subsequently omitted.
Verification accepts only that proven action/module/key-version/missing-property
shape and reports it separately as `legacyNormalizedEvents`; it does not rewrite
or re-sign the rows. All new events are JSON-normalized before hashing so their
signed representation is exactly the representation retained by PostgreSQL.

Key rotation starts a new operational key version but does not remove old verification material. Before rotating, record the current chain head and key version in separately controlled security evidence and add the old key to `AUDIT_HMAC_KEYS_JSON`. Verification fails closed when any historical key version is unavailable.
