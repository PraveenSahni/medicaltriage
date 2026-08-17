\set ON_ERROR_STOP on

-- Run as the approved Cloud SQL database administrator after the PR-010
-- Prisma migration. The application migration identity intentionally does
-- not receive CREATEROLE merely to install this control.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ist_audit_writer') THEN
    CREATE ROLE "ist_audit_writer" NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO "ist_audit_writer";
GRANT SELECT, INSERT ON TABLE "audit_events" TO "ist_audit_writer";
GRANT USAGE, SELECT ON SEQUENCE "audit_events_sequence_number_seq" TO "ist_audit_writer";
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_events" FROM "ist_audit_writer";

-- The Cloud SQL login is created separately so no credential appears in
-- source. The DBA must then run, replacing the quoted placeholder:
-- GRANT "ist_audit_writer" TO "<dedicated_audit_login>";
