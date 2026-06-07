const userControllers = require("./user.controller");
const perusahaanControllers = require("./perusahaan.controller");
const trainingControllers = require("./training.controller");

module.exports = {
  ...userControllers,
  ...perusahaanControllers,
  ...trainingControllers,
};
