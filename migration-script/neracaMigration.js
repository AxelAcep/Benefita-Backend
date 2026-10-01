const mysql = require("mysql2/promise");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const mysqlConfig = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "benefita", // ganti sesuai nama DB MySQL
};

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

function safeBigInt(val) {
  if (val == null) return null;
  return BigInt(val);
}

// Mapping username_lama -> pegawaiId (sesuai data yang kamu berikan)
const userMapping = {
  ZIRAH: "cmq67feia0027jc1chy4j53k6",
  LELEN: "cmqs4gal1000ojcd0wf1gmv1q", // Syukraini
  AMELIA: null,
  "": null,
};

function parseUserField(fieldValue) {
  if (!fieldValue || fieldValue.trim() === "") {
    return { userId: null, date: null };
  }
  const idx = fieldValue.indexOf(",");
  let username = "";
  let dateStr = "";
  if (idx === -1) {
    username = fieldValue.trim();
  } else {
    username = fieldValue.substring(0, idx).trim();
    dateStr = fieldValue.substring(idx + 1).trim();
  }
  const userId = userMapping[username.toUpperCase()] ?? null;
  const date = safeDate(dateStr);
  return { userId, date };
}

// ===== 1. MIGRASI JENIS BIAYA dari lp_keubiaya + tambahan kode unik dari lp_neraca =====
async function migrateJenisBiaya(conn) {
  // a. Ambil semua data dari lp_keubiaya
  const [rows] = await conn.execute("SELECT * FROM lp_keubiaya");
  console.log(`📦 Found ${rows.length} rows in lp_keubiaya.`);

  for (const row of rows) {
    const kode = row.kode?.trim();
    if (!kode) continue;
    await prisma.tableJenisBiaya.upsert({
      where: { kode },
      update: { ket: row.ket || "" },
      create: { kode, ket: row.ket || "" },
    });
  }
  console.log(`✅ TableJenisBiaya migrated from lp_keubiaya.`);

  // b. Ambil semua kode unik dari lp_neraca yang belum ada di TableJenisBiaya
  const [neracaRows] = await conn.execute(
    "SELECT DISTINCT nerkode FROM lp_neraca WHERE nerkode IS NOT NULL AND nerkode != ''",
  );
  const kodeNeraca = neracaRows.map((r) => r.nerkode.trim());
  console.log(`📦 Found ${kodeNeraca.length} unique kodes in lp_neraca.`);

  let added = 0;
  for (const kode of kodeNeraca) {
    const existing = await prisma.tableJenisBiaya.findUnique({
      where: { kode },
    });
    if (!existing) {
      await prisma.tableJenisBiaya.create({ data: { kode, ket: "" } });
      added++;
    }
  }
  console.log(`✅ Added ${added} new kodes from lp_neraca to TableJenisBiaya.`);
}

// ===== 2. MIGRASI NERACA dari lp_neraca =====
async function migrateNeraca(conn) {
  console.log(`🚀 Migrating lp_neraca...`);
  const [rows] = await conn.execute("SELECT * FROM lp_neraca");
  console.log(`📦 Total rows: ${rows.length}`);

  const neracaData = [];

  for (const row of rows) {
    const kode = row.nerkode?.trim();
    if (!kode) {
      console.warn(`⚠️ Skipped row with no kode (ID ${row.ID})`);
      continue;
    }
    const jenisBiaya = await prisma.tableJenisBiaya.findUnique({
      where: { kode },
    });
    if (!jenisBiaya) {
      console.warn(
        `⚠️ Kode "${kode}" still missing, skipping row ID ${row.ID}`,
      );
      continue;
    }

    const input = parseUserField(row.nerInput);
    const update = parseUserField(row.nerUpd);

    neracaData.push({
      tanggal: new Date(row.nertanggal),
      jenisBiayaId: jenisBiaya.id,
      uraian: row.nerUraian || "",
      bukti: row.nerBukti || "",
      debit: safeBigInt(row.nerDebet),
      kredit: safeBigInt(row.nerKredit),
      saldo: safeBigInt(row.nerSaldo),
      periode: row.nerperiode || "",
      userInputId: input.userId,
      tanggalInput: input.date,
      userUpdateId: update.userId,
      tanggalUpdate: update.date,
    });
  }

  if (neracaData.length === 0) {
    console.log(`⚠️ No valid data in lp_neraca`);
    return;
  }

  try {
    const result = await prisma.tableNeraca.createMany({
      data: neracaData,
      skipDuplicates: false,
    });
    console.log(`✅ Inserted ${result.count} rows from lp_neraca.`);
  } catch (err) {
    console.error(`❌ Error inserting lp_neraca:`, err.message);
    throw err;
  }
}

// ===== MAIN =====
async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  try {
    // ===== HAPUS SEMUA DATA YANG SUDAH ADA (hanya 2 tabel ini) =====
    console.log(
      "🧹 Clearing existing data from TableNeraca and TableJenisBiaya...",
    );
    await prisma.tableNeraca.deleteMany({});
    await prisma.tableJenisBiaya.deleteMany({});
    console.log("✅ Data cleared.");

    console.log(
      "📥 Step 1: Migrating Jenis Biaya from lp_keubiaya + adding missing kodes...",
    );
    await migrateJenisBiaya(conn);

    console.log("📥 Step 2: Migrating Neraca from lp_neraca...");
    await migrateNeraca(conn);

    console.log("🎉 All migrations completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    // Rollback: hapus semua data yang sudah masuk (jika error)
    console.log("🧹 Rolling back all inserted data...");
    await prisma.tableNeraca.deleteMany({});
    await prisma.tableJenisBiaya.deleteMany({});
    console.log("Rollback done.");
  } finally {
    await conn.end();
    await prisma.$disconnect();
  }
}

main().catch(console.error);
