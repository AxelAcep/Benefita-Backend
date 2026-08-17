const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const generateNoSurat = async (tipe) => {
  const year = new Date().getFullYear();
  const tipeMap = { umum: "BNFT", marketing: "MKTG", lsp: "LSP" };
  const kode = tipeMap[tipe] || "BNFT";

  const last = await prisma.permintaanNomorSurat.findFirst({
    // Format noSurat: "001/BNFT/IV/2026" — filter harus ikut segmen "IV"-nya,
    // kalau tidak, contains ini tidak pernah match dan nomor selalu reset ke 1.
    where: { noSurat: { contains: `/${kode}/IV/${year}` } },
    orderBy: { noSurat: "desc" },
  });

  let num = 1;
  if (last) {
    const match = last.noSurat.match(/^(\d+)/);
    if (match) num = parseInt(match[1]) + 1;
  }

  return `${num.toString().padStart(3, "0")}/${kode}/IV/${year}`;
};

// ─────────────────────────────────────────────
// HELPER: resolve tujuan dari 1 input string (tujuanNoInduk)
// Kalau cocok ke TabPerusahaan → simpan sebagai relasi.
// Kalau tidak cocok → simpan sebagai teks manual di tujuanNama.
// ─────────────────────────────────────────────

const resolveTujuan = async (inputValue) => {
  if (!inputValue) {
    return { tujuanNoInduk: null, tujuanNama: null };
  }

  const perusahaan = await prisma.tabPerusahaan.findUnique({
    where: { noInduk: inputValue },
    select: { noInduk: true },
  });

  if (perusahaan) {
    return { tujuanNoInduk: perusahaan.noInduk, tujuanNama: null };
  }

  return { tujuanNoInduk: null, tujuanNama: inputValue };
};

// ─────────────────────────────────────────────
// HELPER: bentuk response, cuma 1 field tujuanNoInduk
// (isinya noInduk asli atau teks manual)
// ─────────────────────────────────────────────

const formatSuratResponse = (surat) => {
  const result = { ...surat };
  result.tujuanNoInduk =
    result.tujuanNoInduk ?? result.tujuanNama ?? null;
  delete result.tujuanNama;
  delete result.tujuan;
  return result;
};

const createPermintaanSurat = async (req, res) => {
  try {
    const { keterangan, tanggalKirim, tujuanNoInduk, pengirimId, tipe } =
      req.body;

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pengirimId },
    });
    if (!pegawai)
      return res.status(404).json({ error: "Pegawai tidak ditemukan" });

    const resolved = await resolveTujuan(tujuanNoInduk);

    // Retry beberapa kali kalau kebetulan ada request lain yang generate nomor
    // yang sama persis di waktu bersamaan (race antara baca nomor terakhir & insert).
    let result;
    for (let attempt = 0; attempt < 5; attempt++) {
      const noSurat = await generateNoSurat(tipe);
      try {
        result = await prisma.permintaanNomorSurat.create({
          data: {
            noSurat,
            keterangan,
            tanggalKirim: tanggalKirim ? new Date(tanggalKirim) : new Date(),
            tipe,
            ...resolved,
            pengirimId,
          },
          include: {
            tujuan: { select: { noInduk: true, company: true } },
            pengirim: true,
          },
        });
        break;
      } catch (err) {
        const isDuplicateNoSurat =
          err.code === "P2002" && err.meta?.target?.includes("noSurat");
        if (!isDuplicateNoSurat || attempt === 4) throw err;
      }
    }

    res.status(201).json({ success: true, data: formatSuratResponse(result) });
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

    if (pengirimId) {
      const pegawai = await prisma.pegawai.findUnique({
        where: { id: pengirimId },
      });
      if (!pegawai)
        return res.status(404).json({ error: "Pegawai tidak ditemukan" });
    }

    const resolved =
      tujuanNoInduk !== undefined ? await resolveTujuan(tujuanNoInduk) : {};

    const result = await prisma.permintaanNomorSurat.update({
      where: { id: parseInt(id) },
      data: {
        keterangan,
        tanggalKirim: tanggalKirim ? new Date(tanggalKirim) : undefined,
        pengirimId,
        tipe,
        ...resolved,
      },
      include: { tujuan: { select: { noInduk: true, company: true } }, pengirim: true },
    });

    res.json({ success: true, data: formatSuratResponse(result) });
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
        { tujuanNama: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.permintaanNomorSurat.findMany({
        where,
        include: {
          tujuan: { select: { noInduk: true, company: true } },
          pengirim: true,
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.permintaanNomorSurat.count({ where }),
    ]);

    res.json({
      success: true,
      data: data.map(formatSuratResponse),
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
      include: {
        tujuan: { select: { noInduk: true, company: true } },
        pengirim: true,
      },
    });

    if (!result) return res.status(404).json({ error: "Data tidak ditemukan" });
    res.json({ success: true, data: formatSuratResponse(result) });
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
