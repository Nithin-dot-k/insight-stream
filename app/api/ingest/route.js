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

        // 1. Parse PDF
        const data = await pdf(buffer);
        const chunks = data.text.split('\n\n').filter(c => c.length > 50);

        // 2. Generate Embeddings using Hugging Face (Free, 768-dimensions)
        for (const chunk of chunks) {
            const hfRes = await fetch(
                "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2",
                {
                    headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
                    method: "POST",
                    body: JSON.stringify({ inputs: chunk }),
                }
            );

            const embedding = await hfRes.json();

            if (!Array.isArray(embedding)) {
                console.error("HF Error:", embedding);
                throw new Error("Hugging Face failed to return a vector.");
            }

            // Save to Supabase (768-dim)
            await supabase.from('documents').insert({
                content: chunk,
                embedding: embedding,
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