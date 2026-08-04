import { listQueueItems, QueueOrchestrationError } from "./queueOrchestration.js";
import { searchClinicalProtocols } from "./clinicalContent.js";
import type { AuthenticatedSession } from "../types/security.js";
import type { ProtocolSearchResult } from "../types/clinicalContent.js";
import type { QueueItemDto } from "../types/queue.js";

// Closes NFR-007 ("global search feature") - unifies the one real, scored
// search implementation in this repo (searchClinicalProtocols, reused
// unchanged) with a new, similarly-shaped scorer for queue cases, since no
// backend search over the queue existed before this (the Nurse Cockpit's
// "Search cases..." box is confirmed client-side-only, filtering only the
// already-loaded list).

export type QueueSearchResult = QueueItemDto & { score: number; matchedTerms: string[] };

function queryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function countTermHits(haystack: string | undefined, terms: string[]): { hits: number; matched: string[] } {
  if (!haystack) {
    return { hits: 0, matched: [] };
  }
  const lower = haystack.toLowerCase();
  const matched = terms.filter((term) => lower.includes(term));
  return { hits: matched.length, matched };
}

// Mirrors scoreProtocol's real, tested shape (src/services/clinicalContent.ts)
// but scoped to the fields a queue case actually has: istStaffId is the
// strongest signal a nurse can search on (a directly-known identifier), then
// the two narrative fields.
export function scoreQueueCase(item: QueueItemDto, query: string): { score: number; matchedTerms: string[] } {
  const terms = queryTerms(query);
  if (terms.length === 0) {
    return { score: 0, matchedTerms: [] };
  }

  let score = 0;
  const matchedTerms = new Set<string>();

  const staffIdMatch = countTermHits(item.istStaffId, terms);
  score += staffIdMatch.hits * 100;
  staffIdMatch.matched.forEach((term) => matchedTerms.add(term));

  const summaryMatch = countTermHits(item.summary, terms);
  score += summaryMatch.hits * 40;
  summaryMatch.matched.forEach((term) => matchedTerms.add(term));

  const reasonMatch = countTermHits(item.reasonNarrative, terms);
  score += reasonMatch.hits * 40;
  reasonMatch.matched.forEach((term) => matchedTerms.add(term));

  return { score, matchedTerms: [...matchedTerms].slice(0, 5) };
}

export async function searchQueueCases(
  session: AuthenticatedSession,
  query: string,
  limit: number
): Promise<QueueSearchResult[]> {
  // Reuses the existing, already-permission-scoped listQueueItems() - this
  // must never bypass which queue items a given role/session may see. A
  // role with no queue access at all (e.g. Reporting Analyst, Helpdesk
  // Support) gets an empty queue slice rather than the whole global search
  // failing outright - global search stays "always allowed once
  // authenticated" like protocol search, it just has nothing to return for
  // that role's queue slice.
  let items: QueueItemDto[];
  try {
    items = (await listQueueItems(session, {})).items;
  } catch (error) {
    if (error instanceof QueueOrchestrationError && error.statusCode === 403) {
      return [];
    }
    throw error;
  }
  return items
    .map((item) => ({ item, scored: scoreQueueCase(item, query) }))
    .filter(({ scored }) => scored.score > 0)
    .sort((a, b) => b.scored.score - a.scored.score)
    .slice(0, limit)
    .map(({ item, scored }) => ({ ...item, score: scored.score, matchedTerms: scored.matchedTerms }));
}

export async function searchGlobal(
  session: AuthenticatedSession,
  query: string,
  limit: number
): Promise<{ protocols: ProtocolSearchResult[]; queue: QueueSearchResult[] }> {
  const [protocols, queue] = await Promise.all([
    Promise.resolve(searchClinicalProtocols({ q: query, mode: "both", limit })),
    searchQueueCases(session, query, limit)
  ]);
  return { protocols, queue };
}
