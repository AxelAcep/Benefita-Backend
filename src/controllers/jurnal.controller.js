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
const { newDocument, documentHeader, drawTable, footer, formatRupiah, formatTanggal } = require("../services/pdf.service");

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
async function computeBukuBesarAkun(akunIdRaw, startDate, endDate) {
    const akunId = parseInt(akunIdRaw);
    const akun = await prisma.akun.findUnique({ where: { id: akunId } });
    if (!akun) return null;

    // Saldo awal PERIODE (bukan saldo awal akun sejak awal berdiri) — akun
    // saldoAwal + semua mutasi SEBELUM startDate. Kalau gak, filter tanggal
    // bakal bikin saldo berjalan keliatan understated karena mutasi
    // sebelum rentang yang difilter ke-skip padahal harusnya tetep kehitung.
    let saldoAwalPeriode = Number(akun.saldoAwal);
    if (startDate) {
      const aggSebelum = await prisma.jurnalBaris.aggregate({
        where: { akunId, transaksi: { tanggal: { lt: new Date(startDate) } } },
        _sum: { debit: true, kredit: true },
      });
      saldoAwalPeriode += mutasiBersih(akun.jenis, aggSebelum._sum.debit || 0, aggSebelum._sum.kredit || 0);
    }

    const barisList = await prisma.jurnalBaris.findMany({
      where: {
        akunId,
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

    return {
      akun: { id: akun.id, kode: akun.kode, nama: akun.nama, jenis: akun.jenis },
      saldoAwal: saldoAwalPeriode,
      saldoAkhir: saldo,
      rows,
    };
}

const getBukuBesarAkun = async (req, res) => {
  try {
    const { akunId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await computeBukuBesarAkun(akunId, startDate, endDate);
    if (!data) return res.status(404).json({ message: "Akun tidak ditemukan" });
    return res.status(200).json(data);
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

const HARGA_POKOK_KATEGORI = ["HARGA_POKOK_JASA"];
const BEBAN_PENJUALAN_KATEGORI = ["BEBAN_PENJUALAN"];

async function computeLabaRugi(startDate, endDate) {
  const tanggalFilter = {
    gte: new Date(startDate),
    lte: new Date(`${endDate}T23:59:59.999Z`),
  };

  const akunList = await prisma.akun.findMany({
    where: { jenis: { in: ["PENDAPATAN", "BEBAN"] } },
    orderBy: [{ jenis: "asc" }, { kode: "asc" }, { nama: "asc" }],
  });

  const pendapatan = [];
  const hargaPokok = [];
  const bebanPenjualan = [];
  const bebanAdministrasi = [];
  let totalPendapatan = 0;
  let totalHargaPokok = 0;
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
    } else if (HARGA_POKOK_KATEGORI.includes(akun.kategori)) {
      totalHargaPokok += saldo;
      hargaPokok.push(item);
    } else if (BEBAN_PENJUALAN_KATEGORI.includes(akun.kategori)) {
      totalBebanPenjualan += saldo;
      bebanPenjualan.push(item);
    } else {
      totalBebanAdministrasi += saldo;
      bebanAdministrasi.push(item);
    }
  }

  const totalBeban = totalHargaPokok + totalBebanPenjualan + totalBebanAdministrasi;
  const labaKotor = totalPendapatan - totalHargaPokok;
  const labaRugiBersih = totalPendapatan - totalBeban;

  return {
    startDate,
    endDate,
    pendapatan,
    totalPendapatan,
    hargaPokok,
    totalHargaPokok,
    labaKotor,
    bebanPenjualan,
    totalBebanPenjualan,
    bebanAdministrasi,
    totalBebanAdministrasi,
    totalBeban,
    labaRugiBersih,
  };
}

// Real-time: gak ada lagi konsep Draft/Final, laporan selalu dihitung
// langsung dari JurnalBaris di rentang tanggal yang diminta. Default
// rentang (kalau startDate/endDate gak dikirim) di-handle di FE (bulan ini).
const getLaporanLabaRugi = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate dan endDate wajib diisi (format YYYY-MM-DD)" });
    }
    const data = await computeLabaRugi(startDate, endDate);
    return res.status(200).json({ data });
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

async function computeNeraca(tanggalQuery) {
    const tanggal = tanggalQuery ? new Date(`${tanggalQuery}T23:59:59.999Z`) : new Date();

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

    return {
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
    };
}

const getNeracaSnapshot = async (req, res) => {
  try {
    const data = await computeNeraca(req.query.tanggal);
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getNeracaSnapshot error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// FITUR 6 — KAS & BANK (versi simpel Buku Besar, khusus akun isKasBank)
// ─────────────────────────────────────────────

async function computeKasBank(startDate, endDate) {
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

    return { mutasi, totalSaldoGabungan: totalSaldo };
}

const getKasBank = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await computeKasBank(startDate, endDate);
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getKasBank error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// EXPORT PDF — Laba Rugi, Neraca, Buku Besar (per akun), Kas & Bank
// ─────────────────────────────────────────────

function pipePdf(res, doc, filename) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);
}

const exportLabaRugiPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate dan endDate wajib diisi (format YYYY-MM-DD)" });
    }
    const data = await computeLabaRugi(startDate, endDate);

    const doc = newDocument();
    pipePdf(res, doc, `laba-rugi-${startDate}_${endDate}.pdf`);

    documentHeader(doc, {
      title: "Laporan Laba (Rugi)",
      subtitle: `Periode ${formatTanggal(startDate)} — ${formatTanggal(endDate)}`,
    });

    const columns = [
      { label: "Uraian", width: 340, align: "left" },
      { label: "Nominal", width: 100, align: "right" },
      { label: "% Pdptn", width: 60, align: "right" },
    ];
    const persen = (v) => (data.totalPendapatan ? `${((v / data.totalPendapatan) * 100).toFixed(1)}%` : "-");

    const rows = [
      { cells: ["PENDAPATAN", "", ""], bold: true, fillColor: "#f4f4f5" },
      ...data.pendapatan.map((r) => ({
        cells: [r.akun.nama, formatRupiah(r.saldo), persen(r.saldo)],
        indent: 10,
      })),
      { cells: ["Total Pendapatan", formatRupiah(data.totalPendapatan), "100.0%"], bold: true, fillColor: "#ecfdf5" },
      { cells: ["HARGA POKOK JASA", "", ""], bold: true, fillColor: "#f4f4f5" },
      ...data.hargaPokok.map((r) => ({
        cells: [r.akun.nama, formatRupiah(r.saldo), persen(r.saldo)],
        indent: 10,
      })),
      { cells: ["Total Harga Pokok Jasa", formatRupiah(data.totalHargaPokok), persen(data.totalHargaPokok)], bold: true, fillColor: "#fafafa" },
      { cells: ["LABA KOTOR", formatRupiah(data.labaKotor), persen(data.labaKotor)], bold: true, fillColor: "#e4e4e7" },
      { cells: ["BEBAN PENJUALAN", "", ""], bold: true, fillColor: "#f4f4f5" },
      ...data.bebanPenjualan.map((r) => ({
        cells: [r.akun.nama, formatRupiah(r.saldo), persen(r.saldo)],
        indent: 10,
      })),
      { cells: ["Total Beban Penjualan", formatRupiah(data.totalBebanPenjualan), persen(data.totalBebanPenjualan)], bold: true, fillColor: "#fafafa" },
      { cells: ["BEBAN UMUM & ADMINISTRASI", "", ""], bold: true, fillColor: "#f4f4f5" },
      ...data.bebanAdministrasi.map((r) => ({
        cells: [r.akun.nama, formatRupiah(r.saldo), persen(r.saldo)],
        indent: 10,
      })),
      { cells: ["Total Beban Administrasi", formatRupiah(data.totalBebanAdministrasi), persen(data.totalBebanAdministrasi)], bold: true, fillColor: "#fafafa" },
      { cells: ["TOTAL BEBAN USAHA", formatRupiah(data.totalBeban), persen(data.totalBeban)], bold: true, fillColor: "#e4e4e7" },
      {
        cells: [
          data.labaRugiBersih >= 0 ? "LABA BERSIH" : "RUGI BERSIH",
          formatRupiah(data.labaRugiBersih),
          persen(data.labaRugiBersih),
        ],
        bold: true,
        fillColor: "#d1fae5",
      },
    ];

    drawTable(doc, { columns, rows });
    footer(doc);
    doc.end();
  } catch (error) {
    console.error("[exportLabaRugiPdf error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const exportNeracaPdf = async (req, res) => {
  try {
    const data = await computeNeraca(req.query.tanggal);

    const doc = newDocument();
    pipePdf(res, doc, `neraca-${data.tanggal.toISOString().slice(0, 10)}.pdf`);

    documentHeader(doc, {
      title: "Neraca",
      subtitle: `Per tanggal ${formatTanggal(data.tanggal)}${data.isBalance ? "" : " — TIDAK BALANCE"}`,
    });

    const columns = [
      { label: "Uraian", width: 400, align: "left" },
      { label: "Nominal", width: 100, align: "right" },
    ];

    const section = (label, rowsArr) =>
      rowsArr.map((r) => ({ cells: [r.akun.nama, formatRupiah(r.saldo)], indent: 10 }));

    const rows = [
      { cells: ["AKTIVA", ""], bold: true, fillColor: "#18181b", textColor: "#ffffff" },
      { cells: ["Aktiva Lancar", ""], bold: true, fillColor: "#f4f4f5" },
      ...section("Aktiva Lancar", data.aktivaLancar),
      { cells: ["Total Aktiva Lancar", formatRupiah(data.totalAktivaLancar)], bold: true, fillColor: "#fafafa" },
      { cells: ["Aktiva Tetap", ""], bold: true, fillColor: "#f4f4f5" },
      ...section("Aktiva Tetap", data.aktivaTetap),
      { cells: ["Total Aktiva Tetap", formatRupiah(data.totalAktivaTetap)], bold: true, fillColor: "#fafafa" },
      { cells: ["TOTAL AKTIVA", formatRupiah(data.totalAset)], bold: true, fillColor: "#e4e4e7" },

      { cells: ["PASIVA", ""], bold: true, fillColor: "#18181b", textColor: "#ffffff" },
      { cells: ["Hutang Lancar", ""], bold: true, fillColor: "#f4f4f5" },
      ...section("Hutang Lancar", data.hutangLancar),
      { cells: ["Total Hutang Lancar", formatRupiah(data.totalHutangLancar)], bold: true, fillColor: "#fafafa" },
      { cells: ["Hutang Jangka Panjang", ""], bold: true, fillColor: "#f4f4f5" },
      ...section("Hutang Jangka Panjang", data.hutangJangkaPanjang),
      { cells: ["Total Hutang Jangka Panjang", formatRupiah(data.totalHutangJangkaPanjang)], bold: true, fillColor: "#fafafa" },
      { cells: ["Modal", ""], bold: true, fillColor: "#f4f4f5" },
      ...section("Modal", data.modal),
      { cells: ["Total Modal", formatRupiah(data.totalModal)], bold: true, fillColor: "#fafafa" },
      { cells: ["TOTAL KEWAJIBAN & EKUITAS", formatRupiah(data.totalLiabilitas + data.totalModal)], bold: true, fillColor: "#e4e4e7" },
    ];

    drawTable(doc, { columns, rows });
    footer(doc);
    doc.end();
  } catch (error) {
    console.error("[exportNeracaPdf error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const exportBukuBesarAkunPdf = async (req, res) => {
  try {
    const { akunId } = req.params;
    const { startDate, endDate } = req.query;
    const data = await computeBukuBesarAkun(akunId, startDate, endDate);
    if (!data) return res.status(404).json({ message: "Akun tidak ditemukan" });

    const doc = newDocument();
    pipePdf(res, doc, `buku-besar-${data.akun.kode || data.akun.id}.pdf`);

    documentHeader(doc, {
      title: "Buku Besar",
      subtitle: `${data.akun.kode ? data.akun.kode + " - " : ""}${data.akun.nama}${
        startDate || endDate ? ` (${startDate ? formatTanggal(startDate) : "awal"} — ${endDate ? formatTanggal(endDate) : "sekarang"})` : ""
      }`,
    });

    const columns = [
      { label: "Tanggal", width: 60, align: "left" },
      { label: "No. Jurnal", width: 75, align: "left" },
      { label: "Keterangan", width: 140, align: "left" },
      { label: "Debit", width: 78, align: "right" },
      { label: "Kredit", width: 78, align: "right" },
      { label: "Saldo", width: 84, align: "right" },
    ];

    const rows = [
      { cells: ["", "", "Beginning Balance", "", "", formatRupiah(data.saldoAwal)], bold: true, fillColor: "#f4f4f5" },
      ...data.rows.map((r) => ({
        cells: [
          formatTanggal(r.tanggal),
          r.noJurnal,
          r.keterangan,
          Number(r.debit) ? formatRupiah(r.debit) : "-",
          Number(r.kredit) ? formatRupiah(r.kredit) : "-",
          formatRupiah(r.saldo),
        ],
      })),
      { cells: ["", "", "Ending Balance", "", "", formatRupiah(data.saldoAkhir)], bold: true, fillColor: "#ecfdf5" },
    ];

    drawTable(doc, { columns, rows });
    footer(doc);
    doc.end();
  } catch (error) {
    console.error("[exportBukuBesarAkunPdf error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const exportKasBankPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await computeKasBank(startDate, endDate);

    const doc = newDocument();
    pipePdf(res, doc, `kas-bank-${startDate || "awal"}_${endDate || "sekarang"}.pdf`);

    documentHeader(doc, {
      title: "Laporan Kas & Bank",
      subtitle:
        startDate || endDate
          ? `${startDate ? formatTanggal(startDate) : "awal"} — ${endDate ? formatTanggal(endDate) : "sekarang"}`
          : "Seluruh periode",
    });

    const columns = [
      { label: "Tanggal", width: 60, align: "left" },
      { label: "No. Jurnal", width: 75, align: "left" },
      { label: "Keterangan", width: 140, align: "left" },
      { label: "Masuk", width: 78, align: "right" },
      { label: "Keluar", width: 78, align: "right" },
      { label: "Saldo", width: 84, align: "right" },
    ];

    for (const akunMutasi of data.mutasi) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("#18181b").text(
        `${akunMutasi.akun.kode ? akunMutasi.akun.kode + " - " : ""}${akunMutasi.akun.nama}`,
      );
      doc.moveDown(0.3);

      const rows = [
        { cells: ["", "", "Beginning Balance", "", "", formatRupiah(akunMutasi.saldoAwal)], bold: true, fillColor: "#f4f4f5" },
        ...akunMutasi.rows.map((r) => ({
          cells: [
            formatTanggal(r.tanggal),
            r.noJurnal,
            r.keterangan,
            Number(r.masuk) ? formatRupiah(r.masuk) : "-",
            Number(r.keluar) ? formatRupiah(r.keluar) : "-",
            formatRupiah(r.saldo),
          ],
        })),
        { cells: ["", "", "Ending Balance", "", "", formatRupiah(akunMutasi.saldoAkhir)], bold: true, fillColor: "#ecfdf5" },
      ];
      drawTable(doc, { columns, rows });
      doc.moveDown(0.5);
    }

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#18181b").text(
      `Total Saldo Gabungan: ${formatRupiah(data.totalSaldoGabungan)}`,
      { align: "right" },
    );

    footer(doc);
    doc.end();
  } catch (error) {
    console.error("[exportKasBankPdf error]", error);
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

  exportLabaRugiPdf,
  exportNeracaPdf,
  exportBukuBesarAkunPdf,
  exportKasBankPdf,
};
