// Helper generate PDF laporan keuangan (Laba Rugi, Neraca, Buku Besar,
// Kas & Bank) pakai pdfkit — layout tabel rapi, header perusahaan, mirip
// gaya laporan keuangan asli (PT. BENEFITA INDONESIA) tapi lebih bersih.
const PDFDocument = require("pdfkit");

const COMPANY_NAME = "PT. BENEFITA INDONESIA";
const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 portrait, pt

function formatRupiah(val) {
  const num = Number(val) || 0;
  const abs = Math.abs(num).toLocaleString("id-ID");
  return num < 0 ? `(Rp${abs})` : `Rp${abs}`;
}

function formatTanggal(val) {
  // timeZone: "UTC" wajib — tanggal di sini representasi kalender murni
  // (bukan momen waktu), kalau dirender pakai TZ lokal server (mis. WIB
  // UTC+7) tanggal 23:59:59Z bisa "lompat" ke hari berikutnya.
  return new Date(val).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function newDocument() {
  return new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
}

function documentHeader(doc, { title, subtitle }) {
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#18181b").text(COMPANY_NAME, { align: "center" });
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#3f3f46").text(title.toUpperCase(), { align: "center" });
  if (subtitle) {
    doc.font("Helvetica").fontSize(9).fillColor("#71717a").text(subtitle, { align: "center" });
  }
  doc.moveDown(1);
}

/**
 * Gambar 1 tabel sederhana. `columns`: [{ label, width, align }],
 * `rows`: array of { cells: [string,...], bold?, fillColor?, indent? }.
 * Mengembalikan Y setelah tabel digambar (buat lanjutan konten).
 */
function drawTable(doc, { columns, rows, startY }) {
  const startX = MARGIN;
  const rowHeight = 16;
  const headerHeight = 18;
  let y = startY ?? doc.y;

  function colX(index) {
    let x = startX;
    for (let i = 0; i < index; i++) x += columns[i].width;
    return x;
  }
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);

  function ensureSpace(height) {
    if (y + height > doc.page.height - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // Header
  ensureSpace(headerHeight);
  doc.rect(startX, y, tableWidth, headerHeight).fill("#f4f4f5");
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#52525b");
  columns.forEach((col, i) => {
    doc.text(col.label, colX(i) + 4, y + 5, { width: col.width - 8, align: col.align || "left" });
  });
  y += headerHeight;

  // Rows
  for (const row of rows) {
    ensureSpace(rowHeight);
    if (row.fillColor) {
      doc.rect(startX, y, tableWidth, rowHeight).fill(row.fillColor);
    }
    doc.font(row.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor(row.textColor || "#27272a");
    row.cells.forEach((cell, i) => {
      const indent = i === 0 ? (row.indent || 0) : 0;
      doc.text(String(cell ?? ""), colX(i) + 4 + indent, y + 4, {
        width: columns[i].width - 8 - indent,
        align: columns[i].align || "left",
      });
    });
    y += rowHeight;
  }

  doc.y = y + 8;
  return y;
}

function footer(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Nulin margin bottom sementara — nulis teks deket banget ke tepi
    // bawah halaman bikin pdfkit ngira kontennya overflow & auto nambah
    // halaman kosong baru buat "lanjutan" yang sebenarnya gak ada.
    const originalBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#a1a1aa")
      .text(
        `Dicetak ${formatTanggal(new Date())} — Halaman ${i + 1} dari ${range.count}`,
        MARGIN,
        doc.page.height - 25,
        { width: PAGE_WIDTH - MARGIN * 2, align: "center", lineBreak: false },
      );
    doc.page.margins.bottom = originalBottom;
  }
}

module.exports = { newDocument, documentHeader, drawTable, footer, formatRupiah, formatTanggal, MARGIN };
