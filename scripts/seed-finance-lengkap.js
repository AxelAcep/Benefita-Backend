/**
 * Seed dummy data LENGKAP — chart of account jauh lebih kaya (~85 akun,
 * mirip struktur TB asli yang dikasih user: Kas & Bank, Piutang Usaha/
 * Lainnya, Uang Muka, Beban Dibayar Dimuka, Aktiva Tetap, Hutang Lancar/
 * JP, Modal, Harga Pokok Jasa, Beban Penjualan/Administrasi) + jurnal 1
 * tahun penuh dengan volume jauh lebih banyak per bulan (template-driven,
 * bukan hand-written per entry) biar Buku Besar & Neraca keliatan "hidup"
 * buat demo. SEMUA ANGKA DUMMY — bukan data finansial asli Benefita.
 *
 * Jalanin:
 *   node scripts/seed-finance-lengkap.js akun     (bikin/lengkapi Master Akun)
 *   node scripts/seed-finance-lengkap.js <1-12>   (seed jurnal 1 bulan)
 *   node scripts/seed-finance-lengkap.js all      (seed jurnal 12 bulan)
 *   node scripts/seed-finance-lengkap.js verify   (cek balance & sebaran)
 */
const { PrismaClient } = require("@prisma/client");
const { createJurnalTransaksi } = require("../src/services/jurnal.service");
const jurnalCtrl = require("../src/controllers/jurnal.controller");
const accountingCtrl = require("../src/controllers/accounting.controller");
const prisma = new PrismaClient();

const PEGAWAI_ID = "cmq66v8cq0000jc78h1xi5ccz";
const TAHUN = 2026;

