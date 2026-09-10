"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Copy, Check, KeyRound, RotateCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("manager@desadigital.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  // 1. Inisialisasi Supabase client untuk sisi browser (Client Component)
  const supabase = createClient();

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback jika browser membatasi clipboard API
    }
  };

  const handleFillDemo = () => {
    setEmail("manager@desadigital.com");
    setPassword("password123");
  };

  // Handler untuk proses submit form
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 2. Autentikasi dengan Supabase Auth menggunakan email dan password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      {/* Kartu Form - Styling profesional, clean dengan border-radius (rounded) dan shadow */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header Kartu: Logo / Identitas Desa Digital */}
        <Logo variant="stacked" size="lg" className="pt-1" />

        {/* Notifikasi Error Banner */}
        {error && (
          <div className="bg-red-50 text-sm text-red-600 p-4 rounded-lg flex items-center shadow-sm border border-red-100">
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5 mt-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Email Petugas
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] outline-none transition-all disabled:opacity-60 text-gray-900"
              placeholder="nama@desa.go.id"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] outline-none transition-all disabled:opacity-60 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          {/* Tombol Submit dengan warna khusus hijau tua #15803d */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative flex items-center justify-center py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#15803d] disabled:opacity-75 disabled:cursor-not-allowed bg-[#15803d] hover:bg-green-800 shadow-md hover:shadow-lg mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Memproses...
              </>
            ) : (
              "Masuk ke Dashboard"
            )}
          </button>
        </form>

        {/* Footer / Demo Credentials Card untuk Portfolio Reviewer */}
        <div className="pt-2 border-t border-gray-100">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-xs uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>Akun Demo Portfolio</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                title="Isi ulang form otomatis"
              >
                <RotateCcw className="w-3 h-3" />
                Isi Otomatis
              </button>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {/* Baris Email */}
              <div className="flex items-center justify-between bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                <div className="truncate mr-2">
                  <span className="text-gray-400 font-sans text-[11px] mr-1.5">
                    Email:
                  </span>
                  <span className="text-gray-800 font-medium">
                    manager@desadigital.com
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("manager@desadigital.com", "email")}
                  className="text-gray-500 hover:text-emerald-700 p-1 rounded transition-colors cursor-pointer shrink-0"
                  title="Salin Email"
                >
                  {copiedField === "email" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Baris Password */}
              <div className="flex items-center justify-between bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                <div className="truncate mr-2">
                  <span className="text-gray-400 font-sans text-[11px] mr-1.5">
                    Pass:
                  </span>
                  <span className="text-gray-800 font-medium">password123</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("password123", "password")}
                  className="text-gray-500 hover:text-emerald-700 p-1 rounded transition-colors cursor-pointer shrink-0"
                  title="Salin Password"
                >
                  {copiedField === "password" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
