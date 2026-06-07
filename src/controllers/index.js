const userControllers = require("./user.controller");
const perusahaanControllers = require("./perusahaan.controller");
const trainingControllers = require("./training.controller");
const inputControllers = require("./input.controller");

module.exports = {
  ...userControllers,
  ...perusahaanControllers,
  ...trainingControllers,
  ...inputControllers,
};
