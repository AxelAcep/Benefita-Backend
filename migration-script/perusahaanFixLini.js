const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// MAPPING: kode prefix teks (bukan angka) -> nama di master lini_bisnis
// Sesuai kesepakatan dari hasil audit data lama.
// ─────────────────────────────────────────────
const TEXT_PREFIX_MAP = {
  LOGISTIK: "Logistik (Gudang)",
  MANUFAKTUR: "Manufacturing",
  TEKSTIL: "Tekstil",
  ENERGI: "Energi",
  IT: "IT",
};

// Prefix yang diawali "KAWASAN" (ada spasi ganda di data asli: "Kawasan  : Kawasan Industri")
const KAWASAN_TARGET_NAMA = "Trading - Mall - Kawasan";

function safeUpdatedAt() {
  return new Date();
}

// ─────────────────────────────────────────────
// Parse satu value lineOfBusiness mentah
// Return: { liniBisnisId: number|null, liniBisnisNote: string|null, unmatchedReason?: string }
// ─────────────────────────────────────────────
function parseLineOfBusiness(raw, nameToId) {
  if (!raw || !raw.trim()) {
    return { liniBisnisId: null, liniBisnisNote: null };
  }

  const trimmed = raw.trim();

  // Kasus: string dimulai dengan ":" -> tidak ada kode sama sekali
  if (trimmed.startsWith(":")) {
    const note = trimmed.slice(1).trim();
    return {
      liniBisnisId: null,
      liniBisnisNote: note || null,
    };
  }

  // Split by ":" pertama -> kiri = kode(+skala), kanan = keterangan
  const colonIdx = trimmed.indexOf(":");
  const leftPart = colonIdx === -1 ? trimmed : trimmed.slice(0, colonIdx);
  const rightPart = colonIdx === -1 ? "" : trimmed.slice(colonIdx + 1).trim();

  // Ambil kode di paling depan (sebelum "-" atau ";" pertama)
  const codeMatch = leftPart.trim().match(/^([^-;]+)/);
  const rawCode = codeMatch ? codeMatch[1].trim() : leftPart.trim();

  // Sisa left part setelah kode (misal "; skala B") digabung ke note
  const leftRemainder = leftPart.trim().slice(rawCode.length).trim();

  const noteParts = [];
  if (leftRemainder) noteParts.push(leftRemainder.replace(/^[-;]\s*/, ""));
  if (rightPart) noteParts.push(rightPart);
  const note = noteParts.join(" : ").trim() || null;

  // 1. Prefix angka murni -> langsung id
  if (/^\d+$/.test(rawCode)) {
    const id = parseInt(rawCode, 10);
    return { liniBisnisId: id, liniBisnisNote: note, _needVerifyId: id };
  }

  // 2. Prefix diawali "RS" (RS, RSU, RSUD, RSJ, RSIA, RSAB, dst) -> Rumah Sakit
  if (/^RS/i.test(rawCode)) {
    const id = nameToId.get("RUMAH SAKIT");
    return { liniBisnisId: id ?? null, liniBisnisNote: note };
  }

  // 3. Prefix "Kawasan..." -> Trading - Mall - Kawasan
  if (/^KAWASAN/i.test(rawCode)) {
    const id = nameToId.get(KAWASAN_TARGET_NAMA.toUpperCase().trim());
    return { liniBisnisId: id ?? null, liniBisnisNote: note };
  }

  // 4. Mapping teks manual (Logistik, Manufaktur, Tekstil, Energi, IT)
  const upperCode = rawCode.toUpperCase();
  if (TEXT_PREFIX_MAP[upperCode]) {
    const targetNama = TEXT_PREFIX_MAP[upperCode];
    const id = nameToId.get(targetNama.toUpperCase().trim());
    return { liniBisnisId: id ?? null, liniBisnisNote: note };
  }

  // 5. Tidak dikenali sama sekali -> unmatched
  return {
    liniBisnisId: null,
    liniBisnisNote: note,
    unmatchedReason: `Prefix tidak dikenali: "${rawCode}"`,
  };
}

