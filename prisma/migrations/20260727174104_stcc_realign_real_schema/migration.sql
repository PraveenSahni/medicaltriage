-- AlterTable
ALTER TABLE "algorithms" ADD COLUMN     "algorithm_category" TEXT,
ADD COLUMN     "algorithm_group" TEXT,
ADD COLUMN     "algorithm_system" TEXT,
ADD COLUMN     "algorithm_type" TEXT,
ADD COLUMN     "anatomy" TEXT,
ADD COLUMN     "behavioral_health_eligible" BOOLEAN,
ADD COLUMN     "chronic_disease_eligible" BOOLEAN,
ADD COLUMN     "cms_private" BOOLEAN,
ADD COLUMN     "hospice_eligible" BOOLEAN,
ADD COLUMN     "occupational_health_eligible" BOOLEAN,
ADD COLUMN     "oncology_eligible" BOOLEAN,
ADD COLUMN     "prescription_option" BOOLEAN,
ADD COLUMN     "sample_guideline" BOOLEAN,
ADD COLUMN     "womens_health_eligible" BOOLEAN;

-- AlterTable
ALTER TABLE "clinical_references" ADD COLUMN     "pmid" TEXT,
ADD COLUMN     "pub_med_url" TEXT,
ADD COLUMN     "public_url" TEXT;

-- AlterTable
ALTER TABLE "protocol_disposition_maps" ADD COLUMN     "adult_care_advice_number" INTEGER,
ADD COLUMN     "adult_care_advice_statement" TEXT,
ADD COLUMN     "pediatric_care_advice_number" INTEGER,
ADD COLUMN     "pediatric_care_advice_statement" TEXT;

-- CreateTable
CREATE TABLE "acuity_ratings" (
    "id" TEXT NOT NULL,
    "level_numeric" INTEGER NOT NULL,
    "text_en" TEXT NOT NULL,
    "color" TEXT,
    "color_alternate" TEXT,
    "title_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acuity_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stcc_systems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_order" INTEGER,
    "example_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stcc_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stcc_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stcc_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acuity_ratings_level_numeric_key" ON "acuity_ratings"("level_numeric");

-- CreateIndex
CREATE UNIQUE INDEX "stcc_systems_name_key" ON "stcc_systems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "stcc_types_name_key" ON "stcc_types"("name");
