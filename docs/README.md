# Project Documentation

This folder contains the technical documentation for the InsightStream application. It explains how the project is structured, how the main components work, and what each file is responsible for.

## Documentation Index

- [Architecture Overview](./architecture.md)
- [Project Structure](./project-structure.md)
- [File-by-File Reference](./file-reference.md)
- [Developer Guide](./developer-guide.md)

## Purpose of this documentation

This documentation is intended to help developers understand:

- how the application is organized
- what each major folder does
- how the request flow works
- which files to modify for features or bug fixes
- how the system connects with Clerk, Supabase, Cohere, and Groq

---

## High-level system summary

InsightStream is a multi-tenant AI knowledge assistant that allows organizations to upload PDF documents, extract information, store vector embeddings, and ask questions against that content.

The application architecture is centered around:

- a Next.js frontend
- Clerk authentication and organization scoping
- API route handlers for document and chat operations
- a Supabase vector database
- Cohere embedding generation
- Groq LLM response generation

---

## Recommended reading order

1. Start with [project-structure.md](./project-structure.md) to understand folder layout.
2. Read [architecture.md](./architecture.md) to understand the runtime workflow.
3. Review [file-reference.md](./file-reference.md) when making code changes.
4. Use [developer-guide.md](./developer-guide.md) for setup and local development instructions.
