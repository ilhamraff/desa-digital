-- ==============================================================================
-- Tabel: peserta_kegiatan
-- ==============================================================================
CREATE TABLE peserta_kegiatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kegiatan_id UUID REFERENCES kegiatan(id) ON DELETE CASCADE NOT NULL,
    warga_id UUID REFERENCES profiles(id) NOT NULL,
    waktu_daftar TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tambahkan UNIQUE constraint agar satu warga tidak bisa terdaftar dua kali di kegiatan yang sama
ALTER TABLE peserta_kegiatan ADD CONSTRAINT unique_kegiatan_warga UNIQUE (kegiatan_id, warga_id);

-- Enable RLS
ALTER TABLE peserta_kegiatan ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Manager bisa INSERT, SELECT, UPDATE, DELETE semua
DROP POLICY IF EXISTS "Manager bisa akses semua data peserta kegiatan" ON peserta_kegiatan;
CREATE POLICY "Manager bisa akses semua data peserta kegiatan" ON peserta_kegiatan
FOR ALL USING (public.is_manager());

-- Warga hanya bisa SELECT peserta di kegiatan publik
-- Asumsi: Seluruh data di tabel `kegiatan` dianggap kegiatan publik, sama seperti policy kegiatan
DROP POLICY IF EXISTS "Warga bisa melihat peserta kegiatan" ON peserta_kegiatan;
CREATE POLICY "Warga bisa melihat peserta kegiatan" ON peserta_kegiatan
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'warga')
);
