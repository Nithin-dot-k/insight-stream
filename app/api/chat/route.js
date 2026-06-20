import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { orgId } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        // Generate query vector using Cohere (1024-dim)
        const cohereRes = await fetch("https://api.cohere.com/v1/embed", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                texts: [lastMessage],
                model: "embed-english-v3.0",
                input_type: "search_query"
            })
        });

        const cohereData = await cohereRes.json();
        const vector = cohereData.embeddings[0];

        // Search Supabase
        const { data: chunks, error: dbError } = await supabase.rpc('match_documents', {
            query_embedding: vector,
            match_threshold: 0.01,
            match_count: 5,
            filter_org_id: orgId
        });

        if (dbError) throw dbError;
        const context = chunks && chunks.length > 0 ? chunks.map(c => c.content).join("\n\n") : "Empty context.";

        // Call Groq with Llama 3.1
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: `Answer using ONLY this context:\n\n${context}` },
                    { role: "user", content: lastMessage }
                ],
                model: "llama-3.1-8b-instant"
            })
        });

        const data = await res.json();
        const aiResponse = data.choices[0]?.message?.content;

        return NextResponse.json({ text: aiResponse });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}