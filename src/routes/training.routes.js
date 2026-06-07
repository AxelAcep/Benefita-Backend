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

module.exports = router;
