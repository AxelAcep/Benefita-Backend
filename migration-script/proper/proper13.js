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

const TAHUN = 2013;
const SOURCE_TABLE = "proper13";

function clean(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);
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
        jenisIndustris: clean(row.Jenisindustri) || "",
        tahun: TAHUN,
        peringkat: clean(row.peringkat),
        noIndukProvinsi: clean(row.NO_INDUK), // NO_INDUK -> provinsi
        noIndukPemda: clean(row.noinduk), // noinduk  -> pemda
        noIndukPerusahaan: null,
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
