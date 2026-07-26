# CLAUDE.md — Chat with Your Docs (RAG)

> Place this file at the **root of your repo**. Claude Code reads it automatically at the start of every session, so you don't have to re-explain the project. Then paste the short phase prompts from `rag-phase-prompts.txt`.

## Project

A standalone full-stack "Chat with your documents" RAG app. A user uploads documents, the app chunks and embeds them into a vector store, and when the user asks a question the app retrieves the most relevant chunks and has Gemini answer **using only those documents**, with citations. This is a fresh, self-contained project — all document handling is built from scratch here; do not assume any code from other projects.

## Tech stack (all free tiers — do not introduce paid services)

- **Frontend:** Vite + React (JavaScript)
- **Backend:** Node + Express (JavaScript, ES modules)
- **Text extraction (built fresh):** pdfjs-dist (PDF text layer) + tesseract.js (OCR fallback for scanned PDFs) + native read for .txt/.md + mammoth for .docx
- **Embeddings:** Google Gemini `text-embedding-004`
- **LLM:** Google Gemini `gemini-1.5-flash`
- **Vector DB:** Supabase (Postgres + pgvector)
- **Hosting:** Vercel (frontend) + Render (backend)

## Repo structure

```
/frontend   Vite + React app (upload + chat UI)
/backend    Express API (extraction, chunking, embeddings, retrieval, chat)
CLAUDE.md   this file
```

## Architecture

```
Frontend (React) ── REST ──> Backend (Express)
                              INGEST: extract -> chunk (~500 tok, ~50 overlap)
                                      -> embed (Gemini) -> store (Supabase pgvector)
                              QUERY:  embed question -> similarity search
                                      -> grounded prompt -> Gemini -> answer + sources
```

## Data model (Supabase)

Table `documents`: id, source_filename, chunk_index, content (text), embedding (vector, model dimension), created_at. Plus a `match_documents(query_embedding, k)` SQL function returning top-k rows with a similarity score.

## Environment variables

Backend `.env`: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
Frontend `.env`: `VITE_API_URL`
Keep `.env` gitignored; maintain `.env.example` in both apps.

## Conventions & guardrails

- Keep it free — no paid APIs or services.
- Answers must be grounded in retrieved chunks and must show sources; if the context lacks the answer, say "I don't know" instead of guessing.
- Clear loading and error states for every network call.
- Batch Gemini embedding calls with retry/backoff for rate limits.
- Test each phase end-to-end before moving on.

## Build order

Work phases 0–6 in order (see `rag-phase-prompts.txt`); test between each.
