"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 1. Inisialisasi Supabase client untuk sisi browser (Client Component)
  const supabase = createClient();

  // Handler untuk proses submit form
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 2. Autentikasi dengan Supabase Auth menggunakan email dan password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Menampilkan pesan error ramah jika autentikasi gagal
      if (authError || !authData.user) {
        throw new Error("Email atau password salah. Silakan coba lagi.");
      }

      // 3. Mengambil record profil user dari tabel `profiles` setelah berhasil login
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        // Bisa juga menampilkan error yang lebih spesifik jika data profil gagal dimuat
        throw new Error("Terjadi kesalahan saat memeriksa hak akses pengguna.");
      }

      // 4. Pengalihan halaman (Redirect) berdasarkan role pengguna spesifik
      if (profileData?.role === "manager") {
        router.push("/dashboard");
      } else {
        router.push("/unauthorized");
      }
    } catch (err: any) {
      // Menangkap dan menampilkan error ke tampilan UI
      setError(err.message);
    } finally {
      // Selalu mematikan loading spinner setelah proses selesai, baik sukses maupun error
      setIsLoading(false);
    }
  };

  return (
    // Background abu muda (bg-gray-50/100) dan penengah layout pada layar Penuh
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Kartu Form - Styling profesional, clean dengan border-radius (rounded) dan shadow */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        {/* Header Kartu: Logo / Nama Dashboard */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard Desa Digital
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Sistem Informasi Manajemen Desa
          </p>
        </div>

        {/* Notifikasi Error Banner */}
        {error && (
          <div className="bg-red-50 text-sm text-red-600 p-4 rounded-lg flex items-center shadow-sm border border-red-100">
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5 mt-8">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email Petugas
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] outline-none transition-all disabled:opacity-60"
              placeholder="nama@desa.go.id"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] outline-none transition-all disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          {/* Tombol Submit dengan warna khusus hijau tua #15803d */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#15803d] disabled:opacity-75 disabled:cursor-not-allowed bg-[#15803d] hover:bg-green-800 shadow-md hover:shadow-lg mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
