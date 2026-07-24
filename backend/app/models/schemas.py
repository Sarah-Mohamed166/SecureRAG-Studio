from typing import Literal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    model_validator,
)


class _StrictContract(BaseModel):
    """Shared validation rules for the Session 1 public contracts."""

    model_config = ConfigDict(
        extra="forbid",
        strict=True,
        str_strip_whitespace=True,
    )


# ==========================================
# Session 1 Baseline Contracts
# ==========================================

class DocumentRegistrationRequest(_StrictContract):
    """Metadata required before a document can enter an approved corpus."""

    source_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]*$",
        description="Stable identifier for the source document",
    )
    source_title: str = Field(
        ...,
        min_length=1,
        max_length=300,
        description="Human-readable source title",
    )
    corpus_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]*$",
        description="Bounded corpus that owns the document",
    )
    approved: Literal[True] = Field(
        ...,
        description="Only explicitly approved documents may be registered",
    )


class QueryRequest(_StrictContract):
    """A question submitted against the approved bounded corpus."""

    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        validation_alias=AliasChoices("question", "query"),
        description="User question; the legacy input name 'query' is also accepted",
    )

    @property
    def query(self) -> str:
        """Keep existing route code compatible while `question` is canonical."""

        return self.question


ConfidenceLevel = Literal["High", "Medium", "Low", "None"]


class AnswerResponse(_StrictContract):
    """Exact structured answer contract agreed for Session 1."""

    question: str = Field(..., min_length=1, max_length=1000)
    answer: str | None = Field(..., min_length=1)
    source_id: str | None = Field(..., min_length=1, max_length=128)
    source_title: str | None = Field(..., min_length=1, max_length=300)
    evidence_snippet: str | None = Field(..., min_length=1)
    relevance_score: float = Field(..., ge=0.0, le=1.0)
    citation_coverage: float = Field(..., ge=0.0, le=1.0)
    confidence: ConfidenceLevel
    not_found: StrictBool
    safety_flag: StrictBool
    limitation: str | None = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_answer_state(self):
        """
        Enforce a supported answer or a safe no-answer state.

        `safety_flag=True` means the request was blocked and therefore must use
        the same no-answer shape as any other not-found result.
        """

        evidence_fields = (
            self.answer,
            self.source_id,
            self.source_title,
            self.evidence_snippet,
        )

        if self.not_found:
            if any(value is not None for value in evidence_fields):
                raise ValueError(
                    "not_found responses cannot contain an answer or source evidence"
                )
            if self.relevance_score != 0.0 or self.citation_coverage != 0.0:
                raise ValueError(
                    "not_found responses require zero relevance and citation coverage"
                )
            if self.confidence != "None":
                raise ValueError("not_found responses require confidence='None'")
            if self.limitation is None:
                raise ValueError("not_found responses require a limitation")
            return self

        if self.safety_flag:
            raise ValueError("safety_flag=True requires not_found=True")
        if any(value is None for value in evidence_fields):
            raise ValueError(
                "supported responses require an answer and complete source evidence"
            )
        if self.relevance_score <= 0.0 or self.citation_coverage <= 0.0:
            raise ValueError(
                "supported responses require positive relevance and citation coverage"
            )
        if self.confidence == "None":
            raise ValueError("supported responses require a confidence level")

        return self


# ==========================================
# Retrieval Schemas
# ==========================================

class RetrieveRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User query",
    )


class RetrievedChunk(BaseModel):
    filename: str
    page: int | None = None
    score: float
    text: str


class RetrieveResponse(BaseModel):
    status: Literal["success"]
    results: list[RetrievedChunk]


# ==========================================
# Ingestion Schemas
# ==========================================

class IngestResponse(BaseModel):
    status: Literal["success"]
    filename: str
    documents: int
    chunks: int
    message: str


# ==========================================
# Legacy/Exploratory Query Schemas
# ==========================================

class Citation(BaseModel):
    filename: str
    page: int | None = None
    snippet: str


# Backwards-compatible name for code that imported the earlier response class.
QueryResponse = AnswerResponse


# ==========================================
# Error Schemas
# ==========================================

class ErrorResponse(BaseModel):
    detail: str
