const userControllers = require("./user.controller");
const perusahaanControllers = require("./perusahaan.controller");
const trainingControllers = require("./training.controller");
const inputControllers = require("./input.controller");
const pegawaiControllers = require("./pegawai.controller");

module.exports = {
  ...userControllers,
  ...perusahaanControllers,
  ...trainingControllers,
  ...inputControllers,
  ...pegawaiControllers,
};
