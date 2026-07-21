import type { ClinicalContentPackageInput } from "../../../types/clinicalContent.js";

/**
 * STATUS (see docs/semantic-matching-enhancement-plan-2026.md for the full plan):
 * This file is Phase 0 of a 5-phase semantic-matching plan - the ONLY phase
 * implemented so far. Phases 1-4 (stemming, a lay-term concept gazetteer,
 * local embedding similarity, and an Agreement Engine) are still just a plan,
 * not code. 59 of 228 protocols still have zero synonym coverage - see the
 * plan doc's "IF YOU ARE PICKING THIS UP LATER" section before adding more
 * entries here or starting Phase 1.
 *
 * Before changing anything in this file: any edit here needs a genuine
 * before/after A/B sweep (git stash the change, re-run the 22 live-queue
 * verification scripts, compare, re-apply) - three separate real regressions
 * were found this way during Phase 0 that a same-code re-run would have
 * missed entirely. See the plan doc's §7 Changelog for what those were and
 * why (canonical-term double-counting, word-boundary-less false attachment,
 * redundant re-scoring of already-authored keywords).
 */

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * A single normalization group: one canonical term plus every lay/clinical
 * variant a caller might use instead. Every term in a group is treated as
 * interchangeable with every other term in that group - the group itself
 * (not a "canonical vs synonym" direction) is what gets attached to a
 * matching protocol, so "doctor", "physician", and "GP" all resolve to the
 * same synonym entries regardless of which one the protocol's own title/
 * keywords happened to use.
 *
 * This dictionary is intentionally hand-curated and narrow rather than a
 * general-purpose thesaurus - entries were seeded from the actual
 * lay-phrasing gaps hit repeatedly while authoring and live-queue-verifying
 * batches 01-23 (see docs/semantic-matching-enhancement-plan-2026.md,
 * Phase 0). It is not a substitute for the broader gazetteer/embedding work
 * planned in later phases - it only needs to cover common word-level
 * substitutions, not paraphrase or semantic similarity.
 */
interface SynonymGroup {
  canonicalTerm: string;
  variants: string[];
}

