const userControllers = require("./user.controller");
const perusahaanControllers = require("./perusahaan.controller");
const trainingControllers = require("./training.controller");
const inputControllers = require("./input.controller");
const pegawaiControllers = require("./pegawai.controller");
const cutiControllers = require("./cuti.controller");

module.exports = {
  ...userControllers,
  ...perusahaanControllers,
  ...trainingControllers,
  ...inputControllers,
  ...pegawaiControllers,
  ...cutiControllers,
};
