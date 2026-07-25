import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type Redirect = {
  question: string;
  info: string;
  target?: string;
  dispositionLevel?: number;
  careAdviceId?: string;
};
type Config = {
  batch: string;
  root: string;
  protocols: any[];
  selectedIds: string[];
  redirects: Record<string, Redirect | Redirect[]>;
  startId: number;
  endId: number;
  version: string;
  sourceText?: string;
  redirectTelemedicineEligible?: boolean;
  preserveUatProvenance?: boolean;
  excludedNotes?: string[];
  adaptText?: (value: string, context: { protocol: any; age: string; gender: string }) => string;
  includeQuestion?: (question: any, context: { protocol: any; age: string; gender: string }) => boolean;
  variants?: Record<string, Array<{
    age: "Adult" | "Child";
    gender: "Male" | "Female";
    ageDisplay?: string;
    ageMin?: number;
    ageMax?: number | null;
  }>>;
};

const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source guideline content derived from cited public sources; it is not licensed STCC content. Question.DispositionLevel=null marks a See More Appropriate Guideline redirect. Demographic variants contain only source-supported differences; identical thresholds are documented rather than fabricated. Local destinations and TelemedicineEligible values require IST clinical governance approval.";
const hash = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const prohibitedOperationalLanguage =
  /\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b|\bchemist\b|\bwalk-in centre\b|\bminor injuries unit\b/i;
const controlledEmergencyTransportInstruction =
  "Call Qatar 999 now, follow the call-taker's ambulance and emergency-transport instructions, and do not self-drive. Do not delay emergency care.";
export const normalizeEmergencyAdvice = (value: string) =>
  value.includes(controlledEmergencyTransportInstruction)
    ? value
    : `${value.trim()} ${controlledEmergencyTransportInstruction}`.trim();
