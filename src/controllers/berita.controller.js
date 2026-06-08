const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createBerita = async (req, res) => {
  try {
    const { periode, isi } = req.body;

    if (!periode || !isi) {
      return res.status(400).json({ message: "periode dan isi wajib diisi." });
    }

    const berita = await prisma.berita.create({
      data: {
        periode: new Date(periode),
        isi,
      },
    });

    return res
      .status(201)
      .json({ message: "Berita berhasil dibuat.", data: berita });
  } catch (error) {
    console.error("[createBerita error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getBeritaAktif = async (req, res) => {
  try {
    const now = new Date();

    const berita = await prisma.berita.findMany({
      where: {
        periode: { gte: now },
      },
      orderBy: { periode: "asc" },
    });

    const data = berita.map((b) => ({
      ...b,
      status: "aktif",
    }));

    return res
      .status(200)
      .json({ message: "Berhasil mengambil berita aktif.", data });
  } catch (error) {
    console.error("[getBeritaAktif error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// GET ALL (dengan status derived)
const getAllBerita = async (req, res) => {
  try {
    const now = new Date();

    const berita = await prisma.berita.findMany({
      orderBy: { periode: "desc" },
    });

    const data = berita.map((b) => ({
      ...b,
      status: b.periode >= now ? "aktif" : "nonaktif",
    }));

    return res
      .status(200)
      .json({ message: "Berhasil mengambil semua berita.", data });
  } catch (error) {
    console.error("[getAllBerita error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// GET ONE
const getBeritaById = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();

    const berita = await prisma.berita.findUnique({ where: { id } });

    if (!berita) {
      return res.status(404).json({ message: "Berita tidak ditemukan." });
    }

    return res.status(200).json({
      message: "Berhasil mengambil berita.",
      data: { ...berita, status: berita.periode >= now ? "aktif" : "nonaktif" },
    });
  } catch (error) {
    console.error("[getBeritaById error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// EDIT
const updateBerita = async (req, res) => {
  try {
    const { id } = req.params;
    const { periode, isi } = req.body;

    if (!periode && !isi) {
      return res
        .status(400)
        .json({ message: "Minimal satu field harus diisi." });
    }

    const existing = await prisma.berita.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Berita tidak ditemukan." });
    }

    const berita = await prisma.berita.update({
      where: { id },
      data: {
        ...(periode && { periode: new Date(periode) }),
        ...(isi && { isi }),
      },
    });

    const now = new Date();
    return res.status(200).json({
      message: "Berita berhasil diperbarui.",
      data: { ...berita, status: berita.periode >= now ? "aktif" : "nonaktif" },
    });
  } catch (error) {
    console.error("[updateBerita error]", error);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

module.exports = {
  createBerita,
  getBeritaAktif,
  getAllBerita,
  updateBerita,
  getBeritaById,
};
