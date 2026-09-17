const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRole } = require("../middlewares/auth.middleware");
const {
  createJurnal,
  getJurnalList,
  getJurnalById,

  getBukuBesarAkun,
  getBukuBesarRingkasan,
  getPeriodeList,
  tutupBuku,

  getLaporanLabaRugi,

  getNeracaSnapshot,

  getKasBank,
} = require("../controllers");

// Role yang boleh input jurnal & tutup buku — sama kayak approver
// RequestKeuangan (FINANCE, SUPER_ADMIN), gak bikin role baru.
const FINANCE_ROLES = ["FINANCE", "SUPER_ADMIN"];

// Fitur 2 — Jurnal Keuangan
router.post("/", authMiddleware, authorizeRole(...FINANCE_ROLES), createJurnal);
router.get("/", authMiddleware, getJurnalList);
router.get("/:id", authMiddleware, getJurnalById);

// Fitur 3 — Buku Besar & Tutup Buku
router.get("/buku-besar/ringkasan", authMiddleware, getBukuBesarRingkasan);
router.get("/buku-besar/akun/:akunId", authMiddleware, getBukuBesarAkun);
router.get("/periode", authMiddleware, getPeriodeList);
router.post("/tutup-buku", authMiddleware, authorizeRole(...FINANCE_ROLES), tutupBuku);

// Fitur 4 — Laba Rugi
router.get("/laporan/laba-rugi", authMiddleware, getLaporanLabaRugi);

// Fitur 5 — Neraca
router.get("/laporan/neraca", authMiddleware, getNeracaSnapshot);

// Fitur 6 — Kas & Bank
router.get("/kas-bank", authMiddleware, getKasBank);

module.exports = router;
