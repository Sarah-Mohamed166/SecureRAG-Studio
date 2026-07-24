import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AnswerResponse,
    DocumentRegistrationRequest,
    QueryRequest,
)


ANSWER_FIELDS = {
    "question",
    "answer",
    "source_id",
    "source_title",
    "evidence_snippet",
    "relevance_score",
    "citation_coverage",
    "confidence",
    "not_found",
    "safety_flag",
    "limitation",
}


def supported_answer(**overrides) -> AnswerResponse:
    values = {
        "question": "What is the attendance requirement?",
        "answer": "Students must attend at least 75% of classes.",
        "source_id": "attendance-2026",
        "source_title": "Attendance Policy",
        "evidence_snippet": "Students are required to attend at least 75%.",
        "relevance_score": 0.94,
        "citation_coverage": 1.0,
        "confidence": "High",
        "not_found": False,
        "safety_flag": False,
        "limitation": None,
    }
    values.update(overrides)
    return AnswerResponse(**values)


def not_found_answer(**overrides) -> AnswerResponse:
    values = {
        "question": "What salary do graduates receive?",
        "answer": None,
        "source_id": None,
        "source_title": None,
        "evidence_snippet": None,
        "relevance_score": 0.0,
        "citation_coverage": 0.0,
        "confidence": "None",
        "not_found": True,
        "safety_flag": False,
        "limitation": "No supporting evidence exists in the approved corpus.",
    }
    values.update(overrides)
    return AnswerResponse(**values)


def test_document_registration_requires_approved_bounded_source_metadata():
    registration = DocumentRegistrationRequest(
        source_id="attendance-2026",
        source_title=" Attendance Policy ",
        corpus_id="training-handbook",
        approved=True,
    )

    assert registration.source_title == "Attendance Policy"
    assert registration.approved is True

    with pytest.raises(ValidationError):
        DocumentRegistrationRequest(
            source_id="attendance-2026",
            source_title="Attendance Policy",
            corpus_id="training-handbook",
            approved=False,
        )


def test_query_uses_question_and_accepts_legacy_query_alias():
    canonical = QueryRequest(question=" What is the attendance policy? ")
    legacy = QueryRequest(query="What is the attendance policy?")

    assert canonical.question == "What is the attendance policy?"
    assert canonical.query == canonical.question
    assert legacy.question == canonical.question
    assert set(legacy.model_dump()) == {"question"}


def test_contracts_forbid_unknown_fields():
    with pytest.raises(ValidationError):
        QueryRequest(question="A valid question?", corpus_id="other")


def test_supported_answer_has_exact_fields_and_complete_evidence():
    response = supported_answer()
    schema = AnswerResponse.model_json_schema()

    assert set(response.model_dump()) == ANSWER_FIELDS
    assert set(schema["properties"]) == ANSWER_FIELDS
    assert set(schema["required"]) == ANSWER_FIELDS
    assert response.not_found is False
    assert response.source_id == "attendance-2026"


def test_not_found_answer_has_exact_safe_no_answer_shape():
    response = not_found_answer()

    assert set(response.model_dump()) == ANSWER_FIELDS
    assert response.answer is None
    assert response.relevance_score == 0.0
    assert response.citation_coverage == 0.0


@pytest.mark.parametrize(
    "overrides",
    [
        {"answer": None},
        {"source_id": None},
        {"relevance_score": 0.0},
        {"citation_coverage": 0.0},
        {"confidence": "None"},
        {"safety_flag": True},
    ],
)
def test_supported_answer_rejects_incomplete_or_blocked_states(overrides):
    with pytest.raises(ValidationError):
        supported_answer(**overrides)


@pytest.mark.parametrize(
    "overrides",
    [
        {"answer": "An unsupported answer"},
        {"source_id": "unexpected-source"},
        {"relevance_score": 0.1},
        {"citation_coverage": 1.0},
        {"confidence": "Low"},
        {"limitation": None},
    ],
)
def test_not_found_answer_rejects_evidence_scores_or_missing_limitation(overrides):
    with pytest.raises(ValidationError):
        not_found_answer(**overrides)


def test_safety_flag_uses_no_answer_shape():
    response = not_found_answer(
        safety_flag=True,
        limitation="The request was blocked by the safety policy.",
    )

    assert response.safety_flag is True
    assert response.not_found is True
