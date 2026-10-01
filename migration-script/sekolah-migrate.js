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

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabsekolah");
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
        jenisInstansi: "SEKOLAH",
        company: row["1COMPANY"] || null,
        alamat: row["alamat"] || null,
        alamatWaktu: row["2ALAMAT_WAKTU"] || null,
        telp: row["telp"] || null,
        fax: row["fax"] || null,
        email: row["email"] || null,
        ket: row["keterangan"] || null,
        fasilitas: row["fasilitas"] || null,
        butuhTraining: row["ButuhTraining"] || row["hrdTraining"] || null,
        pemilik: row["rektorKeSek"] || null,
        yayasan: row["pengurusYayasan"] || null,
        group: row["skgroup"] || null,
        tglRecord: row["tglrecord"] || null,
        acc: row["23ACC"] || null,
        accCsr: row["23ACC_CSR"] || null,
        accTsm: row["23ACC_TSM"] || null,
        accEpm: row["23ACC_EPM"] || null,
        tglRecordEnv: row["tglrecordENV"] || null,
        tglRecordCsr: row["tglrecordCSR"] || null,
        tglRecordTsm: row["tglrecordTSM"] || null,
        tglRecordEpm: row["tglrecordEPM"] || null,
        tglRecordAdm: row["tglrecordADM"] || null,
        requestAcount: row["recquestAcount"] || null,
        dateRequestAcount: safeDate(row["daterecquestAcount"]),
        inputter: row["inputter"] || null,
        dateInput: safeDate(row["dateinput"]),
        updatter: row["updatter"] || null,
        dateUpdate: safeDate(row["dateupdate"]),
        sertifikasi: row["sertifikasi"] || null,
        contakPerson: row["contakPerson"] || null,
      };

      await prisma.tabPerusahaan.upsert({
        where: { noInduk },
        update: data,
        create: { noInduk, ...data },
      });

      createdIds.push(noInduk);
      console.log(`✅ Migrated: ${noInduk} — ${row["1COMPANY"] || "-"}`);
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
