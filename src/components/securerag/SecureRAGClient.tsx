"use client";

import { useState } from "react";

import AnswerEvidence from "./AnswerEvidence";
import CorpusPanel from "./CorpusPanel";
import QuestionForm from "./QuestionForm";
import RetrievalDiagnostics from "./RetrievalDiagnostics";
import type {
  CorpusSummary,
  DocumentsResponse,
  ErrorResponse,
  HealthResponse,
  LoadDocumentsResponse,
  QueryResponse,
} from "@/lib/securerag/schema";
import { QUESTION_MAX_LENGTH, QUESTION_MIN_LENGTH } from "@/lib/securerag/schema";

/**
 * SecureRAG client container: owns all UI state and talks to the real API.
 * Owner: Mohab Ahmed (Product UI & Security)
 *
 * There is no mock data here. Every value shown comes from
 * /api/securerag/documents, /api/securerag/query or /api/securerag/health.
 */

type RequestState = "idle" | "loading" | "success" | "error";

export interface SecureRAGClientProps {
  /** Corpus list rendered by the server component on first paint. */
  initialCorpora: CorpusSummary[];
  /** Platform health snapshot taken on the server, or null if unavailable. */
  initialHealth: HealthResponse | null;
  /** Overridable for tests; defaults to same-origin relative paths. */
  apiBasePath?: string;
}

interface ErrorState {
  message: string;
  code: string;
  retryable: boolean;
  requestId?: string;
}

function isErrorResponse(body: unknown): body is ErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as ErrorResponse).errorCode === "string" &&
    typeof (body as ErrorResponse).message === "string"
  );
}

export default function SecureRAGClient({
  initialCorpora,
  initialHealth,
  apiBasePath = "/api/securerag",
}: SecureRAGClientProps) {
  // The corpus list and health snapshot are rendered on the server, so the
  // client needs no data-loading effect at all: every later state change is
  // driven by a user action.
  const [corpora, setCorpora] = useState<CorpusSummary[]>(initialCorpora);
  const [corpusId, setCorpusId] = useState(initialCorpora[0]?.corpusId ?? "");
  const [reloading, setReloading] = useState(false);
  const [reloadMessage, setReloadMessage] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [queryState, setQueryState] = useState<RequestState>("idle");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const health = initialHealth;

  async function refreshCorpora() {
    try {
      const response = await fetch(`${apiBasePath}/documents`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok || isErrorResponse(body)) {
        return;
      }
      setCorpora((body as DocumentsResponse).corpora);
    } catch {
      // A failed refresh leaves the server-rendered list in place; the
      // reload message below already tells the user what happened.
    }
  }

  async function reloadDocuments() {
    if (!corpusId) {
      return;
    }
    setReloading(true);
    setReloadMessage(null);
    try {
      const response = await fetch(`${apiBasePath}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corpusId }),
      });
      const body: unknown = await response.json();
      if (!response.ok || isErrorResponse(body)) {
        setReloadMessage(
          isErrorResponse(body) ? body.message : "The documents could not be loaded.",
        );
        return;
      }
      const loaded = body as LoadDocumentsResponse;
      setReloadMessage(
        `Indexed ${loaded.approvedDocumentCount} approved documents into ${loaded.chunkCount} searchable chunks.`,
      );
      await refreshCorpora();
    } catch {
      setReloadMessage("The documents could not be loaded.");
    } finally {
      setReloading(false);
    }
  }

  async function submitQuestion() {
    const trimmed = question.trim();

    if (trimmed.length === 0) {
      setValidationMessage("Please enter a question before submitting.");
      return;
    }
    if (trimmed.length < QUESTION_MIN_LENGTH) {
      setValidationMessage(`The question must contain at least ${QUESTION_MIN_LENGTH} characters.`);
      return;
    }
    if (trimmed.length > QUESTION_MAX_LENGTH) {
      setValidationMessage(`The question must not exceed ${QUESTION_MAX_LENGTH} characters.`);
      return;
    }
    if (!corpusId) {
      setValidationMessage("Please select an approved corpus.");
      return;
    }

    setValidationMessage(null);
    setError(null);
    setResult(null);
    setQueryState("loading");

    try {
      const response = await fetch(`${apiBasePath}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, corpusId }),
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        setQueryState("error");
        setError({
          message: isErrorResponse(body)
            ? body.message
            : "The request could not be completed. Please try again.",
          code: isErrorResponse(body) ? body.errorCode : "INTERNAL_ERROR",
          retryable: isErrorResponse(body) ? body.retryable : true,
          ...(isErrorResponse(body) ? { requestId: body.requestId } : {}),
        });
        return;
      }

      setResult(body as QueryResponse);
      setQueryState("success");
    } catch {
      setQueryState("error");
      setError({
        message: "The application could not reach the SecureRAG API. Please try again.",
        code: "INTERNAL_ERROR",
        retryable: true,
      });
    }
  }

  const selectedCorpus = corpora.find((corpus) => corpus.corpusId === corpusId) ?? null;
  const loading = queryState === "loading";

  return (
    <div className="layout">
      <div>
        {health && health.status !== "healthy" ? (
          <div className="alert warning" data-testid="health-banner">
            <h2>Platform degraded</h2>
            <p>
              {health.checks.providerConfigured
                ? "Some platform checks are failing."
                : "The AI provider is not configured. Questions will fail safely until the server environment is completed."}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="alert danger" role="alert" data-testid="error-banner">
            <h2>
              {error.code === "MODEL_FAILED" || error.code === "INVALID_MODEL_OUTPUT"
                ? "AI provider error"
                : error.code === "CONFIGURATION_ERROR"
                  ? "Configuration problem"
                  : "Something went wrong"}
            </h2>
            <p>{error.message}</p>
            {error.requestId ? <p className="muted">Request ID: {error.requestId}</p> : null}
          </div>
        ) : null}

        <QuestionForm
          question={question}
          corpusId={corpusId}
          corpora={corpora}
          loading={loading}
          validationMessage={validationMessage}
          onQuestionChange={setQuestion}
          onCorpusChange={setCorpusId}
          onSubmit={() => void submitQuestion()}
        />

        <AnswerEvidence result={result} loading={loading} />
      </div>

      <aside>
        <CorpusPanel
          corpus={selectedCorpus}
          loading={false}
          onReload={() => void reloadDocuments()}
          reloading={reloading}
          reloadMessage={reloadMessage}
        />
        <RetrievalDiagnostics result={result} />
      </aside>
    </div>
  );
}
