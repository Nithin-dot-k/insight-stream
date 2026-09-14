import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteOrganizationDocument } from '@/lib/services/documents';

export async function DELETE(req) {
    try {
        const { orgId, orgRole } = await auth();
        if (!orgId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (orgRole !== 'org:admin') {
            return NextResponse.json({ error: 'Admin rights required' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'No filename provided' }, { status: 400 });
        }

        const result = await deleteOrganizationDocument(orgId, filename);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}