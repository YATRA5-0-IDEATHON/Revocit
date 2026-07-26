# Lawyersathi

AI legal platform with a structured frontend/backend architecture.

## Project structure

- frontend/public: UI files (HTML, CSS, JS)
- backend/src/server.js: Express app entry
- backend/src/routes: API routes
- backend/src/services: RAG and legal tools logic
- backend/src/lib: PostgreSQL, vector store, and embedding utilities
- backend/src/data: bundled legal corpus

## Stack

- Backend: Node.js + Express
- Database: PostgreSQL
- Vector DB: Pinecone or Weaviate (configurable)
- RAG retrieval: vector search with local semantic fallback
- Frontend: Responsive bilingual (English/Nepali) web UI

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and configure credentials:

```bash
copy .env.example .env
```

3. Set database/vector credentials in .env:

- DATABASE_URL for PostgreSQL
- VECTOR_PROVIDER as pinecone or weaviate
- provider-specific keys (PINECONE_* or WEAVIATE_*)

For the bundled legal PDFs, Pinecone is required. Create **two** dense Pinecone
indexes, both with dimension **1024** (the output size of `multilingual-e5-large`):
one for English and one for Nepali. Set:

```
VECTOR_PROVIDER=pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_english=...
PINECONE_INDEX_nepali=...
PINECONE_NAMESPACE=lawyersathi
PINECONE_EMBEDDING_MODEL=multilingual-e5-large
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
```

On startup the service separately reads PDFs in `C:\Users\user\Desktop\english files`
and `C:\Users\user\Desktop\nepali files`, extracts every page, chunks each source
in its original language, and upserts each corpus into its matching index. A Nepali
question only queries the Nepali index; an English question only queries the English
index. Use `POST /api/rag/reindex` after adding or replacing PDFs.

The app queries the existing indexes on startup, so teammates do not need local PDF
copies to chat. On a machine that does have the source folders, set
`AUTO_REINDEX=true` (or call `POST /api/rag/reindex` with `{ "language": "en" }`
or `{ "language": "ne" }`) to update an index.

The chat answer is generated locally with Qwen through Ollama. Install Ollama,
then download the model once on each laptop before starting the app:

```bash
ollama pull qwen3:4b
```

Nepali questions are detected automatically and Qwen answers in Nepali. Chat
retrieval uses the clean English statutory PDFs with deterministic Nepali legal
term expansion because the supplied Nepali PDFs are OCR scans; this avoids
corrupted OCR text being treated as legal authority. English questions search the
English corpus directly. Both paths retrieve a wider candidate set and use
Pinecone's multilingual cross-encoder reranker before generating a
source-grounded answer; a local hybrid reranker is retained only as a fallback.

4. Start the app:

```bash
npm start
```

5. Open:

http://localhost:3000

## API endpoints

- POST /api/rag/query
- POST /api/rag/reindex
- POST /api/draft-case
- POST /api/draft-case
- POST /api/date/convert
- POST /api/format-document
- GET /api/health

## Features

- RAG legal assistant with citations
- Bilingual English/Nepali interface and responses
- Legal search and context retrieval
- Guided Nepali जाहेरी दरखास्त preparation with native-law citations and review safeguards
- Case draft generation workflow
- AD/BS date conversion utility
- Legal text formatting helper
