// controllers/pendapatanController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

module.exports = {
  getPendapatan,
  getPiutang,
  getDetailPiutang,

  createNeraca,
  getNeracaPagination,
  updateNeraca,
  deleteNeraca,
  getJenisBiaya,
};
