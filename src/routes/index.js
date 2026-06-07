const express = require("express");

const userRoutes = require("./user.routes");
const databaseRoutes = require("./perusahaan.routes");
const trainingRoutes = require("./training.routes");
const inputRoutes = require("./input.routes");

const router = express.Router();

router.use("/user", userRoutes);
router.use("/training", trainingRoutes);
router.use("/database", databaseRoutes);
router.use("/input", inputRoutes);

module.exports = router;
