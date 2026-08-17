-- PR-011 governance decision: 365 days, approved 2026-08-17.
INSERT INTO "retention_policies" (
  "id", "code", "name", "entity_name", "retention_period", "legal_basis", "deletion_mode", "status", "created_at", "updated_at"
) VALUES (
  'pr011_triage_queue_365',
  'TRIAGE_QUEUE_ITEM_COMPLETED',
  'Completed triage queue retention',
  'TriageQueueItem',
  '{"days":365,"decisionReference":"PR-011-2026-08-17"}'::jsonb,
  'Business owner approval recorded 2026-08-17; subject to active legal hold',
  'archive_then_delete',
  'active',
  NOW(),
  NOW()
)
ON CONFLICT ("code") DO UPDATE SET
  "retention_period" = EXCLUDED."retention_period",
  "legal_basis" = EXCLUDED."legal_basis",
  "deletion_mode" = EXCLUDED."deletion_mode",
  "status" = EXCLUDED."status",
  "updated_at" = NOW();
