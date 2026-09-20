const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRole } = require("../middlewares/auth.middleware");
const {
  createJurnal,
  getJurnalList,
  getJurnalById,

  getBukuBesarAkun,
  getBukuBesarRingkasan,

  getLaporanLabaRugi,

  getNeracaSnapshot,

  getKasBank,

  exportLabaRugiPdf,
  exportNeracaPdf,
  exportBukuBesarAkunPdf,
  exportKasBankPdf,
} = require("../controllers");

// Role yang boleh input jurnal — sama kayak approver RequestKeuangan
// (FINANCE, SUPER_ADMIN), gak bikin role baru.
const FINANCE_ROLES = ["FINANCE", "SUPER_ADMIN"];

// Fitur 2 — Jurnal Keuangan
router.post("/", authMiddleware, authorizeRole(...FINANCE_ROLES), createJurnal);
router.get("/", authMiddleware, getJurnalList);

// PENTING: semua route literal 1-segmen (kas-bank, dst) WAJIB didaftarin
// SEBELUM "/:id" — kalau kebalik, Express bakal treat "kas-bank" sebagai
// value :id (match pattern-nya sama, 1 segmen) dan salah manggil
// getJurnalById. Ini akar masalah "Kas & Bank kosong" yang dilaporkan user.

// Fitur 3 — Buku Besar (real-time, gak ada tutup buku)
router.get("/buku-besar/ringkasan", authMiddleware, getBukuBesarRingkasan);
router.get("/buku-besar/akun/:akunId", authMiddleware, getBukuBesarAkun);
router.get("/buku-besar/akun/:akunId/pdf", authMiddleware, exportBukuBesarAkunPdf);

// Fitur 4 — Laba Rugi
router.get("/laporan/laba-rugi", authMiddleware, getLaporanLabaRugi);
router.get("/laporan/laba-rugi/pdf", authMiddleware, exportLabaRugiPdf);

// Fitur 5 — Neraca
router.get("/laporan/neraca", authMiddleware, getNeracaSnapshot);
router.get("/laporan/neraca/pdf", authMiddleware, exportNeracaPdf);

// Fitur 6 — Kas & Bank
router.get("/kas-bank", authMiddleware, getKasBank);
router.get("/kas-bank/pdf", authMiddleware, exportKasBankPdf);

// Fitur 2 detail — WAJIB PALING BAWAH (single-segment catch-all by id)
router.get("/:id", authMiddleware, getJurnalById);

module.exports = router;
