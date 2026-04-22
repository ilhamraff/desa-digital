-- Enable UUID extension jika belum aktif untuk function uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function global untuk handle auto-update pada field updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 1. Tabel profiles (Data user)
-- Menyimpan informasi user aplikasi dan relasi ke tabel auth.users bawaan Supabase
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nama TEXT NOT NULL,
    role TEXT CHECK (role IN ('manager', 'warga')) NOT NULL,
    rt TEXT,
    rw TEXT,
    no_hp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 2. Tabel keluarga (Data kartu keluarga)
-- Menyimpan entitas sebuah rumah/keluarga secara unik melalui no_kk
CREATE TABLE keluarga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no_kk TEXT UNIQUE NOT NULL,
    nama_kepala TEXT NOT NULL,
    rt TEXT,
    rw TEXT,
    alamat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_keluarga_updated_at
BEFORE UPDATE ON keluarga
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 3. Tabel anggota (Anggota tiap keluarga)
-- Menyimpan penduduk/masyarakat, terhubung dengan tabel keluarga 
CREATE TABLE anggota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keluarga_id UUID REFERENCES keluarga(id) ON DELETE CASCADE NOT NULL,
    nama TEXT NOT NULL,
    nik TEXT UNIQUE NOT NULL,
    hubungan TEXT NOT NULL,
    tgl_lahir DATE,
    jenis_kelamin TEXT CHECK (jenis_kelamin IN ('L', 'P')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_anggota_updated_at
BEFORE UPDATE ON anggota
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 4. Tabel bansos (Penerima bantuan sosial)
-- Mencatat penyaluran bansos ke perorangan/user (profiles) tertuju
CREATE TABLE bansos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama_program TEXT NOT NULL,
    penerima_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    jumlah_bantuan INTEGER NOT NULL,
    periode TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'tersalurkan')) DEFAULT 'pending',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_bansos_updated_at
BEFORE UPDATE ON bansos
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 5. Tabel kegiatan (Kegiatan/acara desa)
-- Managemen agenda acara untuk pemerintahan desa dan partisipasi warga
CREATE TABLE kegiatan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul TEXT NOT NULL,
    deskripsi TEXT,
    tanggal DATE NOT NULL,
    waktu_mulai TIME,
    waktu_selesai TIME,
    lokasi TEXT,
    kuota INTEGER,
    status TEXT CHECK (status IN ('aktif', 'selesai', 'dibatalkan')) DEFAULT 'aktif',
    catatan_tambahan TEXT,
    alasan_batal TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_kegiatan_updated_at
BEFORE UPDATE ON kegiatan
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 6. Tabel surat (Permohonan surat dari warga)
-- Melacak permohonan penerbitan surat/dokumen
CREATE TABLE surat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pemohon_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    jenis_surat TEXT NOT NULL,
    keperluan TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'diproses', 'selesai', 'ditolak')) DEFAULT 'pending',
    catatan_petugas TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_surat_updated_at
BEFORE UPDATE ON surat
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 7. Tabel retribusi (Tagihan retribusi warga)
-- Fasilitas pembayaran bulanan terintegrasi gateway seperti Midtrans
CREATE TABLE retribusi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warga_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    jenis TEXT NOT NULL,
    jumlah INTEGER NOT NULL,
    jatuh_tempo DATE NOT NULL,
    status TEXT CHECK (status IN ('belum_bayar', 'lunas', 'jatuh_tempo')) DEFAULT 'belum_bayar',
    midtrans_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER set_retribusi_updated_at
BEFORE UPDATE ON retribusi
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
