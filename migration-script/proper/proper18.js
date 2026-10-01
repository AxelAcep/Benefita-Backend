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

const TAHUN = 2018;
const SOURCE_TABLE = "proper18";

function clean(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function cleanPeringkat(val) {
  const s = clean(val);
  return s ? s.toUpperCase() : null;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  // Hapus semua data Proper dengan tahun 2018
  console.log(`Deleting all Proper records with tahun ${TAHUN}...`);
  const deleteResult = await prisma.proper.deleteMany({
    where: { tahun: TAHUN },
  });
  console.log(`Deleted ${deleteResult.count} records.`);

  console.log(`Fetching data from MySQL table "${SOURCE_TABLE}"...`);
  const [rows] = await conn.execute(`SELECT * FROM ${SOURCE_TABLE}`);
  console.log(`Found ${rows.length} rows. Migrating...`);

  const success = [];
  const failed = [];

  for (const row of rows) {
    const namaPerusahaan = clean(row.NamaPerusahaan);
    const label = namaPerusahaan || `(row no=${row.no})`;

    try {
      const data = {
        namaPerusahaan: namaPerusahaan || "",
        bidangIndustri: clean(row.bidang_Industri),
        jenisIndustris: clean(row.Jenisindustri) || "",
        tahun: TAHUN,
        peringkat: cleanPeringkat(row.peringkat),
        noIndukProvinsi: clean(row.NO_INDUK), // NO_INDUK    -> provinsi
        noIndukPemda: clean(row.noinduk), // noinduk     -> pemda
        noIndukPerusahaan: clean(row.NO_INDUKPer), // NO_INDUKPer -> perusahaan
      };

      await prisma.proper.create({ data });

      success.push(label);
      console.log(`✅ Migrated: ${label}`);
    } catch (err) {
      failed.push({ label, reason: err.message });
      console.error(`❌ Failed: ${label} — ${err.message}`);
    }
  }

  await conn.end();

  console.log(
    `\n=== Migration Summary (${SOURCE_TABLE} -> tahun ${TAHUN}) ===`,
  );
  console.log(`Total rows   : ${rows.length}`);
  console.log(`Success      : ${success.length}`);
  console.log(`Failed       : ${failed.length}`);

  if (failed.length > 0) {
    console.log(`\nFailed rows:`);
    failed.forEach((f) => console.log(`  - ${f.label}: ${f.reason}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
