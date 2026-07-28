-- CreateTable
CREATE TABLE "Mdb_AcuityRating" (
    "AcuityRating_Numeric" INTEGER NOT NULL,
    "AcuityRating_Text" VARCHAR(50),
    "AcuityRating_Color" VARCHAR(50),
    "AcuityRating_Color_Alternate" VARCHAR(50),
    "AcuityRating_Title" VARCHAR(50),
    "AcuityRating_Bullet" BYTEA,
    "AcuityRating_Color_Alternate_Img" BYTEA,

    CONSTRAINT "Mdb_AcuityRating_pkey" PRIMARY KEY ("AcuityRating_Numeric")
);

-- CreateTable
CREATE TABLE "Mdb_System" (
    "System" VARCHAR(50) NOT NULL,
    "System_Order" INTEGER,
    "System_Example" VARCHAR(50),

    CONSTRAINT "Mdb_System_pkey" PRIMARY KEY ("System")
);

-- CreateTable
CREATE TABLE "Mdb_Type" (
    "Type" VARCHAR(50) NOT NULL,
    "Type_Topic" VARCHAR(50),

    CONSTRAINT "Mdb_Type_pkey" PRIMARY KEY ("Type")
);

-- CreateTable
CREATE TABLE "Mdb_Disposition" (
    "LevelID" INTEGER NOT NULL,
    "CreatedDate" TIMESTAMP(3),
    "LastUpDate" TIMESTAMP(3),
    "DispositionHeading" VARCHAR(75),
    "DispositionHeading_Telemedicine" VARCHAR(100),
    "Adult_CareAdvice_Number" INTEGER,
    "Adult_CareAdvice_Statement" TEXT,
    "Adult_CareAdvice_Statement_XHTML" TEXT,
    "Adult_CareAdvice_Statement_Telemedicine" TEXT,
    "Adult_CareAdvice_Statement_XHTML_Telemedicine" TEXT,
    "Pediatric_CareAdvice_Number" INTEGER,
    "Pediatric_CareAdvice_Statement" TEXT,
    "Pediatric_CareAdvice_Statement_XHTML" TEXT,
    "Pediatric_CareAdvice_Statement_Telemedicine" TEXT,
    "Pediatric_CareAdvice_Statement_XHTML_Telemedicine" TEXT,
    "AcuityRating" INTEGER,

    CONSTRAINT "Mdb_Disposition_pkey" PRIMARY KEY ("LevelID")
);

-- CreateTable
CREATE TABLE "Mdb_Algorithm" (
    "AlgorithmID" INTEGER NOT NULL,
    "Author" TEXT,
    "Copyright" TEXT,
    "CreatedDate" TIMESTAMP(3),
    "LastUpDate" TIMESTAMP(3),
    "LastReviewDate" TIMESTAMP(3),
    "Title" VARCHAR(75),
    "Title_UpperCase" VARCHAR(75),
    "Title_LastUpdate" TIMESTAMP(3),
    "Definition" TEXT,
    "DefinitionXHTML" TEXT,
    "Definition_LastUpdate" TIMESTAMP(3),
    "InitialAssessmentQuestions" TEXT,
    "InitalAssessmentQuestions_LastUpdate" TIMESTAMP(3),
    "Background" TEXT,
    "BackgroundXHTML" TEXT,
    "BackGround_LastUpdate" TIMESTAMP(3),
    "FirstAid" TEXT,
    "FirstAidXHTML" TEXT,
    "FirstAid_LastUpdate" TIMESTAMP(3),
    "Reference_LastUpdate" TIMESTAMP(3),
    "SearchWords_LastUpdate" TIMESTAMP(3),
    "Questions_LastUpdate" TIMESTAMP(3),
    "CA_LastUpdate" TIMESTAMP(3),
    "AH_DESCRIPTORS" BOOLEAN,
    "Category" VARCHAR(20),
    "Group" VARCHAR(30),
    "Type" VARCHAR(50),
    "System" VARCHAR(50),
    "Anatomy" VARCHAR(50),
    "VersionYear" VARCHAR(4),
    "Status" VARCHAR(15),
    "Acuity" INTEGER,
    "Gender" VARCHAR(1),
    "AgeGroup" VARCHAR(10),
    "Min_Age_Years" INTEGER,
    "Max_Age_Years" INTEGER,
    "Min_Age_Months" INTEGER,
    "Max_Age_Months" INTEGER,
    "WH" BOOLEAN,
    "BH" BOOLEAN,
    "OA" BOOLEAN,
    "CD" BOOLEAN,
    "Hospice" BOOLEAN,
    "Oncology" BOOLEAN,
    "Prescription_Option" BOOLEAN,
    "CMS_PRIVATE" BOOLEAN,
    "SampleGuidelines" BOOLEAN,

    CONSTRAINT "Mdb_Algorithm_pkey" PRIMARY KEY ("AlgorithmID")
);

