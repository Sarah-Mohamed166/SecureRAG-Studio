"""Lazy process-local dependencies for the exploratory backend routes."""

from functools import lru_cache
from typing import Any

from app.config import settings


@lru_cache(maxsize=1)
def get_embedder() -> Any:
    """Load the embedding model only when an endpoint actually needs it."""

    from app.ingestion.embedder import Embedder

    return Embedder(model_name=settings.EMBEDDING_MODEL)


@lru_cache(maxsize=1)
def get_vector_store() -> Any:
    """Construct the Qdrant client only when an endpoint actually needs it."""

    from app.retrieval.vector_store import VectorStore

    return VectorStore(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        collection_name=settings.COLLECTION_NAME,
    )


@lru_cache(maxsize=1)
def get_retriever() -> Any:
    """Share one lazily constructed retriever within the server process."""

    from app.retrieval.retriever import Retriever

    return Retriever(
        vector_store=get_vector_store(),
        embedder=get_embedder(),
    )