async function main() {
  console.log("Loading master lini_bisnis...");
  const master = await prisma.liniBisnis.findMany({
    select: { id: true, nama: true },
  });

  const nameToId = new Map(
    master.map((m) => [m.nama.toUpperCase().trim(), m.id]),
  );
  const validIds = new Set(master.map((m) => m.id));

  console.log(`Master lini_bisnis: ${master.length} entries`);
  console.log(
    "Preview mapping RS ->",
    nameToId.get("RUMAH SAKIT"),
    "| Energi ->",
    nameToId.get("ENERGI"),
    "| IT ->",
    nameToId.get("IT"),
  );

  if (!nameToId.get("RUMAH SAKIT")) {
    console.error(
      "❌ 'Rumah Sakit' tidak ditemukan di master lini_bisnis. Cek nama persis (trailing space dll). Stop.",
    );
    process.exit(1);
  }
  if (!nameToId.get("ENERGI") || !nameToId.get("IT")) {
    console.error(
      "❌ 'Energi' atau 'IT' belum ada di master lini_bisnis. Pastikan sudah di-insert dulu. Stop.",
    );
    process.exit(1);
  }

  console.log("Fetching TabPerusahaan rows with lineOfBusiness...");
  const rows = await prisma.tabPerusahaan.findMany({
    where: { lineOfBusiness: { not: null } },
    select: { noInduk: true, company: true, lineOfBusiness: true },
  });
  console.log(`Found ${rows.length} rows to process.`);

  const unmatchedLog = [];
  let updatedCount = 0;
  const updatedNoInduk = [];

  for (const row of rows) {
    const result = parseLineOfBusiness(row.lineOfBusiness, nameToId);

    // Kalau prefix angka tapi id-nya tidak ada di master (data lama nyimpang), treat unmatched
    if (
      result._needVerifyId !== undefined &&
      !validIds.has(result._needVerifyId)
    ) {
      unmatchedLog.push({
        noInduk: row.noInduk,
        company: row.company,
        rawValue: row.lineOfBusiness,
        reason: `Kode angka "${result._needVerifyId}" tidak ada di master lini_bisnis`,
      });
      result.liniBisnisId = null;
    }

    if (result.unmatchedReason) {
      unmatchedLog.push({
        noInduk: row.noInduk,
        company: row.company,
        rawValue: row.lineOfBusiness,
        reason: result.unmatchedReason,
      });
    }

    try {
      await prisma.tabPerusahaan.update({
        where: { noInduk: row.noInduk },
        data: {
          liniBisnisId: result.liniBisnisId,
          liniBisnisNote: result.liniBisnisNote,
        },
      });
      updatedNoInduk.push(row.noInduk);
      updatedCount++;
    } catch (err) {
      console.error(`❌ Failed update ${row.noInduk}: ${err.message}`);
      console.log(`🧹 Rolling back ${updatedNoInduk.length} updates...`);
      for (const noInduk of updatedNoInduk) {
        await prisma.tabPerusahaan.update({
          where: { noInduk },
          data: { liniBisnisId: null, liniBisnisNote: null },
        });
      }
      console.log("Rollback done. Migration stopped.");
      process.exit(1);
    }
  }

  console.log(`\n✅ Migration done! Updated: ${updatedCount} rows.`);
  console.log(
    `⚠️ Unmatched (liniBisnisId = NULL, note tetap tersimpan): ${unmatchedLog.length}`,
  );

  if (unmatchedLog.length > 0) {
    const fs = require("fs");
    fs.writeFileSync(
      "unmatched-perusahaan-lini-bisnis.json",
      JSON.stringify(unmatchedLog, null, 2),
    );
    console.log(
      "Detail unmatched disimpan di: unmatched-perusahaan-lini-bisnis.json",
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
