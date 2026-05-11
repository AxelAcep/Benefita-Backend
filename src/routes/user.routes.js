const express = require("express");
const router = express.Router();
const {
  createUser,
  login,
  verifyOtp,
  refresh,
  logout,
  getPegawaiDropdown,
} = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

// Existing routes — tidak berubah
router.post("/register", createUser);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

// Endpoint baru
router.post("/refresh", refresh); // baca httpOnly cookie
router.post("/logout", logout); // hapus cookie + DB

router.get("/dropdown/sales", getPegawaiDropdown); // hapus cookie + DB

module.exports = router;
