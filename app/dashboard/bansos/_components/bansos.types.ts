import { Bansos } from "@/types";

export interface BansosWithRelations extends Bansos {
  profiles: { nama: string; rt: string; rw: string } | null;
  keluarga: { no_kk: string; nama_kepala: string } | null;
}

export interface ProgramSummary {
  nama_program: string;
  total_penerima: number;
  jumlah_bantuan: number;
  periode: string;
  aktif: boolean;
}
