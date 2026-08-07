# Database Privilege Audit (NFR-174) - 2026-08-07

_Real finding and real fix, not a documentation-only exercise._

## Finding

A direct audit of both live Cloud SQL app database roles found neither
`ist_triage_soc2_app` nor `triage_demo_app` is the database owner
(`cloudsqlsuperuser` owns both databases, confirmed via
`pg_database.datdba`) and neither has `rolsuper`. However, both roles
carried `CREATEROLE` and `CREATEDB` - cluster-wide privileges the
application never uses. Prisma migrations only need DDL within their
own already-existing database (`CREATE TABLE`, `ALTER TABLE`, etc.),
never cluster-wide role or database creation. This appears to be a
Cloud SQL default-user-creation artifact, not a deliberate grant.

## Fix

```sql
ALTER ROLE ist_triage_soc2_app NOCREATEDB NOCREATEROLE;
ALTER ROLE triage_demo_app NOCREATEDB NOCREATEROLE;
```

Applied directly against both live Cloud SQL databases via the local
Cloud SQL Auth Proxy tunnel.

## Verification

- Confirmed via `pg_roles` that both flags are now `false` on both
  roles.
- Confirmed real CRUD (SELECT, INSERT, DELETE) still works correctly
  under the reduced-privilege soc2 role.
- Confirmed the demo app's real login -> session -> queue round trip
  still returns 200/200/200 when hit directly against the Cloud Run
  origin (the custom-domain 401 seen during this same verification is
  the pre-existing, already-documented Firebase Hosting cookie-
  forwarding limitation - ruled out as a regression by testing the
  origin directly).

## Scope not covered

This audit covered role-level (cluster-wide) privileges. Granular
per-query/per-feature privilege separation *within* a database (e.g.
whether every table grant is scoped to exactly what each feature
needs) was not independently re-audited this pass - the app connects
as a single role for all queries via Prisma, so finer-grained
separation would require either multiple connection roles per feature
or PostgreSQL row/column-level security, a larger architectural change
out of scope for this pass.
