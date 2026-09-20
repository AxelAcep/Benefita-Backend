/**
 * Seed dummy data 1 TAHUN PENUH (Jan-Des 2026) buat semua fitur Finance
 * Module real-time (Fitur 0, 2, 3, 4, 5, 6) — skala nominal disesuaikan
 * biar mirip laporan keuangan asli (ratusan juta/bulan), bukan cuma
 * beberapa juta. Gak ada tutup buku lagi — semua laporan real-time.
 *
 * Jalanin per bulan (biar bisa dipantau progressnya & gak timeout):
 *   node scripts/seed-finance-1-tahun.js <1-12>
 *   node scripts/seed-finance-1-tahun.js all      (semua 12 bulan sekaligus)
 *   node scripts/seed-finance-1-tahun.js verify    (cek Neraca real-time & sebaran akun)
 */
const { PrismaClient } = require("@prisma/client");
const { createJurnalTransaksi } = require("../src/services/jurnal.service");
const jurnalCtrl = require("../src/controllers/jurnal.controller");
const accountingCtrl = require("../src/controllers/accounting.controller");
const prisma = new PrismaClient();

const PEGAWAI_ID = "cmq66v8cq0000jc78h1xi5ccz"; // Budi Santoso
const TAHUN = 2026;

function mockRes() {
  const res = {};
  res.status = (c) => {
    res._status = c;
    return res;
  };
  res.json = (b) => {
    res._body = b;
    return res;
  };
  return res;
}

function tgl(bulan, hari) {
  return `${TAHUN}-${String(bulan).padStart(2, "0")}-${String(hari).padStart(2, "0")}`;
}

async function getAkunMap() {
  const akuns = await prisma.akun.findMany();
  const map = {};
  for (const a of akuns) map[a.kode] = a;
  return map;
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
    return jurnal;
  });
}

