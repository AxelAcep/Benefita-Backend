const express = require("express");

const userRoutes = require("./user.routes");
const databaseRoutes = require("./perusahaan.routes");
const trainingRoutes = require("./training.routes");
const inputRoutes = require("./input.routes");
const pegawaiRoutes = require("./pegawai.routes");
const cutiRoutes = require("./cuti.routes");

const router = express.Router();

router.use("/user", userRoutes);
router.use("/training", trainingRoutes);
router.use("/database", databaseRoutes);
router.use("/input", inputRoutes);
router.use("/pegawai", pegawaiRoutes);
router.use("/cuti", cutiRoutes);

module.exports = router;
