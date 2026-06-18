import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { pipeline } from '@xenova/transformers';
import { auth } from '@clerk/nextjs/server';
import Groq from 'groq-sdk'; // Import Groq

let extractor;

// Initialize Groq securely
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
    try {
        // 1. Secure Auth check
        const { orgId } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1].content;

        console.log("--- CHAT INITIATED VIA GROQ ---");

        // 2. Generate vector locally (FREE)
        if (!extractor) {
            extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        const output = await extractor(lastMessage, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);

        // 3. Search Supabase
        const { data: chunks, error: dbError } = await supabase.rpc('match_documents', {
            query_embedding: vector,
            match_threshold: 0.01,
            match_count: 5,
            filter_org_id: orgId
        });

        if (dbError) throw dbError;

        const context = chunks && chunks.length > 0
            ? chunks.map(c => c.content).join("\n\n")
            : "No relevant information found.";

        console.log(`Retrieved ${chunks?.length || 0} chunks from database.`);

        // 4. Call Groq with Llama 3 (Ultra-Fast & Free)
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a professional assistant. Answer the question using ONLY this document context:\n\n${context}`
                },
                {
                    role: "user",
                    content: lastMessage
                }
            ],
            // llama3-8b-8192 is the standard free workhorse model on Groq
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
        });

        const aiResponse = chatCompletion.choices[0]?.message?.content;

        console.log("✅ Groq answered successfully!");
        return NextResponse.json({ text: aiResponse });

    } catch (error) {
        console.error("GROQ CHAT ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}