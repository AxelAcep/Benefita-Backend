const mysql = require("mysql2/promise");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const mysqlConfig = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "benefita",
};

// ─────────────────────────────────────────────
// HELPER: extract kode training dari 1 entry mentah
// Contoh:
//  "EMS-03 (2-0-06)-KONVERSI" -> ["EMS-03"]
//  "EM12 (EM-01, EM-02)"      -> ["EM-12", "EM-01", "EM-02"]
//  "HAZ"                      -> []            (tidak ada angka -> skip)
//  "tak terdeteksi"           -> []            (tidak ada angka -> skip)
//  "WM-01 (+)"                -> ["WM-01"]     (suffix (+) otomatis hilang)
//  "EM-02B"                   -> ["EM-02B"]    (huruf akhir tetap kepreserve)
// ─────────────────────────────────────────────
function extractKodeList(rawEntry) {
  if (!rawEntry) return [];
  const matches = rawEntry.match(/[A-Za-z]+-?\d+[A-Za-z]?/g) || [];
  return matches.map((m) => {
    let clean = m.toUpperCase();
    clean = clean.replace(/^([A-Z]+)(\d)/, "$1-$2"); // EM12 -> EM-12
    return clean;
  });
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);
  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM line_bisnis");
  console.log(`Found ${rows.length} rows. Migrating...`);

  // Cache semua kode judul_training yang ada, biar tidak query berulang-ulang
  const allTraining = await prisma.judulTraining.findMany({
    select: { id: true, kode: true },
  });
  const kodeToId = new Map(
    allTraining.map((t) => [t.kode.toUpperCase(), t.id]),
  );

  const createdLiniBisnisIds = [];
  const unmatchedLog = []; // { liniBisnis, rawEntry, extractedKode }

  for (const row of rows) {
    const namaLini = row["line_bisnis"];
    const kodePelRaw = row["kodePel"];

    if (!namaLini) {
      console.warn(`⚠️ Skipped row id=${row.id}, line_bisnis kosong`);
      continue;
    }

    try {
      // 1. Upsert LiniBisnis
      const liniBisnis = await prisma.liniBisnis.upsert({
        where: { nama: namaLini },
        update: {},
        create: { nama: namaLini },
      });
      createdLiniBisnisIds.push(liniBisnis.id);

      // 2. Split kodePel by ";", extract kode dari tiap entry
      const rawEntries = (kodePelRaw || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

      const matchedTrainingIds = new Set();

      for (const entry of rawEntries) {
        const kodeList = extractKodeList(entry);

        if (kodeList.length === 0) {
          unmatchedLog.push({
            liniBisnis: namaLini,
            rawEntry: entry,
            reason: "tidak ada kode terdeteksi (di-skip)",
          });
          continue;
        }

        for (const kode of kodeList) {
          const trainingId = kodeToId.get(kode);
          if (trainingId) {
            matchedTrainingIds.add(trainingId);
          } else {
            unmatchedLog.push({
              liniBisnis: namaLini,
              rawEntry: entry,
              extractedKode: kode,
              reason: "kode tidak ditemukan di judul_training",
            });
          }
        }
      }

      // 3. Insert relasi (skip duplikat pakai skipDuplicates)
      if (matchedTrainingIds.size > 0) {
        await prisma.liniBisnisTraining.createMany({
          data: [...matchedTrainingIds].map((judulTrainingId) => ({
            liniBisnisId: liniBisnis.id,
            judulTrainingId,
          })),
          skipDuplicates: true,
        });
      }

      console.log(
        `✅ ${namaLini}: ${matchedTrainingIds.size} training ter-link (dari ${rawEntries.length} entry mentah)`,
      );
    } catch (err) {
      console.error(`❌ Failed: ${namaLini} — ${err.message}`);
      console.log(
        `🧹 Rolling back ${createdLiniBisnisIds.length} lini bisnis...`,
      );
      await prisma.liniBisnisTraining.deleteMany({
        where: { liniBisnisId: { in: createdLiniBisnisIds } },
      });
      await prisma.liniBisnis.deleteMany({
        where: { id: { in: createdLiniBisnisIds } },
      });
      console.log("Rollback done. Migration stopped.");
      await conn.end();
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await conn.end();

  console.log(
    `\nMigration done! Total lini bisnis: ${createdLiniBisnisIds.length}`,
  );
  console.log(`Total unmatched/skipped entries: ${unmatchedLog.length}`);

  if (unmatchedLog.length > 0) {
    const fs = require("fs");
    fs.writeFileSync(
      "unmatched-lini-bisnis.json",
      JSON.stringify(unmatchedLog, null, 2),
    );
    console.log("Detail unmatched disimpan di: unmatched-lini-bisnis.json");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
