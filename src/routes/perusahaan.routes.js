const express = require("express");
const router = express.Router();
const {
  getTabPerusahaanList,
  createTabPerusahaan,
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
  getLogPerusahaan,
  createPosPerusahaan,
  getPosPerusahaan,
  updatePosPerusahaan,
  deletePosPerusahaan,
  createPenawaran,
  updatePenawaran,
  deletePenawaran,
  getPenawaranById,
  getPenawaran,
  createPermohonanHakAkses,
  updateStatusPermohonan,
  getPermohonanHakAkses,
  getLogPerubahanSummary,
  getProperByTahun,
  getLiniBisnis,
  getPerusahaanTbkList,
  getPerusahaanProperList,
  getPerusahaanIsoList,
  getPerusahaanPrioritasList,
  getPerusahaanVendorList,
  getPerusahaanByAlamatList,
  getPelatihanTahunOptions,
  getPerusahaanCustomerList,
} = require("../controllers");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

// Route tanpa parameter
router.get("/perusahaan", authMiddleware, getTabPerusahaanList);
router.post("/perusahaan", authMiddleware, createTabPerusahaan);

// Daftar perusahaan Tbk (kategoriCpn mengandung "Tbk")
router.get("/perusahaan-tbk", authMiddleware, getPerusahaanTbkList);

// Daftar perusahaan yang punya riwayat rating PROPER
router.get("/perusahaan-proper", authMiddleware, getPerusahaanProperList);

// Daftar perusahaan yang kategoriCpn-nya mengandung "ISO"
router.get("/perusahaan-iso", authMiddleware, getPerusahaanIsoList);

// Daftar perusahaan by Prioritas MA / Prioritas AE (rentang huruf A–E)
router.get("/perusahaan-prioritas", authMiddleware, getPerusahaanPrioritasList);

// Daftar perusahaan yang field vendor-nya keisi (bukan null/kosong)
router.get("/perusahaan-vendor", authMiddleware, getPerusahaanVendorList);

// Daftar semua perusahaan diurutkan berdasarkan alamat
router.get(
  "/perusahaan-by-alamat",
  authMiddleware,
  getPerusahaanByAlamatList,
);

// Daftar semua perusahaan (Customer) — riwayat pelatihan pertama/terakhir,
// PROPER, PIC ENV/CSR/TSM/EPM
router.get(
  "/pelatihan-tahun-options",
  authMiddleware,
  getPelatihanTahunOptions,
);
router.get(
  "/perusahaan-customer",
  authMiddleware,
  getPerusahaanCustomerList,
);

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
router.get("/perusahaan/:perusahaanId/logs", authMiddleware, getLogPerusahaan);

router.post("/perusahaan/pos", authMiddleware, createPosPerusahaan);
router.get("/perusahaan/pos/:idPerusahaan", authMiddleware, getPosPerusahaan);
router.put(
  "/perusahaan/pos/:idPerusahaan",
  authMiddleware,
  updatePosPerusahaan,
);
router.delete("/perusahaan/pos", authMiddleware, deletePosPerusahaan);

router.post(
  "/penawaran",
  authMiddleware,
  upload.single("file"),
  createPenawaran,
);
router.get("/penawaran/:perusahaanId", authMiddleware, getPenawaran);
router.get("/penawaran/:id", authMiddleware, getPenawaranById);
router.put(
  "/penawaran/:id",
  authMiddleware,
  upload.single("file"),
  updatePenawaran,
);
router.delete("/penawaran/:id", authMiddleware, deletePenawaran);

router.post("/permohonan-hak-akses", authMiddleware, createPermohonanHakAkses);
router.get("/permohonan-hak-akses", authMiddleware, getPermohonanHakAkses);
router.patch(
  "/permohonan-hak-akses/:id/status",
  authMiddleware,
  updateStatusPermohonan,
);

router.get("/perubahan-summary", authMiddleware, getLogPerubahanSummary);

router.get("/proper-list", authMiddleware, getProperByTahun);

router.get("/lini-bisnis", authMiddleware, getLiniBisnis);

module.exports = router;
