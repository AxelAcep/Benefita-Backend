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

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d)) return null;
  if (d.getFullYear() < 1900 || d.getFullYear() > 2100) return null;
  return d;
}

function safeInt(val) {
  if (val == null) return null;
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabinstansidaerah");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const createdIds = [];

  for (const row of rows) {
    const noInduk = row["0NO_INDUK"];
    if (!noInduk) {
      console.warn(`⚠️ Skipped row with no NO_INDUK`);
      continue;
    }

    try {
      const data = {
        jenisInstansi: "INSTANSI_DAERAH",
        company: row["Instansi"] || null,
        kotaKabupaten: row["Propkabkot"] || null,
        alamat: row["Alamat1"] || null,
        alamatWaktu: row["2ALAMAT_WAKTU"] || null,
        provinsi: row["Propinsi"] || null,
        telp: row["Telp"] || null,
        fax: row["Fax"] || null,
        email: row["Email"] || null,
        ket: row["Keterangan"] || null,
        tglRecord: row["TglRecord"] || null,
        tender1: row["contohtender"] || null,
        tender2: row["tender1"] || null,
        tender3: row["tender2"] || null,
        fasilitas: row["fasilitas"] || null,
        pelatihanDiikuti: row["Yangdiikuti"] || null,
        acc: row["23ACC"] || null,
        accCsr: row["23ACC_CSR"] || null,
        accTsm: row["23ACC_TSM"] || null,
        accEpm: row["23ACC_EPM"] || null,
        tglRecordEnv: row["tglrecordENV"] || null,
        tglRecordCsr: row["tglrecordCSR"] || null,
        tglRecordTsm: row["tglrecordTSM"] || null,
        tglRecordEpm: row["tglrecordEPM"] || null,
        inputter: row["inputter"] || null,
        dateInput: safeDate(row["dateinput"]),
        updatter: row["updatter"] || null,
        dateUpdate: safeDate(row["dateupdate"]),
        prioritasMa: row["PRIORITAS_MA"] || null,
        prioritasAe: row["PRIORITAS_AE"] || null,
        butuhTraining: row["ButuhTraining"] || null,
        noIndukProv: row["noinduk_prov"] || null,
        prioritas: safeInt(row["Prioritas"]),
        pelanggan: row["Pelanngan"] != null ? Boolean(row["Pelanngan"]) : null,
      };

      await prisma.tabPerusahaan.upsert({
        where: { noInduk },
        update: data,
        create: { noInduk, ...data },
      });

      createdIds.push(noInduk);
      console.log(`✅ Migrated: ${noInduk} — ${row["Instansi"] || "-"}`);
    } catch (err) {
      console.error(`❌ Failed: ${noInduk} — ${err.message}`);
      console.log(`🧹 Rolling back ${createdIds.length} records...`);
      await prisma.tabPerusahaan.deleteMany({
        where: { noInduk: { in: createdIds } },
      });
      console.log("Rollback done. Migration stopped.");
      await conn.end();
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await conn.end();
  console.log(`Migration done! Total: ${createdIds.length} records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
