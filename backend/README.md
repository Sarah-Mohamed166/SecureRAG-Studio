# SecureRAG Studio Backend

Session 1 defines the baseline request trace, strict document/query/answer
contracts, and safe bounded-corpus assumptions. See
[Session 1 contracts](docs/session1-contracts.md).

The ingestion and retrieval modules currently in this folder are exploratory
work for later sessions. Session 1 does not claim that grounded generation,
authorization, citation validation, or retrieval-quality scoring is complete.

## Verify Session 1

Run from this `backend` directory:

```powershell
python -B -m pytest -p no:cacheprovider tests/test_contracts.py tests/test_health.py
python -B -c "from app.main import app; print(app.title)"
```

All Session 1 tests are isolated from the embedding model, Qdrant, and the
network.

## Run the lightweight API shell

After installing `backend/requirements.txt` into a fresh local environment:

```powershell
python -m uvicorn app.main:app --reload
```

The root and `/health` endpoints do not load the embedding model or connect to
Qdrant. Calling the exploratory ingestion/retrieval routes still requires their
later-session services.
