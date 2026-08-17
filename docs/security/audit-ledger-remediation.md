# PR-010 Append-Only Audit Ledger

This control applies to the authoritative demo in GCP project `triage-502706`, Cloud Run service `ist-triage-demo`, and logical database `ist_triage_demo`.

## Security boundary

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

## Legacy records and key rotation

Rows written before this migration receive sequence numbers but no fabricated signatures. Verification reports them as `legacyUnsignedEvents`. Authenticity begins at the first chained record.

Key rotation starts a new operational key version but does not remove old verification material. Before rotating, record the current chain head and key version in separately controlled security evidence and add the old key to `AUDIT_HMAC_KEYS_JSON`. Verification fails closed when any historical key version is unavailable.
