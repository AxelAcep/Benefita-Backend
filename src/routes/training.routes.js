const express = require("express");
const router = express.Router();
const {
  createHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");

// Existing routes — tidak berubah
router.post("/hotel", authMiddleware, createHotel);
router.put("/hotel", authMiddleware, updateHotel);
router.get("/hotel", authMiddleware, getAllHotels);
router.get("/hotel/:id", authMiddleware, getHotelById);

module.exports = router;
