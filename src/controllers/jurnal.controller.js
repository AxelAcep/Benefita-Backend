// Controller Jurnal Keuangan (Fitur 2), Buku Besar & Tutup Buku (Fitur 3),
// Laba Rugi (Fitur 4), Neraca (Fitur 5), Kas & Bank (Fitur 6).
//
// Semua fitur di sini adalah SKEMA BARU (JurnalTransaksi/JurnalBaris —
// double-entry, relasi ke Akun), terpisah dari TableNeraca/TableJenisBiaya
// lama yang dibiarkan jadi arsip "(Lama)".
const {
  prisma,
  isDebitNormal,
  mutasiBersih,
  toPeriode,
  validasiBarisJurnal,
  createJurnalTransaksi,
  findOrCreateLabaDitahan,
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

    // Gak boleh posting ke periode yang udah ditutup.
    const periode = toPeriode(tanggal);
    const periodeRow = await prisma.periodeAkuntansi.findUnique({ where: { periode } });
    if (periodeRow?.status === "CLOSED") {
      return res.status(400).json({
        message: `Periode ${periode} sudah ditutup (Closed). Gak bisa nambah jurnal baru di periode itu.`,
      });
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
    const { status, periode, search } = req.query;

    const where = {};
    if (status && ["POSTED", "CLOSED"].includes(status)) where.status = status;
    if (periode) where.periode = periode;
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

    const where = {
      akunId: parseInt(akunId),
      transaksi: {
        status: { in: ["POSTED", "CLOSED"] },
        ...(startDate || endDate
          ? {
              tanggal: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
    };

    const barisList = await prisma.jurnalBaris.findMany({
      where,
      include: {
        transaksi: { select: { id: true, noJurnal: true, tanggal: true, deskripsi: true, status: true } },
      },
      orderBy: [{ transaksi: { tanggal: "asc" } }, { id: "asc" }],
    });

    let saldo = Number(akun.saldoAwal);
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
      saldoAwal: akun.saldoAwal,
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
      const agg = await prisma.jurnalBaris.aggregate({
        where: { akunId: akun.id, transaksi: { status: { in: ["POSTED", "CLOSED"] }, ...tanggalFilter } },
        _sum: { debit: true, kredit: true },
      });
      const totalDebit = Number(agg._sum.debit || 0);
      const totalKredit = Number(agg._sum.kredit || 0);
      const saldoAkhir = Number(akun.saldoAwal) + mutasiBersih(akun.jenis, totalDebit, totalKredit);

      result.push({
        akun: { id: akun.id, kode: akun.kode, nama: akun.nama, jenis: akun.jenis },
        saldoAwal: akun.saldoAwal,
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

const getPeriodeList = async (req, res) => {
  try {
    // Gabungin periode yang udah ada di PeriodeAkuntansi dengan periode
    // yang punya transaksi tapi belum pernah ditutup (masih implicitly OPEN).
    const [periodeRows, distinctTransaksi] = await Promise.all([
      prisma.periodeAkuntansi.findMany({ orderBy: { periode: "desc" } }),
      prisma.jurnalTransaksi.findMany({ distinct: ["periode"], select: { periode: true } }),
    ]);

    const known = new Set(periodeRows.map((p) => p.periode));
    const implicitOpen = distinctTransaksi
      .map((t) => t.periode)
      .filter((p) => !known.has(p))
      .map((p) => ({ periode: p, status: "OPEN", labaRugiBersih: null, closedAt: null }));

    const data = [...periodeRows, ...implicitOpen].sort((a, b) => (a.periode < b.periode ? 1 : -1));
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getPeriodeList error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

/**
 * TUTUP BUKU — kunci semua transaksi POSTED di periode itu jadi CLOSED,
 * nolin akun Pendapatan & Beban, selisihnya (Laba/Rugi) dipindah ke Modal
 * "Laba Ditahan" lewat 1 jurnal penutup otomatis.
 */
const tutupBuku = async (req, res) => {
  try {
    const { periode } = req.body; // format YYYYMM
    if (!periode || !/^\d{6}$/.test(periode)) {
      return res.status(400).json({ message: "Periode wajib diisi, format YYYYMM (contoh: 202609)" });
    }

    const existing = await prisma.periodeAkuntansi.findUnique({ where: { periode } });
    if (existing?.status === "CLOSED") {
      return res.status(400).json({ message: `Periode ${periode} sudah pernah ditutup` });
    }

    const closedBy = req.user?.pegawaiId || null;

    const result = await prisma.$transaction(async (tx) => {
      // Hitung saldo Pendapatan & Beban KHUSUS periode ini (bukan kumulatif)
      const akunPnB = await tx.akun.findMany({ where: { jenis: { in: ["PENDAPATAN", "BEBAN"] } } });

      const barisPenutup = [];
      let totalPendapatan = 0;
      let totalBeban = 0;

      for (const akun of akunPnB) {
        const agg = await tx.jurnalBaris.aggregate({
          where: { akunId: akun.id, transaksi: { periode, status: "POSTED" } },
          _sum: { debit: true, kredit: true },
        });
        const totalDebit = Number(agg._sum.debit || 0);
        const totalKredit = Number(agg._sum.kredit || 0);
        const saldoPeriode = mutasiBersih(akun.jenis, totalDebit, totalKredit); // kredit-normal utk PENDAPATAN, debit-normal utk BEBAN

        if (saldoPeriode === 0) continue;

        if (akun.jenis === "PENDAPATAN") {
          totalPendapatan += saldoPeriode;
          // saldo Pendapatan (kredit-normal, positif) → nol-in dgn DEBIT sebesar saldoPeriode
          barisPenutup.push({ akunId: akun.id, debit: saldoPeriode, kredit: 0, keterangan: "Tutup buku — nol-in Pendapatan" });
        } else {
          totalBeban += saldoPeriode;
          // saldo Beban (debit-normal, positif) → nol-in dgn KREDIT sebesar saldoPeriode
          barisPenutup.push({ akunId: akun.id, debit: 0, kredit: saldoPeriode, keterangan: "Tutup buku — nol-in Beban" });
        }
      }

      const labaRugiBersih = totalPendapatan - totalBeban;

      let jurnalPenutup = null;
      if (barisPenutup.length > 0) {
        const labaDitahan = await findOrCreateLabaDitahan(tx);
        // Penyeimbang ke Laba Ditahan (MODAL, kredit-normal):
        // laba (positif) → kredit Laba Ditahan (nambah modal)
        // rugi (negatif) → debit Laba Ditahan (ngurangin modal)
        if (labaRugiBersih >= 0) {
          barisPenutup.push({ akunId: labaDitahan.id, debit: 0, kredit: labaRugiBersih, keterangan: "Tutup buku — Laba periode ke Laba Ditahan" });
        } else {
          barisPenutup.push({ akunId: labaDitahan.id, debit: -labaRugiBersih, kredit: 0, keterangan: "Tutup buku — Rugi periode dari Laba Ditahan" });
        }

        jurnalPenutup = await createJurnalTransaksi(tx, {
          tanggal: new Date(`${periode.slice(0, 4)}-${periode.slice(4, 6)}-01T00:00:00.000Z`),
          deskripsi: `Jurnal penutup periode ${periode}`,
          mode: "ADVANCED",
          baris: barisPenutup,
          sumber: "TUTUP_BUKU",
          status: "CLOSED",
          createdBy: closedBy,
        });
      }

      // Kunci semua transaksi POSTED di periode ini (termasuk jurnal
      // penutup yang baru dibuat udah CLOSED dari awal).
      await tx.jurnalTransaksi.updateMany({
        where: { periode, status: "POSTED" },
        data: { status: "CLOSED", closedAt: new Date() },
      });

      const periodeRow = await tx.periodeAkuntansi.upsert({
        where: { periode },
        update: {
          status: "CLOSED",
          labaRugiBersih,
          jurnalPenutupId: jurnalPenutup?.id ?? null,
          closedAt: new Date(),
          closedBy,
        },
        create: {
          periode,
          status: "CLOSED",
          labaRugiBersih,
          jurnalPenutupId: jurnalPenutup?.id ?? null,
          closedAt: new Date(),
          closedBy,
        },
      });

      return { periodeRow, jurnalPenutup, totalPendapatan, totalBeban, labaRugiBersih };
    });

    return res.status(200).json({
      message: `Periode ${periode} berhasil ditutup`,
      data: result,
    });
  } catch (error) {
    console.error("[tutupBuku error]", error);
    return res.status(500).json({ message: error.message || "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// FITUR 4 — LABA RUGI (read-only)
// ─────────────────────────────────────────────

const getLaporanLabaRugi = async (req, res) => {
  try {
    const { startPeriode, endPeriode } = req.query;
    if (!startPeriode || !endPeriode) {
      return res.status(400).json({ message: "startPeriode dan endPeriode wajib diisi (format YYYYMM)" });
    }

    const akunList = await prisma.akun.findMany({
      where: { jenis: { in: ["PENDAPATAN", "BEBAN"] } },
      orderBy: [{ jenis: "asc" }, { nama: "asc" }],
    });

    const rows = [];
    let totalPendapatan = 0;
    let totalBeban = 0;

    for (const akun of akunList) {
      const agg = await prisma.jurnalBaris.aggregate({
        where: {
          akunId: akun.id,
          transaksi: { status: { in: ["POSTED", "CLOSED"] }, periode: { gte: startPeriode, lte: endPeriode } },
        },
        _sum: { debit: true, kredit: true },
      });
      const saldo = mutasiBersih(akun.jenis, agg._sum.debit || 0, agg._sum.kredit || 0);
      if (saldo === 0) continue;

      if (akun.jenis === "PENDAPATAN") totalPendapatan += saldo;
      else totalBeban += saldo;

      rows.push({ akun: { id: akun.id, kode: akun.kode, nama: akun.nama, jenis: akun.jenis }, saldo });
    }

    // Final kalau SEMUA periode dalam rentang ini udah Closed.
    const periodeInRange = await prisma.periodeAkuntansi.findMany({
      where: { periode: { gte: startPeriode, lte: endPeriode } },
    });
    const semuaAdaDanClosed =
      periodeInRange.length > 0 && periodeInRange.every((p) => p.status === "CLOSED");

    return res.status(200).json({
      data: {
        startPeriode,
        endPeriode,
        rows,
        totalPendapatan,
        totalBeban,
        labaRugiBersih: totalPendapatan - totalBeban,
        status: semuaAdaDanClosed ? "FINAL" : "DRAFT",
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
      const barisList = await prisma.jurnalBaris.findMany({
        where: { akunId: akun.id, transaksi: { status: { in: ["POSTED", "CLOSED"] }, ...tanggalFilter } },
        include: { transaksi: { select: { noJurnal: true, tanggal: true, deskripsi: true } } },
        orderBy: [{ transaksi: { tanggal: "asc" } }, { id: "asc" }],
      });

      let saldo = Number(akun.saldoAwal);
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
        saldoAwal: akun.saldoAwal,
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
  getPeriodeList,
  tutupBuku,

  getLaporanLabaRugi,

  getNeracaSnapshot,

  getKasBank,
};
