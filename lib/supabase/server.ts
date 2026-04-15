import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Digunakan di Server Components, Server Actions, dan API Route Handlers
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Error ini wajar terjadi saat setAll dipanggil dari Server Component.
            // Server Component tidak punya izin untuk modifikasi cookies.
            // Biarkan catch kosong karena pembaruan token ini sudah dihandle oleh file middleware.ts
          }
        },
      },
    }
  )
}
