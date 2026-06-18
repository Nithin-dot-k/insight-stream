import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { orgId } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Fetch all filenames for this organization
        const { data, error } = await supabase
            .from('documents')
            .select('filename')
            .eq('org_id', orgId)
            .not('filename', 'is', null);

        if (error) throw error;

        // Filter the list to only show UNIQUE filenames
        const uniqueFilenames = [...new Set(data.map(item => item.filename))];

        return NextResponse.json({ files: uniqueFilenames });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}