const SYNONYM_GROUPS: SynonymGroup[] = [
  // People / roles - short/generic tokens (e.g. bare "er", "ed", "gp", "kid",
  // "fit", "temp", "gut", "hide", "behind") are deliberately excluded: they
  // are substrings of common unrelated words ("kid" inside "kidney", "fit"
  // inside "benefit", "temp" inside "attempt", "er"/"ed" inside almost any
  // caller sentence) and caused a confirmed, widespread false-positive
  // regression across unrelated protocols when first tried - see the
  // Phase-0 changelog entry in docs/semantic-matching-enhancement-plan-2026.md.
  // Every entry below is either a whole, sufficiently distinctive word (4+
  // characters, not a common substring of unrelated words) or a multi-word
  // phrase, so it participates safely in scoreProtocol()'s plain substring
  // matching.
  { canonicalTerm: "doctor", variants: ["physician", "gp doctor", "medic"] },
  { canonicalTerm: "nurse", variants: ["nursing staff"] },
  { canonicalTerm: "pharmacist", variants: ["chemist"] },
  { canonicalTerm: "baby", variants: ["infant", "newborn"] },
  { canonicalTerm: "child", variants: ["toddler", "little one"] },
  { canonicalTerm: "teenager", variants: ["adolescent"] },
  { canonicalTerm: "caregiver", variants: ["caretaker"] },

  // Places / services
  { canonicalTerm: "emergency room", variants: ["accident and emergency", "emergency department"] },
  { canonicalTerm: "hospital", variants: ["clinic", "medical center", "medical centre"] },

  // Body parts / regions
  { canonicalTerm: "stomach", variants: ["tummy", "belly", "abdomen"] },
  { canonicalTerm: "head", variants: ["skull"] },
  { canonicalTerm: "chest", variants: ["ribcage", "rib cage"] },
  { canonicalTerm: "arm", variants: ["forearm", "upper limb"] },
  { canonicalTerm: "leg", variants: ["lower limb"] },
  { canonicalTerm: "buttocks", variants: ["backside"] },
  { canonicalTerm: "genitals", variants: ["private parts", "privates"] },
  { canonicalTerm: "eye", variants: ["eyeball"] },
  { canonicalTerm: "ear", variants: ["eardrum"] },
  { canonicalTerm: "nose", variants: ["nostril", "nostrils"] },
  { canonicalTerm: "mouth", variants: ["oral cavity"] },
  { canonicalTerm: "tooth", variants: ["teeth"] },

  // Common symptom words. Generic single-word terms are deliberately
  // excluded here even when they'd seem useful, for two related reasons
  // confirmed during Phase 0 authoring (see
  // docs/semantic-matching-enhancement-plan-2026.md changelog): (1) nearly
  // every protocol's authored keywords already contain common symptom words
  // directly, so synonym-izing them only amplifies the pre-existing
  // short-word noise-floor problem rather than fixing anything; (2) this
  // content set deliberately has *many* protocols covering the same generic
  // symptom from different angles (six separate Swelling protocols by body
  // part, three separate Itching protocols, two separate Dizziness
  // protocols), so a single-word group like "swelling" or "itching"
  // attaches unevenly across all of them and can tip an already-close
  // scoring race toward whichever one happens to repeat that word most in
  // its own keyword bank - confirmed via a real A/B regression test
  // (hay-fever->eye-allergy, hand-injury->hand-swelling both flipped this
  // way). "swelling", "itching", "fainting", and "dizziness" were removed
  // for exactly this reason; the remaining entries below are multi-word
  // phrases or specific-enough single words that don't have this problem.
  { canonicalTerm: "vomiting", variants: ["throwing up", "throw up", "being sick", "puking"] },
  { canonicalTerm: "diarrhea", variants: ["diarrhoea", "loose stools", "runny stool"] },
  { canonicalTerm: "constipation", variants: ["backed up", "cant poop"] },
  { canonicalTerm: "fever", variants: ["high temperature", "running a temperature"] },
  { canonicalTerm: "bruise", variants: ["black and blue mark", "bruising"] },
  { canonicalTerm: "bleeding", variants: ["blood loss"] },
  { canonicalTerm: "shortness of breath", variants: ["cant catch my breath", "breathless", "breathlessness", "out of breath"] },
  { canonicalTerm: "wheezing", variants: ["whistling breath"] },
  { canonicalTerm: "sore throat", variants: ["scratchy throat"] },
  { canonicalTerm: "congestion", variants: ["stuffy nose", "blocked nose", "stuffed up"] },
  { canonicalTerm: "runny nose", variants: ["nose is running"] },
  { canonicalTerm: "chills", variants: ["shivering", "shivers"] },
  { canonicalTerm: "sweating", variants: ["perspiring", "perspiration"] },
  { canonicalTerm: "fatigue", variants: ["tiredness", "exhaustion", "worn out", "wiped out"] },
  { canonicalTerm: "weakness", variants: ["feeling weak", "no strength"] },
  { canonicalTerm: "numbness", variants: ["no feeling", "pins and needles"] },
  { canonicalTerm: "confusion", variants: ["disoriented", "not making sense"] },
  { canonicalTerm: "seizure", variants: ["convulsion"] },
  { canonicalTerm: "palpitations", variants: ["heart racing", "heart pounding", "heart fluttering"] },
  { canonicalTerm: "headache", variants: ["head pain"] },
  { canonicalTerm: "insomnia", variants: ["cant sleep", "trouble sleeping"] },
  { canonicalTerm: "anxiety", variants: ["anxious", "panicky"] },

  // Common conditions / abbreviations
  { canonicalTerm: "heart attack", variants: ["myocardial infarction"] },
  { canonicalTerm: "stroke", variants: ["brain attack"] },
  { canonicalTerm: "high blood pressure", variants: ["hypertension"] },
  { canonicalTerm: "low blood pressure", variants: ["hypotension"] },
  { canonicalTerm: "urinary tract infection", variants: ["bladder infection"] },
  { canonicalTerm: "sexually transmitted infection", variants: ["sexually transmitted disease"] },
  { canonicalTerm: "diabetes", variants: ["blood sugar problems", "high blood sugar", "low blood sugar"] },
  { canonicalTerm: "asthma", variants: ["reactive airway"] },
  { canonicalTerm: "flu", variants: ["influenza"] },
  { canonicalTerm: "common cold", variants: ["head cold"] },

  // Named conditions with a genuine, distinct lay term - added in a
  // second pass after auditing which of the 228 protocols had zero
  // synonym coverage (see docs/semantic-matching-enhancement-plan-2026.md,
  // Phase 0 changelog). Deliberately skips: (a) protocols whose title
  // already *is* the plain-English term (Fever, Hives-as-a-word-itself,
  // Ankle/Elbow/Finger/Foot/Hip/Face Pain - there's no separate lay
  // version to map those to), and (b) the sensitive topics Suicide
  // Concerns, Domestic Violence, and Sexual Assault or Rape, where no
  // generic-word expansion was added on purpose.
  { canonicalTerm: "anaphylaxis", variants: ["severe allergic reaction", "anaphylactic shock"] },
  { canonicalTerm: "cyanosis", variants: ["turning blue", "lips are blue"] },
  { canonicalTerm: "hair loss", variants: ["alopecia", "balding", "thinning hair"] },
  { canonicalTerm: "hallucinations", variants: ["seeing things that arent there", "hearing voices"] },
  { canonicalTerm: "coma", variants: ["unresponsive", "wont wake up"] },
  { canonicalTerm: "acne", variants: ["pimples", "breakouts"] },
  { canonicalTerm: "hiccups", variants: ["hiccupping"] },
  { canonicalTerm: "emergency contraception", variants: ["morning after pill", "plan b pill"] },
  { canonicalTerm: "hoarseness", variants: ["hoarse voice", "losing my voice"] },
  { canonicalTerm: "missed period", variants: ["late period"] },
  { canonicalTerm: "motion sickness", variants: ["carsick", "seasick"] },
  { canonicalTerm: "pinworms", variants: ["threadworms"] },
  { canonicalTerm: "scrapes", variants: ["abrasion", "road rash"] },
  { canonicalTerm: "ringworm", variants: ["fungal skin infection", "tinea"] },
  { canonicalTerm: "fingernail infection", variants: ["paronychia", "infected nail"] },
  { canonicalTerm: "opioid", variants: ["narcotic", "painkiller addiction"] },
  { canonicalTerm: "hives", variants: ["urticaria", "welts"] },
  { canonicalTerm: "drowning", variants: ["near drowning"] },
  { canonicalTerm: "groin strain", variants: ["groin pull"] },
  { canonicalTerm: "iud", variants: ["coil", "copper coil"] },
  { canonicalTerm: "bed bug bite", variants: ["bedbug bite"] },
  { canonicalTerm: "fire ant sting", variants: ["fire ant bite"] },
  { canonicalTerm: "meningitis", variants: ["exposed to meningitis"] }
];

