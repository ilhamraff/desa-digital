import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Digunakan spesifik di dalam file middleware.ts Next.js (di root aplikasi)
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Ketika token refresh terjadi, kita set cookie baru ke request
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // Memperbarui objek NextResponse agar menyimpan cookie baru
          supabaseResponse = NextResponse.next({
             request,
          })
          
          // Set cookie tersebut ke response agar ditangkap oleh browser pengguna
          cookiesToSet.forEach(({ name, value, options }) =>
             supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Memanggil getUser() secara sengaja agar trigger session refresh terjadi (jika token expired).
  // Jangan menaruh logika lain sebelum pemanggilan ini.
  await supabase.auth.getUser()

  return supabaseResponse
}
