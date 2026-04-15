-- ==========================================
-- TRIGGER: AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================

-- 1. Membuat Fungsi (Function)
-- Fungsi ini akan dijalankan setiap kali ada baris baru yang dimasukkan ke auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    nama,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    -- Mengambil nama dari metadata user (bisa menggunakan key 'nama' atau 'full_name').
    -- Jika metadata nama tidak ada, jadikan email sebagai fallback/cadangan.
    COALESCE(
      NEW.raw_user_meta_data->>'nama',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1) -- Mengambil bagian depan email sebagai nama jika meta_data kosong
    ),
    'warga', -- Nilai default role
    NOW(),
    NOW()
  );
  
  -- Mengembalikan nilai NEW agar proses insert di auth.users tetap berlanjut normal
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Membuat Trigger
-- Menyambungkan fungsi di atas ke tabel bawaan Supabase yaitu auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
