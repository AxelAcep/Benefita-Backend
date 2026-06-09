const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateNoSurat = async (tipe) => {
  const year = new Date().getFullYear();
  const tipeMap = { umum: "BNFT", marketing: "MKTG", lsp: "LSP" };
  const kode = tipeMap[tipe] || "BNFT";

  const last = await prisma.permintaanNomorSurat.findFirst({
    where: { noSurat: { contains: `/${kode}/${year}` } },
    orderBy: { noSurat: "desc" },
  });

  let num = 1;
  if (last) {
    const match = last.noSurat.match(/^(\d+)/);
    if (match) num = parseInt(match[1]) + 1;
  }

  return `${num.toString().padStart(3, "0")}/${kode}/IV/${year}`;
};

const createPermintaanSurat = async (req, res) => {
  try {
    const { keterangan, tanggalKirim, tujuanNoInduk, pengirimId, tipe } =
      req.body;

    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk: tujuanNoInduk },
    });
    if (!perusahaan)
      return res.status(404).json({ error: "Perusahaan tidak ditemukan" });

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pengirimId },
    });
    if (!pegawai)
      return res.status(404).json({ error: "Pegawai tidak ditemukan" });

    const noSurat = await generateNoSurat(tipe);

    const result = await prisma.permintaanNomorSurat.create({
      data: {
        noSurat,
        keterangan,
        tanggalKirim: tanggalKirim ? new Date(tanggalKirim) : new Date(),
        tipe,
        tujuanNoInduk,
        pengirimId,
      },
      include: { tujuan: true, pengirim: true },
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePermintaanSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan, tanggalKirim, tujuanNoInduk, pengirimId, tipe } =
      req.body;

    const existing = await prisma.permintaanNomorSurat.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing)
      return res.status(404).json({ error: "Data tidak ditemukan" });

    if (tujuanNoInduk) {
      const perusahaan = await prisma.tabPerusahaan.findUnique({
        where: { noInduk: tujuanNoInduk },
      });
      if (!perusahaan)
        return res.status(404).json({ error: "Perusahaan tidak ditemukan" });
    }

    if (pengirimId) {
      const pegawai = await prisma.pegawai.findUnique({
        where: { id: pengirimId },
      });
      if (!pegawai)
        return res.status(404).json({ error: "Pegawai tidak ditemukan" });
    }

    const result = await prisma.permintaanNomorSurat.update({
      where: { id: parseInt(id) },
      data: {
        keterangan,
        tanggalKirim: tanggalKirim ? new Date(tanggalKirim) : undefined,
        tujuanNoInduk,
        pengirimId,
        tipe,
      },
      include: { tujuan: true, pengirim: true },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getListPermintaanSurat = async (req, res) => {
  try {
    const { page = 1, limit = 10, tipe, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = {};
    if (tipe) where.tipe = tipe;
    if (search) {
      where.OR = [
        { noSurat: { contains: search, mode: "insensitive" } },
        { pengirim: { nama: { contains: search, mode: "insensitive" } } },
        { tujuan: { company: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.permintaanNomorSurat.findMany({
        where,
        include: { tujuan: true, pengirim: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.permintaanNomorSurat.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPermintaanSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.permintaanNomorSurat.findUnique({
      where: { id: parseInt(id) },
      include: { tujuan: true, pengirim: true },
    });

    if (!result) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePermintaanSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await prisma.permintaanNomorSurat.delete({
      where: { id: parseInt(id) },
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPermintaanSurat,
  updatePermintaanSurat,
  getListPermintaanSurat,
  getPermintaanSurat,
  deletePermintaanSurat,
};
