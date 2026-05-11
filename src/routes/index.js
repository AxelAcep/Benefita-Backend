const express = require("express");

const userRoutes = require("./user.routes");
const databaseRoutes = require("./perusahaan.routes");

const router = express.Router();

router.use("/user", userRoutes);
router.use("/database", databaseRoutes);

module.exports = router;
