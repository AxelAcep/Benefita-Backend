// routes/konfirmasi.js
const express = require("express");
const router = express.Router();
const {
  createKonfirmasi,
  getListKonfirmasi,
  getKonfirmasiById,
  updateKonfirmasi,
  deleteKonfirmasi,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { uploadKonfirmasi } = require("../middlewares/upload.middleware");

router.post(
  "/",
  authMiddleware,
  uploadKonfirmasi.single("file"),
  createKonfirmasi,
);
router.get("/", authMiddleware, getListKonfirmasi);
router.get("/:id", authMiddleware, getKonfirmasiById);
router.put(
  "/:id",
  authMiddleware,
  uploadKonfirmasi.single("file"),
  updateKonfirmasi,
);
router.delete("/:id", authMiddleware, deleteKonfirmasi);

module.exports = router;
