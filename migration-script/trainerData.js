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
  if (val == null) return null;
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

function safeString(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s.length ? s : null;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("🧹 Truncating trainer...");
  await prisma.trainer.deleteMany({});
  console.log("✅ Truncate done.");

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabtrainer");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const migratedIds = [];

  for (const row of rows) {
    const mysqlId = row.ID_Trainer;

    const kode = safeString(row.Kode_Trainer);
    if (!kode) {
      console.warn(`⚠️ Skipped ID_Trainer ${mysqlId} — Kode_Trainer kosong`);
      continue;
    }

    const nama = safeString(row.Nama_Trainer);
    if (!nama) {
      console.warn(`⚠️ Skipped ID_Trainer ${mysqlId} — Nama_Trainer kosong`);
      continue;
    }

    try {
      const data = {
        kode,
        nama,
        alamat: safeString(row.Alamat_Trainer),
        telp: safeString(row.NoHp_Trainer),
        email: safeString(row.Email_Trainer),
        kantor: safeString(row.Kantor_Trainer),
        alamatKantor: safeString(row.AlmtKantor_Trainer),
        noTelpKantor: safeString(row.TelpKantor_Trainer),
        subjekKhusus: safeString(row.SubyKhusus_Trainer),
        keterangan: safeString(row.Keterangan_Trainer),
        referensi: safeString(row.Referensi_Trainer),
        CV_Trainer: safeString(row.CV_Trainer),
      };

      const created = await prisma.trainer.create({ data });
      migratedIds.push(created.id);
      console.log(`✅ Migrated: ID_Trainer ${mysqlId} — ${nama}`);
    } catch (err) {
      console.error(`❌ Failed: ID_Trainer ${mysqlId} — ${err.message}`);
      console.log(`🧹 Rolling back ${migratedIds.length} records...`);
      await prisma.trainer.deleteMany({
        where: { id: { in: migratedIds } },
      });
      console.log("Rollback done. Migration stopped.");
      await conn.end();
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await conn.end();
  console.log(`\nMigration done! Total: ${migratedIds.length} records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
