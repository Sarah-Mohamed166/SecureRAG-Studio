import type { Citation } from "./schema";

/**
 * Returns how much of the answer is supported by citations.
 * Score range: 0–100
 */
export function citationCoverage(
  answer: string,
  citations: Citation[]
): number {
  if (!answer.trim()) {
    return 0;
  }

  if (citations.length === 0) {
    return 0;
  }

  return 100;
}

/**
 * Measures retrieval quality.
 * Score range: 0–100
 */
export function retrievalQualityScore(
  expectedSourceIds: string[],
  retrievedSourceIds: string[]
): number {
  if (expectedSourceIds.length === 0) {
    return 0;
  }

  const retrievedSet = new Set(retrievedSourceIds);

  const relevantRetrieved = expectedSourceIds.filter((sourceId) =>
    retrievedSet.has(sourceId)
  ).length;

  return Math.round(
    (relevantRetrieved / expectedSourceIds.length) * 100
  );
}
