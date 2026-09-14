import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ingestPdfDocumentForOrg } from '@/lib/services/rag';

export async function POST(req) {
    try {
        const { orgId, orgRole } = await auth();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (orgRole !== 'org:admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await ingestPdfDocumentForOrg({
            orgId,
            fileName: file.name,
            fileBuffer: buffer,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}