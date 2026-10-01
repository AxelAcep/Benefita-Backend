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

const PEGAWAI_KODE_MAP = {
  ENI: "Eni Endri Yeni",
  NANANG: "Nanang Santoso",
  HERLINA: "Herlina Susilowati",
  ARIEPH: "Ahmad Arief D.",
  DIAN: "Radian",
  MULYADI: "Mulyadi Afmar",
  SYLVA: "Sylvania Permata Sari",
  RITA: "Rita Zulbetti",
  LELEN: "Syukraini",
  ENDANG: "Endang",
  SALMAN: "Muhammad\n Salman Musy",
  HABIBIE: "Habibie",
  YANI: "Nofliyani",
  GHIFARI: "Muhammad Ghifari",
  ZIRAH: "Siti Nazirah",
  RAZIF: "Razif",
  AFFAN: "Affan Marwan",
  RIFQI: "Muhammad Rifqi Pambudi",
  WULAN: "Nuriyah Wulandari",
  ARISTA: "Nurul Fadila Arista",
  GEMPI: "Gempita Erlintiana",
  CALVIN: "Calvin Vadhya Fajar",
  BIYAN: "Biyan Shandika",
  NURFAZA: "Moch Rifqy Nurfaza",
  ALDY: "Trenaldy Abdafanza",
  JEANE: "Jeane Geraldine",
  MILDA: "Milda Ayu El Rahmah",
  KITHA: "Rizkitha Widiawati",
  ZAHRA: "Euis Zahra Nurhalimah",
  RISKI: "Riski Lesmana",
  EXEL: "Exel",
};

function mapStatus(val) {
  if (!val) return null;
  const v = val.trim().toUpperCase();
  if (v === "FIX") return "FIX";
  if (v === "TEN") return "TENTATIF";
  if (v === "XXX") return "CANCEL";
  return null;
}

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

  console.log("🧹 Truncating peserta_training...");
  await prisma.pesertaTraining.deleteMany({});
  console.log("✅ Truncate done.");

  console.log("Building pegawai lookup...");
  const pegawaiList = await prisma.pegawai.findMany({
    select: { id: true, nama: true },
  });
  const pegawaiByNama = {};
  for (const p of pegawaiList) {
    pegawaiByNama[p.nama] = p.id;
  }

  function resolvePegawaiId(kode) {
    if (!kode) return DEFAULT_PEGAWAI_ID;
    const nama = PEGAWAI_KODE_MAP[kode.trim().toUpperCase()];
    if (!nama) return DEFAULT_PEGAWAI_ID;
    return pegawaiByNama[nama] ?? DEFAULT_PEGAWAI_ID;
  }

  function resolvePegawaiIdNullable(kode) {
    if (!kode) return null;
    const nama = PEGAWAI_KODE_MAP[kode.trim().toUpperCase()];
    if (!nama) return null;
    return pegawaiByNama[nama] ?? null;
  }

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabpeserta");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const migratedIds = [];

  for (const row of rows) {
    const mysqlId = row.ID;

    const noJadwal = row.PesNoJadwal ? String(row.PesNoJadwal).trim() : null;
    if (!noJadwal) {
      console.warn(`⚠️ Skipped ID ${mysqlId} — no PesNoJadwal`);
      continue;
    }

    const noIndukPerusahaan = row.PesNoInduk
      ? String(row.PesNoInduk).trim()
      : null;
    if (!noIndukPerusahaan) {
      console.warn(`⚠️ Skipped ID ${mysqlId} — no PesNoInduk`);
      continue;
    }

    const jadwalExists = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
    });
    if (!jadwalExists) {
      console.warn(
        `⚠️ Skipped ID ${mysqlId} — JadwalTraining "${noJadwal}" tidak ditemukan`,
      );
      continue;
    }

    const perusahaanExists = noIndukPerusahaan
      ? await prisma.tabPerusahaan.findUnique({
          where: { noInduk: noIndukPerusahaan },
        })
      : null;
    const resolvedNoInduk = perusahaanExists ? noIndukPerusahaan : null;
    if (!perusahaanExists) {
      console.warn(
        `⚠️ TabPerusahaan "${noIndukPerusahaan}" tidak ditemukan untuk ID ${mysqlId} — noIndukPerusahaan di-set null`,
      );
    }

    try {
      const data = {
        nama: row.PesNama || "",
        jabatan: row.PesJabatan || null,
        alamat: row.PesAlamat || null,
        noTelp: row.PesNoTelepon || null,
        noFax: row.PesNoFax || null,
        email: row.PesKonEmail || null,
        alamatPengirimanSertifikat: row.PesKirimSertifikat || null,
        catatan: row.PesCatatan || null,
        industri: row.PesIndustri || null,
        status: mapStatus(row.PesStatus),
        ownEnv: row.PesOnw || null,
        metode: row.PesMetode || null,
        filePendaftaran: row.PesFormPendaftar || null,
        fileBuktiPembayaran: null,
        noUrut: row.PesNoUrut || null,
        tglMulai: safeDate(row.PesTglMulai),
        tempatLahir: row.PesTempat_lahir || null,
        tanggalLahir: safeDate(row.PesTanggal_lahir),
        jenisKelamin: row.Pesjenis_kelamin || null,
        bidang: row.PesBidang || null,
        noCust: row.PesNoCust || null,
        instansi: row.PesInstansi || null,
        namaPerusahaan: row.PesPerusahaan || null,
        noHp: row.PesNoHP || null,
        konTgl: safeDate(row.PesKonTgl1),
        konOleh: row.PesKonOleh || null,
        dep: row.PesDep || null,
        gender: row.PesGender || null,
        religi: row.PesReligi || null,
        partisipan: row.PesPrtisipan || null,
        biaya: safeInt(row.PesBiaya),
        periode: row.PesPeriode || null,
        noRegUji: row.no_Reg_Uji || null,
        idDok: row.ID_dok || null,
        noJadOld: row.Nojad || null,
        idPesPel: row.IDpespel || null,
        fee: row.Fee || null,
        noIndukPerusahaan: resolvedNoInduk,
        noJadwal,
        accExecutive: row.PesRegisBy || null,
        ujian: row.PesStatUji || null,
        noInvUjian: row.PesinvoiceUji || null,
        noKwtUjian: row.PeskwitansiUji || null,
        diskon: safeInt(row.PesDiskon),
        ppn: safeInt(row.pesppn),
        cashback: safeInt(row.PesCashBack),
        hargaTotal: safeInt(row.pestotalbayar),
        bayar: safeInt(row.PesBayar),
        infoPembayaran: row.PesInfoByr || null,
        infoPenagihan: row.PesInfoTagih || null,
        tglBayar: safeDate(row.PesTglByr),
        noInvoice: row.Pesinvoice || null,
        noKwitansi: row.Peskwitansi || null,
        inputOleh: resolvePegawaiId(row.PesInputBy),
        updateOleh: resolvePegawaiIdNullable(row.PesUpdBy),
        konfirmasiOleh: resolvePegawaiIdNullable(row.PesAccRep),
        tglInput: safeDate(row.PesInputTgl) ?? new Date(),
      };

      const created = await prisma.pesertaTraining.create({ data });
      migratedIds.push(created.id);
      console.log(`✅ Migrated: ID ${mysqlId} — ${row.PesNama || "-"}`);
    } catch (err) {
      console.error(`❌ Failed: ID ${mysqlId} — ${err.message}`);
      console.log(`🧹 Rolling back ${migratedIds.length} records...`);
      await prisma.pesertaTraining.deleteMany({
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
