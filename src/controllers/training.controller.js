const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * CREATE HOTEL
 */
const createHotel = async (req, res) => {
  try {
    const {
      kodeHotel,
      namaHotel,
      alamat,
      kota,
      telepon,
      fax,
      pubRate,
      corRate,
    } = req.body;

    if (!kodeHotel || !namaHotel || !alamat || !kota || !telepon) {
      return res.status(400).json({
        message: "Field wajib belum lengkap",
      });
    }

    const existing = await prisma.hotel.findUnique({
      where: { kodeHotel },
    });

    if (existing) {
      return res.status(400).json({
        message: "Kode Hotel sudah digunakan",
      });
    }

    const hotel = await prisma.hotel.create({
      data: {
        kodeHotel,
        namaHotel,
        alamat,
        kota,
        telepon,
        fax: fax || null,
        pubRate: pubRate ? Number(pubRate) : null,
        corRate: corRate ? Number(corRate) : null,
      },
    });

    return res.status(201).json({
      message: "Hotel berhasil dibuat",
      data: hotel,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * GET ALL + PAGINATION + FILTER + SEARCH
 */
const getAllHotels = async (req, res) => {
  try {
    let { page = 1, limit = 10, kota, search } = req.query;

    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        kota ? { kota: { equals: kota, mode: "insensitive" } } : {},
        search
          ? {
              OR: [
                { kodeHotel: { contains: search, mode: "insensitive" } },
                { namaHotel: { contains: search, mode: "insensitive" } },
                { alamat: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kodeHotel: true,
          namaHotel: true,
          alamat: true,
          kota: true,
          telepon: true,
          fax: true,
          pubRate: true,
          corRate: true,
        },
      }),
      prisma.hotel.count({ where }),
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
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * GET BY ID
 */
const getHotelById = async (req, res) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
    });

    if (!hotel) {
      return res.status(404).json({
        message: "Hotel tidak ditemukan",
      });
    }

    return res.json({ data: hotel });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * UPDATE HOTEL
 */
const updateHotel = async (req, res) => {
  try {
    const { id } = req.params;

    const { namaHotel, alamat, kota, telepon, fax, pubRate, corRate } =
      req.body;

    const hotel = await prisma.hotel.update({
      where: { kodeHotel: id },
      data: {
        namaHotel,
        alamat,
        kota,
        telepon,
        fax,
        pubRate: pubRate ? Number(pubRate) : null,
        corRate: corRate ? Number(corRate) : null,
      },
    });

    return res.json({
      message: "Hotel berhasil diupdate",
      data: hotel,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

/**
 * DELETE HOTEL
 */
const deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.hotel.delete({
      where: { id },
    });

    return res.json({
      message: "Hotel berhasil dihapus",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

const createTrainer = async (req, res) => {
  try {
    const {
      kode,
      nama,
      referensi,
      alamat,
      subjekKhusus,
      telp,
      keterangan,
      email,
      tugas,
      kantor,
      alamatKantor,
      noTelpKantor,
    } = req.body;

    const trainer = await prisma.trainer.create({
      data: {
        kode,
        nama,
        referensi,
        alamat,
        subjekKhusus,
        telp,
        keterangan,
        email,
        tugas: tugas ? new Date(tugas) : null,
        kantor,
        alamatKantor,
        noTelpKantor,
      },
    });

    return res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "Kode sudah digunakan." });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE
const updateTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode,
      nama,
      referensi,
      alamat,
      subjekKhusus,
      telp,
      keterangan,
      email,
      tugas,
      kantor,
      alamatKantor,
      noTelpKantor,
    } = req.body;

    const trainer = await prisma.trainer.update({
      where: { id: Number(id) },
      data: {
        kode,
        nama,
        referensi,
        alamat,
        subjekKhusus,
        telp,
        keterangan,
        email,
        tugas: tugas ? new Date(tugas) : null,
        kantor,
        alamatKantor,
        noTelpKantor,
      },
    });

    return res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Trainer tidak ditemukan." });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET ONE
const getTrainerById = async (req, res) => {
  try {
    const { id } = req.params;

    const trainer = await prisma.trainer.findUnique({
      where: { id: Number(id) },
    });

    if (!trainer) {
      return res
        .status(404)
        .json({ success: false, message: "Trainer tidak ditemukan." });
    }

    return res.status(200).json({ success: true, data: trainer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET LIST WITH PAGINATION & SEARCH
const getTrainers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = search
      ? {
          OR: [
            { kode: { contains: search, mode: "insensitive" } },
            { nama: { contains: search, mode: "insensitive" } },
            { telp: { contains: search, mode: "insensitive" } },
            { kantor: { contains: search, mode: "insensitive" } },
            { subjekKhusus: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, trainers] = await prisma.$transaction([
      prisma.trainer.count({ where: whereClause }),
      prisma.trainer.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kode: true,
          nama: true,
          telp: true,
          email: true,
          kantor: true,
          referensi: true,
          subjekKhusus: true,
          tugas: true,
        },
      }),
    ]);

    // Hitung jumlah hari dari tugas sampai sekarang
    const now = new Date();
    const data = trainers.map((t) => {
      let jumlahHari = null;
      if (t.tugas) {
        const diffMs = now - new Date(t.tugas);
        jumlahHari = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
      return { ...t, jumlahHari };
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createPengajuan = async (req, res) => {
  try {
    const {
      judulTraining,
      jumlahHari,
      perusahaanId,
      namaKontak,
      kontak,
      jumlahPeserta,
    } = req.body;

    const updateOleh = req.user?.userId; // dari JWT middleware

    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Ambil pegawaiId dari userId
    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User tidak ditemukan." });
    }

    const pengajuan = await prisma.pengajuanJudulTraining.create({
      data: {
        judulTraining,
        jumlahHari: Number(jumlahHari),
        namaKontak,
        kontak,
        jumlahPeserta: jumlahPeserta ? Number(jumlahPeserta) : null,
        perusahaanId,
        inputOlehId: user.pegawaiId, // ← pakai pegawaiId
      },
      include: {
        perusahaan: { select: { noInduk: true, company: true } },
        inputOleh: { select: { id: true, nama: true } },
      },
    });

    return res.status(201).json({ success: true, data: pengajuan });
  } catch (error) {
    if (error.code === "P2003") {
      return res
        .status(400)
        .json({ success: false, message: "Perusahaan tidak ditemukan." });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

const updatePengajuan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      judulTraining,
      jumlahHari,
      perusahaanId,
      namaKontak,
      kontak,
      jumlahPeserta,
      responMA,
    } = req.body;

    const pengajuan = await prisma.pengajuanJudulTraining.update({
      where: { id },
      data: {
        judulTraining,
        jumlahHari: jumlahHari ? Number(jumlahHari) : undefined,
        perusahaanId,
        namaKontak,
        kontak,
        jumlahPeserta: jumlahPeserta ? Number(jumlahPeserta) : undefined,
        responMA: responMA ?? "PENDING",
      },
      include: {
        perusahaan: { select: { noInduk: true } },
        inputOleh: { select: { id: true, nama: true } },
      },
    });

    return res.status(200).json({ success: true, data: pengajuan });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Pengajuan tidak ditemukan." });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────

const getPengajuanById = async (req, res) => {
  try {
    const { id } = req.params;

    const pengajuan = await prisma.pengajuanJudulTraining.findUnique({
      where: { id },
      include: {
        perusahaan: true,
        inputOleh: { select: { id: true, nama: true, jabatan: true } },
      },
    });

    if (!pengajuan) {
      return res
        .status(404)
        .json({ success: false, message: "Pengajuan tidak ditemukan." });
    }

    return res.status(200).json({ success: true, data: pengajuan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET LIST + PAGINATION + SEARCH
// ─────────────────────────────────────────────

const getPengajuan = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = search
      ? {
          OR: [
            { judulTraining: { contains: search, mode: "insensitive" } },
            {
              perusahaan: {
                // sesuaikan field nama perusahaan di TabPerusahaan
                company: { contains: search, mode: "insensitive" },
              },
            },
            {
              inputOleh: {
                nama: { contains: search, mode: "insensitive" },
              },
            },
          ],
        }
      : {};

    const [total, data] = await prisma.$transaction([
      prisma.pengajuanJudulTraining.count({ where: whereClause }),
      prisma.pengajuanJudulTraining.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { tanggalPengajuan: "desc" },
        select: {
          id: true,
          judulTraining: true,
          jumlahHari: true,
          jumlahPeserta: true,
          namaKontak: true,
          kontak: true,
          responMA: true,
          tanggalPengajuan: true,
          perusahaan: {
            select: { noInduk: true, company: true },
          },
          inputOleh: {
            select: { id: true, nama: true },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getListPerusahaan = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const data = await prisma.tabPerusahaan.findMany({
      where: search
        ? {
            OR: [
              { company: { contains: search, mode: "insensitive" } },
              { noInduk: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        noInduk: true,
        company: true,
      },
      orderBy: { company: "asc" },
      take: 50, // batasi biar ga berat
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createJudulTraining = async (req, res) => {
  try {
    const {
      kode,
      judulTraining,
      tipe,
      hari,
      biayaOffline,
      biayaOnline,
      batch,
    } = req.body;

    const existing = await prisma.judulTraining.findUnique({ where: { kode } });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Kode training sudah digunakan." });
    }

    const brosur = req.file ? req.file.path : null;

    const data = await prisma.judulTraining.create({
      data: {
        kode,
        judulTraining,
        tipe,
        hari: parseInt(hari),
        biayaOffline: parseInt(biayaOffline),
        biayaOnline: parseInt(biayaOnline),
        batch: parseInt(batch),
        brosur,
      },
    });

    res.status(201).json({ message: "Judul Training berhasil dibuat.", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// GET ONE
const getJudulTrainingById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await prisma.judulTraining.findUnique({
      where: { id: parseInt(id) },
    });

    if (!data) {
      return res
        .status(404)
        .json({ message: "Judul Training tidak ditemukan." });
    }

    res.status(200).json({ data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// EDIT
const updateJudulTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode,
      judulTraining,
      tipe,
      hari,
      biayaOffline,
      biayaOnline,
      batch,
    } = req.body;

    const existing = await prisma.judulTraining.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ message: "Judul Training tidak ditemukan." });
    }

    // Cek kode duplikat jika kode diganti
    if (kode && kode !== existing.kode) {
      const kodeTaken = await prisma.judulTraining.findUnique({
        where: { kode },
      });
      if (kodeTaken) {
        return res
          .status(400)
          .json({ message: "Kode training sudah digunakan." });
      }
    }

    const brosur = req.file ? req.file.path : existing.brosur;

    const data = await prisma.judulTraining.update({
      where: { id: parseInt(id) },
      data: {
        kode: kode ?? existing.kode,
        judulTraining: judulTraining ?? existing.judulTraining,
        tipe: tipe ?? existing.tipe,
        hari: hari ? parseInt(hari) : existing.hari,
        biayaOffline: biayaOffline
          ? parseInt(biayaOffline)
          : existing.biayaOffline,
        biayaOnline: biayaOnline ? parseInt(biayaOnline) : existing.biayaOnline,
        batch: batch ? parseInt(batch) : existing.batch,
        brosur,
      },
    });

    res
      .status(200)
      .json({ message: "Judul Training berhasil diupdate.", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// GET PAGINATION
const getJudulTraining = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", tipe, kode } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      AND: [
        // Filter
        ...(tipe ? [{ tipe: { equals: tipe, mode: "insensitive" } }] : []),
        ...(kode ? [{ kode: { equals: kode, mode: "insensitive" } }] : []),
        // Search
        ...(search
          ? [
              {
                OR: [
                  { judulTraining: { contains: search, mode: "insensitive" } },
                  { kode: { contains: search, mode: "insensitive" } },
                  { tipe: { contains: search, mode: "insensitive" } },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, data] = await Promise.all([
      prisma.judulTraining.count({ where }),
      prisma.judulTraining.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          kode: true,
          judulTraining: true,
          tipe: true,
          hari: true,
          biayaOnline: true,
          biayaOffline: true,
          batch: true,
          brosur: true,
        },
      }),
    ]);

    res.status(200).json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const createJadwalTraining = async (req, res) => {
  try {
    const {
      noJadwal,
      kodePelatihan,
      tglMulai,
      tglSelesai,
      judulLengkap,
      judulPendek,
      metode,
      jenisTraining,
      kota,
      lokasiDetail,
      biaya,
      catatan,
      status,
      trainerKodes, // trainerKodes: string[]
    } = req.body;

    // di createJadwalTraining controller
    const updateOleh = req.user?.userId; // dari JWT middleware

    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User tidak ditemukan." });
    }

    const existing = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
    });
    if (existing) {
      return res.status(400).json({ message: "No Jadwal sudah digunakan." });
    }

    const fileAgenda = req.file ? req.file.path : null;

    const data = await prisma.jadwalTraining.create({
      data: {
        noJadwal,
        kodePelatihan,
        tglMulai: tglMulai ? new Date(tglMulai) : null,
        tglSelesai: tglSelesai ? new Date(tglSelesai) : null,
        judulLengkap,
        judulPendek,
        metode,
        jenisTraining,
        kota,
        lokasiDetail,
        biaya: parseInt(biaya),
        catatan,
        status: status ?? "AKTIF",
        fileAgenda,
        updateOleh: user.pegawaiId,
        trainers: {
          create: trainerKodes?.map((kode) => ({ trainerKode: kode })) ?? [],
        },
      },
      include: {
        trainers: {
          include: { trainer: { select: { kode: true, nama: true } } },
        },
        pegawai: { select: { id: true, nama: true } },
        judulTraining: { select: { kode: true, judulTraining: true } },
      },
    });

    res.status(201).json({ message: "Jadwal Training berhasil dibuat.", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────

const updateJadwalTraining = async (req, res) => {
  try {
    const { noJadwal } = req.params; // ambil dari params URL

    const {
      kodePelatihan,
      tglMulai,
      tglSelesai,
      judulLengkap,
      judulPendek,
      metode,
      jenisTraining,
      kota,
      lokasiDetail,
      biaya,
      catatan,
      status,
      trainerKodes,
    } = req.body;

    const updateOleh = req.user?.userId;

    if (!updateOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOleh },
      select: { pegawaiId: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User tidak ditemukan." });
    }

    const existing = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Jadwal Training tidak ditemukan." });
    }

    const fileAgenda = req.file ? req.file.path : existing.fileAgenda;

    const updateData = await prisma.$transaction([
      prisma.trainerOnJadwal.deleteMany({
        where: { jadwalId: existing.id },
      }),
      prisma.jadwalTraining.update({
        where: { noJadwal },
        data: {
          kodePelatihan: kodePelatihan ?? existing.kodePelatihan,
          tglMulai: tglMulai ? new Date(tglMulai) : existing.tglMulai,
          tglSelesai: tglSelesai ? new Date(tglSelesai) : existing.tglSelesai,
          judulLengkap: judulLengkap ?? existing.judulLengkap,
          judulPendek: judulPendek ?? existing.judulPendek,
          metode: metode ?? existing.metode,
          jenisTraining: jenisTraining ?? existing.jenisTraining,
          kota: kota ?? existing.kota,
          lokasiDetail: lokasiDetail ?? existing.lokasiDetail,
          biaya: biaya ? parseInt(biaya) : existing.biaya,
          catatan: catatan ?? existing.catatan,
          status: status ?? existing.status,
          fileAgenda,
          updateOleh: user.pegawaiId ?? existing.updateOleh,
          trainers: {
            create: trainerKodes?.map((kode) => ({ trainerKode: kode })) ?? [],
          },
        },
        include: {
          trainers: {
            include: { trainer: { select: { kode: true, nama: true } } },
          },
          pegawai: { select: { id: true, nama: true } },
          judulTraining: { select: { kode: true, judulTraining: true } },
        },
      }),
    ]);

    res.status(200).json({
      message: "Jadwal Training berhasil diupdate.",
      data: updateData[1],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET PAGINATION
// ─────────────────────────────────────────────

const getJadwalTraining = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      jenisTraining,
      metode,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      AND: [
        ...(status
          ? [{ status: { equals: status, mode: "insensitive" } }]
          : []),
        ...(jenisTraining
          ? [{ jenisTraining: { equals: jenisTraining, mode: "insensitive" } }]
          : []),
        ...(metode
          ? [{ metode: { equals: metode, mode: "insensitive" } }]
          : []),
        ...(search
          ? [
              {
                OR: [
                  { noJadwal: { contains: search, mode: "insensitive" } },
                  { judulLengkap: { contains: search, mode: "insensitive" } },
                  { judulPendek: { contains: search, mode: "insensitive" } },
                  { kota: { contains: search, mode: "insensitive" } },
                  { kodePelatihan: { contains: search, mode: "insensitive" } },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, data] = await Promise.all([
      prisma.jadwalTraining.count({ where }),
      prisma.jadwalTraining.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { lastUpdate: "desc" },
        select: {
          id: true,
          noJadwal: true,
          tglMulai: true,
          kodePelatihan: true,
          jenisTraining: true,
          judulLengkap: true,
          biaya: true,
          lokasiDetail: true,
          status: true,
          catatan: true,
          lastUpdate: true,
          trainers: {
            select: {
              trainer: { select: { kode: true, nama: true } },
            },
          },
          pegawai: { select: { id: true, nama: true } },
        },
      }),
    ]);

    res.status(200).json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET ONE
// ─────────────────────────────────────────────

const getJadwalTrainingById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await prisma.jadwalTraining.findUnique({
      where: { noJadwal: id },
      include: {
        trainers: {
          include: { trainer: { select: { kode: true, nama: true } } },
        },
        pegawai: { select: { id: true, nama: true } },
        judulTraining: { select: { kode: true, judulTraining: true } },
      },
    });

    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal Training tidak ditemukan." });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

const deleteJadwalTraining = async (req, res) => {
  try {
    const { noJadwal } = req.params;

    if (!noJadwal) {
      return res.status(400).json({ message: "noJadwal wajib diisi." });
    }

    const existing = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Jadwal Training tidak ditemukan." });
    }

    await prisma.$transaction([
      prisma.trainerOnJadwal.deleteMany({ where: { jadwalId: existing.id } }),
      prisma.jadwalTraining.delete({ where: { noJadwal } }),
    ]);

    res.status(200).json({ message: "Jadwal Training berhasil dihapus." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const getJudulTrainingOptions = async (req, res) => {
  try {
    const data = await prisma.judulTraining.findMany({
      orderBy: { kode: "asc" },
      select: {
        kode: true,
        judulTraining: true,
        tipe: true,
      },
    });
    res.status(200).json({ data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const getTrainerOptions = async (req, res) => {
  try {
    const data = await prisma.trainer.findMany({
      orderBy: { kode: "asc" },
      select: {
        kode: true,
        nama: true,
      },
    });
    res.status(200).json({ data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

module.exports = {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,

  createTrainer,
  updateTrainer,
  getTrainerById,
  getTrainers,

  createPengajuan,
  updatePengajuan,
  getPengajuanById,
  getPengajuan,

  createJudulTraining,
  getJudulTrainingById,
  updateJudulTraining,
  getJudulTraining,

  getListPerusahaan,

  createJudulTraining,
  getJudulTrainingById,
  updateJudulTraining,
  getJudulTraining,

  createJadwalTraining,
  updateJadwalTraining,
  getJadwalTraining,
  getJadwalTrainingById,
  deleteJadwalTraining,

  getTrainerOptions,
  getJudulTrainingOptions,
};
