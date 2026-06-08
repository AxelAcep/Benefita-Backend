const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// CREATE PEGAWAI (otomatis create User)
// ─────────────────────────────────────────────
const createPegawai = async (req, res) => {
  try {
    const {
      nama,
      nip,
      prefix,
      kode,
      jabatan,
      departemen,
      // User fields
      phone,
      email,
      password,
      role,
    } = req.body;

    const foto = req.files?.foto?.[0] ?? null;
    const dokumenFiles = req.files?.dokumen ?? [];

    const hashedPassword = await bcrypt.hash(password, 10);

    const pegawai = await prisma.$transaction(async (tx) => {
      const newPegawai = await tx.pegawai.create({
        data: {
          nama,
          nip: nip || null,
          prefix: prefix || null,
          kode: kode || null,
          jabatan: jabatan || null,
          departemen: departemen || null,
          fotoUrl: foto ? `/uploads/pegawai/${foto.filename}` : null,
          fotoKey: foto ? foto.filename : null,
          dokumen: dokumenFiles.length
            ? {
                create: dokumenFiles.map((f) => ({
                  nama: f.originalname,
                  url: `/uploads/pegawai/${f.filename}`,
                  key: f.filename,
                })),
              }
            : undefined,
          user: {
            create: {
              phone,
              email,
              password: hashedPassword,
              role,
            },
          },
        },
        include: { dokumen: true, user: true },
      });

      return newPegawai;
    });

    return res.status(201).json({
      message: "Pegawai berhasil dibuat",
      data: pegawai,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE PEGAWAI
// ─────────────────────────────────────────────
const getPegawai = async (req, res) => {
  try {
    const { id } = req.params;

    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        dokumen: true,
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pegawai) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }

    return res.status(200).json({ data: pegawai });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET LIST PEGAWAI
// ─────────────────────────────────────────────
const getListPegawai = async (req, res) => {
  try {
    const { search, departemen, jabatan, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      AND: [
        search
          ? {
              OR: [
                { nama: { contains: search, mode: "insensitive" } },
                { nip: { contains: search, mode: "insensitive" } },
                { jabatan: { contains: search, mode: "insensitive" } },
                { departemen: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        departemen ? { departemen } : {},
        jabatan ? { jabatan } : {},
      ],
    };

    const [data, total] = await Promise.all([
      prisma.pegawai.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { nama: "asc" },
        include: {
          user: {
            select: { id: true, email: true, phone: true, role: true },
          },
        },
      }),
      prisma.pegawai.count({ where }),
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
// UPDATE PEGAWAI
// ─────────────────────────────────────────────
const updatePegawai = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nip, prefix, kode, jabatan, departemen, phone, email, role } =
      req.body;

    const foto = req.files?.foto?.[0] ?? null;
    const dokumenFiles = req.files?.dokumen ?? [];

    const existing = await prisma.pegawai.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }

    // Hapus foto lama jika ada foto baru
    if (foto && existing.fotoKey) {
      const oldPath = path.join("uploads/pegawai", existing.fotoKey);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const pegawai = await prisma.$transaction(async (tx) => {
      const updated = await tx.pegawai.update({
        where: { id },
        data: {
          nama: nama ?? existing.nama,
          nip: nip ?? existing.nip,
          prefix: prefix ?? existing.prefix,
          kode: kode ?? existing.kode,
          jabatan: jabatan ?? existing.jabatan,
          departemen: departemen ?? existing.departemen,
          fotoUrl: foto
            ? `/uploads/pegawai/${foto.filename}`
            : existing.fotoUrl,
          fotoKey: foto ? foto.filename : existing.fotoKey,
          ...(dokumenFiles.length && {
            dokumen: {
              create: dokumenFiles.map((f) => ({
                nama: f.originalname,
                url: `/uploads/pegawai/${f.filename}`,
                key: f.filename,
              })),
            },
          }),
        },
        include: { dokumen: true, user: true },
      });

      if (existing.user && (phone || email || role)) {
        await tx.user.update({
          where: { pegawaiId: id },
          data: {
            phone: phone ?? existing.user.phone,
            email: email ?? existing.user.email,
            role: role ?? existing.user.role,
          },
        });
      }

      return updated;
    });

    return res.status(200).json({
      message: "Pegawai berhasil diupdate",
      data: pegawai,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE PEGAWAI
// ─────────────────────────────────────────────
const deletePegawai = async (req, res) => {
  try {
    const { id } = req.params;

    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: { dokumen: true },
    });

    if (!pegawai) {
      return res.status(404).json({ message: "Pegawai tidak ditemukan" });
    }

    // Hapus foto
    if (pegawai.fotoKey) {
      const fotoPath = path.join("uploads/pegawai", pegawai.fotoKey);
      if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
    }

    // Hapus semua dokumen fisik
    for (const dok of pegawai.dokumen) {
      const dokPath = path.join("uploads/pegawai", dok.key);
      if (fs.existsSync(dokPath)) fs.unlinkSync(dokPath);
    }

    await prisma.pegawai.delete({ where: { id } });

    return res.status(200).json({ message: "Pegawai berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "newPassword wajib diisi" });
    }

    const user = await prisma.user.findUnique({ where: { pegawaiId: id } });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { pegawaiId: id },
      data: { password: hashed },
    });

    return res.status(200).json({ message: "Password berhasil direset" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// RESET DEVICE (hapus semua DeviceTrusted)
// ─────────────────────────────────────────────
const resetDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { pegawaiId: id } });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    await prisma.deviceTrusted.deleteMany({ where: { userId: user.id } });

    return res.status(200).json({ message: "Device berhasil direset" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE DOKUMEN
// ─────────────────────────────────────────────
const deleteDokumen = async (req, res) => {
  try {
    const { dokumenId } = req.params;

    const dokumen = await prisma.dokumenPegawai.findUnique({
      where: { id: dokumenId },
    });

    if (!dokumen) {
      return res.status(404).json({ message: "Dokumen tidak ditemukan" });
    }

    // Hapus file fisik
    const filePath = path.join("uploads/pegawai", dokumen.key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.dokumenPegawai.delete({ where: { id: dokumenId } });

    return res.status(200).json({ message: "Dokumen berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPegawai,
  getPegawai,
  updatePegawai,
  getListPegawai,
  deletePegawai,
  resetPassword,
  resetDevice,
  deleteDokumen,
};
