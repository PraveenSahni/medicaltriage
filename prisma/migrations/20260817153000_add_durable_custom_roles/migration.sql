ALTER TABLE "roles"
  ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "responsibilities" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "data_scopes" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "clinical_scopes" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "integration_scopes" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "role_origin" TEXT NOT NULL DEFAULT 'legacy';

CREATE INDEX "roles_role_origin_status_idx" ON "roles"("role_origin", "status");
