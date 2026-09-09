// routes/izin.js
const express = require("express");
const router = express.Router();
const { authMiddleware, authorizeRole } = require("../middlewares/auth.middleware");
const { uploadRequestKeuangan } = require("../middlewares/upload.middleware");

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
  getUmk,
  createUmk,
  updateUmk,
  getUmkById,
  getPegawaiUmk,

  createAkun,
  getAkunList,
  getAkunById,
  updateAkun,
  toggleAkunStatus,

  createRequestKeuangan,
  getRequestKeuanganList,
  getRequestKeuanganById,
  approveRequestKeuangan,
  rejectRequestKeuangan,
} = require("../controllers");

// Role yang boleh approve/reject request keuangan — pakai role existing
// (FINANCE, SUPER_ADMIN), gak bikin role baru.
const APPROVER_ROLES = ["FINANCE", "SUPER_ADMIN"];

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

router.get("/umk", authMiddleware, getUmk);
router.post("/umk", authMiddleware, createUmk);
router.put("/umk/:id", authMiddleware, updateUmk);
router.get("/umk/:id", authMiddleware, getUmkById);
router.get("/pegawai", authMiddleware, getPegawaiUmk);

// Master Akun
router.post("/akun", authMiddleware, createAkun);
router.get("/akun", authMiddleware, getAkunList);
router.get("/akun/:id", authMiddleware, getAkunById);
router.put("/akun/:id", authMiddleware, updateAkun);
router.patch("/akun/:id/status", authMiddleware, toggleAkunStatus);

// Pengeluaran & Pemasukan
router.post(
  "/request-keuangan",
  authMiddleware,
  uploadRequestKeuangan.single("buktiFile"),
  createRequestKeuangan,
);
router.get("/request-keuangan", authMiddleware, getRequestKeuanganList);
router.get("/request-keuangan/:id", authMiddleware, getRequestKeuanganById);
router.patch(
  "/request-keuangan/:id/approve",
  authMiddleware,
  authorizeRole(...APPROVER_ROLES),
  approveRequestKeuangan,
);
router.patch(
  "/request-keuangan/:id/reject",
  authMiddleware,
  authorizeRole(...APPROVER_ROLES),
  rejectRequestKeuangan,
);

module.exports = router;
