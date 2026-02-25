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
const identifier = process.argv[2] || '1123804425@qq.com';

async function forcePromote() {
    console.log(`Attempting to promote user [${identifier}]...`);

    // Note: Standard Supabase client might not have full DDL permissions via RPC unless predefined,
    // but we can try to update directly. If it fails with "column not found", we know for sure.

    const isEmail = identifier.includes('@');
    const query = supabase.from('users').update({ role: 'admin' });

    if (isEmail) {
        query.eq('email', identifier);
    } else {
        query.eq('phone', identifier);
    }

    const { data, error } = await query.select();

    if (error) {
        if (error.message.includes('column') && error.message.includes('role')) {
            console.error('FATAL: The "role" column is physically missing from the database.');
            console.log('Please go to Supabase SQL Tab and run:');
            console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS role text DEFAULT \'user\';');
            console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS status text DEFAULT \'active\';');
        } else {
            console.error('Error:', error);
        }
    } else if (data && data.length > 0) {
        console.log('Success! User promoted:', data);
    } else {
        console.log('No user found with that email.');
    }
    process.exit(0);
}

forcePromote();
