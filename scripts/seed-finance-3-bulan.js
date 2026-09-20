/**
 * Seed dummy data 3 bulan (Mei, Juni, Juli 2026) buat semua fitur Finance
 * Module (Fitur 0, 2, 3, 4, 5, 6) — akun & kategori dari finance-reference.md
 * bagian 1-2. Tutup buku dijalankan berurutan Mei -> Juni -> Juli biar
 * carry-forward saldo & Laba Ditahan antar bulan konsisten.
 *
 * Jalanin satu bulan per invocation (biar bisa commit per-milestone):
 *   node scripts/seed-finance-3-bulan.js mei
 *   node scripts/seed-finance-3-bulan.js juni
 *   node scripts/seed-finance-3-bulan.js juli
 *   node scripts/seed-finance-3-bulan.js verify   (cek balance 3 titik snapshot)
 */
const { PrismaClient } = require("@prisma/client");
const { createJurnalTransaksi } = require("../src/services/jurnal.service");
const jurnalCtrl = require("../src/controllers/jurnal.controller");
const accountingCtrl = require("../src/controllers/accounting.controller");
const prisma = new PrismaClient();

const PEGAWAI_ID = "cmq66v8cq0000jc78h1xi5ccz"; // Budi Santoso — dipakai sbg pengaju/approver/pembuat jurnal seed

function mockRes() {
  const res = {};
  res.status = (code) => {
    res._status = code;
    return res;
  };
  res.json = (body) => {
    res._body = body;
    return res;
  };
  return res;
}

async function getAkunMap() {
  const akuns = await prisma.akun.findMany();
  const map = {};
  for (const a of akuns) map[a.kode] = a;
  return map;
}

async function ensureBebanGaji() {
  const existing = await prisma.akun.findUnique({ where: { kode: "5.5001" } });
  if (existing) return existing;
  return prisma.akun.create({
    data: { kode: "5.5001", nama: "Beban Gaji Karyawan", jenis: "BEBAN", saldoAwal: 0 },
  });
}

async function jurnalLangsung({ tanggal, deskripsi, mode, baris }) {
  return prisma.$transaction(async (tx) => {
    const jurnal = await createJurnalTransaksi(tx, {
      tanggal,
      deskripsi,
      mode,
      baris,
      sumber: "MANUAL",
      status: "POSTED",
      createdBy: PEGAWAI_ID,
    });
    console.log(`  + [jurnal] ${jurnal.noJurnal} (${tanggal}) ${mode} - ${deskripsi}`);
    return jurnal;
  });
}

async function requestKeuanganApproved({ jenis, akunId, deskripsi, nominal, tanggal }) {
  const createRes = mockRes();
  await accountingCtrl.createRequestKeuangan(
    {
      body: { jenis, akunId, deskripsi, nominal, tanggal },
      user: { pegawaiId: PEGAWAI_ID },
      file: null,
    },
    createRes,
  );
  if (createRes._status && createRes._status >= 400) {
    throw new Error(`createRequestKeuangan gagal: ${JSON.stringify(createRes._body)}`);
  }
  const requestId = createRes._body.data.id;

  const approveRes = mockRes();
  await accountingCtrl.approveRequestKeuangan(
    { params: { id: requestId }, body: {}, user: { pegawaiId: PEGAWAI_ID } },
    approveRes,
  );
  if (approveRes._status && approveRes._status >= 400) {
    throw new Error(`approveRequestKeuangan gagal: ${JSON.stringify(approveRes._body)}`);
  }
  console.log(
    `  + [request->approved] ${jenis} "${deskripsi}" Rp${nominal.toLocaleString("id-ID")} (${tanggal})`,
  );
  return approveRes._body.data;
}

async function tutupBukuPeriode(periode) {
  const res = mockRes();
  await jurnalCtrl.tutupBuku({ body: { periode }, user: { pegawaiId: PEGAWAI_ID } }, res);
  if (res._status && res._status >= 400) {
    throw new Error(`tutupBuku gagal periode ${periode}: ${JSON.stringify(res._body)}`);
  }
  console.log(`  = Tutup Buku ${periode}: Laba Bersih ${res._body.data.labaRugiBersih.toLocaleString("id-ID")}`);
  return res._body.data;
}

async function neracaSnapshot(tanggal) {
  const res = mockRes();
  await jurnalCtrl.getNeracaSnapshot({ query: { tanggal } }, res);
  const d = res._body.data;
  console.log(
    `  = Neraca ${tanggal}: Aset ${d.totalAset.toLocaleString("id-ID")} | Liab+Modal ${(
      d.totalLiabilitas + d.totalModal
    ).toLocaleString("id-ID")} | isBalance=${d.isBalance}`,
  );
  return d;
}

