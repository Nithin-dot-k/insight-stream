# InsightStream

## Project Overview

InsightStream is a multi-tenant AI-powered knowledge assistant designed for enterprise document discovery and retrieval. The application allows organizations to upload PDF documents, extract their content, generate vector embeddings, and query that information using natural language. The system is built around a Retrieval-Augmented Generation (RAG) workflow to provide grounded, context-aware answers from an organization’s private knowledge base.

The project demonstrates a practical implementation of an internal enterprise knowledge system with authentication, tenant isolation, vector retrieval, document ingestion, and AI-based answer generation.

---

## Purpose

The application is intended to support internal business use cases such as:

- organizational knowledge search
- PDF-based information retrieval
- AI-powered Q&A over internal documents
- team-ready knowledge-base workflows within a secure workspace boundary

The system is designed to help users find relevant information quickly while keeping retrieval grounded in uploaded, organization-specific content.

---

## Solution Architecture

The system follows a component-based architecture leveraging modern web and AI infrastructure.

### Core Components

- Frontend: Next.js application with App Router
- Authentication: Clerk with organization-aware access control
- Backend APIs: Next.js route handlers
- Database: Supabase PostgreSQL with pgvector extension
- Embeddings: Cohere embedding API
- LLM Service: Groq chat completion API
- Document Parsing: pdf-parse-fork

### Retrieval Pipeline

1. A user submits a question to the application.
2. The question is converted into an embedding using Cohere.
3. Similarity search is performed against the organization’s document chunks in Supabase.
4. Relevant chunks are retrieved and passed to the LLM as contextual input.
5. The model responds based only on the retrieved document context.

This creates a grounded answer flow intended to reduce unsupported or hallucinated responses.

---

## Key Functional Features

### Multi-Tenant Organization Isolation

Each document chunk is stored with an organization identifier. All retrieval operations are scoped to the active Clerk organization to ensure that tenant data is separated and isolated from other organizations.

### Document Ingestion and Embedding

Admins can upload PDF files, extract text, split it into chunks, generate embeddings, and store them in the vector database for semantic search.

### Knowledge Retrieval

Users can ask natural-language questions and receive answers based on relevant document context retrieved by similarity search.

### Admin Controls

Administrators can:

- upload documents for the organization
- list currently indexed files
- delete individual files from memory
- purge the organization’s knowledge base

### Session Safety

The client-side application clears chat state when the active user or organization changes, reducing the risk of stale conversational data persisting across session boundaries.

---

## Technical Stack

- Next.js 16
- React 19
- Tailwind CSS
- Clerk Authentication
- Supabase PostgreSQL
- pgvector
- Cohere Embed API
- Groq LLM API
- Node.js runtime

---

## Repository Structure

```text
insight-stream/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   ├── delete-file/
│   │   ├── documents/
│   │   ├── ingest/
│   │   └── purge/
│   ├── globals.css
│   ├── layout.js
│   └── page.js
├── components/
│   └── enterprise-chat/
│       └── EnterpriseChat.jsx
├── lib/
│   ├── services/
│   │   ├── documents.js
│   │   └── rag.js
│   └── supabase.js
├── public/
├── .env.local
├── .gitignore
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
├── proxy.js
├── README.md
├── package-lock.json
└── .next/
```

---

## System Requirements

The following dependencies and services are required to run the project locally:

- Node.js 18 or newer
- npm
- Clerk account and project
- Supabase project with pgvector enabled
- Cohere API key
- Groq API key

---

## Environment Configuration

Create a .env.local file in the project root with the following variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
```

These values are required for authentication, vector storage, retrieval, and LLM-based responses.

---

## Database Setup

The project depends on a Supabase database with pgvector support enabled. The following schema is required:

```sql
create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  org_id text not null default 'default_org',
  content text not null,
  filename text,
  embedding vector(1024)
);

create or replace function match_documents (
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_org_id text
)
returns table (id bigint, content text, similarity float)
language plpgsql as $$
begin
  return query
  select
    documents.id,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.org_id = filter_org_id
    and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

## Local Development

### Install dependencies

```bash
npm install
```

### Run the application

```bash
npm run dev
```

### Access the app

```text
http://localhost:3000
```

---

## Application Workflow

### Document Ingestion Flow

- An administrator uploads a PDF through the application UI.
- The system extracts raw text from the PDF.
- The text is broken into chunks for manageable indexing.
- Each chunk is encoded into an embedding using Cohere.
- The embedded chunks are persisted in Supabase with org metadata and filename information.

### Query Flow

- A user enters a prompt into the chat interface.
- The question is embedded and compared to indexed vectors.
- The system retrieves the most relevant chunks within the organization boundary.
- These chunks are sent to the LLM as context.
- The model generates a response using only the retrieved content as guidance.

---

## Security and Design Considerations

The project includes several important design elements for enterprise-style handling of knowledge data:

- organization-scoped document access
- admin-only document management routes
- no cross-tenant retrieval in the core query flow
- session reset logic when organization or user context changes

For production deployment, additional controls should be considered, including:

- row-level security policies in Supabase
- rate limiting on ingestion and query APIs
- structured logging and monitoring
- centralized secret management
- validation and request sanitization
- content safety and abuse protections

---

## Current Status

This repository represents a functional prototype and early-stage implementation of an AI-powered enterprise document assistant. It is built to demonstrate the core mechanics of knowledge retrieval and AI grounding, and it is structured in a way that can serve as a foundation for a larger production product.

---

## Suggested Improvements

Recommended next steps include:

- unit and integration tests for API and retrieval layers
- validation middleware for request schemas
- support for more file formats beyond PDF
- metadata tracking for documents and chunk provenance
- improved observability and error monitoring
- production deployment automation with CI/CD
- role-based permissions beyond admin-only document actions
- audit trails for document management operations

---

## License

This project does not currently include a license file. If the project is intended for public or shared usage, it is recommended to adopt an open-source license such as MIT or Apache 2.0.

---

## Conclusion

InsightStream demonstrates a practical implementation of an enterprise document intelligence workflow using modern web engineering and AI services. The project combines auth, vector search, document ingestion, and generative AI into a cohesive knowledge assistant architecture suitable for internal enterprise use cases and further extension into a production-grade product.

```

```
