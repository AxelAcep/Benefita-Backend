// routes/izin.js
const express = require("express");
const router = express.Router();

const {
  createBerita,
  getBeritaAktif,
  getAllBerita,
  updateBerita,
  getBeritaById,
} = require("../controllers");

router.post("/", createBerita);
router.get("/", getBeritaAktif);
router.get("/riwayat", getAllBerita);
router.get("/riwayat/:id", getBeritaById);
router.patch("/:id", updateBerita);

module.exports = router;