export const localizeOperationalText = (value: string) =>
  value
    .replace(/\burgent GP\/111 contact\b/gi, "urgent clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\burgent (?:NHS )?111 or emergency GP contact\b/gi, "urgent clinical review or emergency assessment through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bpharmacy\/GP treatment\b/gi, "pharmacy or clinical treatment through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bGP review\b/gi, "clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bthe same ([^.]+) as a GP\b/gi, "the same $1 as a clinician using the Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bcall-999\b/gi, "Qatar 999")
    .replace(/\bcall 999 or go to A&E\b/gi, "call Qatar 999 and follow the call-taker's emergency transport instructions")
    .replace(/\bdrive to A&E\b/gi, "seek emergency assessment through a Qatar transport pathway approved by governance; do not self-drive when emergency features are present (GOVERNANCE_REQUIRED)")
    .replace(/\bgo to A&E\b/gi, "seek emergency assessment through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bA&E\b/g, "an emergency assessment service selected through the Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bNHS 111\b/gi, "the Qatar clinical-review pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\burgent 111\b/gi, "urgent clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bcontact 111\b/gi, "seek clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bcalling 111\b/gi, "contacting the Qatar clinical-review pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bcall 111\b/gi, "seek clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\b111\b/g, "the Qatar clinical-review pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bsee a GP\b/gi, "arrange clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bseeing a GP\b/gi, "arranging clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bGP visit\b/gi, "clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bGP or dentist appointment\b/gi, "clinical or dental review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bGP appointment\b/gi, "clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bbook a GP appointment\b/gi, "arrange clinical review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bGP\b/gi, "a clinician using the Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bchemist\b/gi, "pharmacy review through a Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bwalk-in centre\b/gi, "an in-person service selected through the Qatar pathway approved by governance (GOVERNANCE_REQUIRED)")
    .replace(/\bminor injuries unit\b/gi, "an in-person injury service selected through the Qatar pathway approved by governance (GOVERNANCE_REQUIRED)");

export const canonicalLineageId = (protocol: any): string =>
  protocol.canonicalSourceProtocolId ?? protocol.id;

export function generateDemographicBatch(config: Config) {
  const root = path.resolve(config.root);
  for (const dir of ["json", "pdf", "evidence", "manifests", "research-gaps", "batches"]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  const selected = config.protocols.filter((protocol) => config.selectedIds.includes(protocol.id));
  if (selected.length !== config.selectedIds.length) {
    throw new Error(`Expected ${config.selectedIds.length} selected families, found ${selected.length}.`);
  }
  const entries: any[] = [];
  const gaps: any[] = [];
  let nextId = config.startId;
  for (const protocol of selected) {
    for (const age of [{ label: "Adult", min: 18, max: null }, { label: "Child", min: protocol.ageMin, max: 17 }]) {
      for (const gender of ["Male", "Female"]) {
        const allowedVariants = config.variants?.[protocol.id];
        const selectedVariant = allowedVariants?.find(
          (variant) => variant.age === age.label && variant.gender === gender,
        );
        if (allowedVariants && !selectedVariant) continue;
        const effectiveAge = {
          min: selectedVariant?.ageMin ?? age.min,
          max: selectedVariant?.ageMax !== undefined ? selectedVariant.ageMax : age.max,
          display: selectedVariant?.ageDisplay,
        };
        const algorithmId = nextId++;
        const context = { protocol, age: age.label, gender };
        const adapt = (value: string) =>
          config.adaptText
            ? config.adaptText(localizeOperationalText(value), context)
            : localizeOperationalText(value);
        const slug = `${slugify(protocol.titleEn)}-${age.label.toLowerCase()}-${gender.toLowerCase()}`;
        const adviceIds = new Map(
          protocol.careAdvice.map((advice: any, index: number) => [advice.id, algorithmId * 100 + index + 1]),
        );
        const iaqs = protocol.initialAssessmentQuestions.map((question: any, index: number) => ({
          Order: index + 1,
          Category: question.responseType,
          Question: adapt(question.promptTextEn),
          Rationale: `Condition-relevant assessment retained from the cited Batch ${config.batch} source.`,
          Source: protocol.titleEn,
        }));
        if (age.label === "Child") {
          iaqs.push({
            Order: iaqs.length + 1,
            Category: "CAREGIVER_OBSERVATION",
            Question: "What has a safe parent or caregiver observed about alertness, breathing, pain, swelling, fever, eating or drinking, sleep, play, and normal activity?",
            Rationale: "Child assessment adds safe-caregiver observations without inventing a different clinical threshold.",
            Source: "IST pediatric telephone-assessment adaptation; governance review required",
          });
        }
        const configuredRedirects = config.redirects[protocol.id];
        if (!configuredRedirects) throw new Error(`Missing redirect for ${protocol.id}.`);
        const redirects = Array.isArray(configuredRedirects) ? configuredRedirects : [configuredRedirects];
        const questions = [...redirects.map((redirect, index) => {
          if (!redirect.target && redirect.dispositionLevel === undefined) {
            throw new Error(`${protocol.id}: direct redirect replacement requires dispositionLevel.`);
          }
          const directAdviceId = redirect.careAdviceId
            ? adviceIds.get(redirect.careAdviceId)
            : undefined;
          if (redirect.careAdviceId && directAdviceId === undefined) {
            throw new Error(`${protocol.id}: direct redirect replacement advice '${redirect.careAdviceId}' does not exist.`);
          }
          return {
            QuestionID: algorithmId * 1000 + index + 1,
            AlgorithmID: algorithmId,
            DispositionLevel: redirect.target ? null : redirect.dispositionLevel!,
            QuestionOrder: index + 1,
            Question: redirect.question,
            Information: redirect.info,
            GotoGuideline: redirect.target ?? null,
            TelemedicineEligible: config.redirectTelemedicineEligible ?? true,
            AdviceIDs: directAdviceId === undefined ? [] : [directAdviceId],
          };
        }), ...protocol.questions
          .filter((question: any) => config.includeQuestion?.(question, context) ?? true)
          .map((question: any, index: number) => ({
          QuestionID: algorithmId * 1000 + redirects.length + index + 1, AlgorithmID: algorithmId,
          DispositionLevel: question.dispositionLevel ?? 50,
          QuestionOrder: question.questionOrder ?? index + 1,
          Question: adapt(question.questionTextEn), Information: adapt(question.rationaleEn),
          GotoGuideline: null, TelemedicineEligible: question.telemedicineEligible,
          AdviceIDs: question.careAdviceIds.map((id: string) => adviceIds.get(id)),
          }))];
        const dispositions = new Map<number, any>();
        for (const question of protocol.questions) {
          const level = question.dispositionLevel ?? 50;
          if (!dispositions.has(level)) dispositions.set(level, {
            LevelID: level,
            DispositionHeading: level >= 100 ? "Emergency Department Now" : level >= 70 ? "Urgent Clinical Review" : level >= 40 ? "Clinical Review" : "Self Care with Callback Precautions",
            DispositionHeading_Telemedicine: level >= 100 ? "Emergency transport / in-person assessment now" : level >= 70 ? "Urgent clinical assessment" : level >= 40 ? "Prompt telemedicine or in-person review" : "Home care with safety-net advice",
            Video: level < 100,
            CssVar: level >= 100 ? "--ems" : level >= 70 ? "--urgent" : level >= 40 ? "--review" : "--self-care",
            DestinationCode: question.dispositionCode,
            Acuity: level >= 100 ? 5 : level >= 70 ? 4 : level >= 40 ? 3 : 2,
          });
        }
        const doc = {
          _source: config.sourceText ?? sourceText,
          algorithm: {
            AlgorithmID: algorithmId, Title: `${protocol.titleEn} - ${gender} (${age.label})`,
            ContentSet: `IST Open-Source Guideline Content | ${age.label} | ${gender}`,
            Age: effectiveAge.display ??
              (effectiveAge.max === null
                ? `Adult (${effectiveAge.min} years and older)`
                : `Child (${effectiveAge.min}-${effectiveAge.max} years)`),
            GenderAtBirth: gender, Acuity: protocol.acuity,
            Definition: [protocol.clinicalDefinitionEn, `${age.label} patient.`, `${gender}.`],
            PainSeverity: [],
            Background: { KeyPoints: protocol.backgroundInfoEn ? [protocol.backgroundInfoEn] : [], CausesUnder50: [], CausesOver50: [], LocationTable: [], ExpertReviewer: protocol.authorship?.expertReviewerEn ?? "Public-source clinical editorial review (source publisher)" },
            FirstAid: protocol.careAdvice.filter((advice: any) => advice.dispositionCode === "HMC_EMERGENCY_DEPARTMENT").map((advice: any) => normalizeEmergencyAdvice(adapt(advice.instructionTextEn))),
            Author: protocol.authorship?.authorEn ?? "IST Health Open-Source Guideline Content",
            LastRevised: "RESEARCH_REQUIRED - internal IST clinical adaptation date is not recorded",
            LastReviewed: protocol.authorship?.lastReviewedIso ?? "RESEARCH_REQUIRED - verify source review date during governance",
            VersionYear: protocol.authorship?.versionYear ?? 2026,
            Company: "IST Health Open-Source Guideline Content",
            Copyright: "Public-source content reused under its stated licence. This is not licensed STCC content.",
          },
          dispositions: [...dispositions.values()].sort((a, b) => b.LevelID - a.LevelID),
          questions,
          advice: protocol.careAdvice.map((advice: any) => ({
            AdviceID: adviceIds.get(advice.id), AlgorithmOrder: advice.displayOrder, Title: advice.titleEn,
            PatientHealthInfo: advice.patientSendable ?? false, Internal: false,
            Content: [
              advice.dispositionCode === "HMC_EMERGENCY_DEPARTMENT"
                ? normalizeEmergencyAdvice(adapt(advice.instructionTextEn))
                : adapt(advice.instructionTextEn),
              `Call Back If: ${advice.warningSigns.join("; ")}.`,
            ],
          })),
          references: protocol.provenance.sourceDocuments,
          searchwords: protocol.keywords.map((keyword: any) => keyword.phrase),
          initialAssessmentQuestions: iaqs,
        };
        const prohibitedMatch = JSON.stringify(doc).match(prohibitedOperationalLanguage);
        if (prohibitedMatch) {
          throw new Error(
            `${doc.algorithm.Title}: prohibited operational wording "${prohibitedMatch[0]}" remains after localization.`,
          );
        }
        const canonicalContentHash = hash(doc);
        fs.writeFileSync(path.join(root, "json", `${slug}.db.json`), `${JSON.stringify(doc, null, 2)}\n`);
        entries.push({
          file: `json/${slug}.db.json`, algorithmId, title: doc.algorithm.Title,
          protocolFamily: protocol.titleEn,
          sourceProtocolId: canonicalLineageId(protocol),
          canonicalSourceProtocolId: canonicalLineageId(protocol),
          ageGroup: age.label,
          sourceMinimumAge: effectiveAge.min, genderAtBirth: gender,
          protocolVersion: config.version,
          validationStatus: "BLOCKED_BY_RESEARCH_GAP", canonicalContentHash,
          redirectTarget: redirects
            .map((redirect) => redirect.target ?? `DIRECT_DISPOSITION_${redirect.dispositionLevel}`)
            .join(" | "),
          ...(config.preserveUatProvenance ? {
            sourceProvenance: {
              usageStatus: protocol.provenance.usageStatus,
              productionEligible: protocol.provenance.productionEligible,
              clinicalStatus: protocol.provenance.clinicalStatus,
              requiresClinicalValidation: protocol.provenance.requiresClinicalValidation,
              licensedContentIncluded: protocol.provenance.licensedContentIncluded,
              sourceDocuments: protocol.provenance.sourceDocuments,
              contentNotice: protocol.provenance.contentNotice,
            },
          } : {}),
          demographicDifferentiation: {
            ageSpecificChanges: age.label === "Child"
              ? [`Child applicability begins at source minimum age ${protocol.ageMin}.`, "Safe-caregiver observations are added without changing source-derived thresholds."]
              : ["Adult pathway uses direct symptom, safety, and functional-impact assessment."],
            sexSpecificChanges: ["No sex-specific threshold is supported by the cited source; no difference was fabricated."],
          },
        });
        for (const [field, description] of [
          ["algorithm.LastRevised", "Internal IST clinical adaptation date is not recorded."],
          ["clinicalReview", "Named IST clinician approval is required for questions, dispositions, advice, redirects, and demographic applicability."],
          ["localization", "Qatar destination, medication, callback, emergency, and safeguarding instructions require approval."],
        ]) gaps.push({ gapId: `B${config.batch}-${algorithmId}-${field.replaceAll(".", "-")}`, algorithmId, protocol: doc.algorithm.Title, field, description, status: "OPEN" });
      }
    }
  }
  if (nextId - 1 !== config.endId) throw new Error(`Expected final ID ${config.endId}, got ${nextId - 1}.`);
  const manifest = {
    manifestVersion: "1.0", importBatch: `open-source-batch-${config.batch}`,
    generatedDate: "2026-07-25", conditionFamilies: selected.length, protocolCount: entries.length,
    canonicalSourceFieldType: "string", algorithmIdRange: `${config.startId}-${config.endId}`,
    applicabilityPolicy: {
      pregnancySpecificProtocols: "Female-only; never generate Male variants.",
      pediatricSpecificProtocols: "Child-only within source-supported ages; never generate Adult variants.",
      adultSpecificProtocols: "Adult-only; never generate Child variants.",
      mixedAgeProtocols: "Adult and Child variants only when the cited source supports both populations.",
      sexSpecificDifferences: "Only evidence-supported differences; never fabricate demographic content.",
    },
    excludedSourceFamilies: config.excludedNotes ?? [], entries,
    ...(config.preserveUatProvenance ? {
      safetyBoundary: {
        usageStatus: "UAT_ONLY",
        productionEligible: false,
        requiresClinicalValidation: true,
        importOrDeploymentPerformed: false,
      },
    } : {}),
  };
  fs.writeFileSync(path.join(root, "manifests", `batch-${config.batch}-manifest.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "research-gaps", `batch-${config.batch}-research-gap-register.json`), `${JSON.stringify({ batch: config.batch, count: gaps.length, gaps }, null, 2)}\n`);
  for (const entry of entries) {
    const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
    fs.writeFileSync(path.join(root, "evidence", `${path.basename(entry.file, ".db.json")}-evidence-and-parity-report.md`),
      `# ${entry.title} - Evidence and Parity Report\n\n- Algorithm ID: \`${entry.algorithmId}\`\n- Protocol family: \`${entry.protocolFamily}\`\n- Age group: **${entry.ageGroup}**\n- Gender at birth: **${entry.genderAtBirth}**\n- Completion status: **${entry.validationStatus}**\n- Content hash: \`${entry.canonicalContentHash}\`\n\n## Applicability\n\n- ${entry.demographicDifferentiation.ageSpecificChanges.join("\n- ")}\n- ${entry.demographicDifferentiation.sexSpecificChanges.join("\n- ")}\n\n## Parity\n\n- Disposition questions: ${doc.questions.filter((question: any) => question.DispositionLevel !== null).length}\n- Redirect questions: ${doc.questions.filter((question: any) => question.DispositionLevel === null).length}\n- Advice rows: ${doc.advice.length}\n- Initial assessment questions: ${doc.initialAssessmentQuestions.length}\n- References: ${doc.references.length}\n`);
  }
  const rows = entries.map((entry) => `| ${entry.algorithmId} | ${entry.title} | ${entry.redirectTarget} | ${entry.validationStatus} |`).join("\n");
  fs.writeFileSync(path.join(root, "batches", `batch-${config.batch}-summary.md`),
    `# Batch ${config.batch} - Learned-Safeguard Expansion\n\n- ${selected.length} public-source families produced as ${entries.length} demographically applicable protocols.\n- IDs: ${config.startId}-${config.endId}.\n- UK operational wording is localized.\n- All records remain BLOCKED_BY_RESEARCH_GAP.\n\n| ID | Protocol | Redirect | Status |\n|---:|---|---|---|\n${rows}\n`);
  console.log(`Generated ${entries.length} Batch ${config.batch} protocols and ${gaps.length} research gaps.`);
}
