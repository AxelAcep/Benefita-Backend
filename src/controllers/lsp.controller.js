// Controller LSP (Lembaga Sertifikasi Profesi) — master data + transaksi.
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * CREATE TUK
 */
const createTUK = async (req, res) => {
  try {
    const { noSK, noPenetapan, tglSanggup, nama, alamat, telp } = req.body;

    if (!noSK || !nama || !alamat) {
      return res.status(400).json({
        message: "Field wajib belum lengkap (No SK, Nama, Alamat).",
      });
    }

    const updateOleh = req.user?.userId;
    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });
    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const tuk = await prisma.tUK.create({
      data: {
        noSK,
        noPenetapan: noPenetapan || null,
        tglSanggup: tglSanggup ? new Date(tglSanggup) : null,
        nama,
        alamat,
        telp: telp || null,
        updateOleh: user.pegawaiId,
      },
      include: { pegawai: { select: { id: true, nama: true } } },
    });

    return res.status(201).json({
      message: "TUK berhasil ditambahkan.",
      data: tuk,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * GET LIST TUK — pagination & search
 */
const getTUKList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { noSK: { contains: search, mode: "insensitive" } },
            { alamat: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.tUK.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { pegawai: { select: { id: true, nama: true } } },
      }),
      prisma.tUK.count({ where }),
    ]);

    return res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * GET TUK BY ID
 */
const getTUKById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const tuk = await prisma.tUK.findUnique({
      where: { id: parsedId },
      include: { pegawai: { select: { id: true, nama: true } } },
    });

    if (!tuk) {
      return res.status(404).json({ message: "TUK tidak ditemukan." });
    }

    return res.json({ data: tuk });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * UPDATE TUK
 */