async function requestKeuanganApproved({ jenis, akunId, deskripsi, nominal, tanggal }) {
  const createRes = mockRes();
  await accountingCtrl.createRequestKeuangan(
    { body: { jenis, akunId, deskripsi, nominal, tanggal }, user: { pegawaiId: PEGAWAI_ID }, file: null },
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
  return approveRes._body.data;
}

// Growth trend + variasi naik-turun kecil per bulan (deterministik, bukan
// Math.random, biar hasil seed reproducible tiap dijalanin ulang).
function trend(base, bulan, amplitudo = 0.08) {
  const growth = 1 + (bulan - 1) * 0.015; // naik ~1.5%/bulan sepanjang tahun
  const wave = 1 + amplitudo * Math.sin(bulan * 1.7); // variasi naik-turun
  return Math.round((base * growth * wave) / 100000) * 100000; // bulatin ke ratusan ribu
}

async function seedBulan(bulan) {
  const a = await getAkunMap();

  const pendapatanTraining = trend(280000000, bulan);
  const pendapatanSertifikasi = trend(95000000, bulan, 0.1);
  const pendapatanKonsultasi = trend(60000000, bulan, 0.12);
  const bebanHonor = trend(75000000, bulan, 0.05);
  const bebanSewaVenue = trend(105000000, bulan, 0.06);
  const bebanMarketing = trend(22000000, bulan, 0.15);
  const bebanOperasional = trend(13000000, bulan, 0.15);
  const bebanGaji = trend(42000000, bulan, 0.02);

  // Split training: sebagian cash, sebagian piutang (belum lunas).
  const trainingPiutang = Math.round(pendapatanTraining * 0.25 / 100000) * 100000;
  const trainingCash = pendapatanTraining - trainingPiutang;

  const pphHonor = Math.round((bebanHonor * 0.1) / 100000) * 100000; // PPh 21 10%
  const honorCash = bebanHonor - pphHonor;

  const venuePayable = Math.round((bebanSewaVenue * 0.12) / 100000) * 100000;
  const venueCash = bebanSewaVenue - venuePayable;

  const rows = [];

  // 1-3: pelunasan piutang & settlement hutang bulan sebelumnya (kecuali Januari)

  if (bulan > 1) {
    rows.push({
      tanggal: tgl(bulan, 2),
      deskripsi: `Setor Hutang PPh 21 bulan lalu ke kas negara`,
      mode: "SIMPLE",
      baris: (() => {
        // Harus PERSIS sama formula pphHonor bulan lalu (Math.round bulat
        // ke 100rb) — kalau dihitung ulang tanpa pembulatan yang sama,
        // nominalnya beda dikit dari yang tercatat sebagai hutang, bikin
        // Neraca gak balance kumulatif makin lama makin ngaco.
        const pphBulanLalu = Math.round((trend(75000000, bulan - 1, 0.05) * 0.1) / 100000) * 100000;
        return [
          { akunId: a["2.1002"].id, debit: pphBulanLalu, keterangan: "Setor PPh 21 bulan lalu" },
          { akunId: a["1.2001"].id, kredit: pphBulanLalu, keterangan: "Setor PPh 21 bulan lalu" },
        ];
      })(),
    });
    rows.push({
      tanggal: tgl(bulan, 3),
      deskripsi: `Bayar sisa Hutang Vendor Venue bulan lalu`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["2.1003"].id, debit: Math.round((trend(105000000, bulan - 1, 0.06) * 0.12) / 100000) * 100000, keterangan: "Pelunasan vendor venue bulan lalu" },
        { akunId: a["1.2001"].id, kredit: Math.round((trend(105000000, bulan - 1, 0.06) * 0.12) / 100000) * 100000, keterangan: "Pelunasan vendor venue bulan lalu" },
      ],
    });
    rows.push({
      tanggal: tgl(bulan, 5),
      deskripsi: `Pelunasan Piutang training bulan lalu`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.2001"].id, debit: Math.round((trend(280000000, bulan - 1) * 0.25) / 100000) * 100000, keterangan: "Pelunasan piutang training bulan lalu" },
        { akunId: a["1.3001"].id, kredit: Math.round((trend(280000000, bulan - 1) * 0.25) / 100000) * 100000, keterangan: "Pelunasan piutang training bulan lalu" },
      ],
    });
  }

  rows.push({
    tanggal: tgl(bulan, 7),
    deskripsi: `Pendapatan Training (tunai) - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: trainingCash, keterangan: "Pelunasan training tunai" },
      { akunId: a["4.1001"].id, kredit: trainingCash, keterangan: "Pelunasan training tunai" },
    ],
  });

  rows.push({
    tanggal: tgl(bulan, 9),
    deskripsi: `Pendapatan Training (belum lunas) - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.3001"].id, debit: trainingPiutang, keterangan: "Invoice training belum lunas" },
      { akunId: a["4.1001"].id, kredit: trainingPiutang, keterangan: "Invoice training belum lunas" },
    ],
  });

  rows.push({
    tanggal: tgl(bulan, 11),
    deskripsi: `Pendapatan Sertifikasi BNSP - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2002"].id, debit: pendapatanSertifikasi, keterangan: "Sertifikasi BNSP" },
      { akunId: a["4.2001"].id, kredit: pendapatanSertifikasi, keterangan: "Sertifikasi BNSP" },
    ],
  });

  rows.push({
    tanggal: tgl(bulan, 13),
    deskripsi: `Jasa Konsultasi HR - ${bulan}/${TAHUN}`,
    mode: "PEMASUKAN_REQUEST",
    akunId: a["4.3001"].id,
    nominal: pendapatanKonsultasi,
  });

  rows.push({
    tanggal: tgl(bulan, 15),
    deskripsi: `Honor Instruktur ${bulan}/${TAHUN} (kepotong PPh 21)`,
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.1001"].id, debit: bebanHonor, keterangan: "Honor instruktur" },
      { akunId: a["1.2001"].id, kredit: honorCash, keterangan: "Transfer honor instruktur (net PPh 21)" },
      { akunId: a["2.1002"].id, kredit: pphHonor, keterangan: "PPh 21 dipotong dari honor instruktur" },
    ],
  });

  rows.push({
    tanggal: tgl(bulan, 18),
    deskripsi: `Sewa Venue training ${bulan}/${TAHUN} (sebagian belum dibayar)`,
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.2001"].id, debit: bebanSewaVenue, keterangan: "Sewa venue training" },
      { akunId: a["1.2001"].id, kredit: venueCash, keterangan: "Pembayaran sewa venue (sebagian)" },
      { akunId: a["2.1003"].id, kredit: venuePayable, keterangan: "Sisa tagihan vendor venue" },
    ],
  });

  rows.push({
    tanggal: tgl(bulan, 21),
    deskripsi: `Beban Marketing ${bulan}/${TAHUN} (iklan & promosi)`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.3001"].id, debit: bebanMarketing, keterangan: "Iklan & promosi" },
      { akunId: a["1.1001"].id, kredit: bebanMarketing, keterangan: "Iklan & promosi" },
    ],
  });

  rows.push({
    tanggal: tgl(bulan, 24),
    deskripsi: `ATK & konsumsi training ${bulan}/${TAHUN}`,
    mode: "PENGELUARAN_REQUEST",
    akunId: a["5.4001"].id,
    nominal: bebanOperasional,
  });

  rows.push({
    tanggal: tgl(bulan, 27),
    deskripsi: `Gaji Karyawan ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.5001"].id, debit: bebanGaji, keterangan: "Gaji karyawan" },
      { akunId: a["1.2001"].id, kredit: bebanGaji, keterangan: "Gaji karyawan" },
    ],
  });

  let count = 0;
  for (const row of rows) {
    if (row.mode === "PEMASUKAN_REQUEST") {
      await requestKeuanganApproved({
        jenis: "PEMASUKAN",
        akunId: row.akunId,
        deskripsi: row.deskripsi,
        nominal: row.nominal,
        tanggal: row.tanggal,
      });
    } else if (row.mode === "PENGELUARAN_REQUEST") {
      await requestKeuanganApproved({
        jenis: "PENGELUARAN",
        akunId: row.akunId,
        deskripsi: row.deskripsi,
        nominal: row.nominal,
        tanggal: row.tanggal,
      });
    } else {
      await jurnalLangsung(row);
    }
    count++;
  }

  console.log(`  Bulan ${bulan}/${TAHUN}: ${count} entry jurnal disimpan.`);
}

