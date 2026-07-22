import type { AIProvider } from "@/lib/ai/providers";
import { logger, hashForLogging } from "@/lib/securerag/logger";
import { getConfig } from "@/lib/securerag/config";

/**
 * Orchestration service: retrieval -> AI provider -> validated response.
 *
 * Owner: Monica Nabil (Platform Integration & Deployment)
 *
 * ⚠️ INTEGRATION POINT ⚠️
 * `RetrievedChunk` and `retrieveEvidence` below are LOCAL STUBS standing in
 * for Somaya's real retrieval module (src/lib/securerag/retrieval.ts) and
 * shared schema (src/lib/securerag/schema.ts), which are still empty
 * placeholders in the repo as of this writing.
 *
 * TODO once Somaya's work lands:
 *   1. Delete the two stub declarations below.
 *   2. Replace with:
 *        import { retrieveEvidence } from "@/lib/securerag/retrieval";
 *        import type { RetrievedChunk } from "@/lib/securerag/schema";
 *   3. Confirm the real `retrieveEvidence` signature matches
 *      `(question: string, corpusId: string) => Promise<RetrievedChunk[]>`.
 *      If Somaya's actual signature differs, update the call in
 *      `answerQuestion` below -- do not change her module to fit this one.
 */
export interface RetrievedChunk {
  sourceId: string;
  title: string;
  text: string;
  score: number;
}

async function retrieveEvidence(
  _question: string,
  _corpusId: string,
): Promise<RetrievedChunk[]> {
  throw new Error(
    "retrieveEvidence is a placeholder. Wire in Somaya's real retrieval module.",
  );
}
// ⚠️ END INTEGRATION POINT ⚠️

export interface AnswerQuestionInput {
  question: string;
  corpusId: string;
  requestId: string;
}

export interface AnswerQuestionResult {
  answer: string;
  notFound: boolean;
  citations: Array<{ sourceId: string; title: string }>;
  evidence: string[];
  requestId: string;
}

export async function answerQuestion(
  provider: AIProvider,
  input: AnswerQuestionInput,
): Promise<AnswerQuestionResult> {
  const { question, corpusId, requestId } = input;
  const { retrievalScoreThreshold } = getConfig();

  const chunks = await retrieveEvidence(question, corpusId);
  const trustedChunks = chunks.filter((chunk) => chunk.score >= retrievalScoreThreshold);

  logger.info("Retrieval completed", {
    requestId,
    questionHash: hashForLogging(question),
    corpusId,
    chunkCount: chunks.length,
    trustedChunkCount: trustedChunks.length,
  });

  if (trustedChunks.length === 0) {
    return {
      answer: "",
      notFound: true,
      citations: [],
      evidence: [],
      requestId,
    };
  }

  const generated = await provider.generateAnswer({
    question,
    evidence: trustedChunks.map((chunk) => chunk.text),
  });

  const isNotFound =
    generated.answer.trim().toUpperCase() === "NOT_FOUND" ||
    generated.usedEvidenceIndexes.length === 0;

  if (isNotFound) {
    return {
      answer: "",
      notFound: true,
      citations: [],
      evidence: [],
      requestId,
    };
  }

  const usedChunks = generated.usedEvidenceIndexes
    .map((index) => trustedChunks[index - 1])
    .filter((chunk): chunk is RetrievedChunk => Boolean(chunk));

  return {
    answer: generated.answer,
    notFound: false,
    citations: usedChunks.map((chunk) => ({
      sourceId: chunk.sourceId,
      title: chunk.title,
    })),
    evidence: usedChunks.map((chunk) => chunk.text),
    requestId,
  };
}
