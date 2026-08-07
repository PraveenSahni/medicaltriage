-- CreateTable
CREATE TABLE "security_threshold_overrides" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_threshold_overrides_pkey" PRIMARY KEY ("key")
);
