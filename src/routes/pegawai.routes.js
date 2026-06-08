// routes/pegawai.js
const express = require("express");
const router = express.Router();
const { uploadPegawai } = require("../middlewares/upload.middleware");
const {
  createPegawai,
  getPegawai,
  updatePegawai,
  getListPegawai,
  deletePegawai,
  resetPassword,
  resetDevice,
  deleteDokumen,
} = require("../controllers");

const multiUpload = uploadPegawai.fields([
  { name: "foto", maxCount: 1 },
  { name: "dokumen", maxCount: 10 },
]);

router.get("/", getListPegawai);
router.get("/:id", getPegawai);
router.post("/", multiUpload, createPegawai);
router.put("/:id", multiUpload, updatePegawai);
router.delete("/:id", deletePegawai);
router.patch("/:id/reset-password", resetPassword);
router.patch("/:id/reset-device", resetDevice);
router.delete("/dokumen/:dokumenId", deleteDokumen);

module.exports = router;
