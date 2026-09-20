// Controller Jurnal Keuangan (Fitur 2), Buku Besar & Tutup Buku (Fitur 3),
// Laba Rugi (Fitur 4), Neraca (Fitur 5), Kas & Bank (Fitur 6).
//
// Semua fitur di sini adalah SKEMA BARU (JurnalTransaksi/JurnalBaris —
// double-entry, relasi ke Akun), terpisah dari TableNeraca/TableJenisBiaya
// lama yang dibiarkan jadi arsip "(Lama)".
const {
  prisma,
  mutasiBersih,
  validasiBarisJurnal,
  createJurnalTransaksi,
} = require("../services/jurnal.service");

const JURNAL_INCLUDE = {
  baris: {
    include: { akun: { select: { id: true, kode: true, nama: true, jenis: true } } },
  },
  dibuatOleh: { select: { id: true, nama: true } },
};

// ─────────────────────────────────────────────
// FITUR 2 — JURNAL KEUANGAN (double-entry)
// ─────────────────────────────────────────────

/**
 * CREATE — dipakai buat mode Simple maupun Advanced. FE yang nyusun array
 * `baris` (Simple: FE otomatis bikin 2 baris dari dariAkunId/keAkunId/
 * nominal; Advanced: user isi bebas). Backend gak peduli mode, cuma
 * validasi balance ulang (jangan percaya FE aja).
 */
const createJurnal = async (req, res) => {
  try {
    const { tanggal, deskripsi, mode, baris } = req.body;

    if (!tanggal) return res.status(400).json({ message: "Tanggal wajib diisi" });
    if (!deskripsi) return res.status(400).json({ message: "Deskripsi wajib diisi" });

    const validasi = validasiBarisJurnal(baris);
    if (!validasi.valid) {
      return res.status(400).json({ message: validasi.message });
    }

    // Semua akun yang dipakai harus ada & aktif.
    const akunIds = [...new Set(baris.map((b) => parseInt(b.akunId)))];
    const akunList = await prisma.akun.findMany({ where: { id: { in: akunIds } } });
    if (akunList.length !== akunIds.length) {
      return res.status(404).json({ message: "Ada akun yang gak ditemukan" });
    }
    const nonAktif = akunList.find((a) => !a.isActive);
    if (nonAktif) {
      return res.status(400).json({ message: `Akun "${nonAktif.nama}" sudah nonaktif` });
    }

    const createdBy = req.user?.pegawaiId || null;

    const transaksi = await prisma.$transaction(async (tx) => {
      return createJurnalTransaksi(tx, {
        tanggal,
        deskripsi,
        mode: mode === "ADVANCED" ? "ADVANCED" : "SIMPLE",
        baris,
        sumber: "MANUAL",
        status: "POSTED",
        createdBy,
      });
    });

    return res.status(201).json({ message: "Jurnal berhasil disimpan", data: transaksi });
  } catch (error) {
    console.error("[createJurnal error]", error);
    return res.status(500).json({ message: error.message || "Terjadi kesalahan server." });
  }
};

