// controllers/pendapatanController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { toPeriode, createJurnalTransaksi } = require("../services/jurnal.service");

/**
 * GET /api/accounting/pendapatan
 * Query params:
 *  - page         : number, default 1
 *  - limit        : number, default 10
 *  - sortBy       : 'kodePelatihan' | 'judulTraining' | 'biaya' | 'totalPeserta' | 'pendapatan'
 *  - order        : 'asc' | 'desc', default 'asc'
 *  - startMonth   : number (1-12), wajib jika ingin filter bulan
 *  - startYear    : number (tahun), wajib jika startMonth ada
 *  - endMonth     : number (1-12), opsional
 *  - endYear      : number, opsional
 *  - jenis        : 'REG' | 'INH' | 'KON', opsional (filter berdasarkan jenisTraining)
 */
const getPendapatan = async (req, res) => {
  try {
    // 1. Ambil query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "kodePelatihan";
    const order = req.query.order === "desc" ? "desc" : "asc";
    const jenis = req.query.jenis; // 'REG', 'INH', 'KON' atau undefined

    const startMonth = parseInt(req.query.startMonth);
    const startYear = parseInt(req.query.startYear);
    const endMonth = req.query.endMonth
      ? parseInt(req.query.endMonth)
      : undefined;
    const endYear = req.query.endYear ? parseInt(req.query.endYear) : undefined;

    // 2. Buat filter dasar
    const now = new Date();
    let dateFilter = {
      tglSelesai: {
        lt: now, // hanya yang sudah lewat
      },
    };

    if (startMonth && startYear) {
      const startDate = new Date(startYear, startMonth - 1, 1);
      let endDate;

      if (endMonth && endYear) {
        // Range bulan
        const nextMonth = new Date(endYear, endMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      } else {
        // Satu bulan
        const nextMonth = new Date(startYear, startMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      }

      dateFilter = {
        tglSelesai: {
          gte: startDate,
          lte: endDate,
          lt: now,
        },
      };
    }

    // 3. Tambahkan filter jenisTraining jika ada
    const whereClause = {
      ...dateFilter,
    };

    if (jenis && ["REG", "INH", "KON"].includes(jenis)) {
      whereClause.jenisTraining = jenis;
    }

    // 4. Ambil data dari database
    const jadwalList = await prisma.jadwalTraining.findMany({
      where: whereClause,
      include: {
        judulTraining: true,
        peserta: true,
      },
    });

    // 5. Transformasi dan hitung agregat
    const result = jadwalList.map((jadwal) => {
      const semuaPeserta = jadwal.peserta || [];
      const totalPeserta = semuaPeserta.length;

      const pendapatan = semuaPeserta
        .filter((p) => p.status === "FIX")
        .reduce((sum, p) => sum + (p.hargaTotal || 0), 0);

      return {
        kodeJadwal: jadwal.noJadwal,
        kodePelatihan: jadwal.kodePelatihan,
        judulTraining: jadwal.judulTraining?.judulTraining || "",
        judulLengkap: jadwal.judulLengkap,
        biaya: jadwal.biaya,
        jenisTraining: jadwal.jenisTraining, // tambahkan field jenis
        totalPeserta,
        pendapatan,
        tglSelesai: jadwal.tglSelesai, // t
      };
    });

    // 6. Sorting di memori
    const sortOrder = order === "asc" ? 1 : -1;
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") {
        return valA.localeCompare(valB) * sortOrder;
      } else {
        return (valA - valB) * sortOrder;
      }
    });

    //Sorting Tanggal
    // setelah result dibuat, sebelum sorting
    const sortField = sortBy;

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "tglSelesai") {
        // valA dan valB adalah Date atau null
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return (dateA - dateB) * sortOrder;
      } else if (typeof valA === "string") {
        return valA.localeCompare(valB) * sortOrder;
      } else {
        return (valA - valB) * sortOrder;
      }
    });

    // Grand Total
    const grandTotalPeserta = result.reduce(
      (sum, item) => sum + item.totalPeserta,
      0,
    );
    const grandTotalPendapatan = result.reduce(
      (sum, item) => sum + item.pendapatan,
      0,
    );

    // 7. Pagination
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = result.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    // 8. Response
    return res.status(200).json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      grandTotal: {
        totalPeserta: grandTotalPeserta,
        pendapatan: grandTotalPendapatan,
      },
    });
  } catch (error) {
    console.error("[getPendapatan error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getPiutang = async (req, res) => {
  try {
    // 1. Ambil query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "kodePelatihan"; // bisa 'totalPesertaBelumLunas', 'totalPiutang', 'tglSelesai', dll
    const order = req.query.order === "desc" ? "desc" : "asc";
    const jenis = req.query.jenis; // 'REG', 'INH', 'KON'

    const startMonth = parseInt(req.query.startMonth);
    const startYear = parseInt(req.query.startYear);
    const endMonth = req.query.endMonth
      ? parseInt(req.query.endMonth)
      : undefined;
    const endYear = req.query.endYear ? parseInt(req.query.endYear) : undefined;

    // 2. Filter tanggal (sama seperti sebelumnya)
    const now = new Date();
    let dateFilter = {
      tglSelesai: { lt: now },
    };
    if (startMonth && startYear) {
      const startDate = new Date(startYear, startMonth - 1, 1);
      let endDate;
      if (endMonth && endYear) {
        const nextMonth = new Date(endYear, endMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      } else {
        const nextMonth = new Date(startYear, startMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      }
      dateFilter = {
        tglSelesai: {
          gte: startDate,
          lte: endDate,
          lt: now,
        },
      };
    }

    // 3. Filter jenis
    const whereClause = { ...dateFilter };
    if (jenis && ["REG", "INH", "KON"].includes(jenis)) {
      whereClause.jenisTraining = jenis;
    }

    // 4. Ambil data jadwal dengan relasi peserta (hanya peserta status FIX)
    const jadwalList = await prisma.jadwalTraining.findMany({
      where: whereClause,
      include: {
        judulTraining: true,
        peserta: {
          where: { status: "FIX" }, // Hanya peserta yang fix
        },
      },
    });

    // 5. Transformasi dan hitung agregat piutang
    const result = jadwalList.map((jadwal) => {
      const pesertaFix = jadwal.peserta || [];
      const totalPesertaFix = pesertaFix.length;

      // Peserta yang belum lunas: bayar < hargaTotal (anggap bayar null atau 0 sebagai belum bayar)
      const belumLunas = pesertaFix.filter(
        (p) => (p.bayar || 0) < (p.hargaTotal || 0),
      );
      const totalPesertaBelumLunas = belumLunas.length;

      // Total piutang = sum (hargaTotal - bayar) untuk yang belum lunas
      const totalPiutang = belumLunas.reduce(
        (sum, p) => sum + ((p.hargaTotal || 0) - (p.bayar || 0)),
        0,
      );

      // Total pendapatan (total hargaTotal semua peserta fix)
      const totalPendapatan = pesertaFix.reduce(
        (sum, p) => sum + (p.hargaTotal || 0),
        0,
      );

      return {
        kodeJadwal: jadwal.noJadwal,
        kodePelatihan: jadwal.kodePelatihan,
        judulTraining: jadwal.judulTraining?.judulTraining || "",
        judulLengkap: jadwal.judulLengkap,
        biaya: jadwal.biaya,
        jenisTraining: jadwal.jenisTraining,
        tglSelesai: jadwal.tglSelesai,
        totalPesertaFix,
        totalPesertaBelumLunas,
        totalPiutang,
        totalPendapatan,
      };
    });

    // 6. Sorting
    const sortOrder = order === "asc" ? 1 : -1;
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === "tglSelesai") {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return (dateA - dateB) * sortOrder;
      } else if (typeof valA === "string") {
        return valA.localeCompare(valB) * sortOrder;
      } else {
        return (valA - valB) * sortOrder;
      }
    });

    // 7. Grand Total
    const grandTotalPesertaBelumLunas = result.reduce(
      (sum, item) => sum + item.totalPesertaBelumLunas,
      0,
    );
    const grandTotalPiutang = result.reduce(
      (sum, item) => sum + item.totalPiutang,
      0,
    );

    // 8. Pagination
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = result.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: paginatedData,
      pagination: { page, limit, total, totalPages },
      grandTotal: {
        totalPesertaBelumLunas: grandTotalPesertaBelumLunas,
        totalPiutang: grandTotalPiutang,
      },
    });
  } catch (error) {
    console.error("[getPiutang error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getDetailPiutang = async (req, res) => {
  try {
    const { kodeJadwal } = req.params;

    // Ambil jadwal dengan peserta FIX
    const jadwal = await prisma.jadwalTraining.findUnique({
      where: { noJadwal: kodeJadwal },
      include: {
        peserta: {
          where: { status: "FIX" },
          select: {
            nama: true,
            hargaTotal: true,
            bayar: true,
          },
        },
      },
    });

    if (!jadwal) {
      return res.status(404).json({ message: "Jadwal tidak ditemukan" });
    }

    // Hitung kurang bayar setiap peserta
    const pesertaDetail = jadwal.peserta.map((p) => ({
      nama: p.nama,
      hargaTotal: p.hargaTotal || 0,
      bayar: p.bayar || 0,
      kurangBayar: (p.hargaTotal || 0) - (p.bayar || 0),
    }));

    // Urutkan dari kurangBayar terbesar ke terkecil
    pesertaDetail.sort((a, b) => b.kurangBayar - a.kurangBayar);

    // Grand total dari jadwal ini (optional)
    const totalPiutangJadwal = pesertaDetail.reduce(
      (sum, p) => sum + p.kurangBayar,
      0,
    );
    const totalPeserta = pesertaDetail.length;
    const totalBelumLunas = pesertaDetail.filter(
      (p) => p.kurangBayar > 0,
    ).length;

    return res.status(200).json({
      data: pesertaDetail,
      grandTotal: {
        totalPeserta,
        totalBelumLunas,
        totalPiutang: totalPiutangJadwal,
      },
    });
  } catch (error) {
    console.error("[getDetailPiutang error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// HELPER: Hitung saldo terakhir sebelum tanggal tertentu
// ─────────────────────────────────────────────

// ─── GET JENIS BIAYA ──────────────────────────────────────
const getJenisBiaya = async (req, res) => {
  try {
    const data = await prisma.tableJenisBiaya.findMany({
      orderBy: { kode: "asc" },
    });
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// helpers/convertBigInt.js
function convertBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (obj instanceof Date) return obj.toISOString(); // <-- ini penting
  if (Array.isArray(obj)) return obj.map((item) => convertBigInt(item));
  if (typeof obj === "object") {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = convertBigInt(value);
    }
    return newObj;
  }
  return obj;
}

// ─── GET NERACA ────────────────────────────────────────────
const getNeracaPagination = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      // Filter bulan/tahun
      startMonth,
      startYear,
      endMonth,
      endYear,
      month,
      year,
      jenisBiayaKode,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Filter periode (bulan/tahun)
    if (startMonth && startYear && endMonth && endYear) {
      const startPeriode = `${startYear}${String(startMonth).padStart(2, "0")}`;
      const endPeriode = `${endYear}${String(endMonth).padStart(2, "0")}`;
      where.periode = { gte: startPeriode, lte: endPeriode };
    } else if (month && year) {
      where.periode = `${year}${String(month).padStart(2, "0")}`;
    } else if (year) {
      // jika hanya tahun, filter semua bulan di tahun itu
      where.periode = { startsWith: String(year) };
    }

    // Filter jenis biaya
    if (jenisBiayaKode) {
      const jb = await prisma.tableJenisBiaya.findUnique({
        where: { kode: jenisBiayaKode },
        select: { id: true },
      });
      if (jb) where.jenisBiayaId = jb.id;
      else {
        return res.json({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPage: 0 },
        });
      }
    }

    // Search
    if (search) {
      where.OR = [
        { uraian: { contains: search, mode: "insensitive" } },
        { bukti: { contains: search, mode: "insensitive" } },
        { periode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.tableNeraca.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ tanggal: "asc" }, { id: "desc" }],
        include: {
          jenisBiaya: { select: { kode: true, ket: true } },
          userInput: { select: { nama: true } },
          userUpdate: { select: { nama: true } },
        },
      }),
      prisma.tableNeraca.count({ where }),
    ]);

    // Konversi BigInt dan Date
    const convertedData = convertBigInt(data);

    res.json({
      data: convertedData,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPage: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ─── CREATE ─────────────────────────────────────────────────
const createNeraca = async (req, res) => {
  try {
    const { tanggal, kode, uraian, bukti, debit, kredit } = req.body;
    const userInputId = req.user?.pegawaiId || null;

    const jenisBiaya = await prisma.tableJenisBiaya.findUnique({
      where: { kode },
    });
    if (!jenisBiaya) {
      return res
        .status(404)
        .json({ message: "Kode jenis biaya tidak ditemukan" });
    }

    const debitVal = debit ? BigInt(debit) : 0n;
    const kreditVal = kredit ? BigInt(kredit) : 0n;

    // Cari saldo terakhir (tanpa pagination)
    const last = await prisma.tableNeraca.findFirst({
      where: { tanggal: { lt: new Date(tanggal) } },
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
      select: { saldo: true },
    });
    const saldoTerakhir = last?.saldo ?? 0n;
    const saldoBaru = saldoTerakhir + debitVal - kreditVal;

    const data = await prisma.tableNeraca.create({
      data: {
        tanggal: new Date(tanggal),
        jenisBiayaId: jenisBiaya.id,
        uraian: uraian || "",
        bukti: bukti || "",
        debit: debitVal,
        kredit: kreditVal,
        saldo: saldoBaru,
        periode: new Date(tanggal).toISOString().slice(0, 7).replace("-", ""),
        userInputId,
        tanggalInput: new Date(),
      },
      include: {
        jenisBiaya: true,
        userInput: { select: { nama: true } },
      },
    });

    const converted = convertBigInt(data);
    res
      .status(201)
      .json({ message: "Neraca berhasil dibuat", data: converted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ─── UPDATE ─────────────────────────────────────────────────
const updateNeraca = async (req, res) => {
  try {
    const { id } = req.params;
    const { tanggal, kode, uraian, bukti, debit, kredit } = req.body;
    const userUpdateId = req.user?.pegawaiId || null;

    const existing = await prisma.tableNeraca.findUnique({
      where: { id: parseInt(id) },
      include: { jenisBiaya: true },
    });
    if (!existing) {
      return res.status(404).json({ message: "Data neraca tidak ditemukan" });
    }

    let jenisBiayaId = existing.jenisBiayaId;
    if (kode && kode !== existing.jenisBiaya.kode) {
      const jb = await prisma.tableJenisBiaya.findUnique({ where: { kode } });
      if (!jb) {
        return res
          .status(404)
          .json({ message: "Kode jenis biaya tidak ditemukan" });
      }
      jenisBiayaId = jb.id;
    }

    let newTanggal = existing.tanggal;
    let newDebit = existing.debit;
    let newKredit = existing.kredit;

    if (tanggal) newTanggal = new Date(tanggal);
    if (debit !== undefined) newDebit = BigInt(debit);
    if (kredit !== undefined) newKredit = BigInt(kredit);

    let newSaldo = existing.saldo;
    if (tanggal || debit !== undefined || kredit !== undefined) {
      const last = await prisma.tableNeraca.findFirst({
        where: {
          tanggal: { lt: newTanggal },
          id: { not: parseInt(id) },
        },
        orderBy: [{ tanggal: "desc" }, { id: "desc" }],
        select: { saldo: true },
      });
      const saldoSebelumnya = last?.saldo ?? 0n;
      newSaldo = saldoSebelumnya + newDebit - newKredit;
    }

    const updated = await prisma.tableNeraca.update({
      where: { id: parseInt(id) },
      data: {
        tanggal: newTanggal,
        jenisBiayaId,
        uraian: uraian || existing.uraian,
        bukti: bukti || existing.bukti,
        debit: newDebit,
        kredit: newKredit,
        saldo: newSaldo,
        periode: newTanggal.toISOString().slice(0, 7).replace("-", ""),
        userUpdateId,
        tanggalUpdate: new Date(),
      },
      include: {
        jenisBiaya: true,
        userInput: { select: { nama: true } },
        userUpdate: { select: { nama: true } },
      },
    });

    const converted = convertBigInt(updated);
    res.json({ message: "Neraca berhasil diupdate", data: converted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ─── DELETE ─────────────────────────────────────────────────
const deleteNeraca = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.tableNeraca.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "Data neraca tidak ditemukan" });
    }
    await prisma.tableNeraca.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Neraca berhasil dihapus" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getLaporanHasilUsaha = async (req, res) => {
  try {
    // 1. Query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "realisasi"; // bisa 'kode', 'keterangan', 'realisasi', 'anggaran'
    const order = req.query.order === "desc" ? "desc" : "asc";

    const startMonth = parseInt(req.query.startMonth);
    const startYear = parseInt(req.query.startYear);
    const endMonth = req.query.endMonth
      ? parseInt(req.query.endMonth)
      : undefined;
    const endYear = req.query.endYear ? parseInt(req.query.endYear) : undefined;

    // 2. Filter tanggal (sama seperti sebelumnya)
    const now = new Date();
    let dateFilter = {
      tglSelesai: { lt: now },
    };
    if (startMonth && startYear) {
      const startDate = new Date(startYear, startMonth - 1, 1);
      let endDate;
      if (endMonth && endYear) {
        const nextMonth = new Date(endYear, endMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      } else {
        const nextMonth = new Date(startYear, startMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      }
      dateFilter = {
        tglSelesai: {
          gte: startDate,
          lte: endDate,
          lt: now,
        },
      };
    }

    // 3. Ambil semua JudulTraining (master)
    const semuaJudul = await prisma.judulTraining.findMany({
      select: {
        kode: true,
        judulTraining: true,
      },
    });

    // 4. Ambil semua JadwalTraining yang lolos filter tanggal, include peserta FIX
    const jadwalList = await prisma.jadwalTraining.findMany({
      where: dateFilter,
      include: {
        peserta: {
          where: { status: "FIX" },
        },
      },
    });

    // 5. Kelompokkan realisasi per kodePelatihan
    const realisasiMap = new Map();
    jadwalList.forEach((jadwal) => {
      const kode = jadwal.kodePelatihan;
      let total = 0;
      if (jadwal.peserta && jadwal.peserta.length > 0) {
        total = jadwal.peserta.reduce((sum, p) => sum + (p.hargaTotal || 0), 0);
      }
      // Akumulasi per kode
      if (realisasiMap.has(kode)) {
        realisasiMap.set(kode, realisasiMap.get(kode) + total);
      } else {
        realisasiMap.set(kode, total);
      }
    });

    // 6. Bentuk hasil array
    let result = semuaJudul.map((item) => ({
      kode: item.kode,
      keterangan: item.judulTraining,
      anggaran: 0, // nanti diisi
      realisasi: realisasiMap.get(item.kode) || 0,
    }));

    // 7. Sorting
    const sortOrder = order === "asc" ? 1 : -1;
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") {
        return valA.localeCompare(valB) * sortOrder;
      } else {
        return (valA - valB) * sortOrder;
      }
    });

    // 8. Grand Total
    const grandTotalRealisasi = result.reduce(
      (sum, item) => sum + item.realisasi,
      0,
    );
    const grandTotalAnggaran = 0; // karena anggaran 0 semua

    // 9. Pagination
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = result.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(total / limit);

    // 10. Response
    return res.status(200).json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      grandTotal: {
        totalRealisasi: grandTotalRealisasi,
        totalAnggaran: grandTotalAnggaran,
      },
    });
  } catch (error) {
    console.error("[getLaporanHasilUsaha error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── Helper ──────────────────────────────────────────────────────
// ─── Helper ──────────────────────────────────────────────────────
function parseDateCustom(str) {
  if (!str) return null;
  let parts = str.split(".");
  if (parts.length !== 3) parts = str.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function formatPeriodFromDate(dateObj) {
  if (!dateObj) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

// ─── GET UMK ──────────────────────────────────────────────────────
const getUmk = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "tglInput";
    const order = req.query.order === "asc" ? "asc" : "desc";
    const picId = req.query.picId;
    const search = req.query.search || "";

    const startMonth = parseInt(req.query.startMonth);
    const startYear = parseInt(req.query.startYear);
    const endMonth = req.query.endMonth
      ? parseInt(req.query.endMonth)
      : undefined;
    const endYear = req.query.endYear ? parseInt(req.query.endYear) : undefined;

    let dateFilter = {};
    if (startMonth && startYear) {
      const startDate = new Date(startYear, startMonth - 1, 1);
      let endDate;
      if (endMonth && endYear) {
        const nextMonth = new Date(endYear, endMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      } else {
        const nextMonth = new Date(startYear, startMonth, 1);
        endDate = new Date(nextMonth.getTime() - 1);
      }
      dateFilter = {
        tglInput: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const where = { ...dateFilter };
    if (picId) where.picId = picId;
    if (search) {
      where.OR = [
        { noUmk: { contains: search } },
        { tujuanUmk: { contains: search } },
        { pic: { is: { nama: { contains: search } } } },
        { inputter: { is: { nama: { contains: search } } } },
      ];
    }

    const total = await prisma.umk.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const data = await prisma.umk.findMany({
      where,
      include: {
        pic: { select: { id: true, nama: true } },
        inputter: { select: { id: true, nama: true } },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    });

    const grandTotal = await prisma.umk.aggregate({
      where,
      _sum: {
        jumlahUmk: true,
        realisasiUmk: true,
        sisaUangUmk: true,
      },
    });

    return res.status(200).json({
      data,
      pagination: { page, limit, total, totalPages },
      grandTotal: {
        totalJumlah: grandTotal._sum.jumlahUmk || 0,
        totalRealisasi: grandTotal._sum.realisasiUmk || 0,
        totalSisa: grandTotal._sum.sisaUangUmk || 0,
      },
    });
  } catch (error) {
    console.error("[getUmk error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── CREATE UMK ──────────────────────────────────────────────────
const createUmk = async (req, res) => {
  try {
    const {
      noUmk,
      tujuanUmk,
      picId,
      jumlahUmk,
      tglPenyerahanUang,
      realisasiUmk,
      ketUmk,
    } = req.body;

    if (!noUmk) return res.status(400).json({ message: "No. UMK wajib diisi" });
    if (!tujuanUmk)
      return res.status(400).json({ message: "Tujuan UMK wajib diisi" });
    if (!picId) return res.status(400).json({ message: "PIC wajib dipilih" });
    if (!jumlahUmk)
      return res.status(400).json({ message: "Jumlah UMK wajib diisi" });

    const existing = await prisma.umk.findUnique({ where: { noUmk } });
    if (existing) {
      return res
        .status(400)
        .json({ message: `No. UMK "${noUmk}" sudah terdaftar` });
    }

    const tglDate = parseDateCustom(tglPenyerahanUang);
    const periode = tglDate ? formatPeriodFromDate(tglDate) : "";

    const realisasi = realisasiUmk || 0;
    const sisa = jumlahUmk - realisasi;

    const data = await prisma.umk.create({
      data: {
        noUmk,
        tujuanUmk,
        picId,
        jumlahUmk,
        tglPenyerahanUang: tglPenyerahanUang || null,
        realisasiUmk: realisasi,
        sisaUangUmk: sisa,
        ketUmk: ketUmk || null,
        periodeUmk: periode,
        inputterId: req.user.id,
      },
      include: {
        pic: { select: { id: true, nama: true } },
        inputter: { select: { id: true, nama: true } },
      },
    });

    return res.status(201).json({ message: "UMK berhasil dibuat", data });
  } catch (error) {
    console.error("[createUmk error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── UPDATE UMK ──────────────────────────────────────────────────
const updateUmk = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tujuanUmk,
      picId,
      jumlahUmk,
      tglPenyerahanUang,
      realisasiUmk,
      ketUmk,
    } = req.body;

    const existing = await prisma.umk.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "UMK tidak ditemukan" });
    }

    const tglDate = parseDateCustom(tglPenyerahanUang);
    const periode = tglDate
      ? formatPeriodFromDate(tglDate)
      : existing.periodeUmk;

    const realisasi =
      realisasiUmk !== undefined ? realisasiUmk : existing.realisasiUmk;
    const jumlah = jumlahUmk || existing.jumlahUmk;
    const sisa = jumlah - realisasi;

    const data = await prisma.umk.update({
      where: { id: parseInt(id) },
      data: {
        tujuanUmk: tujuanUmk || existing.tujuanUmk,
        picId: picId || existing.picId,
        jumlahUmk: jumlah,
        tglPenyerahanUang:
          tglPenyerahanUang !== undefined
            ? tglPenyerahanUang
            : existing.tglPenyerahanUang,
        realisasiUmk: realisasi,
        sisaUangUmk: sisa,
        ketUmk: ketUmk !== undefined ? ketUmk : existing.ketUmk,
        periodeUmk: periode,
      },
      include: {
        pic: { select: { id: true, nama: true } },
        inputter: { select: { id: true, nama: true } },
      },
    });

    return res.status(200).json({ message: "UMK berhasil diperbarui", data });
  } catch (error) {
    console.error("[updateUmk error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── GET UMK BY ID ──────────────────────────────────────────────
const getUmkById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.umk.findUnique({
      where: { id: parseInt(id) },
      include: {
        pic: { select: { id: true, nama: true } },
        inputter: { select: { id: true, nama: true } },
      },
    });
    if (!data) {
      return res.status(404).json({ message: "UMK tidak ditemukan" });
    }
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getUmkById error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getPegawaiUmk = async (req, res) => {
  try {
    const data = await prisma.pegawai.findMany({
      select: {
        id: true,
        nama: true,
        nip: true,
      },
      orderBy: { nama: "asc" },
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getPegawaiUmk error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// MASTER AKUN — Keuangan Tahap 1
// 5 jenis akun baku (enum JenisAkun), isi akun per jenis bebas custom user.
// ─────────────────────────────────────────────

const JENIS_AKUN_VALUES = ["ASET", "LIABILITAS", "MODAL", "PENDAPATAN", "BEBAN"];
const KATEGORI_AKUN_VALUES = [
  "KAS_BANK",
  "PIUTANG_USAHA",
  "PIUTANG_LAINNYA",
  "AKTIVA_TETAP",
  "HUTANG_LANCAR",
  "HUTANG_JANGKA_PANJANG",
  "MODAL_AKUN",
];

// ─── CREATE AKUN ──────────────────────────────────────────────────
const createAkun = async (req, res) => {
  try {
    const { kode, nama, jenis, saldoAwal, isKasBank, kategori } = req.body;

    if (!nama) return res.status(400).json({ message: "Nama akun wajib diisi" });
    if (!jenis || !JENIS_AKUN_VALUES.includes(jenis)) {
      return res.status(400).json({
        message: `Jenis akun wajib salah satu dari: ${JENIS_AKUN_VALUES.join(", ")}`,
      });
    }
    if (kategori && !KATEGORI_AKUN_VALUES.includes(kategori)) {
      return res.status(400).json({
        message: `Kategori akun wajib salah satu dari: ${KATEGORI_AKUN_VALUES.join(", ")}`,
      });
    }

    if (kode) {
      const existing = await prisma.akun.findUnique({ where: { kode } });
      if (existing) {
        return res
          .status(400)
          .json({ message: `Kode akun "${kode}" sudah dipakai` });
      }
    }

    const data = await prisma.akun.create({
      data: {
        kode: kode || null,
        nama,
        jenis,
        saldoAwal: saldoAwal ? Number(saldoAwal) : 0,
        isKasBank: Boolean(isKasBank),
        kategori: kategori || null,
      },
    });

    return res.status(201).json({ message: "Akun berhasil dibuat", data });
  } catch (error) {
    console.error("[createAkun error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── GET LIST AKUN (filter by jenis, search, pagination) ──────────
const getAkunList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const jenis = req.query.jenis;
    const search = req.query.search || "";
    const isActive = req.query.isActive; // "true" | "false" | undefined (semua)

    const where = {};
    if (jenis && JENIS_AKUN_VALUES.includes(jenis)) where.jenis = jenis;
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { kode: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.akun.findMany({
        where,
        orderBy: [{ jenis: "asc" }, { nama: "asc" }],
        skip,
        take: limit,
      }),
      prisma.akun.count({ where }),
    ]);

    return res.status(200).json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("[getAkunList error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── GET AKUN BY ID ─────────────────────────────────────────────────
const getAkunById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.akun.findUnique({ where: { id: parseInt(id) } });
    if (!data) return res.status(404).json({ message: "Akun tidak ditemukan" });
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getAkunById error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── UPDATE AKUN (edit) ─────────────────────────────────────────────
const updateAkun = async (req, res) => {
  try {
    const { id } = req.params;
    const { kode, nama, jenis, saldoAwal, isKasBank, kategori } = req.body;

    const existing = await prisma.akun.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: "Akun tidak ditemukan" });

    if (jenis && !JENIS_AKUN_VALUES.includes(jenis)) {
      return res.status(400).json({
        message: `Jenis akun wajib salah satu dari: ${JENIS_AKUN_VALUES.join(", ")}`,
      });
    }
    if (kategori && !KATEGORI_AKUN_VALUES.includes(kategori)) {
      return res.status(400).json({
        message: `Kategori akun wajib salah satu dari: ${KATEGORI_AKUN_VALUES.join(", ")}`,
      });
    }

    if (kode && kode !== existing.kode) {
      const dup = await prisma.akun.findUnique({ where: { kode } });
      if (dup) {
        return res
          .status(400)
          .json({ message: `Kode akun "${kode}" sudah dipakai` });
      }
    }

    const data = await prisma.akun.update({
      where: { id: parseInt(id) },
      data: {
        kode: kode === undefined ? existing.kode : kode || null,
        nama: nama ?? existing.nama,
        jenis: jenis ?? existing.jenis,
        saldoAwal: saldoAwal !== undefined ? Number(saldoAwal) : existing.saldoAwal,
        isKasBank: isKasBank !== undefined ? Boolean(isKasBank) : existing.isKasBank,
        kategori: kategori !== undefined ? kategori || null : existing.kategori,
      },
    });

    return res.status(200).json({ message: "Akun berhasil diupdate", data });
  } catch (error) {
    console.error("[updateAkun error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── TOGGLE STATUS AKUN (nonaktifkan / aktifkan — soft delete) ─────
// Akun gak boleh di-hard-delete karena bisa udah dipakai di transaksi
// (RequestKeuangan.akunId, dan nanti Jurnal Keuangan). Cukup isActive.
const toggleAkunStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const existing = await prisma.akun.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ message: "Akun tidak ditemukan" });

    const nextActive = isActive === undefined ? !existing.isActive : !!isActive;

    const data = await prisma.akun.update({
      where: { id: parseInt(id) },
      data: { isActive: nextActive },
    });

    return res.status(200).json({
      message: nextActive ? "Akun berhasil diaktifkan" : "Akun berhasil dinonaktifkan",
      data,
    });
  } catch (error) {
    console.error("[toggleAkunStatus error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// PENGELUARAN & PEMASUKAN — Fitur 0 (lanjutan)
// Alur: user request → approver approve/reject → selesai.
// Belum nyentuh Jurnal Keuangan (Fitur 2) — itu integrasi menyusul.
// ─────────────────────────────────────────────

const JENIS_REQUEST_VALUES = ["PENGELUARAN", "PEMASUKAN"];
const STATUS_REQUEST_VALUES = ["PENDING", "APPROVED", "REJECTED"];

// PENGELUARAN → akun jenis BEBAN, PEMASUKAN → akun jenis PENDAPATAN
const JENIS_REQUEST_TO_AKUN = {
  PENGELUARAN: "BEBAN",
  PEMASUKAN: "PENDAPATAN",
};

const REQUEST_KEUANGAN_INCLUDE = {
  akun: { select: { id: true, kode: true, nama: true, jenis: true } },
  requestedOleh: { select: { id: true, nama: true } },
  approvedOleh: { select: { id: true, nama: true } },
};

// ─── CREATE REQUEST (sisi pengaju) ─────────────────────────────────
const createRequestKeuangan = async (req, res) => {
  try {
    const { jenis, akunId, deskripsi, nominal, tanggal } = req.body;

    if (!jenis || !JENIS_REQUEST_VALUES.includes(jenis)) {
      return res.status(400).json({
        message: `Jenis wajib salah satu dari: ${JENIS_REQUEST_VALUES.join(", ")}`,
      });
    }
    if (!deskripsi) {
      return res.status(400).json({ message: "Deskripsi wajib diisi" });
    }
    if (!nominal || Number(nominal) <= 0) {
      return res.status(400).json({ message: "Nominal wajib diisi dan lebih dari 0" });
    }

    const requestedBy = req.user?.pegawaiId;
    if (!requestedBy) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Dropdown akun difilter sesuai jenis request — validasi ulang di backend
    // (bukan cuma percaya filter dari frontend).
    if (akunId) {
      const akun = await prisma.akun.findUnique({ where: { id: parseInt(akunId) } });
      if (!akun) {
        return res.status(404).json({ message: "Akun tidak ditemukan" });
      }
      if (!akun.isActive) {
        return res.status(400).json({ message: "Akun ini sudah nonaktif" });
      }
      const jenisAkunHarusnya = JENIS_REQUEST_TO_AKUN[jenis];
      if (akun.jenis !== jenisAkunHarusnya) {
        return res.status(400).json({
          message: `Akun untuk request ${jenis} harus jenis ${jenisAkunHarusnya}`,
        });
      }
    }

    const buktiFile = req.file ? req.file.path : null;

    const data = await prisma.requestKeuangan.create({
      data: {
        jenis,
        akunId: akunId ? parseInt(akunId) : null,
        deskripsi,
        nominal: Number(nominal),
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        requestedBy,
        status: "PENDING",
        buktiFile,
      },
      include: REQUEST_KEUANGAN_INCLUDE,
    });

    return res.status(201).json({ message: "Request berhasil diajukan", data });
  } catch (error) {
    console.error("[createRequestKeuangan error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── GET LIST REQUEST (filter status & jenis) ──────────────────────
const getRequestKeuanganList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const jenis = req.query.jenis;
    const search = req.query.search || "";

    const where = {};
    if (status && STATUS_REQUEST_VALUES.includes(status)) where.status = status;
    if (jenis && JENIS_REQUEST_VALUES.includes(jenis)) where.jenis = jenis;
    if (search) {
      where.OR = [
        { deskripsi: { contains: search, mode: "insensitive" } },
        { requestedOleh: { is: { nama: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.requestKeuangan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: REQUEST_KEUANGAN_INCLUDE,
      }),
      prisma.requestKeuangan.count({ where }),
    ]);

    return res.status(200).json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    console.error("[getRequestKeuanganList error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── GET REQUEST BY ID ──────────────────────────────────────────────
const getRequestKeuanganById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.requestKeuangan.findUnique({
      where: { id: parseInt(id) },
      include: REQUEST_KEUANGAN_INCLUDE,
    });
    if (!data) return res.status(404).json({ message: "Request tidak ditemukan" });
    return res.status(200).json({ data });
  } catch (error) {
    console.error("[getRequestKeuanganById error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── APPROVE REQUEST (sisi approver) ───────────────────────────────
// Guard role approver dipasang di route (authorizeRole).
const approveRequestKeuangan = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user?.pegawaiId;
    if (!approvedBy) return res.status(401).json({ message: "Unauthorized." });

    const existing = await prisma.requestKeuangan.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) return res.status(404).json({ message: "Request tidak ditemukan" });
    if (existing.status !== "PENDING") {
      return res.status(400).json({
        message: `Request ini sudah diproses sebelumnya (status: ${existing.status})`,
      });
    }

    // ── Fitur 0 lanjutan: auto-generate jurnal begitu request di-approve ──
    // Butuh akun lawan (Kas & Bank) buat nge-balance-in entry-nya. Kalau
    // request gak punya akun (akunId null) atau belum ada akun Kas & Bank
    // sama sekali, approve tetep jalan tapi jurnalnya di-skip (dikasih
    // catatan di response, bukan bikin approve gagal).
    let jurnalInfo = null;
    let skipAlasan = null;

    const akunKasBank = existing.akunId
      ? await prisma.akun.findFirst({ where: { isKasBank: true, isActive: true }, orderBy: { id: "asc" } })
      : null;

    if (!existing.akunId) {
      skipAlasan = "Request ini gak nunjuk akun, jurnal gak di-generate otomatis.";
    } else if (!akunKasBank) {
      skipAlasan = "Belum ada akun Kas & Bank aktif — jurnal gak di-generate otomatis. Tambahin dulu di Master Akun (tandai isKasBank).";
    } else {
      const periode = toPeriode(existing.tanggal);
      const periodeRow = await prisma.periodeAkuntansi.findUnique({ where: { periode } });
      if (periodeRow?.status === "CLOSED") {
        skipAlasan = `Periode ${periode} udah ditutup — jurnal gak di-generate otomatis buat tanggal ini.`;
      }
    }

    const data = await prisma.$transaction(async (tx) => {
      let jurnalTransaksiId = null;

      if (!skipAlasan) {
        const nominal = Number(existing.nominal);
        const baris =
          existing.jenis === "PENGELUARAN"
            ? [
                { akunId: existing.akunId, debit: nominal, keterangan: existing.deskripsi },
                { akunId: akunKasBank.id, kredit: nominal, keterangan: existing.deskripsi },
              ]
            : [
                { akunId: akunKasBank.id, debit: nominal, keterangan: existing.deskripsi },
                { akunId: existing.akunId, kredit: nominal, keterangan: existing.deskripsi },
              ];

        const jurnal = await createJurnalTransaksi(tx, {
          tanggal: existing.tanggal,
          deskripsi: `${existing.jenis === "PENGELUARAN" ? "Pengeluaran" : "Pemasukan"}: ${existing.deskripsi}`,
          mode: "SIMPLE",
          baris,
          sumber: "REQUEST_KEUANGAN",
          status: "POSTED",
          createdBy: approvedBy,
        });
        jurnalInfo = jurnal;
        jurnalTransaksiId = jurnal.id;
      }

      return tx.requestKeuangan.update({
        where: { id: parseInt(id) },
        data: {
          status: "APPROVED",
          approvedBy,
          approvedAt: new Date(),
          catatan: req.body?.catatan || null,
          jurnalTransaksiId,
        },
        include: REQUEST_KEUANGAN_INCLUDE,
      });
    });

    return res.status(200).json({
      message: skipAlasan
        ? `Request berhasil disetujui. ${skipAlasan}`
        : `Request berhasil disetujui, jurnal ${jurnalInfo.noJurnal} otomatis dibuat.`,
      data,
    });
  } catch (error) {
    console.error("[approveRequestKeuangan error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─── REJECT REQUEST (sisi approver) — wajib isi catatan alasan ─────
const rejectRequestKeuangan = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan } = req.body;
    const approvedBy = req.user?.pegawaiId;
    if (!approvedBy) return res.status(401).json({ message: "Unauthorized." });

    if (!catatan || !catatan.trim()) {
      return res
        .status(400)
        .json({ message: "Catatan alasan wajib diisi kalau reject" });
    }

    const existing = await prisma.requestKeuangan.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) return res.status(404).json({ message: "Request tidak ditemukan" });
    if (existing.status !== "PENDING") {
      return res.status(400).json({
        message: `Request ini sudah diproses sebelumnya (status: ${existing.status})`,
      });
    }

    const data = await prisma.requestKeuangan.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
        approvedBy,
        approvedAt: new Date(),
        catatan,
      },
      include: REQUEST_KEUANGAN_INCLUDE,
    });

    return res.status(200).json({ message: "Request berhasil ditolak", data });
  } catch (error) {
    console.error("[rejectRequestKeuangan error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

module.exports = {
  getPendapatan,
  getPiutang,
  getDetailPiutang,

  getLaporanHasilUsaha,

  createNeraca,
  getNeracaPagination,
  updateNeraca,
  deleteNeraca,
  getJenisBiaya,

  getUmk,
  createUmk,
  updateUmk,
  getUmkById,
  getPegawaiUmk,

  createAkun,
  getAkunList,
  getAkunById,
  updateAkun,
  toggleAkunStatus,

  createRequestKeuangan,
  getRequestKeuanganList,
  getRequestKeuanganById,
  approveRequestKeuangan,
  rejectRequestKeuangan,
};
