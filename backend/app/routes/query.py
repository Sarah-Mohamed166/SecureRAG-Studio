from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_retriever
from app.models.schemas import (
    QueryRequest,
    RetrieveResponse,
    RetrievedChunk,
)
from app.security.validator import QueryValidator

router = APIRouter(
    prefix="/query",
    tags=["Query"],
)


@router.post(
    "/",
    response_model=RetrieveResponse,
)
async def query(
    request: QueryRequest,
    retriever: Any = Depends(get_retriever),
):

    valid, error = QueryValidator.validate(request.question)

    if not valid:
        raise HTTPException(
            status_code=400,
            detail=error,
        )

    results = retriever.retrieve(request.question)

    return RetrieveResponse(
        status="success",
        results=[
            RetrievedChunk(
                filename=result.filename,
                page=result.page,
                score=result.score,
                text=result.text,
            )
            for result in results
        ],
    )
