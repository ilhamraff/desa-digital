import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Inisialisasi awal response bawaan Next.js
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Setup Supabase Client untuk Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Memprioritaskan variabel .env sesuai setup Anda
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Ketika refresh token otomatis terjadi, sinkronisasikan cookie tersebut ke objek request...
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

          // ...Lalu timpa 'supabaseResponse' agar cookie baru ini juga ikut diteruskan (set-cookie header)
          supabaseResponse = NextResponse.next({
            request,
          });

          // ...Dan akhirnya menempelkan update-an tersebut ke response yang akan dikirim ke browser klien
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Wajib: Memanggil `getUser()` agar token selalu diperiksa dan terhindar dari kadaluarsa 
  // (Jika belum login atau expired, Supabase akan trigger callback 'setAll' di atas).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Dapatkan URL yang sedang diakses saat ini
  const { pathname } = request.nextUrl;

  // 4. Logika Proteksi Route

  // ATURAN 0: Redirect root '/' ke /dashboard (jika login) atau /login (jika belum)
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard")) {
    
    // ATURAN 1: Kalau user mengakses /dashboard tapi BELUM LOGIN
    if (!user) {
      // Cloning agar path awal tersimpan, dan arahkan ulang ke halaman autentikasi
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Kalau user sudah login, periksa informasi rol-nya pada database profil Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    // ATURAN 2: Kalau SUDAH LOGIN tapi role-nya BUKAN 'manager'
    if (profile?.role !== "manager") {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    // ATURAN 3: Jika role cocok ('manager'), kode akan otomatis menerobos hingga akhir fungsi
    // (return supabaseResponse) dan permintaan ke rute dashboard di-izinkan.
  }

  // ATURAN 4: Pengunjung langsung dilepas dan diizinkan apabila bukan merupakan protected routes.
  // Berlaku untuk: /login, /unauthorized, dll.
  return supabaseResponse;
}

// 5. Matcher middleware untuk melompati pemeriksaan pada aset-aset statis
export const config = {
  matcher: [
    /*
     * Regex di bawah ini memastikan bahwa route berikut sepenuhnya diabaikan oleh middleware agar performa sangat cepat:
     * - Aset statis pada _next/static (file JavaScript, CSS, chunk file)
     * - Gambar otomatis Next.js (_next/image)
     * - File root static (favicon.ico, icon, dll)
     * - File media/images seperti SVG, PNG, JPG/JPEG, GIF, WEBP
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
