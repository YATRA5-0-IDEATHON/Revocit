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
- POST /api/date/convert
- POST /api/format-document
- GET /api/health

## Features

- RAG legal assistant with citations
- Bilingual English/Nepali interface and responses
- Legal search and context retrieval
- Case draft generation workflow
- AD/BS date conversion utility
- Legal text formatting helper