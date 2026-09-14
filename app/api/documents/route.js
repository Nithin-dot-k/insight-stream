import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrganizationDocuments } from '@/lib/services/documents';

export async function GET() {
    try {
        const { orgId } = await auth();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const files = await getOrganizationDocuments(orgId);
        return NextResponse.json({ files });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}