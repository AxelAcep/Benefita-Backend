const express = require("express");
const router = express.Router();
const {
  getTabPerusahaanList,
  createPerusahaan,
  updatePerusahaan,
  getOnePerusahaan,
  getContactPersonList,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
  getOneContactPerson,
  getDailyActivityList,
  getOneDailyActivity,
  createDailyActivity,
  updateDailyActivity,
  deleteDailyActivity,
  getHakAksesPerusahaan,
  editHakAksesPerusahaan,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");

// Route tanpa parameter
router.get("/perusahaan", authMiddleware, getTabPerusahaanList);
router.post("/perusahaan", authMiddleware, createPerusahaan);

// Route spesifik harus didefinisikan sebelum route dengan parameter dinamis
router.get(
  "/perusahaan/:perusahaanId/hak-akses",
  authMiddleware,
  getHakAksesPerusahaan,
);
router.put("/perusahaan/hak-akses", authMiddleware, editHakAksesPerusahaan);

// Route dengan parameter dinamis
router.get("/perusahaan/:noInduk", authMiddleware, getOnePerusahaan);
router.put("/perusahaan/:noInduk", authMiddleware, updatePerusahaan);

router.get(
  "/perusahaan/:noInduk/contact-person",
  authMiddleware,
  getContactPersonList,
);
router.get(
  "/perusahaan/:noInduk/contact-person/:kode",
  authMiddleware,
  getOneContactPerson,
);
router.post(
  "/perusahaan/:noInduk/contact-person",
  authMiddleware,
  createContactPerson,
);
router.put(
  "/perusahaan/:noInduk/contact-person/:kode",
  authMiddleware,
  updateContactPerson,
);
router.delete(
  "/perusahaan/:noInduk/contact-person/:kode",
  authMiddleware,
  deleteContactPerson,
);

router.get(
  "/perusahaan/:noInduk/daily-activity",
  authMiddleware,
  getDailyActivityList,
);
router.get(
  "/perusahaan/:noInduk/daily-activity/:id",
  authMiddleware,
  getOneDailyActivity,
);
router.post(
  "/perusahaan/:noInduk/daily-activity",
  authMiddleware,
  createDailyActivity,
);
router.put(
  "/perusahaan/:noInduk/daily-activity/:id",
  authMiddleware,
  updateDailyActivity,
);
router.delete(
  "/perusahaan/:noInduk/daily-activity/:id",
  authMiddleware,
  deleteDailyActivity,
);

module.exports = router;