// ─────────────────────────────────────────────
// MEI 2026 (periode 202605) — bulan pertama, saldoAwal akun dipakai apa
// adanya (belum ada carry-forward dari bulan lain).
// ─────────────────────────────────────────────
async function seedMei() {
  const a = await getAkunMap();
  const gaji = await ensureBebanGaji();

  await jurnalLangsung({
    tanggal: "2026-05-02",
    deskripsi: "Pendapatan Training batch Mei #1 (tunai)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: 4500000, keterangan: "Pelunasan training batch Mei #1" },
      { akunId: a["4.1001"].id, kredit: 4500000, keterangan: "Pelunasan training batch Mei #1" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-05-05",
    deskripsi: "Pendapatan Training batch Mei #2 (belum lunas)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.3001"].id, debit: 1500000, keterangan: "Invoice training batch Mei #2 belum lunas" },
      { akunId: a["4.1001"].id, kredit: 1500000, keterangan: "Invoice training batch Mei #2 belum lunas" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-05-08",
    deskripsi: "Pendapatan Sertifikasi BNSP Mei",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2002"].id, debit: 1500000, keterangan: "Sertifikasi BNSP Mei" },
      { akunId: a["4.2001"].id, kredit: 1500000, keterangan: "Sertifikasi BNSP Mei" },
    ],
  });

  await requestKeuanganApproved({
    jenis: "PEMASUKAN",
    akunId: a["4.3001"].id,
    deskripsi: "Jasa konsultasi HR Mei",
    nominal: 800000,
    tanggal: "2026-05-11",
  });

  await jurnalLangsung({
    tanggal: "2026-05-14",
    deskripsi: "Honor Instruktur Mei (kepotong PPh 21)",
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.1001"].id, debit: 1800000, keterangan: "Honor instruktur Mei" },
      { akunId: a["1.2001"].id, kredit: 1620000, keterangan: "Transfer honor instruktur (net PPh 21)" },
      { akunId: a["2.1002"].id, kredit: 180000, keterangan: "PPh 21 dipotong dari honor instruktur Mei" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-05-17",
    deskripsi: "Sewa Venue training Mei (sebagian belum dibayar)",
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.2001"].id, debit: 2500000, keterangan: "Sewa venue training Mei" },
      { akunId: a["1.2001"].id, kredit: 2100000, keterangan: "Pembayaran sewa venue (sebagian)" },
      { akunId: a["2.1003"].id, kredit: 400000, keterangan: "Sisa tagihan vendor venue Mei" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-05-20",
    deskripsi: "Beban Marketing Mei (iklan & promosi)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.3001"].id, debit: 400000, keterangan: "Iklan & promosi Mei" },
      { akunId: a["1.2001"].id, kredit: 400000, keterangan: "Iklan & promosi Mei" },
    ],
  });

  await requestKeuanganApproved({
    jenis: "PENGELUARAN",
    akunId: a["5.4001"].id,
    deskripsi: "ATK & konsumsi training Mei",
    nominal: 250000,
    tanggal: "2026-05-23",
  });

  await jurnalLangsung({
    tanggal: "2026-05-26",
    deskripsi: "Gaji Karyawan Mei",
    mode: "SIMPLE",
    baris: [
      { akunId: gaji.id, debit: 1000000, keterangan: "Gaji karyawan Mei" },
      { akunId: a["1.2001"].id, kredit: 1000000, keterangan: "Gaji karyawan Mei" },
    ],
  });

  await tutupBukuPeriode("202605");
  await neracaSnapshot("2026-05-30");
}

