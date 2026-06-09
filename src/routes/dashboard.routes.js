const express = require("express");
const router = express.Router();
const { getMarketingActivity, getKehadiran } = require("../controllers");
const { authenticate } = require("../middlewares/auth.middleware");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/marketing-activity", authMiddleware, getMarketingActivity);
router.get("/kehadiran", authMiddleware, getKehadiran);

module.exports = router;
