// routes/izin.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/auth.middleware");

const {
  getPendapatan,
  getPiutang,
  getDetailPiutang,
} = require("../controllers");

router.get("/pendapatan", authMiddleware, getPendapatan);
router.get("/piutang", authMiddleware, getPiutang);
router.get("/piutang/:noJadwal/detail", authMiddleware, getDetailPiutang);

module.exports = router;