const updateTUK = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const { noSK, noPenetapan, tglSanggup, nama, alamat, telp } = req.body;

    const updateOleh = req.user?.userId;
    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });
    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const existing = await prisma.tUK.findUnique({ where: { id: parsedId } });
    if (!existing) {
      return res.status(404).json({ message: "TUK tidak ditemukan." });
    }

    const tuk = await prisma.tUK.update({
      where: { id: parsedId },
      data: {
        noSK: noSK ?? existing.noSK,
        noPenetapan: noPenetapan ?? existing.noPenetapan,
        tglSanggup: tglSanggup ? new Date(tglSanggup) : existing.tglSanggup,
        nama: nama ?? existing.nama,
        alamat: alamat ?? existing.alamat,
        telp: telp ?? existing.telp,
        updateOleh: user.pegawaiId,
      },
      include: { pegawai: { select: { id: true, nama: true } } },
    });

    return res.json({
      message: "TUK berhasil diupdate.",
      data: tuk,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * DELETE TUK
 */
const deleteTUK = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const existing = await prisma.tUK.findUnique({ where: { id: parsedId } });
    if (!existing) {
      return res.status(404).json({ message: "TUK tidak ditemukan." });
    }

    await prisma.tUK.delete({ where: { id: parsedId } });

    return res.json({ message: "TUK berhasil dihapus." });
  } catch (err) {
    if (err.code === "P2003") {
      return res.status(409).json({
        message:
          "TUK tidak bisa dihapus karena masih dipakai di data Peserta Uji.",
      });
    }
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// ASESOR — Step 5: master data. Pola sama persis kayak TUK.
// Field minimal: nama, noRegAsesor.
// ─────────────────────────────────────────────

/**
 * CREATE ASESOR
 */
const createAsesor = async (req, res) => {
  try {
    const { nama, noRegAsesor } = req.body;

    if (!nama) {
      return res.status(400).json({ message: "Nama asesor wajib diisi." });
    }

    const updateOleh = req.user?.userId;
    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });
    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const asesor = await prisma.asesor.create({
      data: {
        nama,
        noRegAsesor: noRegAsesor || null,
        updateOleh: user.pegawaiId,
      },
      include: { pegawai: { select: { id: true, nama: true } } },
    });

    return res.status(201).json({
      message: "Asesor berhasil ditambahkan.",
      data: asesor,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * GET LIST ASESOR — pagination & search
 */
const getAsesorList = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { noRegAsesor: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.asesor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { pegawai: { select: { id: true, nama: true } } },
      }),
      prisma.asesor.count({ where }),
    ]);

    return res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * GET ASESOR BY ID
 */
const getAsesorById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const asesor = await prisma.asesor.findUnique({
      where: { id: parsedId },
      include: { pegawai: { select: { id: true, nama: true } } },
    });

    if (!asesor) {
      return res.status(404).json({ message: "Asesor tidak ditemukan." });
    }

    return res.json({ data: asesor });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * UPDATE ASESOR
 */
const updateAsesor = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const { nama, noRegAsesor } = req.body;

    const updateOleh = req.user?.userId;
    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });
    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const existing = await prisma.asesor.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Asesor tidak ditemukan." });
    }

    const asesor = await prisma.asesor.update({
      where: { id: parsedId },
      data: {
        nama: nama ?? existing.nama,
        noRegAsesor: noRegAsesor ?? existing.noRegAsesor,
        updateOleh: user.pegawaiId,
      },
      include: { pegawai: { select: { id: true, nama: true } } },
    });

    return res.json({
      message: "Asesor berhasil diupdate.",
      data: asesor,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * DELETE ASESOR
 */
const deleteAsesor = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const existing = await prisma.asesor.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Asesor tidak ditemukan." });
    }

    await prisma.asesor.delete({ where: { id: parsedId } });

    return res.json({ message: "Asesor berhasil dihapus." });
  } catch (err) {
    if (err.code === "P2003") {
      return res.status(409).json({
        message:
          "Asesor tidak bisa dihapus karena masih dipakai di data Peserta Uji.",
      });
    }
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// PESERTA UJI — Step 6: list Calon/Siap Uji + checklist dokumen inline.
// (assign TUK/Asesor/tglUji/hasil ujian itu Step 7, di luar scope ini)
// ─────────────────────────────────────────────

const CHECKLIST_FIELDS = [
  "suratKetKerja",
  "suratRekom",
  "sertPel",
  "cv",
  "ktp",
  "ijazah",
  "pasFoto",
  "verTUK",
  "ksediaTUK",
  "apl01",
  "apl02",
];

const PESERTA_UJI_INCLUDE = {
  skema: { select: { id: true, kode: true, nama: true } },
  tuk: { select: { id: true, nama: true } },
  asesor: { select: { id: true, nama: true } },
};

/**
 * GET LIST PESERTA UJI — default cuma status CALON & SIAP_UJI (peserta yang
 * belum diuji), search nama/instansi, filter by tanggal uji.
 */
const getPesertaUjiList = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      statusHasil,
      skemaId,
      tahun,
      tanggal,
    } = req.query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    // Default cuma tampil yang belum diuji (CALON/SIAP_UJI) — tapi kalau
    // sengaja filter by statusHasil (buat laporan Daftar Asesi/BK, yang
    // notabene statusnya udah SUDAH_UJI), jangan dibatasin ke situ.
    const statusFilter = status
      ? { status }
      : statusHasil
        ? {}
        : { status: { in: ["CALON", "SIAP_UJI"] } };

    let tanggalFilter = {};
    if (tanggal) {
      const start = new Date(`${tanggal}T00:00:00.000Z`);
      const end = new Date(`${tanggal}T23:59:59.999Z`);
      tanggalFilter = { tglUji: { gte: start, lte: end } };
    } else if (tahun) {
      const y = parseInt(tahun);
      tanggalFilter = {
        tglUji: {
          gte: new Date(`${y}-01-01T00:00:00.000Z`),
          lte: new Date(`${y}-12-31T23:59:59.999Z`),
        },
      };
    }

    const where = {
      ...statusFilter,
      ...tanggalFilter,
      ...(statusHasil ? { statusHasil } : {}),
      ...(skemaId ? { skemaId: parseInt(skemaId) } : {}),
      ...(search
        ? {
            OR: [
              { nama: { contains: search, mode: "insensitive" } },
              { instansi: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.pesertaUji.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: PESERTA_UJI_INCLUDE,
      }),
      prisma.pesertaUji.count({ where }),
    ]);

    return res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * GET PESERTA UJI BY ID
 */
const getPesertaUjiById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const data = await prisma.pesertaUji.findUnique({
      where: { id: parsedId },
      include: PESERTA_UJI_INCLUDE,
    });

    if (!data) {
      return res.status(404).json({ message: "Peserta Uji tidak ditemukan." });
    }

    return res.json({ data });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * UPDATE CHECKLIST DOKUMEN — dicentang inline dari tabel. Kalau semua 11
 * dokumen udah lengkap, status otomatis naik ke SIAP_UJI; kalau ada yang
 * di-uncheck lagi, turun balik ke CALON (kecuali udah SUDAH_UJI, itu gak
 * diotak-atik di sini).
 */
const updatePesertaUjiChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const existing = await prisma.pesertaUji.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Peserta Uji tidak ditemukan." });
    }

    const checklistData = {};
    for (const field of CHECKLIST_FIELDS) {
      if (req.body[field] !== undefined) {
        checklistData[field] = !!req.body[field];
      }
    }

    const merged = { ...existing, ...checklistData };
    const semuaLengkap = CHECKLIST_FIELDS.every((f) => merged[f] === true);

    let nextStatus = existing.status;
    if (existing.status !== "SUDAH_UJI") {
      nextStatus = semuaLengkap ? "SIAP_UJI" : "CALON";
    }

    const data = await prisma.pesertaUji.update({
      where: { id: parsedId },
      data: {
        ...checklistData,
        status: nextStatus,
      },
      include: PESERTA_UJI_INCLUDE,
    });

    return res.json({
      message: "Checklist dokumen berhasil diperbarui.",
      data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// PESERTA UJI — Step 7: assign TUK/Asesor/tglUji + input hasil ujian.
// ─────────────────────────────────────────────

/**
 * ASSIGN PELAKSANAAN UJI — TUK, Asesor, tanggal uji.
 * Bisa dipanggil terpisah dari input hasil (biasanya assign dulu jauh-jauh
 * hari, hasilnya baru diinput setelah ujian beneran dilaksanakan).
 */
const assignPesertaUjiPelaksanaan = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const { tukId, asesorId, tglUji } = req.body;

    const existing = await prisma.pesertaUji.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Peserta Uji tidak ditemukan." });
    }

    if (tukId !== undefined && tukId !== null && tukId !== "") {
      const tuk = await prisma.tUK.findUnique({
        where: { id: parseInt(tukId) },
      });
      if (!tuk) {
        return res.status(404).json({ message: "TUK tidak ditemukan." });
      }
    }

    if (asesorId !== undefined && asesorId !== null && asesorId !== "") {
      const asesor = await prisma.asesor.findUnique({
        where: { id: parseInt(asesorId) },
      });
      if (!asesor) {
        return res.status(404).json({ message: "Asesor tidak ditemukan." });
      }
    }

    const data = await prisma.pesertaUji.update({
      where: { id: parsedId },
      data: {
        tukId:
          tukId === "" || tukId === null || tukId === undefined
            ? existing.tukId
            : parseInt(tukId),
        asesorId:
          asesorId === "" || asesorId === null || asesorId === undefined
            ? existing.asesorId
            : parseInt(asesorId),
        tglUji: tglUji ? new Date(tglUji) : existing.tglUji,
      },
      include: PESERTA_UJI_INCLUDE,
    });

    return res.json({
      message: "Pelaksanaan uji berhasil di-assign.",
      data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

/**
 * INPUT HASIL UJI — K (Kompeten) atau BK (Belum Kompeten).
 * Kalau K, noSerBNSP & tglTerbit wajib diisi. Status PesertaUji otomatis
 * jadi SUDAH_UJI begitu hasil diinput (K maupun BK — dua-duanya artinya
 * ujiannya udah selesai dilaksanakan).
 */
const updatePesertaUjiHasil = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const { statusHasil, noReg, noSerBNSP, tglTerbit } = req.body;

    if (!["K", "BK"].includes(statusHasil)) {
      return res
        .status(400)
        .json({ message: "statusHasil wajib diisi 'K' atau 'BK'." });
    }

    if (statusHasil === "K" && (!noSerBNSP || !tglTerbit)) {
      return res.status(400).json({
        message:
          "No Sertifikat BNSP dan Tanggal Terbit wajib diisi kalau hasilnya Kompeten (K).",
      });
    }

    const existing = await prisma.pesertaUji.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Peserta Uji tidak ditemukan." });
    }

    const data = await prisma.pesertaUji.update({
      where: { id: parsedId },
      data: {
        statusHasil,
        noReg: noReg || existing.noReg,
        noSerBNSP: statusHasil === "K" ? noSerBNSP : existing.noSerBNSP,
        tglTerbit:
          statusHasil === "K" && tglTerbit
            ? new Date(tglTerbit)
            : existing.tglTerbit,
        status: "SUDAH_UJI",
      },
      include: PESERTA_UJI_INCLUDE,
    });

    return res.json({
      message: "Hasil uji berhasil disimpan.",
      data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// LAPORAN — Step 8: Laporan_KLHK (rekap per tanggal ujian + skema).
// 3 laporan lainnya (Daftar Asesi, Daftar Asesi BK, Calon Peserta Uji) cukup
// reuse getPesertaUjiList dengan filter statusHasil/status — gak perlu
// endpoint baru.
// ─────────────────────────────────────────────

/**
 * Rekap jumlah peserta K/BK/Total per tanggal ujian + kode skema.
 */
const getLaporanKlhk = async (req, res) => {
  try {
    const { tahun, skemaId } = req.query;

    const parsedTahun = parseInt(tahun);
    const tahunFilter = !isNaN(parsedTahun)
      ? Prisma.sql`AND EXTRACT(YEAR FROM pu."tglUji")::int = ${parsedTahun}`
      : Prisma.empty;

    const parsedSkemaId = parseInt(skemaId);
    const skemaFilter = !isNaN(parsedSkemaId)
      ? Prisma.sql`AND pu."skemaId" = ${parsedSkemaId}`
      : Prisma.empty;

    const data = await prisma.$queryRaw`
      SELECT
        DATE(pu."tglUji") AS "tglUjian",
        sk."kode" AS "kodeSkema",
        sk."nama" AS "namaSkema",
        COUNT(*) FILTER (WHERE pu."statusHasil" = 'K')::int AS "jumlahK",
        COUNT(*) FILTER (WHERE pu."statusHasil" = 'BK')::int AS "jumlahBk",
        COUNT(*)::int AS "jumlahTotal"
      FROM "benefita"."peserta_uji" pu
      JOIN "benefita"."skema_kualifikasi" sk ON sk."id" = pu."skemaId"
      WHERE pu."tglUji" IS NOT NULL
        AND pu."statusHasil" IS NOT NULL
        ${tahunFilter}
        ${skemaFilter}
      GROUP BY DATE(pu."tglUji"), sk."kode", sk."nama"
      ORDER BY "tglUjian" DESC, sk."kode" ASC
    `;

    return res.json({ data });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

module.exports = {
  createTUK,
  getTUKList,
  getTUKById,
  updateTUK,
  deleteTUK,

  createAsesor,
  getAsesorList,
  getAsesorById,
  updateAsesor,
  deleteAsesor,

  getPesertaUjiList,
  getPesertaUjiById,
  updatePesertaUjiChecklist,

  assignPesertaUjiPelaksanaan,
  updatePesertaUjiHasil,

  getLaporanKlhk,
};
