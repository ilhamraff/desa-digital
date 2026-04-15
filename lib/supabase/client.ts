import { createBrowserClient } from '@supabase/ssr'

// Digunakan murni di dalam Client Components (file React yang memiliki "use client" di atasnya)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Fallback ke anon key standar jika publishable key tidak ditemukan
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
