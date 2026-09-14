# Project Structure

This document explains the folder and file layout of the repository and how each part contributes to the application.

## Root-level structure

```text
insight-stream/
├── app/
├── components/
├── lib/
├── public/
├── docs/
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

## app/

The `app/` directory contains the Next.js App Router structure. This is the main application entry area.

### `app/layout.js`

Responsible for the root HTML layout and global app setup.

What it does:

- wraps the application in `ClerkProvider`
- loads the Geist font family
- imports the global stylesheet
- defines application metadata such as title and description

### `app/page.js`

This is the main page entry component.

What it does:

- imports the `EnterpriseChat` component
- renders the main UI page for the application

### `app/globals.css`

Global styling file.

What it does:

- defines the global Tailwind import
- contains base theme variables
- includes custom dark-mode styling for Clerk UI elements

## app/api/

This folder contains all backend route handlers for the application. These endpoints are responsible for the server-side logic that the frontend calls.

### `app/api/chat/route.js`

Handles chat requests.

What it does:

- validates user authentication
- reads the latest user prompt
- retrieves relevant context from the document database
- sends the prompt and retrieved context to the LLM
- returns the AI response

### `app/api/ingest/route.js`

Handles PDF ingestion.

What it does:

- verifies admin access
- reads the uploaded file
- extracts text from the PDF
- splits the text into chunks
- embeds the chunks with Cohere
- inserts the data into the Supabase documents table

### `app/api/documents/route.js`

Returns the list of uploaded document filenames for the active organization.

What it does:

- authenticates the current user
- fetches only the files belonging to the organization
- returns a unique set of filenames

### `app/api/delete-file/route.js`

Handles the deletion of a single indexed document file.

What it does:

- validates admin access
- reads the filename from the query string
- deletes matching rows from the organization-specific document records

### `app/api/purge/route.js`

Handles full organization memory purge.

What it does:

- clears all document entries in the database
- returns a success or failure response

## components/

The frontend UI is stored under reusable component directories.

### `components/enterprise-chat/EnterpriseChat.jsx`

This is the main chat interface component.

What it does:

- loads Clerk auth state and organization info
- renders the sign-in and workspace-required states
- displays the organization sidebar
- lists stored files
- uploads new PDFs
- deletes individual files
- purges organization memory
- sends messages to the chat API
- displays message history
- handles the UI for admin actions and security warnings

This is the largest and most important UI file in the project.

## lib/

The `lib/` folder contains shared application logic and infrastructure helpers.

### `lib/supabase.js`

Initializes the Supabase client used across the app.

What it does:

- reads environment variables for the Supabase URL and key
- creates a shared Supabase client
- exposes that client for database interactions

### `lib/services/rag.js`

Contains the document ingestion and retrieval logic around the RAG pipeline.

What it does:

- generates embeddings using Cohere
- retrieves context using similarity search
- calls the Groq model for chat completion
- processes uploaded PDFs into chunked embeddings
- inserts the embeddings into the documents table

This is the main AI service layer for the project.

### `lib/services/documents.js`

Contains database-level operations related to document lifecycle management.

What it does:

- fetches all filenames for an organization
- deletes a single file from org memory
- purges all documents for the org

This keeps document-related logic separate from UI and route logic.

## public/

The `public/` folder stores static assets used by the application.

This project currently contains default-generated Next.js static assets such as SVG icon files.

## docs/

The `docs/` folder stores project documentation and technical references.

This folder is intended to replace the need for all architecture and project context being buried in a single README.

## config and project files

### `package.json`

Defines project metadata and application scripts.

Key scripts:

- `npm run dev` - starts the local development server
- `npm run build` - builds the application for production
- `npm run start` - runs the production server
- `npm run lint` - runs linter validation

### `next.config.mjs`

Next.js configuration file.

What it does:

- marks `pdf-parse` as a server-side package so it works correctly in the environment

### `jsconfig.json`

JavaScript project configuration for path aliases.

What it does:

- defines the alias `@/*` so imports can resolve from the project root

### `eslint.config.mjs`

ESLint configuration.

What it does:

- loads Next.js linting rules
- ignores generated folders like `.next`

### `proxy.js`

Application proxy-related helper.

This file is likely used to support proxied runtime behavior or environment-specific development routing.

### `.env.local`

Local environment file.

This stores secrets and runtime settings such as:

- Clerk keys
- Supabase credentials
- Cohere API key
- Groq API key

This file should never be committed to source control.

---

## Summary

The project is structured in a clean and understandable way for a small-to-medium AI application. It separates:

- routing
- UI
- business logic
- database access
- AI logic

This is a good engineering foundation, especially for a product still being developed and iterated on.
