import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { orgId } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

        // 1. Generate query vector using Google's Cloud model (768-dim)
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embedResult = await embedModel.embedContent(lastMessage);
        const vector = embedResult.embedding.values;

        // 2. Search Supabase
        const { data: chunks, error: dbError } = await supabase.rpc('match_documents', {
            query_embedding: vector,
            match_threshold: 0.01,
            match_count: 5,
            filter_org_id: orgId
        });

        if (dbError) throw dbError;
        const context = chunks && chunks.length > 0 ? chunks.map(c => c.content).join("\n\n") : "Empty context.";

        // 3. Call Groq with Llama 3.1
        const groqApiKey = process.env.GROQ_API_KEY;
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
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