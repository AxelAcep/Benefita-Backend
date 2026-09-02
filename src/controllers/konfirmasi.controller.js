const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPER: generate NoKonfirmasi
// Format: 0734/BNFT_K/HAX/0222  →  {urut 4 digit}/BNFT_K/HAX/{MMYY}
// ─────────────────────────────────────────────

const KONFIRMASI_KODE = "BNFT_K";
const KONFIRMASI_SUB = "HAX";

const generateNoKonfirmasi = async () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const suffix = `${mm}${yy}`;

  const last = await prisma.konfirmasi.findFirst({
    where: {
      noKonfirmasi: { endsWith: `/${KONFIRMASI_KODE}/${KONFIRMASI_SUB}/${suffix}` },
    },
    orderBy: { noKonfirmasi: "desc" },
  });

  let num = 1;
  if (last) {
    const match = last.noKonfirmasi.match(/^(\d+)/);
    if (match) num = parseInt(match[1], 10) + 1;
  }

  return `${num.toString().padStart(4, "0")}/${KONFIRMASI_KODE}/${KONFIRMASI_SUB}/${suffix}`;
};

// ─────────────────────────────────────────────
// HELPER: resolve instansi dari 1 input noInduk
// Kalau cocok ke TabPerusahaan → simpan sebagai relasi.
// Kalau tidak cocok → simpan sebagai teks manual di instansiNama.
// ─────────────────────────────────────────────

const resolveInstansi = async (inputValue) => {
  if (!inputValue) {
    return { noIndukInstansi: null, instansiNama: null };
  }

  const perusahaan = await prisma.tabPerusahaan.findUnique({
    where: { noInduk: inputValue },
    select: { noInduk: true },
  });

  if (perusahaan) {
    return { noIndukInstansi: perusahaan.noInduk, instansiNama: null };
  }

  return { noIndukInstansi: null, instansiNama: inputValue };
};

const KONFIRMASI_INCLUDE = {
  instansi: { select: { noInduk: true, company: true } },
  jadwalTraining: {
    select: {
      noJadwal: true,
      judulLengkap: true,
      judulPendek: true,
      kodePelatihan: true,
      metode: true,
      tglMulai: true,
      tglSelesai: true,
    },
  },
  pesertaTraining: { select: { id: true, nama: true, jabatan: true } },
  dibuatOleh: { select: { id: true, nama: true } },
};

// ─────────────────────────────────────────────
// HELPER: bentuk response, gabungkan noIndukInstansi/instansiNama jadi 1 field
// ─────────────────────────────────────────────

const formatKonfirmasiResponse = (konfirmasi) => {
  const result = { ...konfirmasi };
  result.instansi = result.instansi?.company ?? result.instansiNama ?? null;
  result.noIndukInstansi = result.noIndukInstansi ?? null;
  delete result.instansiNama;
  return result;
};

// ─────────────────────────────────────────────
// CREATE KONFIRMASI
// ─────────────────────────────────────────────

