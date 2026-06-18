import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(req) {
    try {
        const { orgId, orgRole } = await auth();
        if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        if (orgRole !== 'org:admin') return NextResponse.json({ error: "Admin rights required" }, { status: 403 });

        // Get the filename to delete from the URL (e.g. /api/delete-file?filename=Nithin_CV.pdf)
        const { searchParams } = new URL(req.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: "No filename provided" }, { status: 400 });
        }

        // Delete only the rows that match this specific file AND the user's organization
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('org_id', orgId)
            .eq('filename', filename); // <--- DELETE ONLY THIS FILE

        if (error) throw error;

        return NextResponse.json({ message: `Successfully deleted ${filename} from memory.` });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}