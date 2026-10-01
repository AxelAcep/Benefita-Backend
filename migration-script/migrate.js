const mysql = require("mysql2/promise");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const mysqlConfig = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "benefita",
};

function mapRole(jabatan) {
  if (!jabatan) return "ADMIN";
  const j = jabatan.trim().toLowerCase();
  if (j === "director" || j === "direktur keuangan") return "SUPER_ADMIN";
  if (j === "manager") return "ADMIN";
  if (j === "account executive" || j === "marketing") return "MARKETING_STAFF";
  if (j === "administrasi" || j === "administr" || j === "keuangan")
    return "FINANCE";
  if (j === "mis") return "ADMIN";
  if (j === "teknik" || j === "staff" || j === "operator") return "TEKNIS";
  if (j === "magang") return "MARKETING_SEMENTARA";
  return "ADMIN";
}

function randomEmail() {
  return `user_${randomUUID().slice(0, 8)}@placeholder.com`;
}

function randomPhone() {
  return `08${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
}

function safeDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

async function main() {
  const conn = await mysql.createConnection(mysqlConfig);

  console.log("Fetching data from MySQL...");
  const [rows] = await conn.execute("SELECT * FROM tabuser");
  console.log(`Found ${rows.length} rows. Migrating...`);

  const usedNips = new Set();

  for (const row of rows) {
    const nama = row.UserName || "Unknown";
    const email = row.UserEmail || randomEmail();
    const phone = row.UserHP || randomPhone();
    const nip = row.nip && !usedNips.has(row.nip) ? row.nip : null;
    if (row.nip) usedNips.add(row.nip);

    try {
      const pegawaiData = {
        nama,
        nip,
        jabatan: row.UserJabatan || null,
        departemen: row.UserDivisi || null,
        fotoUrl: row.foto || null,
        nik: row.NIK != null ? String(row.NIK) : null,
        tempatTanggalLahir: row.tempat_tanggal_lahir || null,
        alamat: row.alamat || null,
        pendidikanTerakhir: row.pendidikan_terakhir || null,
        jenisKelamin: row.jenis_kelamin || null,
        statusPerkawinan: row.status_perkawinan || null,
        statusKaryawan: row.UserStatusKaryawan || null,
        tanggalMasuk: safeDate(row.User_masuk),
        remark: row.UserRemark || null,
        sisaCuti: row.UserCuti ? parseInt(row.UserCuti) : null,
        statusHarian: row.UserDaiStat != null ? String(row.UserDaiStat) : null,
        userStatus: row.UserStatus || null,
        kodeDepartemen: row.UserDep || null,
        instansi: row.UserInst || null,
        userData: row.UserData || null,
        updatedBy: row.UserUpdBy || null,
        statusDate: safeDate(row.UserStatDate),
        akunInfo: row.UserAkun || null,
      };

      const pegawai = await prisma.pegawai.upsert({
        where: { nip: nip ?? `__nip_null_${randomUUID()}` },
        update: pegawaiData,
        create: pegawaiData,
      });

      // Cek dulu apakah user ini udah ada (by phone, email, atau pegawaiId)
      let existingUser = await prisma.user.findUnique({ where: { phone } });

      if (!existingUser) {
        existingUser = await prisma.user.findUnique({ where: { email } });
      }

      if (!existingUser) {
        existingUser = await prisma.user.findUnique({
          where: { pegawaiId: pegawai.id },
        });
      }

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            pegawaiId: pegawai.id,
            emailGmail: row.Email_gmail || null,
            role: mapRole(row.UserJabatan),
            lastOnlineAt: safeDate(row.lastlogin1),
          },
        });
      } else {
        await prisma.user.create({
          data: {
            pegawaiId: pegawai.id,
            email,
            emailGmail: row.Email_gmail || null,
            phone,
            password: "123",
            role: mapRole(row.UserJabatan),
            lastOnlineAt: safeDate(row.lastlogin1),
          },
        });
      }

      console.log(`✅ Migrated: ${nama}`);
    } catch (err) {
      console.error(`❌ Failed: ${nama} — ${err.message}`);
    }
  }

  await conn.end();
  console.log("Migration done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
