/**
 * Centralized configuration reader.
 *
 * Owner: Monica Nabil (Platform Integration & Deployment)
 *
 * Nothing else in the app should call `process.env` directly -- always go
 * through getConfig() so there is one place that knows the env var names
 * and one place to change defaults.
 */

export interface AppConfig {
  nodeEnv: string;
  geminiApiKey: string | null;
  geminiModel: string;
  providerTimeoutMs: number;
  /** Evidence scoring below this is not trusted enough to send to the model. */
  retrievalScoreThreshold: number;
}

function readPositiveNumber(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }
  return parsedValue;
}

function readUnitInterval(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    return fallback;
  }
  return parsedValue;
}

export function getConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    geminiApiKey: process.env.GEMINI_API_KEY ?? null,
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    providerTimeoutMs: readPositiveNumber(process.env.PROVIDER_TIMEOUT_MS, 15_000),
    retrievalScoreThreshold: readUnitInterval(process.env.RETRIEVAL_SCORE_THRESHOLD, 0.35),
  };
}