function mockRes() {
  const res = {};
  res.status = (c) => { res._status = c; return res; };
  res.json = (b) => { res._body = b; return res; };
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

async function upsertAkun(data) {
  const existing = await prisma.akun.findUnique({ where: { kode: data.kode } });
  if (existing) {
    if (existing.kategori !== data.kategori || existing.isKasBank !== !!data.isKasBank) {
      return prisma.akun.update({ where: { kode: data.kode }, data: { kategori: data.kategori, isKasBank: !!data.isKasBank } });
    }
    return existing;
  }
  return prisma.akun.create({ data: { saldoAwal: 0, isKasBank: false, ...data } });
}

// ─────────────────────────────────────────────
// MASTER AKUN — chart of account lengkap (dummy)
// ─────────────────────────────────────────────
async function seedAkun() {
  const akun = [
    // ASET — Kas & Bank
    { kode: "1.1001", nama: "Kas Kecil", jenis: "ASET", kategori: "KAS_BANK", isKasBank: true },
    { kode: "1.2001", nama: "Bank BCA", jenis: "ASET", kategori: "KAS_BANK", isKasBank: true },
    { kode: "1.2002", nama: "Bank Mandiri Pancoran", jenis: "ASET", kategori: "KAS_BANK", isKasBank: true },
    { kode: "1.2003", nama: "Bank Mandiri Cikarang", jenis: "ASET", kategori: "KAS_BANK", isKasBank: true },
    { kode: "1.2004", nama: "Bank Permata", jenis: "ASET", kategori: "KAS_BANK", isKasBank: true },
    { kode: "1.2005", nama: "Deposito Berjangka", jenis: "ASET", kategori: "KAS_BANK", isKasBank: true },

    // ASET — Piutang Usaha
    { kode: "1.3001", nama: "Piutang Peserta", jenis: "ASET", kategori: "PIUTANG_USAHA" },
    { kode: "1.3002", nama: "Piutang Usaha Lain-Lain", jenis: "ASET", kategori: "PIUTANG_USAHA" },

    // ASET — Piutang Lainnya
    { kode: "1.4001", nama: "Piutang Pemegang Saham", jenis: "ASET", kategori: "PIUTANG_LAINNYA" },
    { kode: "1.4002", nama: "Piutang Pinjaman Karyawan", jenis: "ASET", kategori: "PIUTANG_LAINNYA" },

    // ASET — Uang Muka
    { kode: "1.5101", nama: "Uang Muka Perjalanan Dinas", jenis: "ASET", kategori: "UANG_MUKA" },
    { kode: "1.5102", nama: "Uang Muka Pembelian Barang", jenis: "ASET", kategori: "UANG_MUKA" },

    // ASET — Beban Dibayar Dimuka
    { kode: "1.6001", nama: "PPh Pasal 23 Dibayar Dimuka", jenis: "ASET", kategori: "BEBAN_DIBAYAR_DIMUKA" },
    { kode: "1.6002", nama: "PPh Pasal 25 Dibayar Dimuka", jenis: "ASET", kategori: "BEBAN_DIBAYAR_DIMUKA" },
    { kode: "1.6003", nama: "Asuransi Dibayar Dimuka", jenis: "ASET", kategori: "BEBAN_DIBAYAR_DIMUKA" },

    // ASET — Aktiva Tetap
    { kode: "1.7001", nama: "Kendaraan", jenis: "ASET", kategori: "AKTIVA_TETAP" },
    { kode: "1.7002", nama: "Peralatan Kantor", jenis: "ASET", kategori: "AKTIVA_TETAP" },
    { kode: "1.7003", nama: "Peralatan Proyek", jenis: "ASET", kategori: "AKTIVA_TETAP" },
    { kode: "1.7004", nama: "Perabotan Kantor", jenis: "ASET", kategori: "AKTIVA_TETAP" },
    { kode: "1.8001", nama: "Akumulasi Penyusutan Kendaraan", jenis: "ASET", kategori: "AKTIVA_TETAP" },
    { kode: "1.8002", nama: "Akumulasi Penyusutan Peralatan Kantor", jenis: "ASET", kategori: "AKTIVA_TETAP" },
    { kode: "1.8003", nama: "Akumulasi Penyusutan Peralatan Proyek", jenis: "ASET", kategori: "AKTIVA_TETAP" },

    // LIABILITAS — Hutang Lancar
    { kode: "2.1001", nama: "Hutang Usaha", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1002", nama: "Hutang PPh Pasal 21", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1003", nama: "Hutang Vendor Venue", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1004", nama: "Hutang Lain-Lain", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1005", nama: "Hutang BPJS Ketenagakerjaan", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1006", nama: "Hutang BPJS Kesehatan", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1007", nama: "Hutang PPh Pasal 23", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1008", nama: "Hutang PPh Pasal 25", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1009", nama: "Hutang PPh Final", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },
    { kode: "2.1010", nama: "Hutang PPN Keluaran", jenis: "LIABILITAS", kategori: "HUTANG_LANCAR" },

    // LIABILITAS — Hutang Jangka Panjang
    { kode: "2.2001", nama: "Hutang Jangka Panjang Pemegang Saham", jenis: "LIABILITAS", kategori: "HUTANG_JANGKA_PANJANG" },
    { kode: "2.2002", nama: "Hutang Dividen", jenis: "LIABILITAS", kategori: "HUTANG_JANGKA_PANJANG" },

    // MODAL
    { kode: "3.1001", nama: "Modal Dasar", jenis: "MODAL", kategori: "MODAL_AKUN" },
    { kode: "3.1002", nama: "Tambahan Modal", jenis: "MODAL", kategori: "MODAL_AKUN" },
    { kode: "3.2001", nama: "Laba Ditahan", jenis: "MODAL", kategori: "MODAL_AKUN" },

    // PENDAPATAN
    { kode: "4.1001", nama: "Pendapatan Training", jenis: "PENDAPATAN" },
    { kode: "4.2001", nama: "Pendapatan Sertifikasi", jenis: "PENDAPATAN" },
    { kode: "4.3001", nama: "Pendapatan Konsultasi", jenis: "PENDAPATAN" },
    { kode: "4.4001", nama: "Pendapatan Bunga Bank", jenis: "PENDAPATAN" },
    { kode: "4.5001", nama: "Pendapatan Lain-Lain", jenis: "PENDAPATAN" },

    // BEBAN — Harga Pokok Jasa
    { kode: "5.0001", nama: "Upah & Imbalan Instruktur Lepas", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },
    { kode: "5.0002", nama: "Biaya Ujian/Sertifikasi", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },
    { kode: "5.0003", nama: "Biaya Paket Meeting Hotel", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },
    { kode: "5.0004", nama: "Biaya Perjalanan Dinas Instruktur", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },
    { kode: "5.0005", nama: "Biaya Konsumsi Training", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },
    { kode: "5.0006", nama: "Biaya Perlengkapan Training", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },
    { kode: "5.0007", nama: "Biaya Souvenir Peserta", jenis: "BEBAN", kategori: "HARGA_POKOK_JASA" },

    // BEBAN — Penjualan
    { kode: "5.1001", nama: "Beban Honor Instruktur", jenis: "BEBAN", kategori: "BEBAN_PENJUALAN" },
    { kode: "5.2001", nama: "Beban Sewa Venue", jenis: "BEBAN", kategori: "BEBAN_PENJUALAN" },
    { kode: "5.3001", nama: "Beban Marketing", jenis: "BEBAN", kategori: "BEBAN_PENJUALAN" },
    { kode: "5.3002", nama: "Biaya Komisi Sales", jenis: "BEBAN", kategori: "BEBAN_PENJUALAN" },
    { kode: "5.3003", nama: "Biaya Kunjungan Pelanggan", jenis: "BEBAN", kategori: "BEBAN_PENJUALAN" },
    { kode: "5.3004", nama: "Biaya Penyusutan Kendaraan", jenis: "BEBAN", kategori: "BEBAN_PENJUALAN" },

    // BEBAN — Administrasi
    { kode: "5.4001", nama: "Beban Operasional Lain", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5001", nama: "Beban Gaji Karyawan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5002", nama: "THR & Bonus Karyawan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5003", nama: "Tunjangan Karyawan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5004", nama: "Beban BPJS Ketenagakerjaan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5005", nama: "Beban BPJS Kesehatan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5006", nama: "Biaya Sewa Kantor", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5007", nama: "Biaya Listrik & Air", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5008", nama: "Biaya Telepon & Internet", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5009", nama: "Biaya ATK & Materai", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5010", nama: "Biaya Fotokopi & Cetak", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5011", nama: "Biaya Konsumsi Kantor", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5012", nama: "Biaya Umum Kantor", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5013", nama: "Biaya Perijinan & Dokumen", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5014", nama: "Biaya Bank & Administrasi", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5015", nama: "Biaya Pajak Daerah", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5016", nama: "Biaya Asuransi Karyawan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5017", nama: "Biaya Pelatihan Karyawan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5018", nama: "Biaya Penyusutan Peralatan Kantor", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5019", nama: "Biaya Konsultan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5020", nama: "Biaya Lain-Lain", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
    { kode: "5.5021", nama: "Pajak Penghasilan Badan", jenis: "BEBAN", kategori: "BEBAN_ADMINISTRASI" },
  ];

  // Opening balance TETAP kayak sebelumnya (udah balance: ASET 1.5M = MODAL
  // 1.5M). Semua akun BARU mulai dari saldoAwal 0 biar gak ganggu balance
  // opening yang udah pas — history mereka kebentuk murni dari jurnal 1
  // tahun di bawah.
  const OPENING = {
    "1.1001": 15000000,
    "1.2001": 1405000000,
    "1.2002": 80000000,
    "3.1001": 1000000000,
    "3.2001": 500000000,
  };

  let created = 0;
  let updated = 0;
  for (const a of akun) {
    const before = await prisma.akun.findUnique({ where: { kode: a.kode } });
    const saldoAwal = OPENING[a.kode] ?? 0;
    await upsertAkun({ ...a, saldoAwal });
    if (!before) created++;
    else updated++;
  }
  console.log(`Master Akun: ${created} akun baru dibuat, ${updated} udah ada (kategori disinkronkan).`);
  console.log(`Total akun sekarang: ${akun.length}`);
}

// ─────────────────────────────────────────────
// HELPERS jurnal
// ─────────────────────────────────────────────
async function jurnalLangsung({ tanggal, deskripsi, mode, baris }) {
  return prisma.$transaction(async (tx) => {
    return createJurnalTransaksi(tx, { tanggal, deskripsi, mode, baris, sumber: "MANUAL", status: "POSTED", createdBy: PEGAWAI_ID });
  });
}

async function requestKeuanganApproved({ jenis, akunId, deskripsi, nominal, tanggal }) {
  const createRes = mockRes();
  await accountingCtrl.createRequestKeuangan(
    { body: { jenis, akunId, deskripsi, nominal, tanggal }, user: { pegawaiId: PEGAWAI_ID }, file: null },
    createRes,
  );
  if (createRes._status && createRes._status >= 400) throw new Error(`createRequestKeuangan gagal: ${JSON.stringify(createRes._body)}`);
  const requestId = createRes._body.data.id;
  const approveRes = mockRes();
  await accountingCtrl.approveRequestKeuangan({ params: { id: requestId }, body: {}, user: { pegawaiId: PEGAWAI_ID } }, approveRes);
  if (approveRes._status && approveRes._status >= 400) throw new Error(`approveRequestKeuangan gagal: ${JSON.stringify(approveRes._body)}`);
  return approveRes._body.data;
}

function round100k(n) {
  return Math.round(n / 100000) * 100000;
}

// Growth + variasi naik-turun deterministik (bukan Math.random).
function trend(base, bulan, amplitudo = 0.08, seed = 1) {
  const growth = 1 + (bulan - 1) * 0.012;
  const wave = 1 + amplitudo * Math.sin(bulan * 1.7 + seed);
  return round100k(base * growth * wave);
}

// ─────────────────────────────────────────────
// TEMPLATE-DRIVEN GENERATOR — 1 bulan
// ─────────────────────────────────────────────

// Kas & Bank yang dipakai bergantian (variasi akun tersentuh tiap bulan).
const KAS_BANK_KODE = ["1.2001", "1.2002", "1.2003", "1.2004"];

async function seedBulan(bulan) {
  const a = await getAkunMap();
  // Siklus tanggal 2..akhirBulan-1 biar entry tersebar ulang sepanjang
  // bulan (bukan numpuk di 1 tanggal pas jumlah entry > jumlah hari).
  const lastDayOfMonth = new Date(TAHUN, bulan, 0).getDate();
  const spreadDays = Math.max(lastDayOfMonth - 3, 20);
  let dayCounter = 0;
  let count = 0;
  const nextDay = () => {
    const hari = 2 + (dayCounter % spreadDays);
    dayCounter++;
    return Math.min(hari, lastDayOfMonth - 1);
  };
  const kasBankRotasi = (i) => a[KAS_BANK_KODE[i % KAS_BANK_KODE.length]];

  // ── 1. Settlement hutang & piutang bulan lalu (kecuali Januari) ──
  if (bulan > 1) {
    // PENTING: nominal settlement HARUS persis sama formula yang dipakai
    // pas liability itu di-posting bulan lalu (lihat step 4/5/7/8 di bawah)
    // — kalau enggak, nominalnya beda dikit dari yang tercatat sebagai
    // hutang, dan Neraca jadi gak balance kumulatif makin lama makin ngaco
    // (persis bug yang pernah ketemu di seed sebelumnya).
    const settlements = [
      { kode: "2.1002", label: "Hutang PPh 21", nominal: round100k(trend(85000000, bulan - 1, 0.05, 40) * 0.1) },
      { kode: "2.1005", label: "Hutang BPJS Ketenagakerjaan", nominal: trend(22000000, bulan - 1, 0.03, 60) },
      { kode: "2.1006", label: "Hutang BPJS Kesehatan", nominal: trend(9000000, bulan - 1, 0.03, 61) },
      { kode: "2.1007", label: "Hutang PPh Pasal 23", nominal: trend(14000000, bulan - 1, 0.1, 4) },
      { kode: "2.1008", label: "Hutang PPh Pasal 25", nominal: trend(11000000, bulan - 1, 0.1, 5) },
      { kode: "2.1009", label: "Hutang PPh Final", nominal: trend(6000000, bulan - 1, 0.1, 6) },
      { kode: "2.1010", label: "Hutang PPN Keluaran", nominal: trend(35000000, bulan - 1, 0.12, 7) },
      { kode: "2.1003", label: "Hutang Vendor Venue", nominal: round100k(trend(115000000, bulan - 1, 0.06, 41) * 0.11) },
      { kode: "2.1001", label: "Hutang Usaha", nominal: trend(28000000, bulan - 1, 0.2, 100) },
    ];
    for (const s of settlements) {
      const nominal = s.nominal;
      await jurnalLangsung({
        tanggal: tgl(bulan, nextDay()),
        deskripsi: `Bayar ${s.label} bulan ${bulan - 1}/${TAHUN}`,
        mode: "SIMPLE",
        baris: [
          { akunId: a[s.kode].id, debit: nominal, keterangan: `Setor ${s.label} bulan lalu` },
          { akunId: a["1.2001"].id, kredit: nominal, keterangan: `Setor ${s.label} bulan lalu` },
        ],
      });
      count++;
    }

    // Pelunasan Piutang training bulan lalu
    const piutangBulanLalu = round100k(trend(680000000, bulan - 1, 0.08, 20) * 0.25);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Pelunasan Piutang training bulan lalu`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.2001"].id, debit: piutangBulanLalu, keterangan: "Pelunasan piutang training bulan lalu" },
        { akunId: a["1.3001"].id, kredit: piutangBulanLalu, keterangan: "Pelunasan piutang training bulan lalu" },
      ],
    });
    count++;

    // Pelunasan Piutang Usaha Lain-Lain bulan lalu (kalau ada)
    if ((bulan - 1) % 4 === 0) {
      const piutangLainBulanLalu = trend(19000000, bulan - 1, 0.2, 101);
      await jurnalLangsung({
        tanggal: tgl(bulan, nextDay()),
        deskripsi: `Pelunasan Piutang Usaha Lain-Lain bulan lalu`,
        mode: "SIMPLE",
        baris: [
          { akunId: a["1.2002"].id, debit: piutangLainBulanLalu, keterangan: "Pelunasan piutang usaha lain-lain" },
          { akunId: a["1.3002"].id, kredit: piutangLainBulanLalu, keterangan: "Pelunasan piutang usaha lain-lain" },
        ],
      });
      count++;
    }
  }

  // Pembelian barang/jasa secara kredit (Hutang Usaha) — settlement-nya
  // udah ada di blok settlements di atas.
  const hutangUsahaBaru = trend(28000000, bulan, 0.2, 100);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pembelian perlengkapan kantor secara kredit ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.5012"].id, debit: hutangUsahaBaru, keterangan: "Pembelian perlengkapan kantor" },
      { akunId: a["2.1001"].id, kredit: hutangUsahaBaru, keterangan: "Belum dibayar ke vendor" },
    ],
  });
  count++;

  // Piutang Usaha Lain-Lain baru (setiap 4 bulan)
  if (bulan % 4 === 0) {
    const piutangLainBaru = trend(19000000, bulan, 0.2, 101);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Piutang Usaha Lain-Lain baru ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.3002"].id, debit: piutangLainBaru, keterangan: "Piutang usaha lain-lain" },
        { akunId: a["4.5001"].id, kredit: piutangLainBaru, keterangan: "Pendapatan lain-lain (belum diterima)" },
      ],
    });
    count++;
  }

  // Uang Muka Perjalanan Dinas — dikasih tiap kuartal, di-reconcile jadi
  // beban di kuartal berikutnya.
  if (bulan % 3 === 1) {
    const uangMuka = trend(14000000, bulan, 0.1, 102);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Uang Muka Perjalanan Dinas Instruktur ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.5101"].id, debit: uangMuka, keterangan: "Uang muka perjalanan dinas" },
        { akunId: a["1.1001"].id, kredit: uangMuka, keterangan: "Uang muka perjalanan dinas" },
      ],
    });
    count++;
  } else if (bulan % 3 === 2) {
    const uangMukaSebelumnya = trend(14000000, bulan - 1, 0.1, 102);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Reconcile Uang Muka Perjalanan Dinas jadi beban ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["5.0004"].id, debit: uangMukaSebelumnya, keterangan: "Realisasi perjalanan dinas instruktur" },
        { akunId: a["1.5101"].id, kredit: uangMukaSebelumnya, keterangan: "Uang muka perjalanan dinas terpakai" },
      ],
    });
    count++;
  }

  // Hutang Lain-Lain — kejadian sesekali (tiap 5 bulan)
  if (bulan % 5 === 0) {
    const hutangLain = trend(7500000, bulan, 0.25, 103);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Hutang Lain-Lain (titipan pihak ketiga) ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.1001"].id, debit: hutangLain, keterangan: "Titipan diterima" },
        { akunId: a["2.1004"].id, kredit: hutangLain, keterangan: "Titipan pihak ketiga" },
      ],
    });
    count++;
  }

  // Tambahan Modal — 1x kejadian (suntikan modal pertengahan tahun).
  if (bulan === 6) {
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Suntikan Tambahan Modal dari Pemegang Saham`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.2001"].id, debit: 300000000, keterangan: "Tambahan modal disetor" },
        { akunId: a["3.1002"].id, kredit: 300000000, keterangan: "Tambahan modal disetor" },
      ],
    });
    count++;
  }

  // Hutang Dividen — 1x kejadian (deklarasi dividen akhir tahun, dari
  // Laba Ditahan tahun-tahun sebelumnya, belum dibayar tunai).
  if (bulan === 12) {
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Deklarasi Dividen ke Pemegang Saham`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["3.2001"].id, debit: 150000000, keterangan: "Deklarasi dividen dari Laba Ditahan" },
        { akunId: a["2.2002"].id, kredit: 150000000, keterangan: "Dividen belum dibayar" },
      ],
    });
    count++;
  }

  // ── 2. Pendapatan ──
  const pendapatanTraining = trend(680000000, bulan, 0.08, 20);
  const trainingPiutang = round100k(pendapatanTraining * 0.25);
  const trainingCash = pendapatanTraining - trainingPiutang;
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pendapatan Training (tunai) - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2001"].id, debit: trainingCash, keterangan: "Pelunasan training tunai" },
      { akunId: a["4.1001"].id, kredit: trainingCash, keterangan: "Pelunasan training tunai" },
    ],
  });
  count++;
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pendapatan Training (belum lunas) - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.3001"].id, debit: trainingPiutang, keterangan: "Invoice training belum lunas" },
      { akunId: a["4.1001"].id, kredit: trainingPiutang, keterangan: "Invoice training belum lunas" },
    ],
  });
  count++;

  // Training batch ke-2 (gelombang training kedua bulan ini, tunai) —
  // volume lebih realistis, gak cuma 1 batch/bulan.
  const trainingBatch2 = trend(180000000, bulan, 0.15, 25);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pendapatan Training batch 2 (tunai) - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: kasBankRotasi(bulan + 5).id, debit: trainingBatch2, keterangan: "Pelunasan training batch 2" },
      { akunId: a["4.1001"].id, kredit: trainingBatch2, keterangan: "Pelunasan training batch 2" },
    ],
  });
  count++;

  const pendapatanSertifikasi = trend(230000000, bulan, 0.1, 21);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pendapatan Sertifikasi BNSP - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: kasBankRotasi(bulan).id, debit: pendapatanSertifikasi, keterangan: "Sertifikasi BNSP" },
      { akunId: a["4.2001"].id, kredit: pendapatanSertifikasi, keterangan: "Sertifikasi BNSP" },
    ],
  });
  count++;

  // Sertifikasi batch ke-2 (bank berbeda)
  const sertifikasiBatch2 = trend(70000000, bulan, 0.18, 26);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pendapatan Sertifikasi batch 2 - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: kasBankRotasi(bulan + 1).id, debit: sertifikasiBatch2, keterangan: "Sertifikasi BNSP batch 2" },
      { akunId: a["4.2001"].id, kredit: sertifikasiBatch2, keterangan: "Sertifikasi BNSP batch 2" },
    ],
  });
  count++;

  const pendapatanKonsultasi = trend(145000000, bulan, 0.12, 22);
  await requestKeuanganApproved({
    jenis: "PEMASUKAN",
    akunId: a["4.3001"].id,
    deskripsi: `Jasa Konsultasi HR - ${bulan}/${TAHUN}`,
    nominal: pendapatanKonsultasi,
    tanggal: tgl(bulan, nextDay()),
  });
  count++;

  const pendapatanBunga = trend(3200000, bulan, 0.2, 23);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Pendapatan Bunga Bank - ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["1.2005"].id, debit: pendapatanBunga, keterangan: "Jasa giro / bunga deposito" },
      { akunId: a["4.4001"].id, kredit: pendapatanBunga, keterangan: "Jasa giro / bunga deposito" },
    ],
  });
  count++;

  if (bulan % 3 === 0) {
    const pendapatanLain = trend(8000000, bulan, 0.25, 24);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Pendapatan Lain-Lain - ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["1.1001"].id, debit: pendapatanLain, keterangan: "Pendapatan lain-lain" },
        { akunId: a["4.5001"].id, kredit: pendapatanLain, keterangan: "Pendapatan lain-lain" },
      ],
    });
    count++;
  }

  // ── 3. Harga Pokok Jasa (7 item, straight cash) ──
  const hpjTemplates = [
    { kode: "5.0002", base: 62000000, amp: 0.07, seed: 30 },
    { kode: "5.0003", base: 18000000, amp: 0.1, seed: 31 },
    { kode: "5.0004", base: 9000000, amp: 0.12, seed: 32 },
    { kode: "5.0005", base: 6000000, amp: 0.1, seed: 33 },
    { kode: "5.0006", base: 2200000, amp: 0.15, seed: 34 },
    { kode: "5.0007", base: 4200000, amp: 0.15, seed: 35 },
  ];
  for (const t of hpjTemplates) {
    const nominal = trend(t.base, bulan, t.amp, t.seed);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `${a[t.kode].nama} - ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a[t.kode].id, debit: nominal, keterangan: a[t.kode].nama },
        { akunId: kasBankRotasi(bulan + 1).id, kredit: nominal, keterangan: a[t.kode].nama },
      ],
    });
    count++;
  }

  // ── 4. Honor Instruktur (Advanced, PPh21 split) ──
  const bebanHonor = trend(85000000, bulan, 0.05, 40);
  const pphHonor = round100k(bebanHonor * 0.1);
  const honorCash = bebanHonor - pphHonor;
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Honor Instruktur ${bulan}/${TAHUN} (kepotong PPh 21)`,
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.1001"].id, debit: bebanHonor, keterangan: "Honor instruktur" },
      { akunId: a["1.2001"].id, kredit: honorCash, keterangan: "Transfer honor instruktur (net PPh 21)" },
      { akunId: a["2.1002"].id, kredit: pphHonor, keterangan: "PPh 21 dipotong dari honor instruktur" },
    ],
  });
  count++;

  // ── 5. Sewa Venue (Advanced, payable split) ──
  const bebanSewaVenue = trend(115000000, bulan, 0.06, 41);
  const venuePayable = round100k(bebanSewaVenue * 0.11);
  const venueCash = bebanSewaVenue - venuePayable;
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Sewa Venue training ${bulan}/${TAHUN} (sebagian belum dibayar)`,
    mode: "ADVANCED",
    baris: [
      { akunId: a["5.2001"].id, debit: bebanSewaVenue, keterangan: "Sewa venue training" },
      { akunId: a["1.2001"].id, kredit: venueCash, keterangan: "Pembayaran sewa venue (sebagian)" },
      { akunId: a["2.1003"].id, kredit: venuePayable, keterangan: "Sisa tagihan vendor venue" },
    ],
  });
  count++;

  // ── 6. Beban Penjualan lainnya (straight cash) ──
  const penjualanTemplates = [
    { kode: "5.3001", base: 24000000, amp: 0.15, seed: 50 },
    { kode: "5.3002", base: 18000000, amp: 0.12, seed: 51 },
    { kode: "5.3003", base: 9000000, amp: 0.14, seed: 52 },
  ];
  for (const t of penjualanTemplates) {
    const nominal = trend(t.base, bulan, t.amp, t.seed);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `${a[t.kode].nama} - ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a[t.kode].id, debit: nominal, keterangan: a[t.kode].nama },
        { akunId: kasBankRotasi(bulan + 2).id, kredit: nominal, keterangan: a[t.kode].nama },
      ],
    });
    count++;
  }

  // ── 7. BPJS TK/Kesehatan (Advanced, hutang split langsung) ──
  const bpjsTk = trend(22000000, bulan, 0.03, 60);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Beban BPJS Ketenagakerjaan ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.5004"].id, debit: bpjsTk, keterangan: "Iuran BPJS Ketenagakerjaan" },
      { akunId: a["2.1005"].id, kredit: bpjsTk, keterangan: "Iuran BPJS Ketenagakerjaan belum disetor" },
    ],
  });
  count++;
  const bpjsKes = trend(9000000, bulan, 0.03, 61);
  await jurnalLangsung({
    tanggal: tgl(bulan, nextDay()),
    deskripsi: `Beban BPJS Kesehatan ${bulan}/${TAHUN}`,
    mode: "SIMPLE",
    baris: [
      { akunId: a["5.5005"].id, debit: bpjsKes, keterangan: "Iuran BPJS Kesehatan" },
      { akunId: a["2.1006"].id, kredit: bpjsKes, keterangan: "Iuran BPJS Kesehatan belum disetor" },
    ],
  });
  count++;

  // ── 8. Pajak-pajak (hutang split langsung, disetor bulan depan) ──
  const pajakTemplates = [
    { hutangKode: "2.1007", label: "PPh Pasal 23", base: 14000000, amp: 0.1, seed: 4 },
    { hutangKode: "2.1008", label: "PPh Pasal 25", base: 11000000, amp: 0.1, seed: 5 },
    { hutangKode: "2.1009", label: "PPh Final", base: 6000000, amp: 0.1, seed: 6 },
    { hutangKode: "2.1010", label: "PPN Keluaran", base: 35000000, amp: 0.12, seed: 7 },
  ];
  for (const t of pajakTemplates) {
    const nominal = trend(t.base, bulan, t.amp, t.seed);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Kewajiban ${t.label} ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a["5.5015"].id, debit: nominal, keterangan: `Kewajiban ${t.label}` },
        { akunId: a[t.hutangKode].id, kredit: nominal, keterangan: `Kewajiban ${t.label} belum disetor` },
      ],
    });
    count++;
  }

  // ── 9. Beban Administrasi lainnya (straight cash, banyak) ──
  const adminTemplates = [
    { kode: "5.4001", base: 15000000, amp: 0.15, seed: 70, viaRequest: true, jenis: "PENGELUARAN" },
    { kode: "5.5001", base: 48000000, amp: 0.02, seed: 71 },
    { kode: "5.5002", base: 0, amp: 0, seed: 72, quarterly: true, base2: 62000000 },
    { kode: "5.5003", base: 9500000, amp: 0.03, seed: 73 },
    { kode: "5.5006", base: 32000000, amp: 0.01, seed: 74 },
    { kode: "5.5007", base: 12000000, amp: 0.08, seed: 75 },
    { kode: "5.5008", base: 8500000, amp: 0.06, seed: 76 },
    { kode: "5.5009", base: 3200000, amp: 0.1, seed: 77 },
    { kode: "5.5010", base: 2100000, amp: 0.1, seed: 78 },
    { kode: "5.5011", base: 4800000, amp: 0.12, seed: 79 },
    { kode: "5.5012", base: 6200000, amp: 0.1, seed: 80 },
    { kode: "5.5013", base: 3500000, amp: 0.2, seed: 81 },
    { kode: "5.5014", base: 1800000, amp: 0.05, seed: 82 },
    { kode: "5.5016", base: 5200000, amp: 0.04, seed: 83 },
    { kode: "5.5017", base: 4100000, amp: 0.18, seed: 84, viaRequest: true, jenis: "PENGELUARAN" },
    { kode: "5.5019", base: 11000000, amp: 0.15, seed: 86 },
    { kode: "5.5020", base: 2600000, amp: 0.2, seed: 87 },
  ];
  for (const t of adminTemplates) {
    let nominal;
    if (t.quarterly) {
      if (bulan % 3 !== 0) continue;
      nominal = trend(t.base2, bulan, 0.05, t.seed);
    } else {
      nominal = trend(t.base, bulan, t.amp, t.seed);
    }
    if (t.viaRequest) {
      await requestKeuanganApproved({
        jenis: t.jenis,
        akunId: a[t.kode].id,
        deskripsi: `${a[t.kode].nama} - ${bulan}/${TAHUN}`,
        nominal,
        tanggal: tgl(bulan, nextDay()),
      });
    } else {
      await jurnalLangsung({
        tanggal: tgl(bulan, nextDay()),
        deskripsi: `${a[t.kode].nama} - ${bulan}/${TAHUN}`,
        mode: "SIMPLE",
        baris: [
          { akunId: a[t.kode].id, debit: nominal, keterangan: a[t.kode].nama },
          { akunId: kasBankRotasi(bulan + 3).id, kredit: nominal, keterangan: a[t.kode].nama },
        ],
      });
    }
    count++;
  }

  // ── 10. Penyusutan Aktiva Tetap (non-cash: debit Beban Penyusutan /
  // kredit Akumulasi Penyusutan — gak ada uang keluar, murni alokasi). ──
  const penyusutanTemplates = [
    { bebanKode: "5.3004", akumKode: "1.8001", label: "Kendaraan", base: 4500000, seed: 90 },
    { bebanKode: "5.5018", akumKode: "1.8002", label: "Peralatan Kantor", base: 9200000, seed: 91 },
  ];
  for (const t of penyusutanTemplates) {
    const nominal = trend(t.base, bulan, 0.01, t.seed);
    await jurnalLangsung({
      tanggal: tgl(bulan, nextDay()),
      deskripsi: `Penyusutan ${t.label} ${bulan}/${TAHUN}`,
      mode: "SIMPLE",
      baris: [
        { akunId: a[t.bebanKode].id, debit: nominal, keterangan: `Beban penyusutan ${t.label.toLowerCase()} bulan berjalan` },
        { akunId: a[t.akumKode].id, kredit: nominal, keterangan: `Akumulasi penyusutan ${t.label.toLowerCase()} bertambah` },
      ],
    });
    count++;
  }

  console.log(`  Bulan ${bulan}/${TAHUN}: ~${count} entry jurnal disimpan.`);
}

async function verify() {
  console.log("=== Neraca real-time per akhir bulan ===");
  for (const bulan of [3, 6, 9, 12]) {
    const lastDay = new Date(TAHUN, bulan, 0).getDate();
    const tanggal = tgl(bulan, lastDay);
    const res = mockRes();
    await jurnalCtrl.getNeracaSnapshot({ query: { tanggal } }, res);
    const d = res._body.data;
    console.log(`  ${tanggal}: Aset ${d.totalAset.toLocaleString("id-ID")} | Liab+Modal ${(d.totalLiabilitas + d.totalModal).toLocaleString("id-ID")} | isBalance=${d.isBalance}`);
  }

  console.log("=== Laba Rugi (Jan, Des, kumulatif) ===");
  for (const [label, s, e] of [["Jan", tgl(1, 1), tgl(1, 31)], ["Des", tgl(12, 1), tgl(12, 31)], ["Kumulatif", tgl(1, 1), tgl(12, 31)]]) {
    const res = mockRes();
    await jurnalCtrl.getLaporanLabaRugi({ query: { startDate: s, endDate: e } }, res);
    const d = res._body.data;
    console.log(`  ${label}: Pendapatan ${d.totalPendapatan.toLocaleString("id-ID")} | HPJ ${d.totalHargaPokok.toLocaleString("id-ID")} | Laba Kotor ${d.labaKotor.toLocaleString("id-ID")} | Beban Usaha ${(d.totalBebanPenjualan + d.totalBebanAdministrasi).toLocaleString("id-ID")} | Laba Bersih ${d.labaRugiBersih.toLocaleString("id-ID")}`);
  }

  const akunCount = await prisma.akun.count();
  const jurnalCount = await prisma.jurnalTransaksi.count();
  const barisCount = await prisma.jurnalBaris.count();
  console.log(`Total akun: ${akunCount} | Total jurnal: ${jurnalCount} | Total baris: ${barisCount}`);

  const ringkasanRes = mockRes();
  await jurnalCtrl.getBukuBesarRingkasan({ query: {} }, ringkasanRes);
  const aktif = ringkasanRes._body.data.filter((r) => r.totalDebit > 0 || r.totalKredit > 0);
  console.log(`Akun dengan mutasi: ${aktif.length} dari ${ringkasanRes._body.data.length} akun aktif.`);
}

async function main() {
  const target = process.argv[2];
  if (target === "akun") await seedAkun();
  else if (target === "all") {
    for (let bulan = 1; bulan <= 12; bulan++) await seedBulan(bulan);
  } else if (target === "verify") await verify();
  else if (target && /^([1-9]|1[0-2])$/.test(target)) await seedBulan(parseInt(target, 10));
  else {
    console.log("Usage: node scripts/seed-finance-lengkap.js <akun|1-12|all|verify>");
    process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
