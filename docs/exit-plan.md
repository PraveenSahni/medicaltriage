# Exit Plan

_Written to close NFR-191 ("confirm that a documented exit plan exists,
covering data export formats, transition assistance, reasonable
exit-pricing, and irreversible data destruction with certificate at end of
contract") and CSQ IG.12 ("published procedure for exiting the service
arrangement... sanitize all computing resources of customer data")._

## Data export

All operational data (queue records, encounters, staff/dependent records,
audit events, transition logs) lives in a standard PostgreSQL database
(Cloud SQL). At contract end, or at any point during the contract on
request, this data can be exported in full using standard, open,
non-proprietary formats:

- **`pg_dump`** for a complete relational export (SQL or custom-format
  dump), restorable into any standard PostgreSQL instance.
- **CSV/JSON exports** per table, generated on request for a specific
  data-migration target format.

No data is held in a proprietary format or a proprietary database engine -
this is a genuine, low-risk export path, not a theoretical one.

## Transition assistance

On request, the outgoing team will:
- Provide the data export described above.
- Document the current schema (this repository's `prisma/schema.prisma` is
  already the living source of truth for the data model).
- Be available for a reasonable, mutually agreed handover period to answer
  questions from the receiving team or a successor vendor.

## Irreversible data destruction

At the end of the contract, on written request:
1. All application data in Cloud SQL will be deleted (`DROP DATABASE` or
   instance deletion, per the agreed timeline).
2. Secret Manager secrets associated with the engagement will be deleted.
3. Backups (automated Cloud SQL backups, point-in-time recovery windows)
   will be allowed to age out per their retention policy, or deleted
   immediately if required by contract terms.
4. A written confirmation of deletion will be provided. **A
   cryptographically signed destruction certificate is not currently an
   automated capability** - this would need to be a manually-prepared
   attestation unless/until a formal process is built.

## Sanitization of computing resources (closes CSQ IG.12's "sanitize all computing resources" clause)

Beyond the data destruction above, the compute/infrastructure resources this
engagement provisions are also fully destroyable, with no residual customer
data left behind:

1. **Cloud Run services** (application containers) - deleting the service
   removes all running/idle container instances; Cloud Run containers hold
   no persistent local state between requests (this app writes nothing to
   local disk that survives a request), so there is no container-local data
   to separately wipe.
2. **Artifact Registry images** - the built Docker images themselves contain
   only application code, never customer data (confirmed - `MOCK_MODE`/
   `DATABASE_URL`/secrets are injected at deploy time via
   `--set-env-vars`/`--set-secrets`, never baked into the image) - deleting
   the repository removes them entirely.
3. **Firebase Hosting** - the deployed static frontend bundle contains no
   customer data (confirmed - it is compiled client-side code only);
   deleting the hosting site removes it.
4. **Cloud SQL instance/database** - covered above under data destruction.

A written confirmation of resource deletion will be provided alongside the
data-destruction confirmation above; as noted there, an automated
cryptographically-signed destruction certificate is not currently built.

## Exit pricing

Not addressed in this document - exit pricing is a commercial/contractual
term, not a technical one, and needs input from whoever owns the commercial
relationship with the client, not an engineering assessment.

## Explicitly out of scope for this document

- Formal exit pricing terms (commercial, not technical).
- An automated, self-service data-export UI (today's export path is a
  manual `pg_dump`/CSV export performed by an engineer on request, not a
  one-click customer-facing feature).
