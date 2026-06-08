// routes/izin.js
const express = require("express");
const router = express.Router();
const { uploadIzin } = require("../middlewares/upload.middleware");
const {
  createPengajuan,
  getListPengajuan,
  konfirmasiPengajuan,
  getDetailPengajuan,
  getRiwayatByPegawai,
  getRiwayatAll,
  getKaryawanCuti,
} = require("../controllers");

const buktiUpload = uploadIzin.array("bukti", 5);

router.post("/", buktiUpload, createPengajuan);
router.get("/", getListPengajuan);
router.get("/riwayat", getRiwayatAll);
router.get("/karyawan-cuti", getKaryawanCuti);
router.get("/riwayat/:pegawaiId", getRiwayatByPegawai);
router.get("/:id", getDetailPengajuan);
router.patch("/:id/konfirmasi", konfirmasiPengajuan);

module.exports = router;
