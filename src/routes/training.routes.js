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
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");

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

module.exports = router;