export function normalizeForLookup(value: string): string {
  return value.toLowerCase().trim();
}

/** Builds a lookup index from every variant/canonical term string to its full synonym group. */
const TERM_INDEX: Map<string, SynonymGroup> = new Map();
for (const group of SYNONYM_GROUPS) {
  TERM_INDEX.set(normalizeForLookup(group.canonicalTerm), group);
  for (const variant of group.variants) {
    TERM_INDEX.set(normalizeForLookup(variant), group);
  }
}

function protocolSearchableText(protocol: ProtocolInput): string {
  const keywordPhrases = (protocol.keywords ?? []).map((keyword) => keyword.phrase);
  const questionKeywords = (protocol.questions ?? []).flatMap((question) => question.keywords ?? []);
  return [protocol.titleEn, protocol.clinicalDefinitionEn ?? "", ...keywordPhrases, ...questionKeywords]
    .join(" ")
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word/whole-phrase containment check (word-boundary aware), unlike
 * plain `String.includes()`. This matters specifically for attachment:
 * confirmed via a real regression during Phase 0 authoring that plain
 * substring matching attached the "nose" body-part group to the
 * Breath-Holding Spell protocol, because its own authored keyword
 * "previously diagnosed breath holding spell" contains "diagnosed", which
 * itself contains "nose" as a substring (dia-gnose-d). Word-boundary
 * matching prevents this whole class of false attachment.
 */
export function containsWholeTerm(haystack: string, term: string): boolean {
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?:$|[^a-z0-9])`, "i");
  return pattern.test(` ${haystack} `);
}

/**
 * Scans a protocol's title/definition/keywords for any term in
 * `SYNONYM_GROUPS`, and attaches every other term in that group as a
 * `ClinicalContentSynonym` pair - so a caller phrase using any lay or
 * clinical variant scores via `scoreProtocol()`'s new synonym-matching path
 * (see src/services/clinicalContent.ts), without needing that exact variant
 * hand-authored into the protocol's own `keywords[]`.
 *
 * Non-destructive: existing `synonyms` entries authored on the protocol are
 * preserved; this only appends additional entries, de-duplicated.
 */
export function attachDictionarySynonyms(protocol: ProtocolInput): ProtocolInput {
  const searchableText = protocolSearchableText(protocol);
  const matchedGroups = new Set<SynonymGroup>();

  for (const [term, group] of TERM_INDEX) {
    if (containsWholeTerm(searchableText, term)) {
      matchedGroups.add(group);
    }
  }

  if (matchedGroups.size === 0) {
    return protocol;
  }

  const existingSynonyms = protocol.synonyms ?? [];
  const seen = new Set(existingSynonyms.map((entry) => `${entry.canonicalTerm}::${entry.synonym}`));
  const additions: ProtocolInput["synonyms"] = [];

  // If a variant phrase is already a literal authored keyword on this
  // protocol, adding it again as a synonym is pure redundancy that can only
  // add risk, not value: it gets scored a second time by the same
  // short-word partial-credit path already applied to `keywords[]`,
  // silently doubling that contribution. Confirmed via a real regression
  // during Phase 0 authoring where the "palpitations" group's variants
  // ("heart racing", "heart pounding", "heart fluttering") were already
  // literal keywords on Heart Rate and Heartbeat Questions, and re-scoring
  // them as synonyms doubled a pre-existing short-word noise contribution
  // enough to flip a close match away from the correct protocol.
  //
  // The same problem can occur via the *canonical* term itself, not just a
  // variant: `scoreProtocol()` scores each unique canonical phrase for a
  // protocol once regardless of how many variant rows share it, so if the
  // canonical term is itself already a literal keyword (e.g. "groin
  // strain" was already an authored keyword on Groin Injury and Strain,
  // and the "groin strain" synonym group's canonical term is the identical
  // string), attaching *any* entry from that group re-scores that already-
  // authored keyword a second time. When the canonical term duplicates an
  // existing keyword, skip the whole group for this protocol rather than
  // trying to suppress just the canonical-phrase scoring (the schema
  // doesn't support scoring variants without also carrying their shared
  // canonical term).
  const existingKeywordPhrases = new Set(
    (protocol.keywords ?? []).map((keyword) => normalizeForLookup(keyword.phrase))
  );

  for (const group of matchedGroups) {
    if (existingKeywordPhrases.has(normalizeForLookup(group.canonicalTerm))) {
      continue;
    }
    for (const variant of group.variants) {
      const key = `${group.canonicalTerm}::${variant}`;
      if (seen.has(key) || existingKeywordPhrases.has(normalizeForLookup(variant))) {
        continue;
      }
      seen.add(key);
      additions.push({ canonicalTerm: group.canonicalTerm, synonym: variant });
    }
  }

  if (additions.length === 0) {
    return protocol;
  }

  return {
    ...protocol,
    synonyms: [...existingSynonyms, ...additions]
  };
}

/** Applies `attachDictionarySynonyms` across an entire protocol list. */
export function attachDictionarySynonymsToAll(protocols: ProtocolInput[]): ProtocolInput[] {
  return protocols.map(attachDictionarySynonyms);
}
