# Architecture Overview

This document explains the system architecture of InsightStream and the runtime flow of the application.

## 1. System overview

InsightStream is a document intelligence application built for private organizational knowledge search. It allows authenticated users to upload PDFs, embed their content, and ask natural-language questions against the stored knowledge base.

The architecture combines:

- a web frontend
- AI embedding generation
- a vector database
- LLM-based answer generation
- tenant-aware access control

---

## 2. Main runtime components

### Frontend

The frontend is a Next.js application that renders the interface and interacts with backend APIs.

Responsibilities:

- user login and organization selection
- chat interface
- document upload UI
- listing indexed files
- admin controls for document deletion and purge

### API layer

The application exposes route handlers under `app/api/`.

These endpoints are the server-side integration points used by the frontend.

Responsibilities:

- validate user access
- read input payloads or URL parameters
- call service logic
- return structured JSON responses

### Service layer

The `lib/services/` layer holds the business logic that connects the app to external systems.

Responsibilities:

- generate embeddings
- retrieve matching context
- store ingested PDFs
- delete or purge docs

### Database layer

Supabase is used as the primary data layer.

Responsibilities:

- store document chunks and metadata
- run vector similarity search
- keep document records scoped by organization

### AI layer

The AI layer is composed of:

- Cohere embeddings API for semantic indexing
- Groq chat completions API for answer generation

These services power the knowledge search and Q&A portion of the app.

---

## 3. Request flow

### A. PDF ingestion

1. Admin uploads a PDF file from the frontend.
2. The frontend sends a `POST` request to `/api/ingest`.
3. The route validates that the user has an org and admin role.
4. The file is parsed and converted to text.
5. The text is split into chunks.
6. Cohere generates embeddings for each chunk.
7. The vector data, text, org_id, and filename are stored in Supabase.

### B. Query flow

1. The user sends a prompt from the chat UI.
2. The frontend calls `/api/chat`.
3. The route authenticates the org and reads the latest message.
4. The prompt is embedded with Cohere.
5. Supabase runs a similarity search using `match_documents`.
6. Relevant chunks are returned.
7. The retrieved context is passed to Groq as system and user messages.
8. Groq returns a grounded answer.

### C. Document listing and deletion

1. The frontend requests `/api/documents` to list files.
2. The route loads the current org ID and fetches unique filenames.
3. The frontend renders these items in the sidebar.
4. Admins can delete a file using `/api/delete-file`.
5. A full org wipe is available through `/api/purge`.

---

## 4. Security model

The project uses organization-aware access boundaries to help enforce multi-tenancy.

Important design characteristics:

- user identity is managed by Clerk
- org context is read from the active session
- document retrieval is filtered by `org_id`
- admin-only actions are protected by role validation

This is central to preventing cross-tenant leakage of knowledge documents.

---

## 5. Why this architecture works

This architecture is effective because it separates concerns clearly:

- the frontend handles UX and interaction
- API routes handle request validation and orchestration
- service files hold the actual business logic
- the database manages persistent knowledge storage
- external AI services handle embeddings and generation

This is a common and scalable pattern for AI applications.

---

## 6. Limitations and next-step architecture improvements

This project is a functional prototype and would benefit from further production hardening.

Recommended next improvements:

- centralized validation
- request schema validation
- structured logging
- error monitoring
- row-level security in Supabase
- rate limiting and abuse controls
- CI/CD automation
- automated tests

---

## 7. Summary

InsightStream follows a solid AI SaaS architecture pattern: frontend + secure API + tenant-scoped database + embedding service + LLM service. It is a good engineering baseline for an internal knowledge assistant and is easy to extend.
