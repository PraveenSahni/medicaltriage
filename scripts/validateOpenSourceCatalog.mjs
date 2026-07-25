import crypto from "node:crypto";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ADULT_ONLY_ALGORITHM_IDS,
  ADULT_ONLY_CATALOG_COUNT,
} from "./adultOnlyCatalogPolicy.mjs";

export const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
export const CATALOG_ROOT = path.join(REPO_ROOT, "docs", "protocol-review", "catalog", "open-source");

const batchRoot = (batch) =>
  batch === 1 ? CATALOG_ROOT : path.join(CATALOG_ROOT, `batch-${String(batch).padStart(2, "0")}`);
const manifestName = (batch) => `batch-${String(batch).padStart(2, "0")}-manifest.json`;
const hash = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const emergencyTransportPattern =
  /\b(?:ambulance|do not (?:allow (?:the person|patient) to |let (?:the person|patient) |self-)?drive|do not let (?:them|the caller) drive|no self-driving|await emergency transport|emergency transport)\b/i;
const qatar999Pattern = /\bQatar(?: emergency services(?: on)?)? 999\b/i;
const prohibitedUkOperationalPattern =
  /\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b|\bchemist\b|\bwalk-in centre\b|\bminor injuries unit\b/i;
const malformedNurseVisiblePattern =
  /\bGOVERNANCE_REQUIRED\b|Qatar 999\/|Qatar pathway approved by governance|clinical-review pathway approved by governance|an emergency assessment service selected through/i;

function dbNurseVisibleText(doc) {
  return JSON.stringify({
    definition: doc.algorithm?.Definition,
    background: doc.algorithm?.Background,
    firstAid: doc.algorithm?.FirstAid,
    questions: doc.questions,
    advice: doc.advice,
    initialAssessmentQuestions: doc.initialAssessmentQuestions,
  });
}

function runtimeNurseVisibleText(protocol) {
  return JSON.stringify({
    definition: protocol.clinicalDefinitionEn,
    background: protocol.backgroundInfoEn,
    backgroundDetail: protocol.backgroundDetail,
    firstAid: protocol.firstAid,
    questions: protocol.questions,
    advice: protocol.careAdvice,
    initialAssessmentQuestions: protocol.initialAssessmentQuestions,
  });
}

function canonicalSourceProtocolIds() {
  const sourceDir = path.join(REPO_ROOT, "src", "data", "openSourceGuidelines");
  const ids = new Set();
  for (const file of fs.readdirSync(sourceDir).filter((name) => /^batch\d+.*\.ts$/.test(name))) {
    const source = fs.readFileSync(path.join(sourceDir, file), "utf8");
    for (const match of source.matchAll(/^\s{4}id:\s*"((?:oscg|oscr)-[^"]+)",/gm)) ids.add(match[1]);
  }
  return ids;
}

function adviceText(advice) {
  const content = advice?.Content ?? advice?.instructionTextEn ?? "";
  return Array.isArray(content) ? content.join(" ") : String(content);
}

function missingDispositionLevels({ questions, dispositions, questionLevelField, dispositionLevelField }) {
  const declared = new Set((dispositions ?? []).map((row) => row[dispositionLevelField]));
  return [...new Set(
    (questions ?? [])
      .map((question) => question[questionLevelField])
      .filter((level) => typeof level === "number" && !declared.has(level)),
  )].sort((a, b) => a - b);
}

function assertAdviceLinks({ questions, advice, idField, adviceIdsField, label, errors }) {
  const adviceById = new Map((advice ?? []).map((item) => [String(item[idField]), item]));
  for (const question of questions ?? []) {
    for (const adviceId of question[adviceIdsField] ?? []) {
      if (!adviceById.has(String(adviceId))) {
        errors.push(`${label}: missing linked advice ${adviceId}`);
      }
    }
  }
  return adviceById;
}

