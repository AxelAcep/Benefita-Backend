const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
/**
 * Middleware verifikasi JWT
 * Taruh di route yang butuh autentikasi
 */
const authMiddleware = async (req, res, next) => {
  // ← tambah async
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const user = await prisma.user.findUnique({
      // ← await sudah valid
      where: { id: decoded.userId },
      select: { pegawaiId: true },
    });
    req.user.pegawaiId = user?.pegawaiId || null;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token sudah kadaluarsa, silakan login ulang." });
    }
    return res.status(401).json({ message: "Token tidak valid." });
  }
};

/**
 * Middleware cek role tertentu
 * Contoh pakai: authorizeRole("SUPER_ADMIN", "FINANCE")
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Role tidak diizinkan." });
    }
    next();
  };
};

module.exports = { authMiddleware, authorizeRole };