-- CreateTable
CREATE TABLE "Mdb_Question" (
    "QuestionID" INTEGER NOT NULL,
    "AlgorithmID" INTEGER,
    "QuestionOrder" INTEGER,
    "DateCreated" TIMESTAMP(3),
    "LastUpDate" TIMESTAMP(3),
    "Question" TEXT,
    "DispositionLevel" INTEGER,
    "Information" TEXT,
    "SMAG_LINK_ID" INTEGER,
    "CMS_NEW" BOOLEAN,
    "TelemedicineEligible" BOOLEAN,

    CONSTRAINT "Mdb_Question_pkey" PRIMARY KEY ("QuestionID")
);

-- CreateTable
CREATE TABLE "Mdb_Advice" (
    "AdviceID" INTEGER NOT NULL,
    "AlgorithmID" INTEGER,
    "DateCreated" TIMESTAMP(3),
    "LastUpDate" TIMESTAMP(3),
    "LastUpDate_XHTML" TIMESTAMP(3),
    "Advice" TEXT,
    "Advice_XHTML" TEXT,
    "PatientHealthInfo" BOOLEAN,
    "AdviceSnap" VARCHAR(30),
    "AlgorithmOrder" INTEGER,

    CONSTRAINT "Mdb_Advice_pkey" PRIMARY KEY ("AdviceID")
);

-- CreateTable
CREATE TABLE "Mdb_QuestionAdvice" (
    "QuestionID" INTEGER NOT NULL,
    "AdviceID" INTEGER NOT NULL,
    "LastUpdate" TIMESTAMP(3),
    "QuestionAdviceOrder" INTEGER,

    CONSTRAINT "Mdb_QuestionAdvice_pkey" PRIMARY KEY ("QuestionID","AdviceID")
);

-- CreateTable
CREATE TABLE "Mdb_Reference" (
    "ReferenceID" INTEGER NOT NULL,
    "TopicReferenceID" INTEGER,
    "ReferenceTitle" VARCHAR(175),
    "ReferenceSource" VARCHAR(150),
    "ReferenceAuthor" VARCHAR(150),
    "LastUpdate" TIMESTAMP(3),
    "DateAdded" TIMESTAMP(3),
    "PMID" VARCHAR(20),
    "PubMedURL" TEXT,
    "PublicURL" TEXT,

    CONSTRAINT "Mdb_Reference_pkey" PRIMARY KEY ("ReferenceID")
);

-- CreateTable
CREATE TABLE "Mdb_AlgorithmReference" (
    "AlgorithmID" INTEGER NOT NULL,
    "ReferenceID" INTEGER NOT NULL,
    "DateUSed" TIMESTAMP(3),
    "LastUpdate" TIMESTAMP(3),

    CONSTRAINT "Mdb_AlgorithmReference_pkey" PRIMARY KEY ("AlgorithmID","ReferenceID")
);

-- CreateTable
CREATE TABLE "Mdb_SearchWord" (
    "SearchWord" VARCHAR(50) NOT NULL,
    "DateCreated" TIMESTAMP(3),

    CONSTRAINT "Mdb_SearchWord_pkey" PRIMARY KEY ("SearchWord")
);

-- CreateTable
CREATE TABLE "Mdb_AlgorithmSearchWords" (
    "AlgorithmID" INTEGER NOT NULL,
    "SearchWord" VARCHAR(50) NOT NULL,
    "CreateDate" TIMESTAMP(3),
    "LastUpDate" TIMESTAMP(3),

    CONSTRAINT "Mdb_AlgorithmSearchWords_pkey" PRIMARY KEY ("AlgorithmID","SearchWord")
);

