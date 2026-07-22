/**
 * Typed platform errors.
 *
 * Owner: Monica Nabil (Platform Integration & Deployment)
 *
 * API routes should catch SecureRAGError and use `.statusCode` and
 * `.code` to build a safe response. Never forward `.message` from a raw
 * provider/network error straight to the client -- wrap it here first.
 */

export type SecureRAGErrorCode =
  | "CONFIGURATION_ERROR"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT"
  | "INVALID_PROVIDER_RESPONSE";

export class SecureRAGError extends Error {
  constructor(
    public readonly code: SecureRAGErrorCode,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "SecureRAGError";
  }
}

export class ConfigurationError extends SecureRAGError {
  constructor(message = "The application is not configured correctly.") {
    super("CONFIGURATION_ERROR", message, 503);
    this.name = "ConfigurationError";
  }
}

export class ProviderError extends SecureRAGError {
  constructor(message = "The AI provider could not complete the request.") {
    super("PROVIDER_ERROR", message, 502);
    this.name = "ProviderError";
  }
}

export class ProviderTimeoutError extends SecureRAGError {
  constructor(message = "The AI provider request timed out.") {
    super("PROVIDER_TIMEOUT", message, 504);
    this.name = "ProviderTimeoutError";
  }
}

export class InvalidProviderResponseError extends SecureRAGError {
  constructor(message = "The AI provider returned an invalid response.") {
    super("INVALID_PROVIDER_RESPONSE", message, 502);
    this.name = "InvalidProviderResponseError";
  }
}
