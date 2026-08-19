-- PR-011: serialize every legal-hold mutation with retention/privacy deletion
-- eligibility checks, including direct SQL and future application writers.
CREATE OR REPLACE FUNCTION "serialize_legal_hold_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(1096520211011);
  IF TG_LEVEL = 'ROW' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER "legal_holds_serialize_row_mutation"
BEFORE INSERT OR UPDATE OR DELETE ON "legal_holds"
FOR EACH ROW EXECUTE FUNCTION "serialize_legal_hold_mutation"();

CREATE TRIGGER "legal_holds_serialize_truncate"
BEFORE TRUNCATE ON "legal_holds"
FOR EACH STATEMENT EXECUTE FUNCTION "serialize_legal_hold_mutation"();

COMMENT ON TABLE "legal_holds" IS
  'Legal-hold mutations serialize with retention and privacy deletion eligibility checks through advisory lock 1096520211011.';
