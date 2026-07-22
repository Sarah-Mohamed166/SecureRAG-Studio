# SecureRAG Studio Known Limitations

## 1. Small Approved Corpus

The MVP starts with a small number of approved documents.

This means the system can answer only a limited set of questions. Questions outside the approved corpus must return a not-found response.

The corpus may be expanded gradually after documents are reviewed and approved.

---

## 2. Early Retrieval Approach

The first implementation may use basic keyword matching or a simple retrieval strategy.

This approach may:

- Miss semantically related evidence
- Rank some documents incorrectly
- Perform poorly with vague questions
- Require exact or similar wording

Future versions may use embeddings, vector search, hybrid retrieval, reranking, or improved chunking.

---

## 3. AI Provider Dependency

Answer generation depends on an external AI provider.

The system may be affected by:

- Provider downtime
- Network failures
- Rate limits
- API changes
- Response delays
- Provider pricing changes

The application must return safe errors when the provider is unavailable.

---

## 4. Simplified Citation Coverage

For the MVP, citation coverage uses a simplified rule:

- No answer or no citation: `0`
- Answer with at least one valid citation: `100`

This does not measure whether every sentence or claim is supported.

A future version may evaluate citation coverage claim by claim or sentence by sentence.

---

## 5. Limited Evaluation Dataset

The initial evaluation dataset contains a limited number of test cases.

The results may not represent performance across:

- Large corpora
- Different document types
- Multiple languages
- Complex legal or technical documents
- Very long questions
- All prompt-injection techniques

The evaluation dataset should grow over time.

---

## 6. Prompt-Injection Risk

The system includes prompt-injection protections, but no protection method can guarantee that every possible attack will be detected.

New attack patterns may require:

- Additional input rules
- Stronger system prompts
- Output filtering
- Adversarial testing
- Human review

Authorization and approval decisions remain outside the language model.

---

## 7. No Confidential Student Data

The MVP uses sample or non-confidential documents.

It is not currently intended to process:

- Student records
- Passwords
- Financial records
- Medical records
- Government identifiers
- Confidential university data

Additional privacy, encryption, access-control, and compliance work would be required before handling sensitive information.

---

## 8. Human Review Is Still Required

SecureRAG Studio is a decision-support and information-retrieval system.

It should not be treated as a replacement for:

- Official university departments
- Legal advice
- Academic decisions
- Security administrators
- Human approval processes

Important answers should be checked against the cited source document.

---

## 9. Confidence Is an Indicator

The confidence field is an application indicator and not a guarantee that the answer is correct.

Users should examine:

- Exact evidence snippets
- Source titles
- Document versions
- Limitations
- Retrieval scores

---

## 10. Document Quality Affects Answer Quality

Incorrect, outdated, unclear, or incomplete source documents may lead to incomplete answers.

Document approval confirms that a source is allowed to be searched, but it does not automatically guarantee that every statement is complete or current.

---

## 11. Language Support

The initial MVP may perform best with English documents and English questions.

Additional testing is needed for:

- Arabic questions
- Mixed Arabic and English
- Scanned documents
- Poorly formatted text
- Technical abbreviations

---

## 12. Scalability

The MVP is designed for a small controlled corpus.

Performance with thousands of documents has not yet been validated.

Future versions may require:

- A vector database
- Background document processing
- Caching
- Queue-based ingestion
- Monitoring
- Retrieval optimization
