import { supabase } from './supabase.js';

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email');
    process.exit(1);
}

const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

if (error) {
    console.error('Error updating user:', error);
} else {
    console.log('User updated successfully:', data);
}
process.exit(0);
