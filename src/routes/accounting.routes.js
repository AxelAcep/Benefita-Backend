// routes/izin.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");

const {
  getPendapatan,
  getPiutang,
  getDetailPiutang,
  createNeraca,
  getNeracaPagination,
  updateNeraca,
  deleteNeraca,
  getJenisBiaya,
  getLaporanHasilUsaha,
} = require("../controllers");

router.get("/pendapatan", authMiddleware, getPendapatan);
router.get("/piutang", authMiddleware, getPiutang);
router.get("/piutang/:noJadwal/detail", authMiddleware, getDetailPiutang);

router.post("/neraca", authMiddleware, createNeraca);
router.get("/neraca", authMiddleware, getNeracaPagination);
router.put("/neraca/:id", authMiddleware, updateNeraca);
router.delete("/neraca/:id", authMiddleware, deleteNeraca);

// routes/jenisBiaya.js
router.get("/jenis-biaya", authMiddleware, getJenisBiaya);

router.get("/laporan-hasil", authMiddleware, getLaporanHasilUsaha);

module.exports = router;