const createKonfirmasi = async (req, res) => {
  try {
    const {
      pesertaTrainingId,
      metode,
      tanggalPelatihan,
      kepada,
      namaPeserta,
      jabatan,
      kontak,
      noIndukInstansi,
    } = req.body;

    // authMiddleware sudah resolve token → user → pegawaiId
    const pegawaiId = req.user?.pegawaiId;
    if (!pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const parsedPesertaId = parseInt(pesertaTrainingId);
    if (!pesertaTrainingId || isNaN(parsedPesertaId)) {
      return res
        .status(400)
        .json({ message: "pesertaTrainingId wajib diisi." });
    }

    if (!metode) {
      return res
        .status(400)
        .json({ message: "Metode (Offline/Online) wajib diisi." });
    }

    const peserta = await prisma.pesertaTraining.findUnique({
      where: { id: parsedPesertaId },
      include: { jadwalTraining: true },
    });
    if (!peserta) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    const resolvedInstansi = await resolveInstansi(
      noIndukInstansi ?? peserta.noIndukPerusahaan ?? peserta.instansi,
    );

    const filePath = req.file?.path ?? null;

    const tanggalPelatihanValue = tanggalPelatihan
      ? new Date(tanggalPelatihan)
      : (peserta.jadwalTraining.tglMulai ?? null);

    // Retry beberapa kali kalau kebetulan ada request lain yang generate nomor
    // yang sama persis di waktu bersamaan (race antara baca nomor terakhir & insert).
    let result;
    for (let attempt = 0; attempt < 5; attempt++) {
      const noKonfirmasi = await generateNoKonfirmasi();
      try {
        result = await prisma.$transaction(async (tx) => {
          const created = await tx.konfirmasi.create({
            data: {
              noKonfirmasi,
              tanggalPelatihan: tanggalPelatihanValue,
              metode,
              kepada: kepada ?? null,
              kodePelatihan: peserta.jadwalTraining.kodePelatihan,
              namaPeserta: namaPeserta ?? peserta.nama,
              jabatan: jabatan ?? peserta.jabatan ?? null,
              kontak: kontak ?? peserta.noHp ?? peserta.noTelp ?? null,
              filePath,
              ...resolvedInstansi,
              noJadwal: peserta.noJadwal,
              pesertaTrainingId: peserta.id,
              dibuatOlehId: pegawaiId,
            },
            include: KONFIRMASI_INCLUDE,
          });

          // Sinkronkan ke PesertaTraining: siapa & kapan terakhir dikonfirmasi
          await tx.pesertaTraining.update({
            where: { id: peserta.id },
            data: {
              konfirmasiOleh: pegawaiId,
              konTgl: created.tanggalKonfirmasi,
            },
          });

          return created;
        });
        break;
      } catch (err) {
        const isDuplicateNoKonfirmasi =
          err.code === "P2002" && err.meta?.target?.includes("noKonfirmasi");
        if (!isDuplicateNoKonfirmasi || attempt === 4) throw err;
      }
    }

    res.status(201).json({
      message: "Konfirmasi berhasil dibuat.",
      data: formatKonfirmasiResponse(result),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// GET LIST KONFIRMASI
// ─────────────────────────────────────────────

const getListKonfirmasi = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      noJadwal,
      pesertaTrainingId,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      ...(noJadwal ? { noJadwal } : {}),
      ...(pesertaTrainingId
        ? { pesertaTrainingId: parseInt(pesertaTrainingId) }
        : {}),
      ...(search
        ? {
            OR: [
              { noKonfirmasi: { contains: search, mode: "insensitive" } },
              { namaPeserta: { contains: search, mode: "insensitive" } },
              { kodePelatihan: { contains: search, mode: "insensitive" } },
              {
                instansi: {
                  company: { contains: search, mode: "insensitive" },
                },
              },
              { instansiNama: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.konfirmasi.count({ where }),
      prisma.konfirmasi.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: KONFIRMASI_INCLUDE,
      }),
    ]);

    res.status(200).json({
      data: data.map(formatKonfirmasiResponse),
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
// GET KONFIRMASI BY ID
// ─────────────────────────────────────────────

const getKonfirmasiById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const data = await prisma.konfirmasi.findUnique({
      where: { id: parsedId },
      include: KONFIRMASI_INCLUDE,
    });

    if (!data) {
      return res.status(404).json({ message: "Konfirmasi tidak ditemukan." });
    }

    res.status(200).json({ data: formatKonfirmasiResponse(data) });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE KONFIRMASI
// ─────────────────────────────────────────────

const updateKonfirmasi = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const existing = await prisma.konfirmasi.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Konfirmasi tidak ditemukan." });
    }

    const {
      metode,
      tanggalPelatihan,
      kepada,
      namaPeserta,
      jabatan,
      kontak,
      noIndukInstansi,
    } = req.body;

    const resolvedInstansi =
      noIndukInstansi !== undefined
        ? await resolveInstansi(noIndukInstansi)
        : {};

    const filePath = req.file?.path ?? existing.filePath;

    const data = await prisma.konfirmasi.update({
      where: { id: parsedId },
      data: {
        metode: metode ?? existing.metode,
        tanggalPelatihan: tanggalPelatihan
          ? new Date(tanggalPelatihan)
          : existing.tanggalPelatihan,
        kepada: kepada ?? existing.kepada,
        namaPeserta: namaPeserta ?? existing.namaPeserta,
        jabatan: jabatan ?? existing.jabatan,
        kontak: kontak ?? existing.kontak,
        filePath,
        ...resolvedInstansi,
      },
      include: KONFIRMASI_INCLUDE,
    });

    res.status(200).json({
      message: "Konfirmasi berhasil diupdate.",
      data: formatKonfirmasiResponse(data),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE KONFIRMASI
// ─────────────────────────────────────────────

const deleteKonfirmasi = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const existing = await prisma.konfirmasi.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res.status(404).json({ message: "Konfirmasi tidak ditemukan." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.konfirmasi.delete({ where: { id: parsedId } });

      // Kalau yang dihapus adalah konfirmasi terakhir peserta ini,
      // sinkron ulang PesertaTraining.konfirmasiOleh/konTgl ke konfirmasi
      // tersisa yang paling baru (atau kosongkan kalau tidak ada lagi).
      const peserta = await tx.pesertaTraining.findUnique({
        where: { id: existing.pesertaTrainingId },
        select: { konfirmasiOleh: true, konTgl: true },
      });

      const isLastActiveKonfirmasi =
        peserta &&
        peserta.konfirmasiOleh === existing.dibuatOlehId &&
        peserta.konTgl?.getTime() === existing.tanggalKonfirmasi.getTime();

      if (isLastActiveKonfirmasi) {
        const latest = await tx.konfirmasi.findFirst({
          where: { pesertaTrainingId: existing.pesertaTrainingId },
          orderBy: { tanggalKonfirmasi: "desc" },
        });

        await tx.pesertaTraining.update({
          where: { id: existing.pesertaTrainingId },
          data: {
            konfirmasiOleh: latest?.dibuatOlehId ?? null,
            konTgl: latest?.tanggalKonfirmasi ?? null,
          },
        });
      }
    });

    res.status(200).json({ message: "Konfirmasi berhasil dihapus." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

module.exports = {
  createKonfirmasi,
  getListKonfirmasi,
  getKonfirmasiById,
  updateKonfirmasi,
  deleteKonfirmasi,
};
