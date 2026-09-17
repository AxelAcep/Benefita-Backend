// services/jurnal.service.js
//
// Logic inti Jurnal Keuangan (double-entry) yang dipakai bareng dari
// beberapa tempat: controller Jurnal Keuangan sendiri (Fitur 2), DAN
// approveRequestKeuangan di accounting.controller.js (Fitur 0 — auto
// generate jurnal pas request di-approve). Ditaruh di sini (bukan di
// salah satu controller) biar gak circular-require.

const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

// Akun jenis ASET & BEBAN itu "debit-normal" (saldo nambah kalau didebit).
// Akun jenis LIABILITAS, MODAL, PENDAPATAN itu "kredit-normal" (saldo
// nambah kalau dikredit). Ini konvensi akuntansi standar, dipakai di
// Buku Besar, Laba Rugi, dan Neraca.
const DEBIT_NORMAL_JENIS = ["ASET", "BEBAN"];

function isDebitNormal(jenisAkun) {
  return DEBIT_NORMAL_JENIS.includes(jenisAkun);
}

// Mutasi bersih 1 baris jurnal terhadap saldo akun, sesuai normal balance
// jenis akunnya.
function mutasiBersih(jenisAkun, debit, kredit) {
  const d = Number(debit);
  const k = Number(kredit);
  return isDebitNormal(jenisAkun) ? d - k : k - d;
}

function toPeriode(tanggal) {
  const d = new Date(tanggal);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

// Format: JRN/YYYYMM/0001 — urut per periode, reset tiap bulan.
async function generateNoJurnal(tx, periode) {
  const last = await tx.jurnalTransaksi.findFirst({
    where: { noJurnal: { startsWith: `JRN/${periode}/` } },
    orderBy: { noJurnal: "desc" },
  });
  let num = 1;
  if (last) {
    const match = last.noJurnal.match(/(\d+)$/);
    if (match) num = parseInt(match[1], 10) + 1;
  }
  return `JRN/${periode}/${String(num).padStart(4, "0")}`;
}

// Validasi array baris jurnal: minimal 2 baris, tiap baris cuma isi salah
// satu (debit XOR kredit) dan > 0, dan total debit harus = total kredit.
// Return { valid, message, totalDebit, totalKredit } — dipanggil dari
// controller SEBELUM insert, dan dari createJurnalTransaksi lagi sebagai
// jaring pengaman kedua (defense in depth, jangan cuma percaya caller).
function validasiBarisJurnal(baris) {
  if (!Array.isArray(baris) || baris.length < 2) {
    return { valid: false, message: "Jurnal minimal harus punya 2 baris." };
  }

  let totalDebit = 0;
  let totalKredit = 0;

  for (const [i, b] of baris.entries()) {
    if (!b.akunId) {
      return { valid: false, message: `Baris ${i + 1}: akun wajib dipilih.` };
    }
    const debit = Number(b.debit || 0);
    const kredit = Number(b.kredit || 0);
    if (debit < 0 || kredit < 0) {
      return { valid: false, message: `Baris ${i + 1}: nominal gak boleh negatif.` };
    }
    if (debit > 0 && kredit > 0) {
      return {
        valid: false,
        message: `Baris ${i + 1}: isi salah satu aja, Uang Masuk (debit) ATAU Uang Keluar (kredit), gak boleh dua-duanya.`,
      };
    }
    if (debit === 0 && kredit === 0) {
      return { valid: false, message: `Baris ${i + 1}: nominal wajib diisi.` };
    }
    totalDebit += debit;
    totalKredit += kredit;
  }

  // Toleransi pembulatan kecil (floating point) — bukan exact 0.
  const selisih = Math.round((totalDebit - totalKredit) * 100) / 100;
  if (selisih !== 0) {
    return {
      valid: false,
      message: `Belum balance — total Uang Masuk (${totalDebit}) harus sama dengan total Uang Keluar (${totalKredit}).`,
      totalDebit,
      totalKredit,
    };
  }

  return { valid: true, totalDebit, totalKredit };
}

/**
 * Buat 1 transaksi jurnal (header + baris) dalam sebuah transaction Prisma
 * yang sudah berjalan (`tx`). Caller WAJIB udah validasi periode gak CLOSED
 * sebelum manggil ini.
 */
async function createJurnalTransaksi(tx, {
  tanggal,
  deskripsi,
  mode = "SIMPLE",
  baris,
  sumber = "MANUAL",
  status = "POSTED",
  createdBy = null,
}) {
  const validasi = validasiBarisJurnal(baris);
  if (!validasi.valid) {
    throw new Error(validasi.message);
  }

  const tanggalDate = new Date(tanggal);
  const periode = toPeriode(tanggalDate);
  const noJurnal = await generateNoJurnal(tx, periode);

  const transaksi = await tx.jurnalTransaksi.create({
    data: {
      noJurnal,
      tanggal: tanggalDate,
      deskripsi,
      mode,
      status,
      totalNominal: validasi.totalDebit,
      periode,
      sumber,
      createdBy,
      closedAt: status === "CLOSED" ? new Date() : null,
      baris: {
        create: baris.map((b) => ({
          akunId: parseInt(b.akunId),
          debit: Number(b.debit || 0),
          kredit: Number(b.kredit || 0),
          keterangan: b.keterangan || null,
        })),
      },
    },
    include: {
      baris: { include: { akun: { select: { id: true, kode: true, nama: true, jenis: true } } } },
    },
  });

  return transaksi;
}

// Cari akun MODAL "Laba Ditahan" (buat Tutup Buku), auto-create kalau
// belum ada — biar Tutup Buku gak pernah gagal cuma gara-gara lupa bikin
// akun ini duluan.
async function findOrCreateLabaDitahan(tx) {
  let akun = await tx.akun.findFirst({
    where: { jenis: "MODAL", nama: { equals: "Laba Ditahan", mode: "insensitive" } },
  });
  if (!akun) {
    akun = await tx.akun.create({
      data: { nama: "Laba Ditahan", jenis: "MODAL", saldoAwal: 0 },
    });
  }
  return akun;
}

module.exports = {
  prisma,
  isDebitNormal,
  mutasiBersih,
  toPeriode,
  generateNoJurnal,
  validasiBarisJurnal,
  createJurnalTransaksi,
  findOrCreateLabaDitahan,
};
