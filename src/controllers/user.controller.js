const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOTP } = require("../middlewares/whatsapp.middleware");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Buat access token — short-lived (15 menit)
 */
const createAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "15m" });

/**
 * Buat refresh token — random string, simpan ke DB
 */
const createRefreshToken = async (userId, deviceHash) => {
  const token = crypto.randomBytes(64).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari

  await prisma.refreshToken.create({
    data: { token, userId, deviceHash, expiresAt },
  });

  return token;
};

/**
 * Set refresh token sebagai httpOnly cookie
 */
const setRefreshCookie = (res, token) => {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari dalam ms
    path: "/api/user/refresh", // cookie hanya dikirim ke endpoint ini saja
  });
};

const createAndSendOTP = async (userId, phone, deviceHash) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentOtpCount = await prisma.otpCode.count({
    where: { userId, deviceHash, createdAt: { gt: tenMinutesAgo } },
  });

  if (recentOtpCount >= 3) {
    throw {
      status: 429,
      message: "Terlalu banyak permintaan OTP. Coba lagi 10 menit lagi.",
    };
  }

  await prisma.otpCode.deleteMany({
    where: { userId, deviceHash, used: false },
  });

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.create({
    data: { userId, code, deviceHash, expiresAt },
  });

  await sendOTP(phone, code);
};

// ─────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────

const createUser = async (req, res) => {
  try {
    const { phone, email, password, role, nama, jabatan, departemen } =
      req.body;

    if (
      (!email || !phone || !password || !role || !nama || !jabatan, !departemen)
    ) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email atau nomor sudah digunakan" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        phone,
        email,
        password: hashedPassword,
        role,
        pegawai: {
          create: {
            nama,
            jabatan,
            Departemen: departemen, // ← pindah ke sini
          },
        },
      },
      include: { pegawai: true },
    });

    res.status(201).json({ message: "User berhasil dibuat", data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Login — flow tidak berubah.
 * Bedanya: kalau device trusted, sekarang return access token (15m)
 * + set refresh token via httpOnly cookie.
 */
const login = async (req, res) => {
  try {
    const { email, password, deviceHash, deviceLabel } = req.body;

    if (!email || !password || !deviceHash) {
      return res
        .status(400)
        .json({ message: "email, password, dan deviceHash wajib diisi." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { pegawai: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const trustedDevice = await prisma.deviceTrusted.findUnique({
      where: { userId_deviceHash: { userId: user.id, deviceHash } },
    });

    if (trustedDevice) {
      const accessToken = createAccessToken(user.id, user.role);
      const refreshToken = await createRefreshToken(user.id, deviceHash);
      setRefreshCookie(res, refreshToken);

      return res.status(200).json({
        requireOtp: false,
        message: "Login berhasil.",
        token: accessToken,
        user: {
          id: user.id,
          nama: user.pegawai.nama,
          email: user.email,
          role: user.role,
        },
      });
    }

    // Device baru → OTP (tidak berubah)
    await createAndSendOTP(user.id, user.phone, deviceHash);

    return res.status(200).json({
      requireOtp: true,
      message:
        "Device baru terdeteksi. Kode OTP telah dikirim ke WhatsApp kamu.",
    });
  } catch (err) {
    if (err.status === 429) {
      return res.status(429).json({ message: err.message });
    }
    console.error("[login error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

/**
 * Verify OTP — flow tidak berubah.
 * Bedanya: sekarang juga set refresh token via httpOnly cookie.
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, code, deviceHash, deviceLabel } = req.body;

    if (!email || !code || !deviceHash) {
      return res
        .status(400)
        .json({ message: "email, code, dan deviceHash wajib diisi." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { pegawai: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        deviceHash,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return res
        .status(400)
        .json({ message: "OTP tidak valid atau sudah kadaluarsa." });
    }

    await prisma.$transaction([
      prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } }),
      prisma.deviceTrusted.create({
        data: {
          userId: user.id,
          deviceHash,
          label: deviceLabel || "Unknown Device",
        },
      }),
    ]);

    const accessToken = createAccessToken(user.id, user.role);
    const refreshToken = await createRefreshToken(user.id, deviceHash);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      message: "Verifikasi berhasil. Login sukses!",
      token: accessToken,
      user: {
        id: user.id,
        nama: user.pegawai.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[verifyOtp error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

/**
 * Refresh — tukar refresh token (dari cookie) dengan access token baru.
 * Refresh token lama dihapus dan diganti baru (rotation).
 */
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Refresh token tidak ditemukan." });
    }

    // Cari di DB
    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: { pegawai: true }, // ← tambah ini
        },
      },
    });

    if (!stored) {
      return res.status(401).json({ message: "Refresh token tidak valid." });
    }

    if (stored.expiresAt < new Date()) {
      // Sudah expired, hapus dari DB + clear cookie
      await prisma.refreshToken.delete({ where: { token } });
      res.clearCookie("refresh_token", { path: "/api/user/refresh" });
      return res.status(401).json({
        message: "Refresh token sudah kadaluarsa. Silakan login ulang.",
      });
    }

    // Rotation: hapus token lama, buat yang baru
    await prisma.refreshToken.delete({ where: { token } });

    const newAccessToken = createAccessToken(stored.user.id, stored.user.role);
    const newRefreshToken = await createRefreshToken(
      stored.user.id,
      stored.deviceHash,
    );
    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      token: newAccessToken,
      user: {
        // ← tambah ini
        id: stored.user.id,
        nama: stored.user.pegawai.nama,
        email: stored.user.email,
        role: stored.user.role,
      },
    });
  } catch (err) {
    console.error("[refresh error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

/**
 * Logout — hapus refresh token dari DB + clear cookie.
 */
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    // Hapus cookie dengan path yang sama saat di-set
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/user/refresh",
    });

    return res.status(200).json({ message: "Logout berhasil." });
  } catch (err) {
    console.error("[logout error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getPegawaiDropdown = async (req, res) => {
  try {
    // Query ke database untuk mendapatkan pegawai dengan departemen "Marketing & Sales"
    const pegawai = await prisma.pegawai.findMany({
      where: {
        Departemen: "Marketing & Sales",
      },
      select: {
        id: true,
        nama: true,
        prefix: true,
        kode: true,
      },
    });

    // Jika tidak ada data, kembalikan response kosong
    if (!pegawai || pegawai.length === 0) {
      return res.status(404).json({
        message: "Tidak ada pegawai di departemen Marketing & Sales.",
        data: [],
      });
    }

    // Kembalikan data pegawai
    return res.status(200).json({
      message: "Berhasil mendapatkan data pegawai.",
      data: pegawai,
    });
  } catch (error) {
    console.error("[getPegawaiDropdown error]", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pegawai.",
    });
  }
};

const getUser = async (req, res) => {
  try {
    // Mengambil id User dari req.params (sesuaikan dengan routing lu, misal: /user/:id)
    const { id } = req.params;

    // Query ke database untuk mendapatkan data User beserta relasi Pegawai
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        pegawai: true, // Menarik semua data dari model Pegawai yang berelasi
      },
    });

    // Jika user tidak ditemukan, kembalikan response 404
    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan.",
        data: null,
      });
    }

    // Demi keamanan, kita pisahkan password agar tidak ikut terkirim ke frontend
    const { password, ...userWithoutPassword } = user;

    // Kembalikan data user dan pegawai
    return res.status(200).json({
      message: "Berhasil mendapatkan data user dan pegawai.",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("[getUser error]", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data user.",
    });
  }
};

module.exports = {
  createUser,
  login,
  verifyOtp,
  refresh,
  logout,
  getPegawaiDropdown,
  getUser,
};
