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
};
