const express = require("express");

const userRoutes = require("./user.routes");
const databaseRoutes = require("./perusahaan.routes");
const trainingRoutes = require("./training.routes");

const router = express.Router();

router.use("/user", userRoutes);
router.use("/training", trainingRoutes);
router.use("/database", databaseRoutes);

module.exports = router;
