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

const DEFAULT_PEGAWAI_ID = "cmqs4gak60006jcd0m2yt7ric"; // Nanang Santoso

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

function mapStatus(val) {
  if (!val) return "TENTATIF";
  const v = val.trim().toUpperCase();
  if (v === "R") return "TERKONFIRMASI";
  if (v === "C") return "BATAL";
  return "TENTATIF";
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("🧹 Truncating peserta_training...");
  await prisma.pesertaTraining.deleteMany({});
  console.log("🧹 Truncating trainer_on_jadwal...");
  await prisma.trainerOnJadwal.deleteMany({});
  console.log("🧹 Truncating jadwal_training...");
  await prisma.jadwalTraining.deleteMany({});
  console.log("✅ Truncate done.");

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabjadwal");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const migratedNomors = [];

  for (const row of rows) {
    const noJadwal = row.JadNomor ? String(row.JadNomor) : null;
    if (!noJadwal) {
      console.warn(`⚠️ Skipped row with no JadNomor`);
      continue;
    }

    const kodePelatihan = row.JadKode || null;
    if (!kodePelatihan) {
      console.warn(`⚠️ Skipped ${noJadwal} — no JadKode`);
      continue;
    }

    const judulExists = await prisma.judulTraining.findUnique({
      where: { kode: kodePelatihan },
    });
    if (!judulExists) {
      console.warn(
        `⚠️ Skipped ${noJadwal} — JudulTraining kode "${kodePelatihan}" tidak ditemukan`,
      );
      continue;
    }

    try {
      const data = {
        kodePelatihan,
        tglMulai: safeDate(row.JadTglMulai),
        tglSelesai: safeDate(row.JadTglSelesai),
        judulLengkap: row.JadJudul || "",
        judulPendek: row.JadJudulPdk || "",
        metode: row.JadMetode || "",
        kota: row.JadKota || "",
        lokasiDetail: row.JadLokasi || null,
        biaya: safeInt(row.JadBiaya) ?? 0,
        jenisTraining: row.JadJenis || "",
        status: mapStatus(row.JadStatus),
        catatan: row.JadCatatan || null,
        fileAgenda: row.JadFileName || null,
        updateOleh: DEFAULT_PEGAWAI_ID,
        durasi: safeInt(row.JadDurasi),
        tglRencana: safeDate(row.JadTglRencana),
        periode: row.JadPeriode || null,
        tipe: row.JadTipe || null,
        penawaran: row.JadPenawaran || null,
        statusPrio: row.JadStatusPrio || null,
        trainer: row.JadTrainer || null,
        statusTr: row.JadStatusTr || null,
        updTgl: safeDate(row.JadUpdTgl),
        batch: safeInt(row.JadBatch),
      };

      await prisma.jadwalTraining.upsert({
        where: { noJadwal },
        update: data,
        create: { noJadwal, ...data },
      });

      migratedNomors.push(noJadwal);
      console.log(`✅ Migrated: ${noJadwal} — ${row.JadJudul || "-"}`);
    } catch (err) {
      console.error(`❌ Failed: ${noJadwal} — ${err.message}`);
      console.log(`🧹 Rolling back ${migratedNomors.length} records...`);
      await prisma.jadwalTraining.deleteMany({
        where: { noJadwal: { in: migratedNomors } },
      });
      console.log("Rollback done. Migration stopped.");
      await conn.end();
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await conn.end();
  console.log(`\nMigration done! Total: ${migratedNomors.length} records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
