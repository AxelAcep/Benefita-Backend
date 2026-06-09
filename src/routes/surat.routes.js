// routes/permintaanSurat.js
const express = require("express");
const router = express.Router();
const {
  createPermintaanSurat,
  updatePermintaanSurat,
  getListPermintaanSurat,
  getPermintaanSurat,
  deletePermintaanSurat,
} = require("../controllers");

router.post("/", createPermintaanSurat);
router.get("/", getListPermintaanSurat);
router.get("/:id", getPermintaanSurat);
router.put("/:id", updatePermintaanSurat);
router.delete("/:id", deletePermintaanSurat);

module.exports = router;
