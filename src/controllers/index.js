const userControllers = require("./user.controller");
const perusahaanControllers = require("./perusahaan.controller");

module.exports = {
  ...userControllers,
  ...perusahaanControllers,
};
