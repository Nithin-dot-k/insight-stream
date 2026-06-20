# 🚀 InsightStream: Enterprise Multi-Tenant AI Knowledge Base

InsightStream is a secure, production-ready B2B SaaS platform designed to transform unstructured organizational data (PDFs) into an interactive, context-aware intelligence hub using **Retrieval-Augmented Generation (RAG)**.

---

## 🛠️ The Tech Stack

- **Frontend:** Next.js 16 (Turbopack), Tailwind CSS, Lucide Icons, Custom Glassmorphic UI
- **Authentication & RBAC:** Clerk (Enterprise Organizations & Role-Based Access Control)
- **Database & Vector Search:** Supabase (PostgreSQL with `pgvector` extension)
- **Cloud Embeddings:** Cohere API (`embed-english-v3.0` producing 1024-dimension vectors)
- **LLM Orchestration:** Groq SDK (Llama 3.1 8B Instant)
- **Deployment:** GitHub (CI/CD) & Vercel (Edge Functions)

---

## 🧠 Key Engineering Challenges Solved

### 1. Cryptographic Tenant Isolation (Multi-Tenancy)

Instead of simulating different company accounts with static dropdowns, the application utilizes **Clerk Organizations**. During user signup, a unique `org_id` token is generated. On the server side, this token is securely extracted from the JWT session to partition database operations. This guarantees that different corporate entities are isolated at the database layer—Company A can never access or query Company B's data.

### 2. Serverless-Optimized Embeddings (Bypassing Timeouts)

In local development, running local CPU-bound models (like Xenova/ONNX) is cost-effective, but deploying 90MB+ models inside serverless containers (like Vercel Edge Functions) leads to cold-start delays and 10-second execution timeouts. To harden the app for production, the ingestion pipeline was refactored to utilize **Cohere's Enterprise Embeddings API**, enabling sub-second, stateless, 1024-dimension vector calculations with zero server overhead.

### 3. Granular Document Deletion

Most basic RAG projects only allow deleting the entire vector index. By appending source metadata (`filename`) to each ingested text chunk in PostgreSQL, this application supports **Granular Deletion**. Administrators can view a dynamic list of indexed files in their sidebar and purge specific documents from memory without affecting the rest of the organization's knowledge base.

### 4. Client-Side Session State Leak Prevention

In Single Page Applications (SPAs), React in-memory states (`useState`) can persist across user logout/login sessions if a hard browser reload is not performed. To mitigate this security vulnerability, a **Session-Change Listener** was implemented to monitor active `userId` and `orgId` changes. The listener instantly flushes the client-side message state on session swap, ensuring zero cross-tenant data exposure.

---

## 🗄️ Database Setup (Supabase)

To enable vector math and set up the custom similarity search function, run the following script in the Supabase SQL Editor:

```sql
-- 1. Enable pgvector support
create extension if not exists vector;

-- 2. Create documents table with Org & Metadata tracking
create table if not exists documents (
  id bigserial primary key,
  org_id text not null default 'default_org',
  content text not null,
  filename text,
  embedding vector(1024) -- Optimized for Cohere's 1024-dim model
);

-- 3. Create the cosine similarity match function
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
  select documents.id, documents.content, 1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.org_id = filter_org_id
  and 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding limit match_count;
end; $$;


🔑 Environment Configuration (.env.local)
To run this project locally, create a .env.local file in the root directory with the following keys:
Env
# Clerk Security Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# AI Model Keys
COHERE_API_KEY=col_...
GROQ_API_KEY=gsk_...


🏃‍♂️ Local Installation
Clone the repository and install dependencies:
Bash
git clone https://github.com/your-username/insight-stream.git
cd insight-stream
npm install

Start the development server:
Bash
npm run dev

Open http://localhost:3000 in your browser.
### Why this README is a game-changer:
It focuses on **Software Architecture** (Pillars 1 to 4 under "Key Engineering Challenges Solved"). When a senior developer or recruiter reads this, they will instantly realize that you understand how real-world B2B systems are engineered, securing you interviews much faster.
```
