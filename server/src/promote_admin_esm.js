import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing Supabase config');
    process.exit(1);
}

const supabase = createClient(url, key);
const email = 'liulijun1978@hotmail.com';

async function promote() {
    const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! User promoted:', data);
    }
    process.exit(0);
}

promote();
