import { createClient } from '@supabase/supabase-js';

// These variables are pulled from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Service Role Key in .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseKey);