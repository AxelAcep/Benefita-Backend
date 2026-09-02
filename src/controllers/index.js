const userControllers = require("./user.controller");
const perusahaanControllers = require("./perusahaan.controller");
const trainingControllers = require("./training.controller");
const inputControllers = require("./input.controller");
const pegawaiControllers = require("./pegawai.controller");
const cutiControllers = require("./cuti.controller");
const beritaControllers = require("./berita.controller");
const suratControllers = require("./surat.controller");
const dashboardControllers = require("./dashboard.controller");
const accountingControllers = require("./accounting.controller");
const publicControllers = require("./public.controller");
const konfirmasiControllers = require("./konfirmasi.controller");

module.exports = {
  ...userControllers,
  ...perusahaanControllers,
  ...trainingControllers,
  ...inputControllers,
  ...pegawaiControllers,
  ...cutiControllers,
  ...beritaControllers,
  ...suratControllers,
  ...dashboardControllers,
  ...accountingControllers,
  ...publicControllers,
  ...konfirmasiControllers,
};
