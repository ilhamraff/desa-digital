-- DUMMY DATA UNTUK DESA DIGITAL

-- 1. Insert 3 data keluarga (tabel keluarga)
-- Menggunakan UUID manual untuk keluarga agar dapat direferensikan oleh tabel anggota nanti
INSERT INTO keluarga (id, no_kk, nama_kepala, rt, rw, alamat) VALUES
('11111111-1111-1111-1111-111111111111', '3201010101010001', 'Budi Santoso', '01', '02', 'Jl. Merdeka No. 10'),
('22222222-2222-2222-2222-222222222222', '3201010101010002', 'Ahmad Hidayat', '02', '02', 'Jl. Sudirman Blok B No. 4'),
('33333333-3333-3333-3333-333333333333', '3201010101010003', 'Rahmat Pratama', '03', '02', 'Perumahan Asri Indah Kav. 12');

-- 2. Insert anggota keluarga (tabel anggota)
INSERT INTO anggota (keluarga_id, nama, nik, hubungan, tgl_lahir, jenis_kelamin) VALUES
-- Keluarga 1 (Budi)
('11111111-1111-1111-1111-111111111111', 'Budi Santoso', '3201011508750001', 'Kepala Keluarga', '1975-08-15', 'L'),
('11111111-1111-1111-1111-111111111111', 'Siti Aminah', '3201014502800001', 'Istri', '1980-02-05', 'P'),
('11111111-1111-1111-1111-111111111111', 'Rizky Santoso', '3201011210050001', 'Anak', '2005-10-12', 'L'),

-- Keluarga 2 (Ahmad)
('22222222-2222-2222-2222-222222222222', 'Ahmad Hidayat', '3201010804820002', 'Kepala Keluarga', '1982-04-08', 'L'),
('22222222-2222-2222-2222-222222222222', 'Nurul Fadhilah', '3201016809850002', 'Istri', '1985-09-28', 'P'),

-- Keluarga 3 (Rahmat)
('33333333-3333-3333-3333-333333333333', 'Rahmat Pratama', '3201011111700003', 'Kepala Keluarga', '1970-11-11', 'L'),
('33333333-3333-3333-3333-333333333333', 'Dewi Lestari', '3201015112750003', 'Istri', '1975-12-15', 'P'),
('33333333-3333-3333-3333-333333333333', 'Putri Pratama', '3201015606980003', 'Anak', '1998-06-16', 'P');

-- 3. Insert 2 program bansos
-- MENGGUNAKAN NULL SEMENTARA KARENA PLACEHOLDER UUID DITOLAK OLEH CONSTRAINT
INSERT INTO bansos (nama_program, penerima_id, jumlah_bantuan, periode, status, catatan) VALUES
('Bantuan Tunai Langsung (BLT) Desa', NULL, 600000, 'April 2026', 'tersalurkan', 'Diterima tunai di balai desa pada tanggal 5 April 2026'),
('Bantuan Pangan Non Tunai (BPNT)', NULL, 300000, 'Juni 2026', 'pending', 'Sedang menunggu distribusi paket sembako dari dinas sosial');

-- 4. Insert 3 kegiatan desa (1 sudah lewat, 2 mendatang)
INSERT INTO kegiatan (judul, deskripsi, tanggal, waktu_mulai, waktu_selesai, lokasi, kuota, status) VALUES
('Kerja Bakti Membersihkan Saluran Air', 'Gotong royong rutin warga RW 02 dalam rangka mengantisipasi musim penghujan.', '2026-03-10', '07:00:00', '11:00:00', 'Sepanjang Jalan Utama RW 02', 100, 'selesai'),
('Penyuluhan Kesehatan Lansia', 'Pemeriksaan tensi darah dan pemberian vitamin gratis.', '2026-05-15', '09:00:00', '12:00:00', 'Balai Desa', 50, 'aktif'),
('Pentas Seni Kemerdekaan', 'Perayaan 17 Agustus dimeriahkan oleh penampilan budaya dari Karang Taruna.', '2026-08-16', '19:00:00', '23:00:00', 'Lapangan Desa', 500, 'aktif');

-- 5. Insert 3 request surat (pending, diproses, selesai)
-- MENGGUNAKAN NULL SEMENTARA KARENA PLACEHOLDER UUID DITOLAK OLEH CONSTRAINT
INSERT INTO surat (pemohon_id, jenis_surat, keperluan, status, catatan_petugas) VALUES
(NULL, 'Keterangan Domisili', 'Syarat pembukaan rekening bank.', 'pending', NULL),
(NULL, 'Keterangan Usaha', 'Pengajuan KUR (Kredit Usaha Rakyat) ke Bank BRI.', 'diproses', 'Sedang dalam validasi Kasi Pemerintahan.'),
(NULL, 'Pengantar SKCK', 'Persyaratan pendaftaran kerja.', 'selesai', 'Surat sudah ditandatangani Kepala Desa dan siap diambil di meja pelayanan.');

-- 6. Insert 3 tagihan retribusi (belum bayar, lunas, jatuh tempo)
-- MENGGUNAKAN NULL SEMENTARA KARENA PLACEHOLDER UUID DITOLAK OLEH CONSTRAINT
INSERT INTO retribusi (warga_id, jenis, jumlah, jatuh_tempo, status, midtrans_id) VALUES
(NULL, 'Keamanan', 15000, '2026-04-30', 'belum_bayar', 'order-rtb-2026-04-sec-001'),
(NULL, 'Sampah', 20000, '2026-03-31', 'lunas', 'order-rtb-2026-03-smp-002'),
(NULL, 'Air Bersih', 50000, '2026-02-28', 'jatuh_tempo', 'order-rtb-2026-02-air-003');
