# File-by-File Reference

This page describes the purpose of each main file in the project.

---

## Root files

### `package.json`

Defines app metadata, dependencies, and scripts.

It is the main configuration file for installation and runtime commands.

### `next.config.mjs`

Contains Next.js runtime configuration.

This file is used to make sure `pdf-parse` is treated properly as a server-side dependency.

### `jsconfig.json`

Sets project path aliases.

This allows imports such as `@/lib/supabase` to resolve correctly.

### `eslint.config.mjs`

Configures linting rules for the application.

### `proxy.js`

Stores proxy or environment runtime helper logic.

### `.env.local`

Stores local environment variables required for app runtime.

This file should not be pushed to source control.

---

## App files

### `app/layout.js`

Root layout component.

Responsibilities:

- global UI wrapper
- font loading
- Clerk provider setup
- metadata configuration

### `app/page.js`

Entry page for the application.

It simply renders the main chat UI component.

### `app/globals.css`

Global style file.

It contains base styling and UI theme definitions, including low-level overrides for Clerk components.

---

## API files

### `app/api/chat/route.js`

Main chat API route.

It handles:

- auth validation
- prompt extraction
- context retrieval from the vector database
- LLM response generation

### `app/api/ingest/route.js`

Handles file upload and ingestion logic.

It validates admin access, parses the uploaded PDF, creates embeddings, and stores the indexed data.

### `app/api/documents/route.js`

Returns the list of indexed document names for the current organization.

It is used to populate the sidebar memory list.

### `app/api/delete-file/route.js`

Deletes a single file from the organization knowledge base.

It verifies admin permissions and removes matching rows based on `org_id` and `filename`.

### `app/api/purge/route.js`

Purges all stored document records.

It is an admin-level destructive action for resetting the organization memory.

---

## Component files

### `components/enterprise-chat/EnterpriseChat.jsx`

Main interactive user interface.

This is the primary frontend file and controls:

- auth states
- org switching
- chat UI
- upload modal
- deletion confirmation dialogs
- organization memory display
- sending prompts to the backend

---

## Library files

### `lib/supabase.js`

Creates and exports the shared Supabase client instance.

This file centralizes all Supabase configuration.

### `lib/services/rag.js`

Contains all core RAG logic.

Functions include:

- embedding generation
- similarity lookup
- Groq completion requests
- PDF chunk processing
- vector insertion

### `lib/services/documents.js`

Contains document management logic.

Functions include:

- list organization files
- delete single document entry
- clear all records in the organization memory

---

## Public assets

### `public/`

This folder contains static frontend assets like SVGs and icons.

These are not the main business logic files but are still part of the runtime front-end.

---

## Summary

Each file has a clear purpose, and the overall structure follows a standard separation between:

- app routing
- UI rendering
- API layer
- service logic
- database integration
- static assets

This is a solid foundation for an AI application and is easy to grow as the project expands.
