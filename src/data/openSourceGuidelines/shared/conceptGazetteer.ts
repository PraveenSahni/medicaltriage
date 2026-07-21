import { containsWholeTerm, normalizeForLookup } from "./synonymDictionary.js";

/**
 * Phase 2 of the semantic-matching plan (see
 * docs/semantic-matching-enhancement-plan-2026.md) - a lightweight, hand-curated
 * "concept gazetteer": lay phrases that don't map cleanly to any single canonical
 * word (so Phase 0's synonym dictionary doesn't fit them) but do correspond to a
 * generic concept word that genuinely appears across many protocols' own authored
 * titles/keywords. Query-side, not protocol-side: at search time, the caller's
 * normalized query is expanded with any matched concept tags (in addition to,
 * never instead of, the original text) - see `expandQueryWithConcepts()` below,
 * wired into `searchClinicalProtocols()` in `src/services/clinicalContent.ts`.
 * `scoreProtocol()` itself is untouched by this phase.
 *
 * This is a modest, curation-quality starter set (about 30 entries), not a
 * best-effort attempt at the plan doc's "~150-300" ceiling - every concept tag
 * below was checked against the actual corpus (`grep`-verified real hits in
 * `titleEn`/keyword `phrase` across all batch files) before being added, rather
 * than guessed. Quality over count, same standard Phase 0's dictionary was held
 * to. Expand this list over time as new lay-phrasing gaps are found during
 * future batches, following the same verify-before-adding process.
 *
 * Safety rule carried over from Phase 0/1 (see their changelog entries): every
 * concept tag is 4+ characters and was confirmed to have real matches in the
 * corpus at that length - short generic tags (e.g. bare "ear"/"eye") were
 * rejected in favor of longer forms ("hearing"/"eyes") specifically because a
 * short tag is a dangerous substring of many unrelated words once it flows
 * into `scoreProtocol()`'s existing (unguarded) keyword-loop substring check.
 */
interface ConceptGazetteerEntry {
  /** A lay phrase or word a caller might use, matched whole-word/whole-phrase against the query. */
  term: string;
  /** The concept tag appended to the query when `term` is matched. 4+ chars, verified present in the corpus. */
  concept: string;
}

const CONCEPT_GAZETTEER: ConceptGazetteerEntry[] = [
  { term: "noggin", concept: "head" },
  { term: "funny bone", concept: "elbow" },
  { term: "waterworks", concept: "urinary" },
  { term: "pee pee", concept: "urination" },
  { term: "peepee", concept: "urination" },
  { term: "wee wee", concept: "urination" },
  { term: "the runs", concept: "diarrhea" },
  { term: "the trots", concept: "diarrhea" },
  { term: "boo boo", concept: "injury" },
  { term: "owie", concept: "injury" },
  { term: "gash", concept: "injury" },
  { term: "chesty cough", concept: "cough" },
  { term: "wheezy chest", concept: "breathing" },
  { term: "struggling to breathe", concept: "breathing" },
  { term: "muffled hearing", concept: "hearing" },
  { term: "cant hear properly", concept: "hearing" },
  { term: "ringing in ears", concept: "hearing" },
  { term: "buzzing in ear", concept: "hearing" },
  { term: "blurry vision", concept: "vision" },
  { term: "cant see properly", concept: "vision" },
  { term: "seeing spots", concept: "vision" },
  { term: "gunky eyes", concept: "eyes" },
  { term: "sticky eyes", concept: "eyes" },
  { term: "eye goop", concept: "eyes" },
  { term: "spots all over", concept: "rash" },
  { term: "blotches", concept: "rash" },
  { term: "itchy skin", concept: "skin" },
  { term: "skin peeling", concept: "skin" },
  { term: "food went down the wrong pipe", concept: "swallowing" },
  { term: "choking on food", concept: "swallowing" },
  { term: "gushing blood", concept: "bleeding" },
  { term: "wont stop bleeding", concept: "bleeding" }
];

/**
 * Expands a caller query with any matched concept tags, appended (not
 * substituted) so the original text is always still scored exactly as before.
 * Returns the original query unchanged if nothing matches or the query is empty.
 */
export function expandQueryWithConcepts(query: string): string {
  const normalizedQuery = normalizeForLookup(query);
  if (!normalizedQuery) {
    return query;
  }

  const matchedConcepts = new Set<string>();
  for (const entry of CONCEPT_GAZETTEER) {
    if (containsWholeTerm(normalizedQuery, entry.term)) {
      matchedConcepts.add(entry.concept);
    }
  }

  if (matchedConcepts.size === 0) {
    return query;
  }

  return `${query} ${[...matchedConcepts].join(" ")}`;
}
