// controllers/pegawaiController.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helper: hapus file dari disk
// ---------------------------------------------------------------------------
function deleteFile(filePath) {
  if (!filePath) return;
  const full = path.join(__dirname, "..", filePath);
  if (fs.existsSync(full)) fs.unlinkSync(full);
}

// ---------------------------------------------------------------------------
// 1. CREATE
// POST /pegawai
// fields: foto (single), dokumen (multiple)
// body: nama, nip, prefix, kode, jabatan, departemen
// ---------------------------------------------------------------------------
async function createPegawai(req, res) {
  try {
    const { nama, nip, prefix, kode, jabatan, departemen } = req.body;

    if (!nama) return res.status(400).json({ message: "Nama wajib diisi." });

    const fotoFile = req.files?.foto?.[0];
    const dokumenFiles = req.files?.dokumen ?? [];

    const pegawai = await prisma.pegawai.create({
      data: {
        nama,
        nip: nip || null,
        prefix: prefix || null,
        kode: kode || null,
        jabatan: jabatan || null,
        departemen: departemen || null,
        fotoUrl: fotoFile ? `uploads/pegawai/${fotoFile.filename}` : null,
        fotoKey: fotoFile ? fotoFile.filename : null,
        dokumen:
          dokumenFiles.length > 0
            ? {
                create: dokumenFiles.map((f) => ({
                  nama: f.originalname,
                  url: `uploads/pegawai/${f.filename}`,
                  key: f.filename,
                })),
              }
            : undefined,
      },
      include: { dokumen: true },
    });

    return res
      .status(201)
      .json({ message: "Pegawai berhasil dibuat.", data: pegawai });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "NIP sudah digunakan." });
    }
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 2. GET ONE
// GET /pegawai/:id
// ---------------------------------------------------------------------------
async function getPegawai(req, res) {
  try {
    const { id } = req.params;

    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: {
        dokumen: true,
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pegawai)
      return res.status(404).json({ message: "Pegawai tidak ditemukan." });

    return res.json({ data: pegawai });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 3. UPDATE
// PUT /pegawai/:id
// fields: foto (single, opsional), dokumen (multiple, opsional — append)
// body: nama, nip, prefix, kode, jabatan, departemen
// ---------------------------------------------------------------------------
async function updatePegawai(req, res) {
  try {
    const { id } = req.params;
    const { nama, nip, prefix, kode, jabatan, departemen } = req.body;

    const existing = await prisma.pegawai.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Pegawai tidak ditemukan." });

    const fotoFile = req.files?.foto?.[0];
    const dokumenFiles = req.files?.dokumen ?? [];

    // Hapus foto lama kalau ada foto baru
    if (fotoFile && existing.fotoKey) {
      deleteFile(`uploads/pegawai/${existing.fotoKey}`);
    }

    const pegawai = await prisma.pegawai.update({
      where: { id },
      data: {
        ...(nama && { nama }),
        ...(nip !== undefined && { nip: nip || null }),
        ...(prefix !== undefined && { prefix: prefix || null }),
        ...(kode !== undefined && { kode: kode || null }),
        ...(jabatan !== undefined && { jabatan: jabatan || null }),
        ...(departemen !== undefined && { departemen: departemen || null }),
        ...(fotoFile && {
          fotoUrl: `uploads/pegawai/${fotoFile.filename}`,
          fotoKey: fotoFile.filename,
        }),
        ...(dokumenFiles.length > 0 && {
          dokumen: {
            create: dokumenFiles.map((f) => ({
              nama: f.originalname,
              url: `uploads/pegawai/${f.filename}`,
              key: f.filename,
            })),
          },
        }),
      },
      include: { dokumen: true },
    });

    return res.json({ message: "Pegawai berhasil diupdate.", data: pegawai });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "NIP sudah digunakan." });
    }
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 4. GET LIST (pagination + search)
// GET /pegawai?page=1&limit=10&search=xxx
// search by: nama, nip, jabatan
// ---------------------------------------------------------------------------
async function getListPegawai(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nama: { contains: search, mode: "insensitive" } },
            { nip: { contains: search, mode: "insensitive" } },
            { jabatan: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.pegawai.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nama: "asc" },
        select: {
          id: true,
          nama: true,
          nip: true,
          prefix: true,
          kode: true,
          jabatan: true,
          departemen: true,
          fotoUrl: true,
          user: {
            select: { role: true, email: true },
          },
        },
      }),
      prisma.pegawai.count({ where }),
    ]);

    return res.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 5. DELETE
// DELETE /pegawai/:id
// Hapus foto, dokumen, dan data pegawai
// ---------------------------------------------------------------------------
async function deletePegawai(req, res) {
  try {
    const { id } = req.params;

    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: { dokumen: true },
    });
    if (!pegawai)
      return res.status(404).json({ message: "Pegawai tidak ditemukan." });

    // Hapus file dari disk
    deleteFile(pegawai.fotoUrl);
    pegawai.dokumen.forEach((doc) => deleteFile(doc.url));

    // Prisma cascade hapus dokumen otomatis (onDelete: Cascade di schema)
    await prisma.pegawai.delete({ where: { id } });

    return res.json({ message: "Pegawai berhasil dihapus." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 6. RESET PASSWORD
// PATCH /pegawai/:id/reset-password
// body: newPassword
// ---------------------------------------------------------------------------
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter." });
    }

    const user = await prisma.user.findUnique({ where: { pegawaiId: id } });
    if (!user)
      return res
        .status(404)
        .json({ message: "User tidak ditemukan untuk pegawai ini." });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return res.json({ message: "Password berhasil direset." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 7. RESET DEVICE
// PATCH /pegawai/:id/reset-device
// Hapus semua trusted device milik user pegawai ini
// ---------------------------------------------------------------------------
async function resetDevice(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { pegawaiId: id } });
    if (!user)
      return res
        .status(404)
        .json({ message: "User tidak ditemukan untuk pegawai ini." });

    await prisma.deviceTrusted.deleteMany({ where: { userId: user.id } });

    return res.json({ message: "Semua device berhasil direset." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

// ---------------------------------------------------------------------------
// 8. DELETE DOKUMEN (bonus — hapus satu dokumen by id)
// DELETE /pegawai/dokumen/:dokumenId
// ---------------------------------------------------------------------------
async function deleteDokumen(req, res) {
  try {
    const { dokumenId } = req.params;

    const doc = await prisma.dokumenPegawai.findUnique({
      where: { id: dokumenId },
    });
    if (!doc)
      return res.status(404).json({ message: "Dokumen tidak ditemukan." });

    deleteFile(doc.url);
    await prisma.dokumenPegawai.delete({ where: { id: dokumenId } });

    return res.json({ message: "Dokumen berhasil dihapus." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
}

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
