import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Test joining profiles
  const { data: bansos1, error: error1 } = await supabase.from('bansos').select('*, profiles(*)').limit(1);
  
  // Test joining keluarga
  const { data: bansos2, error: error2 } = await supabase.from('bansos').select('*, keluarga(*)').limit(1);

  // Just fetch columns of bansos
  const { data: bansosRows } = await supabase.from('bansos').select('*').limit(1);

  return NextResponse.json({
    joinProfiles: { data: bansos1, error: error1 },
    joinKeluarga: { data: bansos2, error: error2 },
    bansosRows
  });
}