export function runSelfTests() {
  assert.equal(hash({ stable: true }), hash({ stable: true }));
  assert.notEqual(hash({ stable: true }), hash({ stable: false }));
  assert.match("Call Qatar emergency services on 999 now.", qatar999Pattern);
  assert.doesNotMatch("Call emergency services now.", qatar999Pattern);
  assert.match("Do not allow self-driving; await ambulance transport.", emergencyTransportPattern);
  assert.doesNotMatch("Arrange review when convenient.", emergencyTransportPattern);
  assert.match("Book a GP appointment.", prohibitedUkOperationalPattern);
  assert.doesNotMatch("Arrange a primary-care review.", prohibitedUkOperationalPattern);
  assert.match("Route remains GOVERNANCE_REQUIRED.", malformedNurseVisiblePattern);
  assert.match("Use Qatar 999/an emergency service.", malformedNurseVisiblePattern);
  assert.doesNotMatch("Call Qatar 999 or attend the Emergency Department.", malformedNurseVisiblePattern);
  assert.deepEqual(
    missingDispositionLevels({
      questions: [{ DispositionLevel: 70 }, { DispositionLevel: 100 }, { DispositionLevel: null }],
      dispositions: [{ LevelID: 100 }],
      questionLevelField: "DispositionLevel",
      dispositionLevelField: "LevelID",
    }),
    [70],
  );

  const errors = [];
  const linked = assertAdviceLinks({
    questions: [{ id: "q1", careAdviceIds: ["a1", "missing"] }],
    advice: [{ id: "a1", instructionTextEn: "Advice" }],
    idField: "id",
    adviceIdsField: "careAdviceIds",
    label: "self-test",
    errors,
  });
  assert.equal(linked.get("a1").instructionTextEn, "Advice");
  assert.deepEqual(errors, ["self-test: missing linked advice missing"]);

  const canonical = canonicalSourceProtocolIds();
  assert.ok(canonical.has("oscr-chest-pain-heart"));
  assert.ok(canonical.has("oscg-snakebite"));
  assert.ok(!canonical.has("oscg-elbow-pain-child"));
  return { status: "PASS", assertions: 17 };
}

