import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdf from 'pdf-parse-fork';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { orgId, orgRole } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (orgRole !== 'org:admin') return NextResponse.json({ error: "Admin only" }, { status: 403 });

        const formData = await req.formData();
        const file = formData.get('file');
        const buffer = Buffer.from(await file.arrayBuffer());

        // 1. Parse PDF (Fast)
        const data = await pdf(buffer);
        const text = data.text;

        // 2. Setup Google AI (No heavy model downloading!)
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
        // text-embedding-004 is Google's high-speed, free embedding model
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const chunks = text.split('\n\n').filter(c => c.length > 50);

        for (const chunk of chunks) {
            // 3. Generate embedding via Google's cloud API (Super fast & free)
            const result = await embedModel.embedContent(chunk);
            const embedding = result.embedding.values; // Returns a 768-dim array

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