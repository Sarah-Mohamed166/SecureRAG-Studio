import type { AIProvider, GenerateAnswerInput, GeneratedAnswer } from "./provider";
import { buildGroundedPrompt } from "./prompt-builder";
import { getConfig } from "@/lib/securerag/config";
import {
  ConfigurationError,
  ProviderError,
  ProviderTimeoutError,
  InvalidProviderResponseError,
} from "@/lib/securerag/errors";
import { logger } from "@/lib/securerag/logger";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}

/**
 * Parses and validates the model's raw text output, which should be a
 * single JSON object per the contract in prompt-builder.ts.
 */
function parseModelOutput(rawText: string): GeneratedAnswer {
  // Strip accidental markdown code fences, just in case the model adds them.
  const cleaned = rawText.trim().replace(/^```json\s*|^```\s*|```$/g, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new InvalidProviderResponseError(
      "The AI provider response was not valid JSON.",
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { answer?: unknown }).answer !== "string" ||
    !Array.isArray((parsed as { usedEvidenceIndexes?: unknown }).usedEvidenceIndexes)
  ) {
    throw new InvalidProviderResponseError(
      "The AI provider response did not match the expected shape.",
    );
  }

  const usedEvidenceIndexes = (parsed as { usedEvidenceIndexes: unknown[] })
    .usedEvidenceIndexes.filter((value): value is number => typeof value === "number");

  return {
    answer: (parsed as { answer: string }).answer,
    usedEvidenceIndexes,
  };
}

export class GeminiProvider implements AIProvider {
  async generateAnswer(input: GenerateAnswerInput): Promise<GeneratedAnswer> {
    if (!input.question.trim()) {
      throw new Error("Question is required.");
    }
    if (input.evidence.length === 0) {
      throw new Error("Evidence is required.");
    }

    const config = getConfig();
    if (!config.geminiApiKey) {
      throw new ConfigurationError("GEMINI_API_KEY is missing.");
    }

    const prompt = buildGroundedPrompt(input);
    const url = `${GEMINI_API_BASE}/${config.geminiModel}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.providerTimeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Header, not a query param -- keeps the key out of any URL that
          // an infra/CDN/proxy layer might log.
          "x-goog-api-key": config.geminiApiKey,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
        }),
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.warn("Gemini request timed out", { model: config.geminiModel });
        throw new ProviderTimeoutError();
      }
      logger.error("Gemini request failed", { model: config.geminiModel });
      throw new ProviderError();
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      logger.error("Gemini returned a non-OK status", {
        statusCode: response.status,
      });
      throw new ProviderError();
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new InvalidProviderResponseError(
        "The AI provider returned no content.",
      );
    }

    return parseModelOutput(rawText);
  }
}
