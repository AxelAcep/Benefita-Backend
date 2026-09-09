const express = require("express");
const router = express.Router();
const {
  createTUK,
  getTUKList,
  getTUKById,
  updateTUK,
  deleteTUK,

  createAsesor,
  getAsesorList,
  getAsesorById,
  updateAsesor,
  deleteAsesor,

  getPesertaUjiList,
  getPesertaUjiById,
  updatePesertaUjiChecklist,

  assignPesertaUjiPelaksanaan,
  updatePesertaUjiHasil,

  getLaporanKlhk,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/tuk", authMiddleware, createTUK);
router.get("/tuk", authMiddleware, getTUKList);
router.get("/tuk/:id", authMiddleware, getTUKById);
router.put("/tuk/:id", authMiddleware, updateTUK);
router.delete("/tuk/:id", authMiddleware, deleteTUK);

router.post("/asesor", authMiddleware, createAsesor);
router.get("/asesor", authMiddleware, getAsesorList);
router.get("/asesor/:id", authMiddleware, getAsesorById);
router.put("/asesor/:id", authMiddleware, updateAsesor);
router.delete("/asesor/:id", authMiddleware, deleteAsesor);

router.get("/peserta-uji", authMiddleware, getPesertaUjiList);
router.get("/peserta-uji/:id", authMiddleware, getPesertaUjiById);
router.patch(
  "/peserta-uji/:id/checklist",
  authMiddleware,
  updatePesertaUjiChecklist,
);
router.patch(
  "/peserta-uji/:id/assign",
  authMiddleware,
  assignPesertaUjiPelaksanaan,
);
router.patch(
  "/peserta-uji/:id/hasil",
  authMiddleware,
  updatePesertaUjiHasil,
);

router.get("/laporan/klhk", authMiddleware, getLaporanKlhk);

module.exports = router;
