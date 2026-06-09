const express = require("express");
const router = express.Router();
const {
  getMarketingActivity,
  getKehadiran,
  getJadwalFix,
  getKalenderTraining,
} = require("../controllers");
const { authenticate } = require("../middlewares/auth.middleware");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/marketing-activity", authMiddleware, getMarketingActivity);
router.get("/kehadiran", authMiddleware, getKehadiran);
router.get("/jadwal-fix", authMiddleware, getJadwalFix);
router.get("/kalender-training", authMiddleware, getKalenderTraining);

module.exports = router;
