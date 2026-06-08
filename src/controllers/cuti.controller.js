const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// 1. CREATE PENGAJUAN IZIN
// ─────────────────────────────────────────────
const createPengajuan = async (req, res) => {
  try {
    const { pegawaiId, jenisIzin, tanggalMulai, tanggalSelesai, alasan } =
      req.body;
    const buktiFiles = req.files ?? [];

    const pengajuan = await prisma.pengajuanIzin.create({
      data: {
        pegawaiId,
        jenisIzin,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        alasan,
        status: "PENDING",
        bukti: buktiFiles.length
          ? {
              create: buktiFiles.map((f) => ({
                nama: f.originalname,
                url: `uploads/izin/${f.filename}`,
                key: f.filename,
              })),
            }
          : undefined,
      },
      include: { bukti: true, pegawai: { select: { nama: true, nip: true } } },
    });

    return res
      .status(201)
      .json({ message: "Pengajuan izin berhasil dibuat", data: pengajuan });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 2. LIST PENGAJUAN (PAGINATION + SEARCH)
// ─────────────────────────────────────────────
const getListPengajuan = async (req, res) => {
  try {
    const { search, jenisIzin, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      AND: [
        search
          ? { pegawai: { nama: { contains: search, mode: "insensitive" } } }
          : {},
        jenisIzin ? { jenisIzin } : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.pengajuanIzin.findMany({
        where: {
          ...where,
          status: "PENDING",
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jenisIzin: true,
          tanggalMulai: true,
          tanggalSelesai: true,
          alasan: true,
          status: true,
          createdAt: true,
          pegawai: {
            select: {
              id: true,
              nama: true,
              nip: true,
              jabatan: true,
              departemen: true,
            },
          },
        },
      }),
      prisma.pengajuanIzin.count({ where }),
    ]);

    return res.status(200).json({
      data,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPage: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 3. KONFIRMASI / TOLAK
// ─────────────────────────────────────────────
const konfirmasiPengajuan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, alasanTolak } = req.body;

    if (!["DISETUJUI", "DITOLAK"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid" });
    }

    if (status === "DITOLAK" && !alasanTolak) {
      return res
        .status(400)
        .json({ message: "alasanTolak wajib diisi jika ditolak" });
    }

    const existing = await prisma.pengajuanIzin.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });

    const updated = await prisma.pengajuanIzin.update({
      where: { id },
      data: {
        status,
        alasanTolak: status === "DITOLAK" ? alasanTolak : null,
        tanggalKonfirmasi: new Date(),
      },
      include: { pegawai: { select: { nama: true } } },
    });

    return res.status(200).json({
      message: `Pengajuan berhasil ${status === "DISETUJUI" ? "disetujui" : "ditolak"}`,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 4. GET ONE DETAIL
// ─────────────────────────────────────────────
const getDetailPengajuan = async (req, res) => {
  try {
    const { id } = req.params;

    const pengajuan = await prisma.pengajuanIzin.findUnique({
      where: { id },
      include: {
        bukti: true,
        pegawai: {
          select: {
            id: true,
            nama: true,
            nip: true,
            jabatan: true,
            departemen: true,
            fotoUrl: true,
          },
        },
      },
    });

    if (!pengajuan)
      return res.status(404).json({ message: "Pengajuan tidak ditemukan" });

    return res.status(200).json({ data: pengajuan });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 5. RIWAYAT IZIN BY PEGAWAI
// ─────────────────────────────────────────────
const getRiwayatByPegawai = async (req, res) => {
  try {
    const { pegawaiId } = req.params;
    const {
      status,
      jenisIzin,
      tanggalPengajuan,
      tanggalMulai,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      pegawaiId,
      AND: [
        status ? { status } : {},
        jenisIzin ? { jenisIzin } : {},
        tanggalPengajuan
          ? {
              createdAt: {
                gte: new Date(tanggalPengajuan),
                lt: new Date(new Date(tanggalPengajuan).getTime() + 86400000),
              },
            }
          : {},
        tanggalMulai
          ? {
              tanggalMulai: {
                gte: new Date(tanggalMulai),
                lt: new Date(new Date(tanggalMulai).getTime() + 86400000),
              },
            }
          : {},
      ],
    };

    const [data, total, summary] = await Promise.all([
      prisma.pengajuanIzin.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jenisIzin: true,
          tanggalMulai: true,
          tanggalSelesai: true,
          alasan: true,
          alasanTolak: true,
          status: true,
          createdAt: true,
          tanggalKonfirmasi: true,
        },
      }),
      prisma.pengajuanIzin.count({ where }),
      // Hitung total per jenis (hanya DISETUJUI)
      prisma.pengajuanIzin.groupBy({
        by: ["jenisIzin"],
        where: { pegawaiId, status: "DISETUJUI" },
        _count: { id: true },
      }),
    ]);

    // Format summary
    const totalCuti =
      summary.find((s) => s.jenisIzin === "CUTI")?._count.id ?? 0;
    const totalIzin =
      summary.find((s) => s.jenisIzin === "IZIN")?._count.id ?? 0;
    const totalSakit =
      summary.find((s) => s.jenisIzin === "SAKIT")?._count.id ?? 0;

    return res.status(200).json({
      data,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPage: Math.ceil(total / parseInt(limit)),
      },
      summary: {
        totalCuti,
        totalIzin,
        totalSakit,
        totalCutiDanIzin: totalCuti + totalIzin,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 6. RIWAYAT IZIN ALL
// ─────────────────────────────────────────────
const getRiwayatAll = async (req, res) => {
  try {
    const {
      status,
      jenisIzin,
      tanggalPengajuan,
      tanggalMulai,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      AND: [
        status ? { status } : {},
        jenisIzin ? { jenisIzin } : {},
        search
          ? { pegawai: { nama: { contains: search, mode: "insensitive" } } }
          : {},
        tanggalPengajuan
          ? {
              createdAt: {
                gte: new Date(tanggalPengajuan),
                lt: new Date(new Date(tanggalPengajuan).getTime() + 86400000),
              },
            }
          : {},
        tanggalMulai
          ? {
              tanggalMulai: {
                gte: new Date(tanggalMulai),
                lt: new Date(new Date(tanggalMulai).getTime() + 86400000),
              },
            }
          : {},
      ],
    };

    const [data, total, summary] = await Promise.all([
      prisma.pengajuanIzin.findMany({
        where: {
          ...where,
          status: "DISETUJUI" || "DITOLAK",
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jenisIzin: true,
          tanggalMulai: true,
          tanggalSelesai: true,
          alasan: true,
          alasanTolak: true,
          status: true,
          createdAt: true,
          tanggalKonfirmasi: true,
          pegawai: {
            select: {
              id: true,
              nama: true,
              nip: true,
              jabatan: true,
              departemen: true,
            },
          },
        },
      }),
      prisma.pengajuanIzin.count({ where }),
      prisma.pengajuanIzin.groupBy({
        by: ["jenisIzin"],
        where: { status: "DISETUJUI" },
        _count: { id: true },
      }),
    ]);

    const totalCuti =
      summary.find((s) => s.jenisIzin === "CUTI")?._count.id ?? 0;
    const totalIzin =
      summary.find((s) => s.jenisIzin === "IZIN")?._count.id ?? 0;
    const totalSakit =
      summary.find((s) => s.jenisIzin === "SAKIT")?._count.id ?? 0;

    return res.status(200).json({
      data,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPage: Math.ceil(total / parseInt(limit)),
      },
      summary: {
        totalCuti,
        totalIzin,
        totalSakit,
        totalCutiDanIzin: totalCuti + totalIzin,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// 7. GET KARYAWAN CUTI (REKAP PER PEGAWAI)
// ─────────────────────────────────────────────
const getKaryawanCuti = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? { nama: { contains: search, mode: "insensitive" } }
      : {};

    const [pegawaiList, total] = await Promise.all([
      prisma.pegawai.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { nama: "asc" },
        select: {
          id: true,
          nama: true,
          jabatan: true,
          departemen: true,
          fotoUrl: true,
          pengajuanIzin: {
            where: { status: "DISETUJUI" },
            select: { jenisIzin: true },
          },
        },
      }),
      prisma.pegawai.count({ where }),
    ]);

    const data = pegawaiList.map((p) => {
      const totalCuti = p.pengajuanIzin.filter(
        (i) => i.jenisIzin === "CUTI",
      ).length;
      const totalIzin = p.pengajuanIzin.filter(
        (i) => i.jenisIzin === "IZIN",
      ).length;
      const totalSakit = p.pengajuanIzin.filter(
        (i) => i.jenisIzin === "SAKIT",
      ).length;

      return {
        id: p.id,
        nama: p.nama,
        jabatan: p.jabatan,
        departemen: p.departemen,
        fotoUrl: p.fotoUrl,
        totalCutiDanIzin: totalCuti + totalIzin,
        totalSakit,
      };
    });

    return res.status(200).json({
      data,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPage: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPengajuan,
  getListPengajuan,
  konfirmasiPengajuan,
  getDetailPengajuan,
  getRiwayatByPegawai,
  getRiwayatAll,
  getKaryawanCuti,
};
