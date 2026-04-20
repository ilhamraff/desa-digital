require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supa.from('bansos').select(`
    *,
    profiles(nama, rt, rw),
    keluarga!penerima_id(no_kk, nama_kepala)
  `).limit(1);
  console.log(JSON.stringify({data, error}, null, 2));
}
run();
