# Developer Guide

This guide covers the operational setup, local development process, and daily workflow for working on InsightStream.

## 1. Prerequisites

Before running the project, ensure the following are available:

- Node.js 18+
- npm
- a Clerk project and authentication keys
- a Supabase project with pgvector enabled
- a Cohere API key
- a Groq API key

---

## 2. Environment setup

Create a `.env.local` file in the project root with the following values:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

COHERE_API_KEY=your_cohere_api_key
GROQ_API_KEY=your_groq_api_key
```

---

## 3. Install dependencies

```bash
npm install
```

---

## 4. Run the project locally

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 5. Build verification

To verify the project builds successfully:

```bash
npm run build
```

This checks whether the app compiles correctly in production mode.

---

## 6. Main development workflow

When working on the project, use the following mental model:

- UI changes: modify files under `components/` or `app/`
- backend logic: modify route handlers in `app/api/`
- shared business logic: modify files in `lib/services/`
- database configuration: update Supabase schema or queries
- environment settings: update `.env.local`

---

## 7. Typical feature work

### Adding a new API feature

1. Create or update the route file in `app/api/`
2. Put reusable logic in `lib/services/`
3. Keep the route file thin and validation focused
4. Return structured JSON responses

### Updating the chat flow

1. Inspect `components/enterprise-chat/EnterpriseChat.jsx`
2. Review `app/api/chat/route.js`
3. Edit or extend the retrieval logic in `lib/services/rag.js`

### Adding new document operations

1. Extend `lib/services/documents.js`
2. Create or update the relevant route file
3. Ensure admin permissions are enforced where required

---

## 8. Best practices for this codebase

- keep route handlers small
- keep business logic in `lib/services/`
- scope all database operations to `org_id`
- avoid mixing UI logic with data access logic
- validate auth and roles before business operations
- keep env variables in `.env.local`
- do not commit secrets to version control

---

## 9. Common project responsibilities

### `app/`

Frontend and route entry points.

### `components/`

User interface and feature rendering.

### `lib/services/`

Business logic and integrations.

### `lib/supabase.js`

Shared database client.

### `public/`

Static assets.

---

## 10. Recommended next improvements

For a production-ready expansion, the next steps should include:

- automated API tests
- unit tests for services
- schema validation
- logging and monitoring
- deployment automation
- rate limiting
- security hardening
- CI pipeline setup

---

## Summary

This project is a good engineering baseline for a multi-tenant AI knowledge assistant. Follow the separation between UI, routes, and services when making changes, and keep the tenant boundary logic secure and consistent across the app.
