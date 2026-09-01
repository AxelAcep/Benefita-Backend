const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * SEARCH PERUSAHAAN — PUBLIC (TANPA AUTH)
 *
 * Dipakai oleh dropdown perusahaan di halaman public /biodata/[id]
 * (form isi biodata peserta, tanpa login). Sengaja dibuat TERPISAH dari
 * getListPerusahaan (training.controller.js, endpoint admin/protected,
 * dipakai dropdown.service.ts → GET /api/training/perusahaan) — endpoint
 * itu TIDAK diubah sama sekali.
 *
 * Field yang di-select DIBATASI: jangan expose semua kolom TabPerusahaan,
 * cukup yang dibutuhkan untuk dropdown + tampilan alamat/telp.
 */
const searchPerusahaanPublic = async (req, res) => {
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
        alamat: true,
        telp: true,
      },
      orderBy: { company: "asc" },
      take: 50, // batasi biar ga berat
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET JADWAL + LIST PESERTA — PUBLIC (TANPA AUTH)
 *
 * Dipakai halaman pengumuman publik (di-share/broadcast ke grup WA peserta)
 * yang berisi link personal (biodata + evaluasi) ke tiap peserta dalam satu
 * jadwal training. Sengaja dibuat TERPISAH dari getPesertaTraining
 * (input.controller.js, endpoint admin/protected, dipakai GET
 * /api/input/jadwal/:noJadwal/peserta) — endpoint itu TIDAK diubah sama
 * sekali.
 *
 * Data DIBATASI SEMINIM MUNGKIN karena halaman ini public:
 * - Info jadwal: cuma judulLengkap, tglMulai, metode.
 * - Peserta: cuma id & nama — JANGAN expose email, noHp, alamat, dll.
 */
const getJadwalPesertaPublic = async (req, res) => {
  try {
    const { noJadwal } = req.params;

    if (!noJadwal) {
      return res
        .status(400)
        .json({ success: false, message: "noJadwal wajib diisi." });
    }

    const jadwal = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
      select: {
        judulLengkap: true,
        tglMulai: true,
        metode: true,
        peserta: {
          select: {
            id: true,
            nama: true,
          },
          orderBy: { id: "asc" }, // urutan input, biar konsisten sebagai nomor urut
        },
      },
    });

    if (!jadwal) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal Training tidak ditemukan." });
    }

    return res.status(200).json({
      success: true,
      data: {
        jadwal: {
          judulLengkap: jadwal.judulLengkap,
          tglMulai: jadwal.tglMulai,
          metode: jadwal.metode,
        },
        peserta: jadwal.peserta,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchPerusahaanPublic,
  getJadwalPesertaPublic,
};
