const express = require("express");
const router = express.Router();
const {
  getPesertaTraining,
  updatePesertaTraining,
  createPesertaTraining,
  getPesertaTrainingById,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.get("/jadwal/:noJadwal/peserta", authMiddleware, getPesertaTraining);
router.get("/peserta/:id", authMiddleware, getPesertaTrainingById);
router.post(
  "/jadwal/:noJadwal/peserta",
  authMiddleware,
  upload.fields([
    { name: "fileBuktiPembayaran", maxCount: 1 },
    { name: "filePendaftaran", maxCount: 1 },
  ]),
  createPesertaTraining,
);
router.put(
  "/peserta/:id",
  authMiddleware,
  upload.fields([
    { name: "fileBuktiPembayaran", maxCount: 1 },
    { name: "filePendaftaran", maxCount: 1 },
  ]),
  updatePesertaTraining,
);

module.exports = router;
