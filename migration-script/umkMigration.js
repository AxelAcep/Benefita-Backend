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

// Default pegawai (Nanang Santoso)
const DEFAULT_PEGAWAI_ID = "cmqs4gak60006jcd0m2yt7ric";

// ─── Mapping nama pegawai → id ──────────────────────────────
const PEGAWAI_MAP = {
  Amelia: "cmqs4v455000ujcqgqrso300g",
  ARIEPH: "cmq67px7v0008jc4wr1hcindk",
  ASMELDI: "cmqs4v42v000fjcqg281l8qc4",
  DEWI: "cmq66v8d30003jc78r7p2h35d",
  DIAN: "cmqs4gakj000fjcd0pnbh5kpw",
  DODY: "cmqs4v43g000jjcqg5gvpx40d",
  EKHO: "cmqs4v435000hjcqg4cotxent",
  Endang: "cmqs4gamg001ijcd0rv0suu5j",
  ENI: "cmq67qist000cjc4wq0nz96c3",
  GHIFARI: "cmqs4gaoy0039jcd0etxcvgqn",
  HABIBIE: "cmqs4ganl0026jcd0cg46nb6e",
  HERLINA: "cmqs4gakb0009jcd0wrpu7n4l",
  IQBAL: "cmqs4v445000ojcqgkxn4xmgd",
  LELEN: "cmqs4gala000ujcd0i3glommm",
  LIANA: "cmqs4v4780016jcqg56wljage",
  MARWATI: "cmqs4v40n0001jcqgdsnit2bq",
  MULYADI: "cmqs4gako000ijcd0fugwthx7",
  NANANG: "cmq67m7fm0000jc4wafuhw4j6",
  NANDIK: "cmqs4v43m000kjcqgwsli3jig",
  RESTU: "cmqs4v44w000tjcqguswk6f3d",
  RIFQI: "cmqs4gapp003ujcd02t2lxk43",
  RIZKI: "cmqs4v440000njcqgaqc910m5",
  SALMAN: "cmqs494lk000yjct8rglynesq",
  SYLVA: "cmq67eg2w0023jc1cq2v2qets",
  WIDIA: "cmqs4v485001djcqg3x63rbg1",
  WULAN: "cmq67bagu001rjc1chivx3ch4",
  YANI: "cmqs4ganl0026jcd0cg46nb6e",
  YOGI: "cmqs4v44d000pjcqgfj3caqjy",
  ZIRAH: "cmq67feia0027jc1chy4j53k6",
};

// ─── Helper ──────────────────────────────────────────────────
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

function safeString(val) {
  if (val == null || val === "") return null;
  return String(val);
}

function mapPegawai(nama) {
  if (!nama) return null;
  const trimmed = nama.trim();
  return PEGAWAI_MAP[trimmed] || null;
}

// ─── Main Migration ───────────────────────────────────────────
async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("🧹 Truncating umk...");
  await prisma.umk.deleteMany({});
  console.log("✅ Truncate done.");

  console.log("📥 Fetching data from MySQL tab_umk...");
  const [rows] = await conn.execute("SELECT * FROM tab_umk");
  console.log(`📊 Found ${rows.length} rows.`);

  let successCount = 0;
  let errorCount = 0;
  const migratedIds = [];

  for (const row of rows) {
    try {
      const noUmk = safeString(row.No_umk);
      if (!noUmk) {
        console.warn(`⚠️ Skipped row with empty No_umk`);
        errorCount++;
        continue;
      }

      // Mapping PIC
      const picNama = safeString(row.PIC_umk);
      const picId = mapPegawai(picNama);

      // Mapping inputter
      const inputterNama = safeString(row.inputter) || safeString(row.imputter);
      const inputterId = mapPegawai(inputterNama) || DEFAULT_PEGAWAI_ID;

      // ─── PERBAIKAN: ambil tglInput dari MySQL ────────────────
      const tglInput = safeDate(row.TglInput_umk) || new Date();

      const data = {
        noUmk,
        tglInput, // <--- ini yang diambil dari MySQL, bukan now()
        jumlahUmk: safeInt(row.Jumlah_umk) ?? 0,
        picId,
        tujuanUmk: safeString(row.Tujuan_umk) || "",
        tglPenyerahanUang: safeString(row.TglPeyerahanUang_umk),
        realisasiUmk: safeInt(row.Realisasi_umk) ?? 0,
        tglPutmKmk: safeString(row.TglPutm_kmk),
        sisaUangUmk: safeInt(row.SisaUang_umk) ?? 0,
        ketUmk: safeString(row.Ket_umk),
        periodeUmk: safeString(row.Periode_umk) || "",
        inputterId,
      };

      await prisma.umk.create({
        data,
      });

      migratedIds.push(noUmk);
      successCount++;
      console.log(
        `✅ ${noUmk} | tglInput: ${row.TglInput_umk || "NULL"} | PIC: ${picNama || "(null)"} → ${picId || "(null)"}`,
      );
    } catch (err) {
      console.error(`❌ Failed for row:`, err.message);
      errorCount++;
    }
  }

  await conn.end();

  console.log(`\n🎉 Migration done!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📦 Total migrated: ${migratedIds.length}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  Ada ${errorCount} error. Cek log di atas.`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
