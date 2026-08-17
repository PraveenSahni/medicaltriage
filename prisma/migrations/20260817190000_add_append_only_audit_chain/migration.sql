-- PR-010: make audit history append-only and add a cryptographic chain.
-- Existing rows receive a sequence number but remain explicitly unsigned;
-- authenticity begins with the first event written by the chained writer.
CREATE SEQUENCE "audit_events_sequence_number_seq";

ALTER TABLE "audit_events"
  ADD COLUMN "sequence_number" BIGINT NOT NULL DEFAULT nextval('"audit_events_sequence_number_seq"'),
  ADD COLUMN "previous_hash" TEXT,
  ADD COLUMN "event_hash" TEXT,
  ADD COLUMN "key_version" TEXT;

ALTER SEQUENCE "audit_events_sequence_number_seq" OWNED BY "audit_events"."sequence_number";

CREATE UNIQUE INDEX "audit_events_sequence_number_key" ON "audit_events"("sequence_number");
CREATE UNIQUE INDEX "audit_events_event_hash_key" ON "audit_events"("event_hash");
CREATE INDEX "audit_events_sequence_number_idx" ON "audit_events"("sequence_number");

CREATE OR REPLACE FUNCTION "reject_audit_event_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only; % is prohibited', TG_OP
    USING ERRCODE = '42501';
END;
$$;

CREATE OR REPLACE FUNCTION "validate_chained_audit_insert"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expected_previous_hash TEXT;
BEGIN
  -- The trigger takes the same transaction-scoped lock as the application,
  -- so direct SQL inserts cannot create a concurrent fork in the chain.
  PERFORM pg_advisory_xact_lock(1096520215793);

  IF NEW."previous_hash" IS NULL OR NEW."event_hash" IS NULL OR NEW."key_version" IS NULL THEN
    RAISE EXCEPTION 'new audit_events rows require previous_hash, event_hash and key_version'
      USING ERRCODE = '23502';
  END IF;

  SELECT COALESCE(
    (SELECT "event_hash" FROM "audit_events" WHERE "event_hash" IS NOT NULL ORDER BY "sequence_number" DESC LIMIT 1),
    repeat('0', 64)
  ) INTO expected_previous_hash;

  IF NEW."previous_hash" <> expected_previous_hash THEN
    RAISE EXCEPTION 'audit chain predecessor mismatch'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "audit_events_validate_chained_insert"
BEFORE INSERT ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "validate_chained_audit_insert"();

CREATE TRIGGER "audit_events_reject_update_delete"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "reject_audit_event_mutation"();

CREATE TRIGGER "audit_events_reject_truncate"
BEFORE TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION "reject_audit_event_mutation"();

COMMENT ON TABLE "audit_events" IS
  'Append-only audit ledger. UPDATE, DELETE and TRUNCATE are rejected by database triggers; new rows are HMAC chained by the application.';
