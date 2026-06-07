const express = require("express");
const router = express.Router();
const {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,

  createTrainer,
  updateTrainer,
  getTrainerById,
  getTrainers,

  createPengajuan,
  updatePengajuan,
  getPengajuanById,
  getPengajuan,
  getListPerusahaan,

  createJudulTraining,
  getJudulTrainingById,
  updateJudulTraining,
  getJudulTraining,

  createJadwalTraining,
  updateJadwalTraining,
  getJadwalTraining,
  getJadwalTrainingById,
  deleteJadwalTraining,

  getJudulTrainingOptions,
  getTrainerOptions,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.get("/judul-training/list", getJudulTrainingOptions);
router.get("/trainer/list", getTrainerOptions); // ⚠️ harus di atas /:id

// Existing routes — tidak berubah
router.post("/hotel", authMiddleware, createHotel);
router.put("/hotel/:id", authMiddleware, updateHotel);
router.get("/hotel", authMiddleware, getAllHotels);
router.get("/hotel/:id", authMiddleware, getHotelById);

router.post("/trainer", authMiddleware, createTrainer);
router.put("/trainer/:id", authMiddleware, updateTrainer);
router.get("/trainer", authMiddleware, getTrainers);
router.get("/trainer/:id", authMiddleware, getTrainerById);

router.post("/pengajuan-judul", authMiddleware, createPengajuan);
router.put("/pengajuan-judul/:id", authMiddleware, updatePengajuan);
router.get("/pengajuan-judul", authMiddleware, getPengajuan);
router.get("/pengajuan-judul/:id", authMiddleware, getPengajuanById);

router.get("/perusahaan", authMiddleware, getListPerusahaan);

router.post(
  "/judul-training",
  authMiddleware,
  upload.single("brosur"),
  createJudulTraining,
);
router.put(
  "/judul-training/:id",
  authMiddleware,
  upload.single("brosur"),
  updateJudulTraining,
);
router.get("/judul-training", authMiddleware, getJudulTraining);
router.get("/judul-training/:id", authMiddleware, getJudulTrainingById);

router.get("/jadwal-training", authMiddleware, getJadwalTraining);
router.get("/jadwal-training/:id", authMiddleware, getJadwalTrainingById);
router.post(
  "/jadwal-training",
  authMiddleware,
  upload.single("fileAgenda"),
  createJadwalTraining,
);
router.put(
  "/jadwal-training/:noJadwal",
  authMiddleware,
  upload.single("fileAgenda"),
  updateJadwalTraining,
);
router.delete(
  "/jadwal-training/:noJadwal",
  authMiddleware,
  deleteJadwalTraining,
);

module.exports = router;