// ─────────────────────────────────────────────
// JUNI 2026 (periode 202606) — settlement hutang PPh21 & vendor venue Mei,
// pelunasan piutang Mei, plus aktivitas baru Juni.
// ─────────────────────────────────────────────
async function seedJuni() {
  const a = await getAkunMap();
  const gaji = await ensureBebanGaji();

  await jurnalLangsung({
    tanggal: "2026-06-02",
    deskripsi: "Bayar Hutang PPh 21 Mei ke kas negara",
    mode: "SIMPLE",
    baris: [
      { akunId: a["2.1002"].id, debit: 180000, keterangan: "Setor PPh 21 Mei" },
      { akunId: a["1.2001"].id, kredit: 180000, keterangan: "Setor PPh 21 Mei" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-04",
    deskripsi: "Bayar sisa Hutang Vendor Venue Mei",
    mode: "SIMPLE",
    baris: [
      { akunId: a["2.1003"].id, debit: 400000, keterangan: "Pelunasan vendor venue Mei" },
      { akunId: a["1.2001"].id, kredit: 400000, keterangan: "Pelunasan vendor venue Mei" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-06",
    deskripsi: "Pelunasan Piutang training batch Mei #2",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: 1500000, keterangan: "Pelunasan piutang training Mei #2" },
      { akunId: a["1.3001"].id, kredit: 1500000, keterangan: "Pelunasan piutang training Mei #2" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-09",
    deskripsi: "Pendapatan Training batch Juni #1 (tunai)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: 5200000, keterangan: "Pelunasan training batch Juni #1" },
      { akunId: a["4.1001"].id, kredit: 5200000, keterangan: "Pelunasan training batch Juni #1" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-12",
    deskripsi: "Pendapatan Training batch Juni #2 (belum lunas)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.3001"].id, debit: 1800000, keterangan: "Invoice training batch Juni #2 belum lunas" },
      { akunId: a["4.1001"].id, kredit: 1800000, keterangan: "Invoice training batch Juni #2 belum lunas" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-15",
    deskripsi: "Pendapatan Sertifikasi BNSP Juni",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2002"].id, debit: 1800000, keterangan: "Sertifikasi BNSP Juni" },
      { akunId: a["4.2001"].id, kredit: 1800000, keterangan: "Sertifikasi BNSP Juni" },
    ],
  });

  await requestKeuanganApproved({
    jenis: "PEMASUKAN",
    akunId: a["4.3001"].id,
    deskripsi: "Jasa konsultasi HR Juni",
    nominal: 900000,
    tanggal: "2026-06-18",
  });

  await jurnalLangsung({
    tanggal: "2026-06-21",
    deskripsi: "Honor Instruktur Juni (kepotong PPh 21)",
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.1001"].id, debit: 1900000, keterangan: "Honor instruktur Juni" },
      { akunId: a["1.2001"].id, kredit: 1710000, keterangan: "Transfer honor instruktur (net PPh 21)" },
      { akunId: a["2.1002"].id, kredit: 190000, keterangan: "PPh 21 dipotong dari honor instruktur Juni" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-24",
    deskripsi: "Sewa Venue training Juni (sebagian belum dibayar)",
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.2001"].id, debit: 2800000, keterangan: "Sewa venue training Juni" },
      { akunId: a["1.2001"].id, kredit: 2380000, keterangan: "Pembayaran sewa venue (sebagian)" },
      { akunId: a["2.1003"].id, kredit: 420000, keterangan: "Sisa tagihan vendor venue Juni" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-06-26",
    deskripsi: "Beban Marketing Juni (iklan & promosi)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.3001"].id, debit: 450000, keterangan: "Iklan & promosi Juni" },
      { akunId: a["1.2001"].id, kredit: 450000, keterangan: "Iklan & promosi Juni" },
    ],
  });

  await requestKeuanganApproved({
    jenis: "PENGELUARAN",
    akunId: a["5.4001"].id,
    deskripsi: "ATK & konsumsi training Juni",
    nominal: 280000,
    tanggal: "2026-06-28",
  });

  await jurnalLangsung({
    tanggal: "2026-06-29",
    deskripsi: "Gaji Karyawan Juni",
    mode: "SIMPLE",
    baris: [
      { akunId: gaji.id, debit: 1050000, keterangan: "Gaji karyawan Juni" },
      { akunId: a["1.2001"].id, kredit: 1050000, keterangan: "Gaji karyawan Juni" },
    ],
  });

  await tutupBukuPeriode("202606");
  await neracaSnapshot("2026-06-30");
}

// ─────────────────────────────────────────────
// JULI 2026 (periode 202607) — settlement hutang PPh21 & vendor venue Juni,
// pelunasan piutang Juni, plus aktivitas baru Juli.
// ─────────────────────────────────────────────
async function seedJuli() {
  const a = await getAkunMap();
  const gaji = await ensureBebanGaji();

  await jurnalLangsung({
    tanggal: "2026-07-02",
    deskripsi: "Bayar Hutang PPh 21 Juni ke kas negara",
    mode: "SIMPLE",
    baris: [
      { akunId: a["2.1002"].id, debit: 190000, keterangan: "Setor PPh 21 Juni" },
      { akunId: a["1.2001"].id, kredit: 190000, keterangan: "Setor PPh 21 Juni" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-04",
    deskripsi: "Bayar sisa Hutang Vendor Venue Juni",
    mode: "SIMPLE",
    baris: [
      { akunId: a["2.1003"].id, debit: 420000, keterangan: "Pelunasan vendor venue Juni" },
      { akunId: a["1.2001"].id, kredit: 420000, keterangan: "Pelunasan vendor venue Juni" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-06",
    deskripsi: "Pelunasan Piutang training batch Juni #2",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: 1800000, keterangan: "Pelunasan piutang training Juni #2" },
      { akunId: a["1.3001"].id, kredit: 1800000, keterangan: "Pelunasan piutang training Juni #2" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-09",
    deskripsi: "Pendapatan Training batch Juli #1 (tunai)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: 6000000, keterangan: "Pelunasan training batch Juli #1" },
      { akunId: a["4.1001"].id, kredit: 6000000, keterangan: "Pelunasan training batch Juli #1" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-12",
    deskripsi: "Pendapatan Training batch Juli #2 (belum lunas)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.3001"].id, debit: 2000000, keterangan: "Invoice training batch Juli #2 belum lunas" },
      { akunId: a["4.1001"].id, kredit: 2000000, keterangan: "Invoice training batch Juli #2 belum lunas" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-15",
    deskripsi: "Pendapatan Sertifikasi BNSP Juli",
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2002"].id, debit: 2000000, keterangan: "Sertifikasi BNSP Juli" },
      { akunId: a["4.2001"].id, kredit: 2000000, keterangan: "Sertifikasi BNSP Juli" },
    ],
  });

  await requestKeuanganApproved({
    jenis: "PEMASUKAN",
    akunId: a["4.3001"].id,
    deskripsi: "Jasa konsultasi HR Juli",
    nominal: 1000000,
    tanggal: "2026-07-18",
  });

  await jurnalLangsung({
    tanggal: "2026-07-21",
    deskripsi: "Honor Instruktur Juli (kepotong PPh 21)",
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.1001"].id, debit: 2000000, keterangan: "Honor instruktur Juli" },
      { akunId: a["1.2001"].id, kredit: 1800000, keterangan: "Transfer honor instruktur (net PPh 21)" },
      { akunId: a["2.1002"].id, kredit: 200000, keterangan: "PPh 21 dipotong dari honor instruktur Juli" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-24",
    deskripsi: "Sewa Venue training Juli (sebagian belum dibayar)",
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.2001"].id, debit: 3000000, keterangan: "Sewa venue training Juli" },
      { akunId: a["1.2001"].id, kredit: 2600000, keterangan: "Pembayaran sewa venue (sebagian)" },
      { akunId: a["2.1003"].id, kredit: 400000, keterangan: "Sisa tagihan vendor venue Juli" },
    ],
  });

  await jurnalLangsung({
    tanggal: "2026-07-26",
    deskripsi: "Beban Marketing Juli (iklan & promosi)",
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.3001"].id, debit: 500000, keterangan: "Iklan & promosi Juli" },
      { akunId: a["1.2001"].id, kredit: 500000, keterangan: "Iklan & promosi Juli" },
    ],
  });

  await requestKeuanganApproved({
    jenis: "PENGELUARAN",
    akunId: a["5.4001"].id,
    deskripsi: "ATK & konsumsi training Juli",
    nominal: 300000,
    tanggal: "2026-07-28",
  });

  await jurnalLangsung({
    tanggal: "2026-07-30",
    deskripsi: "Gaji Karyawan Juli",
    mode: "SIMPLE",
    baris: [
      { akunId: gaji.id, debit: 1100000, keterangan: "Gaji karyawan Juli" },
      { akunId: a["1.2001"].id, kredit: 1100000, keterangan: "Gaji karyawan Juli" },
    ],
  });

  await tutupBukuPeriode("202607");
  await neracaSnapshot("2026-07-31");
}

async function verify() {
  console.log("=== Verifikasi Neraca 3 titik snapshot ===");
  const mei = await neracaSnapshot("2026-05-30");
  const juni = await neracaSnapshot("2026-06-30");
  const juli = await neracaSnapshot("2026-07-31");
  const allBalance = mei.isBalance && juni.isBalance && juli.isBalance;
  console.log(allBalance ? "SEMUA BALANCE ✅" : "ADA YANG TIDAK BALANCE ❌");

  console.log("=== Sebaran mutasi per akun (Buku Besar) ===");
  const ringkasanRes = mockRes();
  await jurnalCtrl.getBukuBesarRingkasan({ query: {} }, ringkasanRes);
  for (const item of ringkasanRes._body.data) {
    const jumlahBaris = await prisma.jurnalBaris.count({ where: { akunId: item.akun.id } });
    console.log(
      `  ${item.akun.kode} ${item.akun.nama}: ${jumlahBaris} baris mutasi, saldo akhir ${item.saldoAkhir.toLocaleString("id-ID")}`,
    );
  }

  console.log("=== Kas & Bank ===");
  const kasBankRes = mockRes();
  await jurnalCtrl.getKasBank({ query: {} }, kasBankRes);
  for (const m of kasBankRes._body.data.mutasi) {
    console.log(`  ${m.akun.kode} ${m.akun.nama}: ${m.rows.length} mutasi, saldo akhir ${m.saldoAkhir.toLocaleString("id-ID")}`);
  }
}

async function main() {
  const target = process.argv[2];
  if (target === "mei") await seedMei();
  else if (target === "juni") await seedJuni();
  else if (target === "juli") await seedJuli();
  else if (target === "verify") await verify();
  else {
    console.log("Usage: node scripts/seed-finance-3-bulan.js <mei|juni|juli|verify>");
    process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
