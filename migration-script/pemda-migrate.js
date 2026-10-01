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
  // Reject tahun di luar range wajar
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
  const [rows] = await conn.execute("SELECT * FROM tabpemda");
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
        jenisInstansi: "PEMDA",
        company: row["1COMPANY"] || null,
        provinsi: row["Propinsi"] || null,
        alamat: row["Alamat"] || null,
        alamatWaktu: row["2ALAMAT_WAKTU"] || null,
        telp: row["Telp"] || null,
        fax: row["Fax"] || null,
        email: row["Email"] || null,
        sekilasLh: row["SekilasLH"] || null,
        ket: row["Keterangan"] || null,
        dateInput: safeDate(row["Tanggal"]),
        dateUpdate: safeDate(row["dateupdater"]),
        updatter: row["updatter"] || null,
        butuhTraining: row["ButuhTraining"] || null,
        instansi: row["Instansi"] || null,
        rsud: safeInt(row["RSUD"]),
        indPengolahan: safeInt(row["IndustriPengolahan"]),
        pertambangan: safeInt(row["Pertambangan"]),
        listrikGasAirBersih: safeInt(row["ListrikGasdanAirBersih"]),
        hotelResto: safeInt(row["PerdaganganHoteldanResto"]),
        bangunan: safeInt(row["Bangunan"]),
        angkutTrans: safeInt(row["AngkutandanTrans"]),
        pertanian: safeInt(row["Pertanian"]),
        keuangan: safeInt(row["Keuangan"]),
        jasa: safeInt(row["Jasa"]),
        laut: safeInt(row["Laut"]),
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
        status: row["Status"] || null,
        statusDaerah: row["status_daerah"] || null,
        golkar: row["Golkar"] || null,
        pdip: row["PDIP"] || null,
        ppp: row["PPP"] || null,
        pan: row["PAN"] || null,
        lain: row["Lain"] || null,
        humasDanHukum: row["HumasdanHukum"] || null,
        costomer: row["COSTOMER"] || null,
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