-- CreateTable
CREATE TABLE "Mdb_Supplemental" (
    "SupplementalID" INTEGER NOT NULL,
    "TopicID" INTEGER,
    "Author" VARCHAR(50),
    "Filename" VARCHAR(60),
    "CreateDate" TIMESTAMP(3),
    "LastUpDate" TIMESTAMP(3),
    "LastReviewDate" TIMESTAMP(3),
    "Title" VARCHAR(70),
    "Title_LastUpdate" TIMESTAMP(3),
    "Content_XHTML" TEXT,
    "Content" TEXT,
    "Content_LastUpdate" TIMESTAMP(3),
    "Category" VARCHAR(50),
    "Group" VARCHAR(30),
    "Status" VARCHAR(15),
    "VersionYear" VARCHAR(4),

    CONSTRAINT "Mdb_Supplemental_pkey" PRIMARY KEY ("SupplementalID")
);

-- CreateTable
CREATE TABLE "Mdb_AlgorithmSupplemental" (
    "AlgorithmID" INTEGER NOT NULL,
    "SupplementalID" INTEGER NOT NULL,
    "CreatedDate" TIMESTAMP(3),

    CONSTRAINT "Mdb_AlgorithmSupplemental_pkey" PRIMARY KEY ("AlgorithmID","SupplementalID")
);

-- AddForeignKey
ALTER TABLE "Mdb_Disposition" ADD CONSTRAINT "Mdb_Disposition_AcuityRating_fkey" FOREIGN KEY ("AcuityRating") REFERENCES "Mdb_AcuityRating"("AcuityRating_Numeric") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Mdb_Algorithm" ADD CONSTRAINT "Mdb_Algorithm_Acuity_fkey" FOREIGN KEY ("Acuity") REFERENCES "Mdb_AcuityRating"("AcuityRating_Numeric") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Mdb_Algorithm" ADD CONSTRAINT "Mdb_Algorithm_System_fkey" FOREIGN KEY ("System") REFERENCES "Mdb_System"("System") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_Algorithm" ADD CONSTRAINT "Mdb_Algorithm_Type_fkey" FOREIGN KEY ("Type") REFERENCES "Mdb_Type"("Type") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_Question" ADD CONSTRAINT "Mdb_Question_AlgorithmID_fkey" FOREIGN KEY ("AlgorithmID") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_Question" ADD CONSTRAINT "Mdb_Question_DispositionLevel_fkey" FOREIGN KEY ("DispositionLevel") REFERENCES "Mdb_Disposition"("LevelID") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Mdb_Advice" ADD CONSTRAINT "Mdb_Advice_AlgorithmID_fkey" FOREIGN KEY ("AlgorithmID") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_QuestionAdvice" ADD CONSTRAINT "Mdb_QuestionAdvice_QuestionID_fkey" FOREIGN KEY ("QuestionID") REFERENCES "Mdb_Question"("QuestionID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_QuestionAdvice" ADD CONSTRAINT "Mdb_QuestionAdvice_AdviceID_fkey" FOREIGN KEY ("AdviceID") REFERENCES "Mdb_Advice"("AdviceID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_AlgorithmReference" ADD CONSTRAINT "Mdb_AlgorithmReference_AlgorithmID_fkey" FOREIGN KEY ("AlgorithmID") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_AlgorithmReference" ADD CONSTRAINT "Mdb_AlgorithmReference_ReferenceID_fkey" FOREIGN KEY ("ReferenceID") REFERENCES "Mdb_Reference"("ReferenceID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_AlgorithmSearchWords" ADD CONSTRAINT "Mdb_AlgorithmSearchWords_AlgorithmID_fkey" FOREIGN KEY ("AlgorithmID") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_AlgorithmSearchWords" ADD CONSTRAINT "Mdb_AlgorithmSearchWords_SearchWord_fkey" FOREIGN KEY ("SearchWord") REFERENCES "Mdb_SearchWord"("SearchWord") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_AlgorithmSupplemental" ADD CONSTRAINT "Mdb_AlgorithmSupplemental_AlgorithmID_fkey" FOREIGN KEY ("AlgorithmID") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mdb_AlgorithmSupplemental" ADD CONSTRAINT "Mdb_AlgorithmSupplemental_SupplementalID_fkey" FOREIGN KEY ("SupplementalID") REFERENCES "Mdb_Supplemental"("SupplementalID") ON DELETE CASCADE ON UPDATE CASCADE;
