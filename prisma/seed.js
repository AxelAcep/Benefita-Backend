const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Mulai seeding...");

  // ==============================
  // 1. PEGAWAI (5 orang)
  // ==============================
  const pegawaiData = [
    {
      nama: "Budi Santoso",
      nip: "NIP001",
      jabatan: "Manager Marketing",
      departemen: "Marketing",
    },
    {
      nama: "Siti Rahayu",
      nip: "NIP002",
      jabatan: "Staff Keuangan",
      departemen: "Finance",
    },
    {
      nama: "Ahmad Fauzi",
      nip: "NIP003",
      jabatan: "Admin Harian",
      departemen: "Admin",
    },
    {
      nama: "Dewi Lestari",
      nip: "NIP004",
      jabatan: "Staff Marketing",
      departemen: "Marketing",
    },
    {
      nama: "Rizky Pratama",
      nip: "NIP005",
      jabatan: "Super Admin",
      departemen: "IT",
    },
  ];

  const pegawaiList = [];
  for (const data of pegawaiData) {
    const p = await prisma.pegawai.upsert({
      where: { nip: data.nip },
      update: {},
      create: data,
    });
    pegawaiList.push(p);
  }
  console.log("✅ Pegawai selesai");

  // ==============================
  // 2. USER (1-1 dengan Pegawai)
  // ==============================
  const roleList = [
    "SUPER_ADMIN",
    "FINANCE",
    "DAILY_ADMIN",
    "MARKETING_STAFF",
    "MARKETING_STAFF",
  ];
  const hashedPassword = await bcrypt.hash("password123", 10);

  for (let i = 0; i < pegawaiList.length; i++) {
    await prisma.user.upsert({
      where: { pegawaiId: pegawaiList[i].id },
      update: {},
      create: {
        pegawaiId: pegawaiList[i].id,
        phone: `0812000000${i + 1}`,
        email: `user${i + 1}@example.com`,
        password: hashedPassword,
        role: roleList[i],
      },
    });
  }
  console.log("✅ User selesai");

  // ==============================
  // 3. PERUSAHAAN (15 data, campur semua jenis)
  // ==============================
  const perusahaanData = [
    // PERUSAHAAN
    {
      noInduk: "PRU001",
      jenisInstansi: "PERUSAHAAN",
      company: "PT Maju Bersama",
      alamat: "Jl. Sudirman No.1, Jakarta",
      telp: "02111111",
      lineOfBusiness: "Manufaktur",
    },
    {
      noInduk: "PRU002",
      jenisInstansi: "PERUSAHAAN",
      company: "PT Karya Indah",
      alamat: "Jl. Gatot Subroto No.5, Bekasi",
      telp: "02122222",
      lineOfBusiness: "Tekstil",
    },
    {
      noInduk: "PRU003",
      jenisInstansi: "PERUSAHAAN",
      company: "PT Energi Nusantara",
      alamat: "Jl. HR Rasuna Said, Jakarta",
      telp: "02133333",
      lineOfBusiness: "Energi",
    },
    {
      noInduk: "PRU004",
      jenisInstansi: "PERUSAHAAN",
      company: "PT Sejahtera Abadi",
      alamat: "Jl. Raya Bogor No.10, Depok",
      telp: "02144444",
      lineOfBusiness: "Logistik",
    },
    // RUMAH_SAKIT
    {
      noInduk: "RS001",
      jenisInstansi: "RUMAH_SAKIT",
      company: "RS Harapan Sehat",
      alamat: "Jl. Kesehatan No.3, Bandung",
      telp: "02255555",
    },
    {
      noInduk: "RS002",
      jenisInstansi: "RUMAH_SAKIT",
      company: "RS Bunda Kasih",
      alamat: "Jl. Dr. Soetomo No.8, Surabaya",
      telp: "03166666",
    },
    // PEMDA
    {
      noInduk: "PMD001",
      jenisInstansi: "PEMDA",
      company: "Pemda Kab. Bogor",
      alamat: "Jl. Tegar Beriman, Bogor",
      telp: "02577777",
      kotaKabupaten: "Bogor",
      provinsi: "Jawa Barat",
    },
    {
      noInduk: "PMD002",
      jenisInstansi: "PEMDA",
      company: "Pemda Kota Semarang",
      alamat: "Jl. Pemuda No.1, Semarang",
      telp: "02488888",
      kotaKabupaten: "Semarang",
      provinsi: "Jawa Tengah",
    },
    {
      noInduk: "PMD003",
      jenisInstansi: "PEMDA",
      company: "Pemda Kab. Tangerang",
      alamat: "Jl. Tigaraksa, Tangerang",
      telp: "02199999",
      kotaKabupaten: "Tangerang",
      provinsi: "Banten",
    },
    // INSTANSI_DAERAH
    {
      noInduk: "INS001",
      jenisInstansi: "INSTANSI_DAERAH",
      company: "Dinas LH Kota Depok",
      alamat: "Jl. Margonda Raya, Depok",
      telp: "02100001",
      instansi: "Dinas Lingkungan Hidup",
    },
    {
      noInduk: "INS002",
      jenisInstansi: "INSTANSI_DAERAH",
      company: "BPLHD Provinsi Jabar",
      alamat: "Jl. Naripan No.25, Bandung",
      telp: "02200002",
      instansi: "BPLHD",
    },
    // SEKOLAH
    {
      noInduk: "SKL001",
      jenisInstansi: "SEKOLAH",
      company: "SMK Teknologi Maju",
      alamat: "Jl. Pendidikan No.5, Bekasi",
      telp: "02100003",
      pemilik: "Yayasan Maju",
      yayasan: "YPT Maju",
    },
    {
      noInduk: "SKL002",
      jenisInstansi: "SEKOLAH",
      company: "SMA Negeri 1 Bogor",
      alamat: "Jl. Pajajaran No.12, Bogor",
      telp: "02500004",
      pemilik: "Negeri",
      subKategori: "SMA",
    },
    {
      noInduk: "SKL003",
      jenisInstansi: "SEKOLAH",
      company: "Universitas Nusantara",
      alamat: "Jl. Raya Kampus No.1, Depok",
      telp: "02100005",
      pemilik: "Swasta",
      subKategori: "Perguruan Tinggi",
    },
    {
      noInduk: "PRU005",
      jenisInstansi: "PERUSAHAAN",
      company: "PT Global Teknindo",
      alamat: "Jl. TB Simatupang No.20, Jaksel",
      telp: "02100006",
      lineOfBusiness: "IT",
    },
  ];

  for (const data of perusahaanData) {
    await prisma.tabPerusahaan.upsert({
      where: { noInduk: data.noInduk },
      update: {},
      create: data,
    });
  }
  console.log("✅ Perusahaan selesai");

  // ==============================
  // 4. CONTACT PERSON (per perusahaan)
  // ==============================
  const cpData = [
    {
      kodePerusahaan: "PRU001",
      nama: "Hendra Wijaya",
      jabatan: "HRD Manager",
      hp: "08131111111",
      email: "hendra@majubersama.com",
    },
    {
      kodePerusahaan: "PRU002",
      nama: "Rina Marlina",
      jabatan: "Direktur",
      hp: "08132222222",
      email: "rina@karyaindah.com",
    },
    {
      kodePerusahaan: "RS001",
      nama: "dr. Hadi S.",
      jabatan: "Direktur RS",
      hp: "08133333333",
      email: "hadi@harapansehat.com",
    },
    {
      kodePerusahaan: "PMD001",
      nama: "Drs. Sutrisno",
      jabatan: "Kepala Dinas LH",
      hp: "08134444444",
      email: "sutrisno@pemda-bogor.go.id",
    },
    {
      kodePerusahaan: "SKL001",
      nama: "Ibu Sunarti",
      jabatan: "Kepala Sekolah",
      hp: "08135555555",
      email: "sunarti@smkmaju.sch.id",
    },
  ];

  for (const cp of cpData) {
    await prisma.contactPersonPerusahaan.create({ data: cp }).catch(() => {});
    // pakai catch biar ga error kalau re-run
  }
  console.log("✅ Contact Person selesai");

  // ==============================
  // 5. JUDUL TRAINING (template)
  // ==============================
  const judulList = [
    {
      kode: "K3-001",
      judulTraining: "K3 Umum",
      tipe: "publik",
      hari: 2,
      biayaOffline: 3500000,
      biayaOnline: 2500000,
      batch: 1,
    },
    {
      kode: "LH-001",
      judulTraining: "AMDAL Dasar",
      tipe: "publik",
      hari: 3,
      biayaOffline: 4500000,
      biayaOnline: 3500000,
      batch: 1,
    },
    {
      kode: "LH-002",
      judulTraining: "Pengelolaan Limbah B3",
      tipe: "inhouse",
      hari: 2,
      biayaOffline: 5000000,
      biayaOnline: 4000000,
      batch: 1,
    },
    {
      kode: "ISO-001",
      judulTraining: "ISO 14001 Awareness",
      tipe: "publik",
      hari: 2,
      biayaOffline: 3000000,
      biayaOnline: 2000000,
      batch: 1,
    },
    {
      kode: "ENE-001",
      judulTraining: "Audit Energi",
      tipe: "publik",
      hari: 3,
      biayaOffline: 4000000,
      biayaOnline: 3000000,
      batch: 1,
    },
  ];

  for (const judul of judulList) {
    await prisma.judulTraining.upsert({
      where: { kode: judul.kode },
      update: {},
      create: judul,
    });
  }
  console.log("✅ Judul Training selesai");

  // ==============================
  // 6. JADWAL TRAINING
  // ==============================
  const jadwalList = [
    {
      noJadwal: "JDW-2025-001",
      kodePelatihan: "K3-001",
      tglMulai: new Date("2025-07-10"),
      tglSelesai: new Date("2025-07-11"),
      judulLengkap: "Pelatihan K3 Umum Batch 1 2025",
      judulPendek: "K3 Umum",
      metode: "offline",
      kota: "Jakarta",
      lokasiDetail: "Hotel Santika Jakarta",
      biaya: 3500000,
      jenisTraining: "publik",
      status: "TERKONFIRMASI",
      updateOleh: pegawaiList[0].id,
    },
    {
      noJadwal: "JDW-2025-002",
      kodePelatihan: "LH-001",
      tglMulai: new Date("2025-07-15"),
      tglSelesai: new Date("2025-07-17"),
      judulLengkap: "Pelatihan AMDAL Dasar Batch 1 2025",
      judulPendek: "AMDAL Dasar",
      metode: "online",
      kota: "Online",
      biaya: 3500000,
      jenisTraining: "publik",
      status: "TERKONFIRMASI",
      updateOleh: pegawaiList[0].id,
    },
    {
      noJadwal: "JDW-2025-003",
      kodePelatihan: "ISO-001",
      tglMulai: new Date("2025-08-05"),
      tglSelesai: new Date("2025-08-06"),
      judulLengkap: "ISO 14001 Awareness Batch 1 2025",
      judulPendek: "ISO 14001",
      metode: "offline",
      kota: "Bandung",
      lokasiDetail: "Hotel Papandayan Bandung",
      biaya: 3000000,
      jenisTraining: "publik",
      status: "TERKONFIRMASI",
      updateOleh: pegawaiList[2].id,
    },
  ];

  for (const jadwal of jadwalList) {
    await prisma.jadwalTraining.upsert({
      where: { noJadwal: jadwal.noJadwal },
      update: {},
      create: jadwal,
    });
  }
  console.log("✅ Jadwal Training selesai");

  // ==============================
  // 7. TRAINER
  // ==============================
  const trainerList = [
    {
      kode: "TR-001",
      nama: "Prof. Dr. Bambang S.",
      subjekKhusus: "K3 & Lingkungan",
      telp: "08161111111",
      email: "bambang@trainer.com",
    },
    {
      kode: "TR-002",
      nama: "Ir. Wulandari, MT",
      subjekKhusus: "AMDAL & ISO",
      telp: "08162222222",
      email: "wulan@trainer.com",
    },
  ];

  for (const t of trainerList) {
    await prisma.trainer.upsert({
      where: { kode: t.kode },
      update: {},
      create: t,
    });
  }
  console.log("✅ Trainer selesai");

  // ==============================
  // 8. TRAINER ON JADWAL (pivot)
  // ==============================
  const jadwalDb = await prisma.jadwalTraining.findMany();
  const trainerDb = await prisma.trainer.findMany();

  await prisma.trainerOnJadwal.createMany({
    data: [
      { jadwalId: jadwalDb[0].id, trainerKode: trainerDb[0].kode },
      { jadwalId: jadwalDb[1].id, trainerKode: trainerDb[1].kode },
      { jadwalId: jadwalDb[2].id, trainerKode: trainerDb[0].kode },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Trainer on Jadwal selesai");

  // ==============================
  // 9. PESERTA TRAINING
  // ==============================
  await prisma.pesertaTraining.createMany({
    data: [
      {
        nama: "Agus Setiawan",
        jabatan: "Staff HSE",
        noTelp: "08171111111",
        noIndukPerusahaan: "PRU001",
        noJadwal: "JDW-2025-001",
        status: "KONFIRMASI",
        metode: "offline",
        hargaTotal: 3500000,
        bayar: 3500000,
        inputOleh: pegawaiList[3].id,
      },
      {
        nama: "Maya Kusuma",
        jabatan: "Manager LH",
        noTelp: "08172222222",
        noIndukPerusahaan: "PRU002",
        noJadwal: "JDW-2025-001",
        status: "KONFIRMASI",
        metode: "offline",
        hargaTotal: 3500000,
        bayar: 3500000,
        inputOleh: pegawaiList[3].id,
      },
      {
        nama: "Eko Prabowo",
        jabatan: "Supervisor",
        noTelp: "08173333333",
        noIndukPerusahaan: "RS001",
        noJadwal: "JDW-2025-002",
        status: "PENDING",
        metode: "online",
        hargaTotal: 3500000,
        inputOleh: pegawaiList[3].id,
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Peserta Training selesai");

  // ==============================
  // 10. DAILY ACTIVITY
  // ==============================
  await prisma.dailyActivity.createMany({
    data: [
      {
        pegawaiId: pegawaiList[3].id,
        perusahaanId: "PRU001",
        kontak: "Hendra Wijaya",
        jenisTraining: "K3 Umum",
        keterangan: "Follow up pendaftaran peserta",
        kategori: "FOLLOW_UP",
        inout: "OUT",
        tanggal: "2025-07-01",
        perusahaan: "PT Maju Bersama",
      },
      {
        pegawaiId: pegawaiList[3].id,
        perusahaanId: "PRU002",
        kontak: "Rina Marlina",
        jenisTraining: "AMDAL Dasar",
        keterangan: "Presentasi program training",
        kategori: "PRESENTASI",
        inout: "OUT",
        tanggal: "2025-07-02",
        perusahaan: "PT Karya Indah",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Daily Activity selesai");

  // ==============================
  // 11. BERITA
  // ==============================
  await prisma.berita.createMany({
    data: [
      {
        periode: new Date("2025-07-01"),
        isi: "Jadwal training K3 bulan Juli 2025 telah dibuka. Segera daftarkan peserta Anda.",
      },
      {
        periode: new Date("2025-08-01"),
        isi: "Pelatihan AMDAL batch kedua akan dilaksanakan pada Agustus 2025 di Bandung.",
      },
    ],
  });
  console.log("✅ Berita selesai");

  console.log("\n🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
