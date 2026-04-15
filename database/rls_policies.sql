-- ==============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 0. Enable RLS pada SEMUA tabel
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE keluarga ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE bansos ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE retribusi ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 0. FUNCTION: is_manager (Bypass RLS untuk mencegah Infinite Recursion)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 1. TABEL: profiles
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat profilnya sendiri" ON profiles;
CREATE POLICY "Warga bisa melihat profilnya sendiri" ON profiles
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Warga bisa update profilnya sendiri" ON profiles;
CREATE POLICY "Warga bisa update profilnya sendiri" ON profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Manager bisa akses semua profil" ON profiles;
CREATE POLICY "Manager bisa akses semua profil" ON profiles
FOR ALL USING (public.is_manager());


-- ==============================================================================
-- 2. TABEL: keluarga
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat data keluarga" ON keluarga;
CREATE POLICY "Warga bisa melihat data keluarga" ON keluarga
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'warga')
);

DROP POLICY IF EXISTS "Manager bisa akses semua data keluarga" ON keluarga;
CREATE POLICY "Manager bisa akses semua data keluarga" ON keluarga
FOR ALL USING (public.is_manager());


-- ==============================================================================
-- 3. TABEL: anggota
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat data anggota" ON anggota;
CREATE POLICY "Warga bisa melihat data anggota" ON anggota
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'warga')
);

DROP POLICY IF EXISTS "Manager bisa akses semua data anggota" ON anggota;
CREATE POLICY "Manager bisa akses semua data anggota" ON anggota
FOR ALL USING (public.is_manager());


-- ==============================================================================
-- 4. TABEL: bansos
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat bansos miliknya sendiri" ON bansos;
CREATE POLICY "Warga bisa melihat bansos miliknya sendiri" ON bansos
FOR SELECT USING (
    penerima_id = auth.uid()
);

DROP POLICY IF EXISTS "Manager bisa akses semua data bansos" ON bansos;
CREATE POLICY "Manager bisa akses semua data bansos" ON bansos
FOR ALL USING (public.is_manager());


-- ==============================================================================
-- 5. TABEL: kegiatan
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat kegiatan desa" ON kegiatan;
CREATE POLICY "Warga bisa melihat kegiatan desa" ON kegiatan
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'warga')
);

DROP POLICY IF EXISTS "Manager bisa akses semua data kegiatan" ON kegiatan;
CREATE POLICY "Manager bisa akses semua data kegiatan" ON kegiatan
FOR ALL USING (public.is_manager());


-- ==============================================================================
-- 6. TABEL: surat
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat surat permohonannya" ON surat;
CREATE POLICY "Warga bisa melihat surat permohonannya" ON surat
FOR SELECT USING (
    pemohon_id = auth.uid()
);

DROP POLICY IF EXISTS "Warga bisa membuat permohonan surat" ON surat;
CREATE POLICY "Warga bisa membuat permohonan surat" ON surat
FOR INSERT WITH CHECK (
    pemohon_id = auth.uid()
);

DROP POLICY IF EXISTS "Manager bisa akses semua surat" ON surat;
CREATE POLICY "Manager bisa akses semua surat" ON surat
FOR ALL USING (public.is_manager());


-- ==============================================================================
-- 7. TABEL: retribusi
-- ==============================================================================
DROP POLICY IF EXISTS "Warga bisa melihat tagihan retribusinya" ON retribusi;
CREATE POLICY "Warga bisa melihat tagihan retribusinya" ON retribusi
FOR SELECT USING (
    warga_id = auth.uid()
);

DROP POLICY IF EXISTS "Warga bisa update pembayaran retribusinya" ON retribusi;
CREATE POLICY "Warga bisa update pembayaran retribusinya" ON retribusi
FOR UPDATE USING (
    warga_id = auth.uid()
) WITH CHECK (
    warga_id = auth.uid()
);

DROP POLICY IF EXISTS "Manager bisa akses semua data retribusi" ON retribusi;
CREATE POLICY "Manager bisa akses semua data retribusi" ON retribusi
FOR ALL USING (public.is_manager());
