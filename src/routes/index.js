const express = require("express");

const userRoutes = require("./user.routes");
const databaseRoutes = require("./perusahaan.routes");
const trainingRoutes = require("./training.routes");
const inputRoutes = require("./input.routes");
const pegawaiRoutes = require("./pegawai.routes");
const cutiRoutes = require("./cuti.routes");
const beritaRoutes = require("./berita.routes");
const suratRoutes = require("./surat.routes");
const dashboardRoutes = require("./dashboard.routes");
const accountingRoutes = require("./accounting.routes");
const publicRoutes = require("./public.routes");
const konfirmasiRoutes = require("./konfirmasi.routes");
const lspRoutes = require("./lsp.routes");
const jurnalRoutes = require("./jurnal.routes");

const router = express.Router();

router.use("/user", userRoutes);
router.use("/training", trainingRoutes);
router.use("/database", databaseRoutes);
router.use("/input", inputRoutes);
router.use("/pegawai", pegawaiRoutes);
router.use("/cuti", cutiRoutes);
router.use("/berita", beritaRoutes);
router.use("/permintaan-surat", suratRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/accounting", accountingRoutes);
router.use("/public", publicRoutes);
router.use("/konfirmasi", konfirmasiRoutes);
router.use("/lsp", lspRoutes);
router.use("/jurnal", jurnalRoutes);

module.exports = router;
