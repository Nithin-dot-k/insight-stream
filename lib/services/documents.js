import { supabase } from '@/lib/supabase';

export async function getOrganizationDocuments(orgId) {
    const { data, error } = await supabase
        .from('documents')
        .select('filename')
        .eq('org_id', orgId)
        .not('filename', 'is', null);

    if (error) throw error;

    return [...new Set((data ?? []).map((item) => item.filename))];
}

export async function deleteOrganizationDocument(orgId, filename) {
    const { error } = await supabase
        .from('documents')
        .delete()
        .eq('org_id', orgId)
        .eq('filename', filename);

    if (error) throw error;

    return { message: `Successfully deleted ${filename} from memory.` };
}

export async function purgeOrganizationDocuments() {
    const { error } = await supabase.from('documents').delete().neq('id', 0);

    if (error) throw error;

    return { message: 'Wiped' };
}