const getJurnalList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.tanggal = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
      };
    }
    if (search) {
      where.OR = [
        { deskripsi: { contains: search, mode: "insensitive" } },
        { noJurnal: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.jurnalTransaksi.findMany({
        where,
        orderBy: [{ tanggal: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        include: JURNAL_INCLUDE,
      }),
      prisma.jurnalTransaksi.count({ where }),
    ]);

    return res.status(200).json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("[getJurnalList error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getJurnalById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.jurnalTransaksi.findUnique({
      where: { id: parseInt(id) },
      include: JURNAL_INCLUDE,
    });
    if (!data) return res.status(404).json({ message: "Jurnal tidak ditemukan" });
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getJurnalById error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// FITUR 3 — BUKU BESAR & TUTUP BUKU
// ─────────────────────────────────────────────

/**
 * Buku Besar 1 akun: histori mutasi + running balance, mulai dari
 * saldoAwal akun, urut tanggal lalu id. Sumbernya transaksi POSTED+CLOSED
 * (keduanya "sah" — bedanya cuma CLOSED udah dikunci gak bisa diubah).
 */
const getBukuBesarAkun = async (req, res) => {
  try {
    const { akunId } = req.params;
    const { startDate, endDate } = req.query;

    const akun = await prisma.akun.findUnique({ where: { id: parseInt(akunId) } });
    if (!akun) return res.status(404).json({ message: "Akun tidak ditemukan" });

    // Saldo awal PERIODE (bukan saldo awal akun sejak awal berdiri) — akun
    // saldoAwal + semua mutasi SEBELUM startDate. Kalau gak, filter tanggal
    // bakal bikin saldo berjalan keliatan understated karena mutasi
    // sebelum rentang yang difilter ke-skip padahal harusnya tetep kehitung.
    let saldoAwalPeriode = Number(akun.saldoAwal);
    if (startDate) {
      const aggSebelum = await prisma.jurnalBaris.aggregate({
        where: { akunId: parseInt(akunId), transaksi: { tanggal: { lt: new Date(startDate) } } },
        _sum: { debit: true, kredit: true },
      });
      saldoAwalPeriode += mutasiBersih(akun.jenis, aggSebelum._sum.debit || 0, aggSebelum._sum.kredit || 0);
    }

    const barisList = await prisma.jurnalBaris.findMany({
      where: {
        akunId: parseInt(akunId),
        transaksi: {
          ...(startDate || endDate
            ? {
                tanggal: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
                },
              }
            : {}),
        },
      },
      include: {
        transaksi: { select: { id: true, noJurnal: true, tanggal: true, deskripsi: true, status: true } },
      },
      orderBy: [{ transaksi: { tanggal: "asc" } }, { id: "asc" }],
    });

    let saldo = saldoAwalPeriode;
    const rows = barisList.map((b) => {
      saldo += mutasiBersih(akun.jenis, b.debit, b.kredit);
      return {
        transaksiId: b.transaksi.id,
        noJurnal: b.transaksi.noJurnal,
        tanggal: b.transaksi.tanggal,
        status: b.transaksi.status,
        keterangan: b.keterangan || b.transaksi.deskripsi,
        debit: b.debit,
        kredit: b.kredit,
        saldo,
      };
    });

    return res.status(200).json({
      akun: { id: akun.id, kode: akun.kode, nama: akun.nama, jenis: akun.jenis },
      saldoAwal: saldoAwalPeriode,
      saldoAkhir: saldo,
      rows,
    });
  } catch (error) {
    console.error("[getBukuBesarAkun error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

/**
 * Ringkasan Buku Besar SEMUA akun — index buat pilih akun mana yang mau
 * di-drill-down. Filter opsional jenis akun.
 */
const getBukuBesarRingkasan = async (req, res) => {
  try {
    const { jenis, startDate, endDate } = req.query;

    const akunWhere = { isActive: true };
    if (jenis) akunWhere.jenis = jenis;

    const akunList = await prisma.akun.findMany({ where: akunWhere, orderBy: [{ jenis: "asc" }, { nama: "asc" }] });

    const tanggalFilter =
      startDate || endDate
        ? {
            tanggal: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {};

    const result = [];
    for (const akun of akunList) {
      // Saldo awal PERIODE, sama kayak getBukuBesarAkun — biar konsisten
      // dan gak understated pas difilter ke rentang tanggal tertentu.
      let saldoAwalPeriode = Number(akun.saldoAwal);
      if (startDate) {
        const aggSebelum = await prisma.jurnalBaris.aggregate({
          where: { akunId: akun.id, transaksi: { tanggal: { lt: new Date(startDate) } } },
          _sum: { debit: true, kredit: true },
        });
        saldoAwalPeriode += mutasiBersih(akun.jenis, aggSebelum._sum.debit || 0, aggSebelum._sum.kredit || 0);
      }

      const agg = await prisma.jurnalBaris.aggregate({
        where: { akunId: akun.id, transaksi: { ...tanggalFilter } },
        _sum: { debit: true, kredit: true },
      });
      const totalDebit = Number(agg._sum.debit || 0);
      const totalKredit = Number(agg._sum.kredit || 0);
      const saldoAkhir = saldoAwalPeriode + mutasiBersih(akun.jenis, totalDebit, totalKredit);

      result.push({
        akun: { id: akun.id, kode: akun.kode, nama: akun.nama, jenis: akun.jenis },
        saldoAwal: saldoAwalPeriode,
        totalDebit,
        totalKredit,
        saldoAkhir,
      });
    }

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("[getBukuBesarRingkasan error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// Catatan: fitur Tutup Buku/Periode Akuntansi udah dihapus — semua laporan
// (Laba Rugi, Neraca, Buku Besar, Kas & Bank) sekarang real-time, dihitung
// langsung dari JurnalBaris tanpa perlu proses "penutupan" manual. Laba
// Rugi berjalan otomatis ke-refleksi di Neraca lewat baris "Laba (Rugi)
// Berjalan" yang dihitung live (lihat getNeracaSnapshot).

// ─────────────────────────────────────────────
// FITUR 4 — LABA RUGI (read-only)
// ─────────────────────────────────────────────

const BEBAN_PENJUALAN_KATEGORI = ["BEBAN_PENJUALAN"];

// Real-time: gak ada lagi konsep Draft/Final, laporan selalu dihitung
// langsung dari JurnalBaris di rentang tanggal yang diminta. Default
// rentang (kalau startDate/endDate gak dikirim) di-handle di FE (bulan ini).
const getLaporanLabaRugi = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate dan endDate wajib diisi (format YYYY-MM-DD)" });
    }
    const tanggalFilter = {
      gte: new Date(startDate),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    };

    const akunList = await prisma.akun.findMany({
      where: { jenis: { in: ["PENDAPATAN", "BEBAN"] } },
      orderBy: [{ jenis: "asc" }, { kode: "asc" }, { nama: "asc" }],
    });

    const pendapatan = [];
    const bebanPenjualan = [];
    const bebanAdministrasi = [];
    let totalPendapatan = 0;
    let totalBebanPenjualan = 0;
    let totalBebanAdministrasi = 0;

    for (const akun of akunList) {
      const agg = await prisma.jurnalBaris.aggregate({
        where: { akunId: akun.id, transaksi: { tanggal: tanggalFilter } },
        _sum: { debit: true, kredit: true },
      });
      const saldo = mutasiBersih(akun.jenis, agg._sum.debit || 0, agg._sum.kredit || 0);
      if (saldo === 0) continue;

      const item = { akun: { id: akun.id, kode: akun.kode, nama: akun.nama, jenis: akun.jenis }, saldo };

      if (akun.jenis === "PENDAPATAN") {
        totalPendapatan += saldo;
        pendapatan.push(item);
      } else if (BEBAN_PENJUALAN_KATEGORI.includes(akun.kategori)) {
        totalBebanPenjualan += saldo;
        bebanPenjualan.push(item);
      } else {
        totalBebanAdministrasi += saldo;
        bebanAdministrasi.push(item);
      }
    }

    const totalBeban = totalBebanPenjualan + totalBebanAdministrasi;
    const labaRugiBersih = totalPendapatan - totalBeban;

    return res.status(200).json({
      data: {
        startDate,
        endDate,
        pendapatan,
        totalPendapatan,
        bebanPenjualan,
        totalBebanPenjualan,
        bebanAdministrasi,
        totalBebanAdministrasi,
        totalBeban,
        labaRugiBersih,
      },
    });
  } catch (error) {
    console.error("[getLaporanLabaRugi error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// FITUR 5 — NERACA (snapshot, read-only)
// ─────────────────────────────────────────────

// Kategori Akun → grup layout Neraca. Kategori kosong/null dianggap masuk
// grup default per jenis (Aktiva Lancar / Hutang Lancar) biar akun lama
// yang belum diisi kategorinya tetap muncul di laporan.
const ASET_TETAP_KATEGORI = ["AKTIVA_TETAP"];
const HUTANG_JP_KATEGORI = ["HUTANG_JANGKA_PANJANG"];

const getNeracaSnapshot = async (req, res) => {
  try {
    const tanggal = req.query.tanggal ? new Date(`${req.query.tanggal}T23:59:59.999Z`) : new Date();

    const akunList = await prisma.akun.findMany({
      where: { jenis: { in: ["ASET", "LIABILITAS", "MODAL"] } },
      orderBy: [{ jenis: "asc" }, { kode: "asc" }, { nama: "asc" }],
    });

    const grup = {
      aktivaLancar: [],
      aktivaTetap: [],
      hutangLancar: [],
      hutangJangkaPanjang: [],
      modal: [],
    };
    const totals = { ASET: 0, LIABILITAS: 0, MODAL: 0 };

    for (const akun of akunList) {
      const agg = await prisma.jurnalBaris.aggregate({
        where: { akunId: akun.id, transaksi: { status: { in: ["POSTED", "CLOSED"] }, tanggal: { lte: tanggal } } },
        _sum: { debit: true, kredit: true },
      });
      const saldo = Number(akun.saldoAwal) + mutasiBersih(akun.jenis, agg._sum.debit || 0, agg._sum.kredit || 0);
      if (saldo === 0 && Number(akun.saldoAwal) === 0) continue;

      const item = { akun: { id: akun.id, kode: akun.kode, nama: akun.nama }, saldo };
      totals[akun.jenis] += saldo;

      if (akun.jenis === "ASET") {
        if (ASET_TETAP_KATEGORI.includes(akun.kategori)) grup.aktivaTetap.push(item);
        else grup.aktivaLancar.push(item);
      } else if (akun.jenis === "LIABILITAS") {
        if (HUTANG_JP_KATEGORI.includes(akun.kategori)) grup.hutangJangkaPanjang.push(item);
        else grup.hutangLancar.push(item);
      } else {
        grup.modal.push(item);
      }
    }

    const totalAktivaLancar = grup.aktivaLancar.reduce((s, i) => s + i.saldo, 0);
    const totalAktivaTetap = grup.aktivaTetap.reduce((s, i) => s + i.saldo, 0);
    const totalHutangLancar = grup.hutangLancar.reduce((s, i) => s + i.saldo, 0);
    const totalHutangJangkaPanjang = grup.hutangJangkaPanjang.reduce((s, i) => s + i.saldo, 0);

    // Real-time: gak ada lagi jurnal penutup yang mindahin Laba/Rugi ke
    // Laba Ditahan. Laba (Rugi) Berjalan dihitung LIVE (semua Pendapatan -
    // Beban sejak awal s/d tanggal snapshot) dan ditambahin ke Modal
    // sebagai baris tersendiri, biar Neraca selalu balance real-time.
    const pnbAkun = await prisma.akun.findMany({ where: { jenis: { in: ["PENDAPATAN", "BEBAN"] } } });
    let labaBerjalan = 0;
    for (const akun of pnbAkun) {
      const agg = await prisma.jurnalBaris.aggregate({
        where: { akunId: akun.id, transaksi: { tanggal: { lte: tanggal } } },
        _sum: { debit: true, kredit: true },
      });
      labaBerjalan += mutasiBersih(akun.jenis, agg._sum.debit || 0, agg._sum.kredit || 0) * (akun.jenis === "PENDAPATAN" ? 1 : -1);
    }

    if (labaBerjalan !== 0) {
      grup.modal.push({ akun: { id: null, kode: null, nama: "Laba (Rugi) Berjalan" }, saldo: labaBerjalan });
    }
    totals.MODAL += labaBerjalan;

    const selisih = Math.round((totals.ASET - (totals.LIABILITAS + totals.MODAL)) * 100) / 100;

    return res.status(200).json({
      data: {
        tanggal,
        aktivaLancar: grup.aktivaLancar,
        totalAktivaLancar,
        aktivaTetap: grup.aktivaTetap,
        totalAktivaTetap,
        hutangLancar: grup.hutangLancar,
        totalHutangLancar,
        hutangJangkaPanjang: grup.hutangJangkaPanjang,
        totalHutangJangkaPanjang,
        modal: grup.modal,
        labaBerjalan,
        totalAset: totals.ASET,
        totalLiabilitas: totals.LIABILITAS,
        totalModal: totals.MODAL,
        isBalance: selisih === 0,
        selisih,
      },
    });
  } catch (error) {
    console.error("[getNeracaSnapshot error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// FITUR 6 — KAS & BANK (versi simpel Buku Besar, khusus akun isKasBank)
// ─────────────────────────────────────────────

const getKasBank = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tanggalFilter =
      startDate || endDate
        ? {
            tanggal: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
            },
          }
        : {};

    const akunList = await prisma.akun.findMany({
      where: { isKasBank: true, isActive: true },
      orderBy: { nama: "asc" },
    });

    const mutasi = [];
    let totalSaldo = 0;

    for (const akun of akunList) {
      // Saldo awal PERIODE — sama alasannya kayak Buku Besar.
      let saldoAwalPeriode = Number(akun.saldoAwal);
      if (startDate) {
        const aggSebelum = await prisma.jurnalBaris.aggregate({
          where: { akunId: akun.id, transaksi: { tanggal: { lt: new Date(startDate) } } },
          _sum: { debit: true, kredit: true },
        });
        saldoAwalPeriode += mutasiBersih(akun.jenis, aggSebelum._sum.debit || 0, aggSebelum._sum.kredit || 0);
      }

      const barisList = await prisma.jurnalBaris.findMany({
        where: { akunId: akun.id, transaksi: { ...tanggalFilter } },
        include: { transaksi: { select: { noJurnal: true, tanggal: true, deskripsi: true } } },
        orderBy: [{ transaksi: { tanggal: "asc" } }, { id: "asc" }],
      });

      let saldo = saldoAwalPeriode;
      const rows = barisList.map((b) => {
        saldo += mutasiBersih(akun.jenis, b.debit, b.kredit);
        return {
          noJurnal: b.transaksi.noJurnal,
          tanggal: b.transaksi.tanggal,
          keterangan: b.keterangan || b.transaksi.deskripsi,
          masuk: b.debit,
          keluar: b.kredit,
          saldo,
        };
      });

      totalSaldo += saldo;
      mutasi.push({
        akun: { id: akun.id, kode: akun.kode, nama: akun.nama },
        saldoAwal: saldoAwalPeriode,
        saldoAkhir: saldo,
        rows,
      });
    }

    return res.status(200).json({ data: { mutasi, totalSaldoGabungan: totalSaldo } });
  } catch (error) {
    console.error("[getKasBank error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

module.exports = {
  createJurnal,
  getJurnalList,
  getJurnalById,

  getBukuBesarAkun,
  getBukuBesarRingkasan,

  getLaporanLabaRugi,

  getNeracaSnapshot,

  getKasBank,
};
