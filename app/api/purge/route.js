import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
    await supabase.from('documents').delete().neq('id', 0);
    return NextResponse.json({ message: "Wiped" });
}
