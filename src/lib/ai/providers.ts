/**
 * AI provider abstraction.
 *
 * Owner: Monica Nabil (Platform Integration & Deployment)
 *
 * Any AI provider (Gemini today, something else later) implements this
 * interface. Nothing outside src/lib/ai should import a concrete provider
 * directly -- always depend on AIProvider.
 */

export interface GenerateAnswerInput {
  question: string;
  evidence: string[];
}

export interface GeneratedAnswer {
  /** The grounded answer, or the literal string "NOT_FOUND". */
  answer: string;
  /** 1-based indexes into `evidence` that the answer actually used
   *  (matches the [Evidence N] numbering in prompt-builder.ts). */
  usedEvidenceIndexes: number[];
}

export interface AIProvider {
  generateAnswer(input: GenerateAnswerInput): Promise<GeneratedAnswer>;
}

