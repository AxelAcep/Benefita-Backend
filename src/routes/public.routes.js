const express = require("express");
const router = express.Router();
const {
  searchPerusahaanPublic,
  getJadwalPesertaPublic,
  getEvaluasiContext,
  getJudulTrainingOptions,
  createEvaluasiPelatihan,
} = require("../controllers");

// Prefix "/api/public" — khusus endpoint yang memang harus bisa diakses
// TANPA auth (dipakai halaman public seperti /biodata/[id]). Sengaja TIDAK
// pakai authMiddleware sama sekali di sini.
router.get("/perusahaan", searchPerusahaanPublic);
router.get("/jadwal/:noJadwal/peserta-links", getJadwalPesertaPublic);
router.get("/evaluasi/judul-training", getJudulTrainingOptions); // spesifik dulu
router.get("/evaluasi/:id", getEvaluasiContext); // dynamic belakangan
router.post("/evaluasi/:id", createEvaluasiPelatihan);

module.exports = router;