function sourceProtocolId(entry) {
  if (entry.sourceProtocolId) return entry.sourceProtocolId;
  const match = entry.importSource?.match(/#([^|]+)/);
  return match?.[1];
}

export function validateCatalog({ requireRuntime = true, requirePdfs = true } = {}) {
  const errors = [];
  const warnings = [];
  const ids = [];
  const sourceIds = new Set();
  const canonicalSourceIds = canonicalSourceProtocolIds();
  let records = 0;
  let openResearchGaps = 0;

  for (let batch = 1; batch <= 23; batch += 1) {
    const root = batchRoot(batch);
    const manifestPath = path.join(root, "manifests", manifestName(batch));
    if (!fs.existsSync(manifestPath)) {
      errors.push(`Batch ${batch}: missing manifest ${manifestPath}`);
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!Array.isArray(manifest.entries) || manifest.entries.length !== manifest.protocolCount) {
      errors.push(`Batch ${batch}: manifest protocolCount does not match entries`);
      continue;
    }

    const manifestFiles = new Set(manifest.entries.map((entry) => path.basename(entry.file)));
    const actualJson = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
    for (const extra of actualJson.filter((name) => !manifestFiles.has(name))) {
      errors.push(`Batch ${batch}: stale JSON not in manifest: ${extra}`);
    }

    for (const entry of manifest.entries) {
      if (entry.ageGroup !== "Adult") {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: adult-only catalog contains ${entry.ageGroup} entry`);
      }
      const protocolSourceId = sourceProtocolId(entry);
      if (!protocolSourceId) errors.push(`Batch ${batch} ID ${entry.algorithmId}: missing sourceProtocolId`);
      else {
        sourceIds.add(protocolSourceId);
        if (!canonicalSourceIds.has(protocolSourceId)) {
          errors.push(
            `Batch ${batch} ID ${entry.algorithmId}: sourceProtocolId '${protocolSourceId}' does not exactly resolve to a canonical source protocol`,
          );
        }
      }
      if (!entry.canonicalSourceProtocolId) {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: missing canonicalSourceProtocolId`);
      } else {
        if (entry.canonicalSourceProtocolId !== protocolSourceId) {
          errors.push(
            `Batch ${batch} ID ${entry.algorithmId}: sourceProtocolId and canonicalSourceProtocolId disagree`,
          );
        }
        if (!canonicalSourceIds.has(entry.canonicalSourceProtocolId)) {
          errors.push(
            `Batch ${batch} ID ${entry.algorithmId}: canonicalSourceProtocolId '${entry.canonicalSourceProtocolId}' does not exactly resolve to a canonical source protocol`,
          );
        }
      }
      if (entry.validationStatus !== "BLOCKED_BY_RESEARCH_GAP") {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: validationStatus must be BLOCKED_BY_RESEARCH_GAP`);
      }
      const jsonPath = path.join(root, entry.file);
      if (!fs.existsSync(jsonPath)) {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: missing JSON ${entry.file}`);
        continue;
      }
      const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      records += 1;
      ids.push(doc.algorithm?.AlgorithmID);
      if (doc.algorithm?.AlgorithmID !== entry.algorithmId) {
        errors.push(`Batch ${batch}: manifest/JSON AlgorithmID mismatch for ${entry.file}`);
      }
      if (!/^Adult\b/.test(doc.algorithm?.Age ?? "") || /\bChild\b/i.test(doc.algorithm?.Title ?? "")) {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: generated JSON is not explicitly adult-only`);
      }
      if (hash(doc) !== entry.canonicalContentHash) {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: canonicalContentHash mismatch`);
      }
      if (prohibitedUkOperationalPattern.test(JSON.stringify(doc))) {
        errors.push(
          `Batch ${batch} ID ${entry.algorithmId}: generated JSON contains prohibited UK operational routing language`,
        );
      }
      if (malformedNurseVisiblePattern.test(dbNurseVisibleText(doc))) {
        errors.push(
          `Batch ${batch} ID ${entry.algorithmId}: generated JSON contains malformed or internal placeholder text in nurse-visible content`,
        );
      }
      const missingDbDispositionLevels = missingDispositionLevels({
        questions: doc.questions,
        dispositions: doc.dispositions,
        questionLevelField: "DispositionLevel",
        dispositionLevelField: "LevelID",
      });
      if (missingDbDispositionLevels.length) {
        errors.push(
          `Batch ${batch} ID ${entry.algorithmId}: question disposition level(s) ${missingDbDispositionLevels.join(", ")} have no declared disposition row`,
        );
      }
      for (const question of doc.questions ?? []) {
        if (question.TelemedicineEligible !== false) {
          errors.push(`Batch ${batch} ID ${entry.algorithmId}: question ${question.QuestionID} is telemedicine eligible`);
        }
      }
      const jsonAdvice = assertAdviceLinks({
        questions: doc.questions,
        advice: doc.advice,
        idField: "AdviceID",
        adviceIdsField: "AdviceIDs",
        label: `Batch ${batch} ID ${entry.algorithmId}`,
        errors,
      });
      for (const question of (doc.questions ?? []).filter((item) => item.DispositionLevel === 100)) {
        const linked = (question.AdviceIDs ?? []).map((id) => jsonAdvice.get(String(id))).filter(Boolean);
        const text = linked.map(adviceText).join(" ");
        if (!qatar999Pattern.test(text)) {
          errors.push(`Batch ${batch} ID ${entry.algorithmId}: emergency question ${question.QuestionID} lacks literal Qatar 999 advice`);
        }
        if (!emergencyTransportPattern.test(text)) {
          errors.push(`Batch ${batch} ID ${entry.algorithmId}: emergency question ${question.QuestionID} lacks controlled transport/no-driving advice`);
        }
      }
      const serialized = JSON.stringify({
        source: doc._source,
        manifest: entry.sourceProvenance ?? manifest.safetyBoundary,
      });
      if (
        !/UAT|structural|pipeline testing/i.test(serialized) ||
        !/not (?:for )?(?:real patient care or )?production|production-ineligible|productionEligible\"\s*:\s*false/i.test(serialized)
      ) {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: UAT/non-production provenance is not explicit`);
      }
      if (requirePdfs) {
        const pdf = path.join(root, "pdf", path.basename(entry.file).replace(/\.db\.json$/, ".pdf"));
        if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) {
          errors.push(`Batch ${batch} ID ${entry.algorithmId}: PDF missing or empty`);
        } else if (fs.statSync(pdf).mtimeMs < fs.statSync(jsonPath).mtimeMs) {
          errors.push(`Batch ${batch} ID ${entry.algorithmId}: PDF is older than JSON`);
        }
      }
    }

    const gapPath = path.join(root, "research-gaps", `batch-${String(batch).padStart(2, "0")}-research-gap-register.json`);
    if (!fs.existsSync(gapPath)) errors.push(`Batch ${batch}: missing research-gap register`);
    else {
      const register = JSON.parse(fs.readFileSync(gapPath, "utf8"));
      if (register.count !== register.gaps?.length) errors.push(`Batch ${batch}: research-gap count mismatch`);
      const nonOpen = (register.gaps ?? []).filter((gap) => gap.status !== "OPEN");
      if (nonOpen.length) errors.push(`Batch ${batch}: ${nonOpen.length} research gaps are not OPEN`);
      openResearchGaps += register.gaps?.length ?? 0;
    }

    if (requireRuntime) {
      const runtimePath = path.join(root, "runtime", `batch-${String(batch).padStart(2, "0")}.runtime.json`);
      if (!fs.existsSync(runtimePath)) errors.push(`Batch ${batch}: missing runtime package`);
      else {
        const runtime = JSON.parse(fs.readFileSync(runtimePath, "utf8"));
        if (runtime.protocols?.length !== manifest.entries.length) {
          errors.push(`Batch ${batch}: runtime/manifest protocol count mismatch`);
        }
        const manifestTitles = new Set(manifest.entries.map((entry) => entry.title));
        const runtimeTitles = (runtime.protocols ?? []).map((protocol) => protocol.titleEn);
        if (new Set(runtimeTitles).size !== runtimeTitles.length) {
          errors.push(`Batch ${batch}: duplicate runtime protocol titles`);
        }
        for (const title of manifestTitles) {
          if (!runtimeTitles.includes(title)) {
            errors.push(`Batch ${batch}: manifest title is missing from runtime: ${title}`);
          }
        }
        for (const protocol of runtime.protocols ?? []) {
          if (
            protocol.patientGroup !== "adult" ||
            Number(protocol.ageMin) < 18 ||
            (protocol.ageMax !== null && protocol.ageMax !== undefined)
          ) {
            errors.push(`Batch ${batch} runtime ${protocol.id}: protocol is not restricted to adults 18+`);
          }
          if (!manifestTitles.has(protocol.titleEn)) {
            errors.push(`Batch ${batch} runtime ${protocol.id}: title is not covered by the manifest`);
          }
          if (prohibitedUkOperationalPattern.test(JSON.stringify(protocol))) {
            errors.push(
              `Batch ${batch} runtime ${protocol.id}: contains prohibited UK operational routing language`,
            );
          }
          if (malformedNurseVisiblePattern.test(runtimeNurseVisibleText(protocol))) {
            errors.push(
              `Batch ${batch} runtime ${protocol.id}: contains malformed or internal placeholder text in nurse-visible content`,
            );
          }
          for (const question of protocol.questions ?? []) {
            if (question.telemedicineEligible !== false) {
              errors.push(`Batch ${batch} runtime ${protocol.id}: telemedicine eligibility must be false`);
            }
          }
          const runtimeAdvice = assertAdviceLinks({
            questions: protocol.questions,
            advice: protocol.careAdvice,
            idField: "id",
            adviceIdsField: "careAdviceIds",
            label: `Batch ${batch} runtime ${protocol.id}`,
            errors,
          });
          for (const question of (protocol.questions ?? []).filter(
            (item) => item.dispositionLevel === 100 || item.severity === "Emergency",
          )) {
            const linked = (question.careAdviceIds ?? []).map((id) => runtimeAdvice.get(String(id))).filter(Boolean);
            const text = linked.map(adviceText).join(" ");
            if (!qatar999Pattern.test(text)) {
              errors.push(`Batch ${batch} runtime ${protocol.id}: emergency question ${question.id} lacks literal Qatar 999 advice`);
            }
            if (!emergencyTransportPattern.test(text)) {
              errors.push(`Batch ${batch} runtime ${protocol.id}: emergency question ${question.id} lacks controlled transport/no-driving advice`);
            }
          }
          const provenance = protocol.provenance ?? {};
          if (
            provenance.productionEligible !== false ||
            provenance.requiresClinicalValidation !== true ||
            !/UAT|structural|pipeline testing/i.test(provenance.contentNotice ?? "")
          ) {
            errors.push(`Batch ${batch} runtime ${protocol.id}: invalid UAT production gate`);
          }
        }
      }
    }
  }

  const sorted = [...ids].sort((a, b) => a - b);
  const expected = ADULT_ONLY_ALGORITHM_IDS;
  if (records !== ADULT_ONLY_CATALOG_COUNT) {
    errors.push(`Expected ${ADULT_ONLY_CATALOG_COUNT} adult-only catalog records, found ${records}`);
  }
  if (new Set(ids).size !== ids.length) errors.push("Duplicate AlgorithmID values found");
  if (sorted.join(",") !== expected.join(",")) {
    errors.push("Adult AlgorithmIDs do not match the frozen adult-only UAT policy");
  }

  return {
    status: errors.length ? "FAIL" : "PASS",
    records,
    uniqueIds: new Set(ids).size,
    idRange: sorted.length ? `${sorted[0]}-${sorted.at(-1)}` : null,
    sourceProtocolIds: sourceIds.size,
    openResearchGaps,
    errors,
    warnings,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--self-test")) {
    console.log(JSON.stringify(runSelfTests(), null, 2));
    process.exit(0);
  }
  const result = validateCatalog({
    requireRuntime: !process.argv.includes("--skip-runtime"),
    requirePdfs: !process.argv.includes("--skip-pdfs"),
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) process.exitCode = 1;
}
