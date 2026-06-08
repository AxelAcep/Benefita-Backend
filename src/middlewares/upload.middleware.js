// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

function createUpload(folder, allowedExt) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExt.includes(ext)) cb(null, true);
      else
        cb(
          new Error(
            `Format file tidak didukung. Diizinkan: ${allowedExt.join(", ")}`,
          ),
        );
    },
  });
}

// Existing — tidak berubah, controller lain aman
const upload = createUpload("uploads/penawaran", [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
]);

// Baru untuk pegawai (foto + dokumen)
const uploadPegawai = createUpload("uploads/pegawai", [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
]);

module.exports = { upload, uploadPegawai };
