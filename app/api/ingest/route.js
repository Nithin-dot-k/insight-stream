import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import pdf from 'pdf-parse-fork';
import { pipeline } from '@xenova/transformers';
import { auth } from '@clerk/nextjs/server'; // Import Clerk Auth

export async function POST(req) {
    try {
        // 1. SECURE AUTH CHECK
        const { orgId, orgRole } = await auth();

        // Security logic: Ensure user is logged in
        if (!orgId) {
            return NextResponse.json({ error: "Unauthorized: You must be part of an organization." }, { status: 401 });
        }

        // Only allow Admins to upload knowledge to the company bank
        if (orgRole !== 'org:admin') {
            return NextResponse.json({ error: "Forbidden: Only Admins can modify the Knowledge Base." }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // 2. Parse PDF
        const data = await pdf(buffer);

        // 3. Initialize Local AI (Free)
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

        const chunks = data.text.split('\n\n').filter(c => c.length > 50);

        // 4. Save chunks with the REAL orgId and filename
        for (const chunk of chunks) {
            const output = await extractor(chunk, { pooling: 'mean', normalize: true });

            const { error } = await supabase.from('documents').insert({
                content: chunk,
                embedding: Array.from(output.data),
                org_id: orgId,      // Secure Org ID from Clerk
                filename: file.name // <--- NEW: Saves the file name (e.g. "Resume_Jishnu.pdf")
            });

            if (error) {
                console.error("Supabase error:", error.message);
            }
        }

        return NextResponse.json({ message: "Knowledge successfully indexed for your organization." });

    } catch (e) {
        console.error("Ingest Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}