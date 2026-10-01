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

function safeInt(val) {
  if (val == null) return 0;
  const n = parseInt(val);
  return isNaN(n) ? 0 : n;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabjudul");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const migratedKodes = [];

  for (const row of rows) {
    const kode = row.JudKode;
    if (!kode) {
      console.warn(`⚠️ Skipped row with no JudKode`);
      continue;
    }

    try {
      const data = {
        judulTraining: row.JudDeskripsi || "",
        tipe: row.JudTipe || "",
        hari: safeInt(row.JudHari),
        biayaOffline: safeInt(row.JudBiayaOffline),
        biayaOnline: safeInt(row.JudBiayaOnline),
        batch: 0,
        brosur: row.File_Pel || null,
      };

      await prisma.judulTraining.upsert({
        where: { kode },
        update: data,
        create: { kode, ...data },
      });

      migratedKodes.push(kode);
      console.log(`✅ Migrated: ${kode} — ${row.JudDeskripsi || "-"}`);
    } catch (err) {
      console.error(`❌ Failed: ${kode} — ${err.message}`);
      console.log(`🧹 Rolling back ${migratedKodes.length} records...`);
      await prisma.judulTraining.deleteMany({
        where: { kode: { in: migratedKodes } },
      });
      console.log("Rollback done. Migration stopped.");
      await conn.end();
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await conn.end();
  console.log(`\nMigration done! Total: ${migratedKodes.length} records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