async function verify() {
  console.log("=== Neraca real-time per akhir bulan ===");
  for (const bulan of [3, 6, 9, 12]) {
    const lastDay = new Date(TAHUN, bulan, 0).getDate();
    const tanggal = tgl(bulan, lastDay);
    const res = mockRes();
    await jurnalCtrl.getNeracaSnapshot({ query: { tanggal } }, res);
    const d = res._body.data;
    console.log(
      `  ${tanggal}: Aset ${d.totalAset.toLocaleString("id-ID")} | Liab+Modal ${(d.totalLiabilitas + d.totalModal).toLocaleString("id-ID")} | isBalance=${d.isBalance} | Laba Berjalan ${d.labaBerjalan.toLocaleString("id-ID")}`,
    );
  }

  console.log("=== Laba Rugi per bulan (sample: Jan, Jun, Des) ===");
  for (const bulan of [1, 6, 12]) {
    const lastDay = new Date(TAHUN, bulan, 0).getDate();
    const res = mockRes();
    await jurnalCtrl.getLaporanLabaRugi(
      { query: { startDate: tgl(bulan, 1), endDate: tgl(bulan, lastDay) } },
      res,
    );
    const d = res._body.data;
    console.log(
      `  Bulan ${bulan}: Pendapatan ${d.totalPendapatan.toLocaleString("id-ID")} | Beban ${d.totalBeban.toLocaleString("id-ID")} | Laba ${d.labaRugiBersih.toLocaleString("id-ID")}`,
    );
  }

  console.log("=== Sebaran mutasi per akun (real-time, all-time) ===");
  const ringkasanRes = mockRes();
  await jurnalCtrl.getBukuBesarRingkasan({ query: {} }, ringkasanRes);
  let totalEntries = 0;
  for (const item of ringkasanRes._body.data) {
    const jumlahBaris = await prisma.jurnalBaris.count({ where: { akunId: item.akun.id } });
    totalEntries += jumlahBaris;
    console.log(`  ${item.akun.kode} ${item.akun.nama}: ${jumlahBaris} baris mutasi, saldo akhir ${item.saldoAkhir.toLocaleString("id-ID")}`);
  }

  const totalJurnal = await prisma.jurnalTransaksi.count();
  console.log(`Total jurnal transaksi: ${totalJurnal}`);

  console.log("=== Kas & Bank (all-time) ===");
  const kasBankRes = mockRes();
  await jurnalCtrl.getKasBank({ query: {} }, kasBankRes);
  for (const m of kasBankRes._body.data.mutasi) {
    console.log(`  ${m.akun.kode} ${m.akun.nama}: ${m.rows.length} mutasi, saldo akhir ${m.saldoAkhir.toLocaleString("id-ID")}`);
  }
}

async function main() {
  const target = process.argv[2];
  if (target === "all") {
    for (let bulan = 1; bulan <= 12; bulan++) {
      await seedBulan(bulan);
    }
  } else if (target === "verify") {
    await verify();
  } else if (target && /^([1-9]|1[0-2])$/.test(target)) {
    await seedBulan(parseInt(target, 10));
  } else {
    console.log("Usage: node scripts/seed-finance-1-tahun.js <1-12|all|verify>");
    process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
