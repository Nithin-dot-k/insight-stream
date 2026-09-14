import { NextResponse } from 'next/server';
import { purgeOrganizationDocuments } from '@/lib/services/documents';

export async function DELETE() {
    try {
        const result = await purgeOrganizationDocuments();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
