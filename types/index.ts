export interface Profile {
  id: string; // uuid, FK to auth.users
  nama: string;
  role: "manager" | "warga";
  rt: string;
  rw: string;
  no_hp: string;
  created_at: string;
  updated_at: string;
}

export interface Keluarga {
  id: string; // uuid
  no_kk: string;
  nama_kepala: string;
  rt: string;
  rw: string;
  alamat: string;
  created_at: string;
  updated_at: string;
}

export interface Anggota {
  id: string; // uuid
  keluarga_id: string; // FK to keluarga
  nama: string;
  nik: string;
  hubungan: string;
  tgl_lahir: string; // date format, e.g. 'YYYY-MM-DD'
  jenis_kelamin: "L" | "P";
  created_at: string;
  updated_at: string;
}

export interface Bansos {
  id: string; // uuid
  nama_program: string;
  penerima_id: string | null; // FK to profiles, null means it's a program definition row
  jumlah_bantuan: number;
  periode: string;
  status: "pending" | "tersalurkan";
  catatan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Kegiatan {
  id: string; // uuid
  judul: string;
  deskripsi: string;
  tanggal: string; // date format, e.g. 'YYYY-MM-DD'
  waktu_mulai: string; // time format, e.g. 'HH:mm'
  waktu_selesai: string; // time format, e.g. 'HH:mm'
  lokasi: string;
  kuota: number | null;
  status: "aktif" | "selesai" | "dibatalkan";
  catatan_tambahan?: string | null;
  alasan_batal?: string | null;
  created_at: string;
  updated_at: string;
  peserta_kegiatan?: { count: number }[];
}

export interface PesertaKegiatan {
  id: string; // uuid
  kegiatan_id: string; // FK to kegiatan
  warga_id: string; // FK to profiles
  waktu_daftar: string; // timestamptz
  catatan?: string | null;
  created_at: string; // timestamptz
  profiles?: Profile; // Relasi ke tabel profiles
}

export interface Surat {
  id: string; // uuid
  pemohon_id: string; // FK to profiles
  jenis_surat: string;
  keperluan: string;
  status: "pending" | "diproses" | "selesai" | "ditolak";
  catatan_petugas?: string | null;
  file_urls?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Retribusi {
  id: string; // uuid
  warga_id: string; // FK to profiles
  jenis: string;
  jumlah: number;
  jatuh_tempo: string; // date format
  status: "belum_bayar" | "lunas" | "jatuh_tempo";
  midtrans_id?: string | null;
  created_at: string;
  updated_at: string;
}
