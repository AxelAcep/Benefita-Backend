const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return { monday, friday };
}

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}

function getDayKey(dateStr) {
  const day = new Date(dateStr).getDay();
  return ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"][day];
}

const getMarketingActivity = async (req, res) => {
  try {
    const { monday, friday } = getCurrentWeekRange();
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

    const marketingUsers = await prisma.user.findMany({
      where: { role: { in: ["MARKETING_STAFF", "MARKETING_SEMENTARA"] } },
      include: { pegawai: true },
    });

    const pegawaiIds = marketingUsers.map((u) => u.pegawaiId);

    const mondayStr = monday.toISOString().split("T")[0];
    const fridayStr = friday.toISOString().split("T")[0];

    const [weekActivities, monthActivities, jadwalList] = await Promise.all([
      prisma.dailyActivity.findMany({
        where: {
          pegawaiId: { in: pegawaiIds },
          tanggal: { gte: mondayStr, lte: fridayStr },
        },
      }),
      prisma.dailyActivity.findMany({
        where: {
          pegawaiId: { in: pegawaiIds },
          kategori: { in: ["ENV", "CSR", "TSM", "EPM"] },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.jadwalTraining.findMany({
        where: {
          status: { in: ["TERKONFIRMASI", "TENTATIVE"] },
          tglMulai: { gte: monthStart, lte: monthEnd },
        },
        include: { peserta: true },
      }),
    ]);

    const data = marketingUsers.map((u) => {
      const { pegawai } = u;

      const harian = { senin: 0, selasa: 0, rabu: 0, kamis: 0, jumat: 0 };
      weekActivities
        .filter((a) => a.pegawaiId === pegawai.id)
        .forEach((a) => {
          const key = getDayKey(a.tanggal);
          if (key in harian) harian[key]++;
        });

      const kategori = { env: 0, csr: 0, tsm: 0, epm: 0 };
      monthActivities
        .filter((a) => a.pegawaiId === pegawai.id)
        .forEach((a) => {
          const key = a.kategori.toLowerCase();
          if (key in kategori) kategori[key]++;
        });

      let fix = 0;
      let ten = 0;
      jadwalList.forEach((j) => {
        const isAE = j.peserta.some((p) => p.accExecutive === pegawai.nama);
        if (!isAE) return;
        if (j.status === "TERKONFIRMASI") fix++;
        if (j.status === "TENTATIVE") ten++;
      });

      return {
        initial: pegawai.nama.charAt(0).toUpperCase(),
        name: pegawai.nama,
        ...harian,
        fix,
        ten,
        ...kategori,
        updateData: 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getKehadiran = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [semuaPegawai, izinHariIni] = await Promise.all([
      prisma.pegawai.findMany(),
      prisma.pengajuanIzin.findMany({
        where: {
          status: "DISETUJUI",
          tanggalMulai: { lte: todayEnd },
          tanggalSelesai: { gte: today },
        },
      }),
    ]);

    const izinMap = {};
    izinHariIni.forEach((i) => {
      izinMap[i.pegawaiId] = i.jenisIzin;
    });

    const attendanceData = semuaPegawai.map((p) => {
      const jenisIzin = izinMap[p.id];
      let status = "Masuk";
      if (jenisIzin === "SAKIT") status = "Sakit";
      else if (jenisIzin === "IZIN" || jenisIzin === "CUTI") status = "Izin";

      return {
        initial: p.nama.charAt(0).toUpperCase(),
        name: p.nama,
        divisi: p.departemen ?? "-",
        status,
      };
    });

    const masuk = attendanceData.filter((a) => a.status === "Masuk").length;
    const sakit = attendanceData.filter((a) => a.status === "Sakit").length;
    const izin = attendanceData.filter((a) => a.status === "Izin").length;

    res.json({
      success: true,
      data: {
        attendanceData,
        pieData: [
          { name: "Masuk", value: masuk, color: "#10b981" },
          { name: "Sakit", value: sakit, color: "#f87171" },
          { name: "Izin", value: izin, color: "#fbbf24" },
        ],
        total: semuaPegawai.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getJadwalFix = async (req, res) => {
  try {
    const { quarter } = req.query; // "Q1" | "Q2" | "Q3" | "Q4"

    const quarterMonths = {
      Q1: [1, 2, 3],
      Q2: [4, 5, 6],
      Q3: [7, 8, 9],
      Q4: [10, 11, 12],
    };

    const months = quarterMonths[quarter] ?? quarterMonths["Q1"];
    const year = new Date().getFullYear();

    // Ambil semua jadwal TERKONFIRMASI di quarter ini
    const startDate = new Date(year, months[0] - 1, 1);
    const endDate = new Date(
      year,
      months[months.length - 1],
      0,
      23,
      59,
      59,
      999,
    );

    const jadwalList = await prisma.jadwalTraining.findMany({
      where: {
        status: "TERKONFIRMASI",
        tglMulai: { gte: startDate, lte: endDate },
      },
      select: { tglMulai: true },
    });

    // Rakit data per bulan
    const monthNames = [
      "",
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    const data = months.map((m) => {
      // Isi 28 slot (4 minggu x 7 hari), null kalau tanggal > hari terakhir bulan
      const daysInMonth = new Date(year, m, 0).getDate();
      const values = Array.from({ length: 28 }, (_, i) => {
        const tanggal = i + 1;
        if (tanggal > daysInMonth) return null;

        // Hitung jadwal yang tglMulai = tanggal ini
        const count = jadwalList.filter((j) => {
          const d = new Date(j.tglMulai);
          return (
            d.getFullYear() === year &&
            d.getMonth() + 1 === m &&
            d.getDate() === tanggal
          );
        }).length;

        return count;
      });

      const totalFix = jadwalList.filter((j) => {
        const d = new Date(j.tglMulai);
        return d.getFullYear() === year && d.getMonth() + 1 === m;
      }).length;

      return {
        bulan: monthNames[m],
        values,
        totalFix,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getKalenderTraining = async (req, res) => {
  try {
    const { bulan, tahun, search } = req.query;

    const now = new Date();
    const targetMonth = bulan ? parseInt(bulan) : now.getMonth() + 1;
    const targetYear = tahun ? parseInt(tahun) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const jadwalList = await prisma.jadwalTraining.findMany({
      where: {
        tglMulai: { gte: startDate, lte: endDate },
        ...(search && {
          OR: [
            { judulLengkap: { contains: search, mode: "insensitive" } },
            { judulPendek: { contains: search, mode: "insensitive" } },
            { noJadwal: { contains: search, mode: "insensitive" } },
            { jenisTraining: { contains: search, mode: "insensitive" } },
            { kota: { contains: search, mode: "insensitive" } },
            { lokasiDetail: { contains: search, mode: "insensitive" } },
            { kodePelatihan: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        peserta: { select: { id: true } },
        trainers: { include: { trainer: { select: { nama: true } } } },
      },
      orderBy: { tglMulai: "asc" },
    });

    const data = jadwalList.map((j) => {
      // Tentukan hari apa tglMulai & tglSelesai
      const dayKeys = [
        "minggu",
        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu",
      ];
      const days = [];

      if (j.tglMulai && j.tglSelesai) {
        const cur = new Date(j.tglMulai);
        const end = new Date(j.tglSelesai);
        while (cur <= end) {
          const dayKey = dayKeys[cur.getDay()];
          if (["senin", "selasa", "rabu", "kamis", "jumat"].includes(dayKey)) {
            days.push({
              day: dayKey,
              code: j.kodePelatihan,
              category: mapKategori(j.kodePelatihan),
            });
          }
          cur.setDate(cur.getDate() + 1);
        }
      }

      // Tentukan lokasiType
      const metodeLower = j.metode?.toLowerCase() ?? "";
      const lokasiType = metodeLower.includes("online")
        ? "online"
        : metodeLower.includes("hybrid")
          ? "hybrid"
          : "hotel";

      // TEN & FIX dari peserta (bisa disesuaikan nanti)
      const totalPeserta = j.peserta.length;
      const trainers = j.trainers.map((t) => t.trainer.nama);

      return {
        judul: j.judulLengkap,
        noJadwal: j.noJadwal,
        jenis: j.jenisTraining,
        status: j.status,
        isHot: totalPeserta >= 20,
        metode: j.metode,
        lokasi: j.kota,
        lokasiType,
        lokasiDetail: j.lokasiDetail ?? j.kota,
        biaya: j.biaya,
        ten: 0, // bisa diisi dari PesertaTraining nanti
        fix: totalPeserta,
        peserta: totalPeserta,
        trainers,
        tglMulai: j.tglMulai,
        tglSelesai: j.tglSelesai,
        days,
      };
    });

    res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper: map kode pelatihan ke kategori
function mapKategori(kode = "") {
  const k = kode.toUpperCase();
  if (k.startsWith("CSR")) return "CSR";
  if (k.startsWith("TSM")) return "TSM";
  if (k.startsWith("EPM")) return "EPM";
  return "WM";
}

module.exports = {
  getMarketingActivity,
  getKehadiran,
  getJadwalFix,
  getKalenderTraining,
};
