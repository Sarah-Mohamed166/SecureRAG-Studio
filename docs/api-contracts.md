# SecureRAG Studio API Contracts

These contracts define the shared data structures used by the backend, frontend, retrieval system, and evaluation components.

All team members must follow the same field names and types.

---

## Approved Document Contract

```typescript
interface ApprovedDocument {
  id: string;
  title: string;
  version: string;
  category: string;
  approvalStatus: "pending" | "approved" | "rejected" | "archived";
  uploadedAt: string;
  approvedBy?: string;
  sourceType: "pdf" | "text" | "markdown";
}
```

### Field Notes

| Field | Description |
|---|---|
| `id` | Unique document identifier |
| `title` | Human-readable document title |
| `version` | Document version |
| `category` | Policy or document category |
| `approvalStatus` | Current document approval state |
| `uploadedAt` | ISO 8601 upload timestamp |
| `approvedBy` | Optional approver name or identifier |
| `sourceType` | Original document format |

---

## Query Request Contract

```typescript
interface QueryRequest {
  question: string;
  corpusId: string;
}
```

### Validation Requirements

- `question` must not be empty.
- `question` must be within the allowed length limit.
- `corpusId` must reference an approved corpus.
- Invalid requests must return a structured error response.

---

## Citation Contract

```typescript
interface Citation {
  sourceId: string;
  sourceTitle: string;
  evidenceSnippet: string;
  page?: number;
  chunkId: string;
  relevanceScore: number;
}
```

### Field Notes

| Field | Description |
|---|---|
| `sourceId` | Identifier of the supporting document |
| `sourceTitle` | Title displayed to the user |
| `evidenceSnippet` | Exact supporting text |
| `page` | Optional page number |
| `chunkId` | Identifier of the retrieved chunk |
| `relevanceScore` | Retrieval relevance score |

---

## Query Response Contract

```typescript
interface QueryResponse {
  question: string;
  answer: string;
  citations: Citation[];
  citationCoverage: number;
  retrievalQualityScore: number;
  confidence: "high" | "medium" | "low";
  notFound: boolean;
  safetyFlag: boolean;
  limitation: string | null;
}
```

### Response Rules

- Supported answers must include at least one citation.
- `citationCoverage` must be between `0` and `1`.
- `retrievalQualityScore` must be between `0` and `1`.
- `notFound` must be `true` when sufficient evidence is unavailable.
- `safetyFlag` must be `true` when unsafe or suspicious input is detected.
- `limitation` must explain incomplete, uncertain, or refused answers.

---

## Supported Response Example

```json
{
  "question": "What is the minimum attendance requirement?",
  "answer": "Students must attend at least 75% of scheduled classes.",
  "citations": [
    {
      "sourceId": "attendance-policy-2026",
      "sourceTitle": "University Attendance Policy",
      "evidenceSnippet": "Students are required to attend at least 75% of scheduled classes.",
      "page": 3,
      "chunkId": "attendance-policy-2026-chunk-12",
      "relevanceScore": 0.95
    }
  ],
  "citationCoverage": 1,
  "retrievalQualityScore": 0.95,
  "confidence": "high",
  "notFound": false,
  "safetyFlag": false,
  "limitation": null
}
```

---

## Not-Found Response Example

```json
{
  "question": "What salary will graduates receive?",
  "answer": "",
  "citations": [],
  "citationCoverage": 0,
  "retrievalQualityScore": 0,
  "confidence": "low",
  "notFound": true,
  "safetyFlag": false,
  "limitation": "No supporting evidence was found in the approved corpus."
}
```

---

## Error Response Contract

```typescript
interface ErrorResponse {
  errorCode: string;
  message: string;
  retryable: boolean;
}
```

## Error Response Example

```json
{
  "errorCode": "INVALID_QUERY",
  "message": "The question field is required.",
  "retryable": true
}
```

---

## Standard Error Codes

| Error Code | Meaning |
|---|---|
| `INVALID_QUERY` | Question validation failed |
| `INVALID_CORPUS` | Corpus does not exist or is unavailable |
| `UNAPPROVED_DOCUMENT` | Document is not approved |
| `RETRIEVAL_FAILED` | Retrieval process failed |
| `MODEL_FAILED` | AI provider request failed |
| `INVALID_MODEL_OUTPUT` | Generated output did not match the schema |
| `SAFETY_REJECTION` | Request was blocked for security reasons |
| `INTERNAL_ERROR` | Unexpected server error |

---

## Contract Ownership

- Architecture and contract coordination: Sara
- Backend implementation: Somaya
- Frontend and evaluation integration: Mohab

Any contract change must be reviewed before implementation and communicated to all team members.
