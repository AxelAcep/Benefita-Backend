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
  return isNaN(d) ? null : d;
}

function safeInt(val) {
  if (val == null) return null;
  const n = parseInt(val);
  return isNaN(n) ? null : n;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabperusahaan");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const createdIds = [];

  for (const row of rows) {
    const noInduk = row["0NO_INDUK"];
    if (!noInduk) {
      console.warn(`⚠️ Skipped row with no NO_INDUK`);
      continue;
    }

    const jenisInstansi = noInduk.startsWith("RS")
      ? "RUMAH_SAKIT"
      : "PERUSAHAAN";

    try {
      const data = {
        jenisInstansi,
        company: row["1COMPANY"] || null,
        alamat: row["2ALAMAT"] || null,
        alamatWaktu: row["2ALAMAT_WAKTU"] || null,
        alamatFactory: row["4ALAMATFACTORY"] || null,
        alamatFactoryWaktu: row["4ALAMATFACTORY_WAKTU"] || null,
        telp: row["5TELP"] || null,
        fax: row["6FAX"] || null,
        email: row["7EMAIL"] || null,
        lineOfBusiness: row["8LINEOFBUSINESS"] || null,
        kategoriCpn: row["3KATEGORICPN"] || null,
        iso9000: row["17ISO9000"] || null,
        iso14000: row["18ISO14001"] || null,
        ohsas18001smk3: row["20OHSAS18001SMK3"] || null,
        group: row["21GROUP"] || null,
        ket: row["24KET"] || null,
        infoKeu: row["27InfoKEU"] || null,
        bdoAction: row["BDO_action"] || null,
        butuhTraining: row["ButuhTraining"] || null,
        dateInput: safeDate(row["dateinput"]),
        dateUpdate: safeDate(row["dateupdate"]),
        fasilitas: row["fasilitas"] || null,
        idSimpel: row["ID_simpel"] || null,
        inputter: row["inputter"] || null,
        nilaiSubBidangProper: safeInt(row["Nilai_Sub_Bidang_PROPER"]),
        permodalan: row["permodalan"] || null,
        prioritasAe: row["PRIORITAS_AE"] || null,
        prioritasMa: row["PRIORITAS_MA"] || null,
        updatter: row["updatter"] || null,
        vendor: row["Vendor"] || null,
        produksi: row["16PRoduksi"] || null,
        tglRecord: row["22TGLRECORD"] || null,
        tglRecordCsr: row["tglrecordCSR"] || null,
        tglRecordEnv: row["tglrecordENV"] || null,
        tglRecordEpm: row["tglrecordEPM"] || null,
        tglRecordTsm: row["tglrecordTSM"] || null,
        acc: row["23ACC"] || null,
        accCsr: row["23ACC_CSR"] || null,
        accEpm: row["23ACC_EPM"] || null,
        accTsm: row["23ACC_TSM"] || null,
        noGroup: row["25NO_GROUP"] || null,
        groupInduk: row["26GROUP_INDUK"] || null,
        actionPareto: row["action_pareto"] || null,
        dateRequestAcount: safeDate(row["daterequestAcount"]),
        requestAcount: row["requestAcount"] || null,
        expiredVendor: safeDate(row["expired_Vendor"]),
        ims: row["IMS"] || null,
        indukKab: row["INDUK_KAB"] || null,
        indukProv: row["INDUK_PROV"] || null,
        kd2: row["KD_2"] || null,
        kd3: row["KD_3"] || null,
        kd4: row["KD_4"] || null,
        kd5: row["KD_5"] || null,
        khusus: row["khusus"] || null,
        kirimPos: row["KIRIMPOS"] || null,
        pesertaInh: safeInt(row["PesertaInh"]),
        pesertaTot: safeInt(row["PesertaTot"]),
        region: row["region"] || null,
        subBidangProper: row["Sub_Bidang_PROPER"] || null,
        tglInfoKeu: row["tglInfoKEU"] || null,
        prioritasMaLama: row["PRIORITAS_MA_lama"] || null,
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
