import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdf from 'pdf-parse-fork';
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { orgId, orgRole } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (orgRole !== 'org:admin') return NextResponse.json({ error: "Admin only" }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get('file');
        const buffer = Buffer.from(await file.arrayBuffer());

        const data = await pdf(buffer);
        const chunks = data.text.split('\n\n').filter(c => c.length > 50);

        // Call Cohere API (1024 dimensions, highly stable DNS)
        const cohereRes = await fetch("https://api.cohere.com/v1/embed", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.COHERE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                texts: chunks,
                model: "embed-english-v3.0",
                input_type: "search_document"
            })
        });

        const cohereData = await cohereRes.json();
        const embeddings = cohereData.embeddings; // Array of 1024-dim arrays

        if (!embeddings || embeddings.length === 0) {
            throw new Error("Cohere failed to generate embeddings.");
        }

        // Save chunks to Supabase
        for (let i = 0; i < chunks.length; i++) {
            await supabase.from('documents').insert({
                content: chunks[i],
                embedding: embeddings[i],
                org_id: orgId,
                filename: file.name
            });
        }

        return NextResponse.json({ message: "Done" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}