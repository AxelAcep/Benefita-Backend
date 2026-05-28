const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Controller to get a paginated and searchable list of TabPerusahaan
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getTabPerusahaanList = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", jenisInstansi } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const offset = (pageNumber - 1) * pageSize;

    const where = {
      jenisInstansi: jenisInstansi || "PERUSAHAAN",
      OR: [
        { company: { contains: search, mode: "insensitive" } },
        { alamat: { contains: search, mode: "insensitive" } },
        { telp: { contains: search, mode: "insensitive" } },
      ],
    };

    const [data, total] = await Promise.all([
      prisma.tabPerusahaan.findMany({
        where,
        select: {
          noInduk: true,
          company: true,
          alamat: true,
          telp: true,
          email: true,
          jenisInstansi: true,
        },
        skip: offset,
        take: pageSize,
        orderBy: {
          company: "asc",
        },
      }),

      prisma.tabPerusahaan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        totalPages,
        currentPage: pageNumber,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching TabPerusahaan list:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the data.",
    });
  }
};

const createTabPerusahaan = async (req, res) => {
  try {
    const {
      noInduk,
      company,
      idSimpel,
      jenisInstansi = "PERUSAHAAN",

      // shared (dipakai semua / sebagian)
      alamat,
      alamatWaktu,
      alamatFactory,
      alamatFactoryWaktu,

      iso9000,
      iso14000,
      ohsas18001smk3,

      kategoriCpn,
      lineOfBusiness,
      lineBisnisSub,
      permodalan,

      nilaiSubBidangProper,
      batasEmas,
      batasHijau,
      fasilitas,
      infoKeu,
      ket,
      group,
      bdoAction,
      prioritasMa,
      prioritasAe,
      vendor,

      cabangSite,
      pesaing,
      butuhTraining,
      prosedurPelatihan,

      telp,
      fax,
      email,

      // PEMDA
      kotaKabupaten,
      provinsi,
      instansi,
      sekilasLh,
      rsud,
      indPengolahan,
      pertambangan,
      listrikGasAirBersih,
      hotelResto,
      angkutTrans,
      bangunan,
      pertanian,
      keuangan,
      laut,
      jasa,

      // INSTANSI DAERAH
      kode,
      tender1,
      tender2,
      tender3,
      pelatihanDiikuti,

      // SEKOLAH
      pemilik,
      yayasan,
      subKategori,
      cpSekolah,
    } = req.body;

    // validasi basic
    if (!noInduk || !company) {
      return res.status(400).json({ message: "noInduk & company wajib" });
    }

    const allowed = [
      "PERUSAHAAN",
      "RUMAH_SAKIT",
      "PEMDA",
      "INSTANSI_DAERAH",
      "SEKOLAH",
    ];

    if (!allowed.includes(jenisInstansi)) {
      return res.status(400).json({ message: "jenisInstansi tidak valid" });
    }

    const exist = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (exist) {
      return res.status(409).json({ message: "noInduk sudah ada" });
    }

    const now = new Date();
    const userId = req.user?.userId ?? "system";

    let userName = "system";

    if (userId !== "system") {
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { pegawai: { select: { nama: true } } },
      });

      if (u?.pegawai) userName = u.pegawai.nama;
    }

    const data = {
      // CORE
      noInduk,
      company,
      idSimpel: idSimpel ?? null,
      jenisInstansi,

      // COMMON
      alamat: alamat ?? null,
      alamatWaktu: alamatWaktu ?? "WIB",
      alamatFactory: alamatFactory ?? null,
      alamatFactoryWaktu: alamatFactoryWaktu ?? "-",

      telp: telp ?? null,
      fax: fax ?? null,
      email: email ?? null,

      fasilitas: fasilitas ?? null,
      ket: ket ?? null,
      group: group ?? null,
      butuhTraining: butuhTraining ?? "",
      prioritasMa: prioritasMa ?? null,
      prioritasAe: prioritasAe ?? null,

      // CLASSIFICATION
      kategoriCpn: kategoriCpn ?? null,
      lineOfBusiness: lineOfBusiness ?? null,
      lineBisnisSub: lineBisnisSub ?? null,
      permodalan: permodalan ?? null,

      // CERTIFICATION
      iso9000: iso9000 ?? null,
      iso14000: iso14000 ?? null,
      ohsas18001smk3: ohsas18001smk3 ?? null,

      // FINANCE
      nilaiSubBidangProper: nilaiSubBidangProper ?? 0,
      batasEmas: batasEmas ?? 0,
      batasHijau: batasHijau ?? 0,
      infoKeu: infoKeu ?? "",
      bdoAction: bdoAction ?? "",
      vendor: vendor ?? "",

      // EXTRA
      cabangSite: cabangSite ?? null,
      pesaing: pesaing ?? null,
      prosedurPelatihan: prosedurPelatihan ?? null,

      // PEMDA
      kotaKabupaten,
      provinsi,
      instansi,
      sekilasLh,
      rsud,
      indPengolahan,
      pertambangan,
      listrikGasAirBersih,
      hotelResto,
      angkutTrans,
      bangunan,
      pertanian,
      keuangan,
      laut,
      jasa,

      // INSTANSI DAERAH
      kode,
      tender1,
      tender2,
      tender3,
      pelatihanDiikuti,

      // SEKOLAH
      pemilik,
      yayasan,
      subKategori,
      cpSekolah,

      // SYSTEM
      inputter: userName,
      updatter: userName,
      dateInput: now,
      dateUpdate: now,

      accCsr: "",
      accTsm: "",
      accEpm: "",

      tglRecordCsr: "",
      tglRecordTsm: "",
      tglRecordEpm: "",

      recquestAcount: "",
      dateRecquestAcount: now,

      pesertaTot: 0,
      pesertaInh: 0,

      expiredVendor: now,
      indukKab: "",
      indukProv: "",
    };

    const result = await prisma.tabPerusahaan.create({ data });

    await prisma.hakAksesKaryawan.createMany({
      data: ["ENV", "CSR", "TSM", "EPM"].map((j) => ({
        perusahaanId: result.noInduk,
        jenisAkses: j,
        status: null,
        tanggalDibuat: now,
      })),
    });

    return res.status(201).json({
      message: "success",
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

const getOnePerusahaan = async (req, res) => {
  try {
    const { noInduk } = req.params;

    const data = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (!data) {
      return res.status(404).json({
        message: `Data ${noInduk} tidak ditemukan.`,
      });
    }

    const sertifikasiBnsp = {
      pppa: 1,
      popal: 2,
      pppu: 3,
      poippu: 4,
      limbahB3: 0,
      tpsLb3: 1,
      sampah3R: 0,
      pSampah: 0,
      aEnergi: 0,
      mEnergi: 0,
      pcua: 0,
      lca: 0,
    };

    // split response by type
    const base = {
      noInduk: data.noInduk,
      company: data.company,
      jenisInstansi: data.jenisInstansi,
    };

    let detail = {};

    switch (data.jenisInstansi) {
      case "PEMDA":
        detail = {
          kotaKabupaten: data.kotaKabupaten,
          provinsi: data.provinsi,
          instansi: data.instansi,
          sekilasLh: data.sekilasLh,
          sektor: {
            rsud: data.rsud,
            indPengolahan: data.indPengolahan,
            pertambangan: data.pertambangan,
            listrikGasAirBersih: data.listrikGasAirBersih,
            hotelResto: data.hotelResto,
            angkutTrans: data.angkutTrans,
            bangunan: data.bangunan,
            pertanian: data.pertanian,
            keuangan: data.keuangan,
            laut: data.laut,
            jasa: data.jasa,
          },
        };
        break;

      case "INSTANSI_DAERAH":
        detail = {
          kode: data.kode,
          kotaKabupaten: data.kotaKabupaten,
          provinsi: data.provinsi,
          instansi: data.instansi,
          tender: [data.tender1, data.tender2, data.tender3],
          pelatihanDiikuti: data.pelatihanDiikuti,
        };
        break;

      case "SEKOLAH":
        detail = {
          pemilik: data.pemilik,
          yayasan: data.yayasan,
          subKategori: data.subKategori,
          cpSekolah: data.cpSekolah,
        };
        break;

      default:
        detail = {
          alamat: data.alamat,
          telp: data.telp,
          email: data.email,
          fasilitas: data.fasilitas,
          kategoriCpn: data.kategoriCpn,
          lineOfBusiness: data.lineOfBusiness,
          lineBisnisSub: data.lineBisnisSub,
          permodalan: data.permodalan,
          nilaiSubBidangProper: data.nilaiSubBidangProper,
          batasEmas: data.batasEmas,
          batasHijau: data.batasHijau,
          infoKeu: data.infoKeu,
          bdoAction: data.bdoAction,
          vendor: data.vendor,
        };
    }

    return res.status(200).json({
      message: "success",
      data: {
        ...base,
        detail,
        sertifikasiBnsp,
      },
    });
  } catch (err) {
    console.error("[getOnePerusahaan]", err);
    return res.status(500).json({
      message: "server error",
    });
  }
};

// ─────────────────────────────────────────────
// UPDATE (EDIT)
// ─────────────────────────────────────────────

const updatePerusahaan = async (req, res) => {
  try {
    const { noInduk } = req.params;
    const body = req.body;

    const existing = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (!existing) {
      return res.status(404).json({
        message: `Data ${noInduk} tidak ditemukan.`,
      });
    }

    const now = new Date();
    const userId = req.user?.userId ?? "system";

    let userName = "system";

    if (userId !== "system") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { pegawai: { select: { nama: true } } },
      });

      if (user?.pegawai) userName = user.pegawai.nama;
    }

    const jenisInstansi = existing.jenisInstansi;

    const allowedFields = {
      COMMON: [
        "company",
        "alamat",
        "alamatWaktu",
        "alamatFactory",
        "alamatFactoryWaktu",
        "telp",
        "fax",
        "email",
        "ket",
        "fasilitas",
        "butuhTraining",
        "prioritasMa",
        "prioritasAe",
        "group",
      ],

      PERUSAHAAN: [
        "idSimpel",
        "kategoriCpn",
        "lineOfBusiness",
        "lineBisnisSub",
        "permodalan",
        "nilaiSubBidangProper",
        "batasEmas",
        "batasHijau",
        "infoKeu",
        "bdoAction",
        "vendor",
        "cabangSite",
        "pesaing",
        "prosedurPelatihan",
        "iso9000",
        "iso14000",
        "ohsas18001smk3",
      ],

      PEMDA: [
        "kotaKabupaten",
        "provinsi",
        "instansi",
        "sekilasLh",
        "rsud",
        "indPengolahan",
        "pertambangan",
        "listrikGasAirBersih",
        "hotelResto",
        "angkutTrans",
        "bangunan",
        "pertanian",
        "keuangan",
        "laut",
        "jasa",
      ],

      INSTANSI_DAERAH: [
        "kode",
        "tender1",
        "tender2",
        "tender3",
        "pelatihanDiikuti",
      ],

      SEKOLAH: ["pemilik", "yayasan", "subKategori", "cpSekolah"],
    };

    const validFields = new Set([
      ...allowedFields.COMMON,
      ...(allowedFields[jenisInstansi] || []),
    ]);

    const ignoredFields = ["updatter", "dateUpdate", "dateInput", "inputter"];

    const logs = [];

    for (const key in body) {
      if (ignoredFields.includes(key)) continue;
      if (!validFields.has(key)) continue;

      if (body[key] !== undefined && body[key] !== existing[key]) {
        logs.push({
          perusahaanId: noInduk,
          field: key.toUpperCase(),
          dataLama: existing[key] ?? "KOSONG",
          dataBaru: body[key] ?? "KOSONG",
          diubahOleh: userName,
          tanggal: now,
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.tabPerusahaan.update({
        where: { noInduk },
        data: {
          ...body,
          updatter: userName,
          dateUpdate: now,
        },
      });

      if (logs.length > 0) {
        await tx.logPerubahanPerusahaan.createMany({
          data: logs,
        });
      }

      return updated;
    });

    return res.status(200).json({
      message: "Data berhasil diupdate",
      data: result,
    });
  } catch (err) {
    console.error("[updatePerusahaan]", err);
    return res.status(500).json({
      message: "server error",
    });
  }
};

const getContactPersonList = async (req, res) => {
  try {
    const { noInduk } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = {
      kodePerusahaan: noInduk,
      ...(search && {
        OR: [
          { nama: { contains: search } },
          { jabatan: { contains: search } },
          { email: { contains: search } },
          { hp: { contains: search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.contactPersonPerusahaan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactPersonPerusahaan.count({ where }),
    ]);

    return res.status(200).json({
      message: "Data contact person berhasil diambil.",
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[getContactPersonList error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const createContactPerson = async (req, res) => {
  try {
    const { noInduk } = req.params;
    const {
      nama,
      teknisTertinggi,
      jabatan,
      hp,
      email,
      posisi,
      keuangan,
      minta,
      ket,
    } = req.body;

    // Validasi minimal
    if (!nama || !nama.trim()) {
      return res.status(400).json({ message: "Field 'nama' wajib diisi." });
    }

    // Cek perusahaan ada
    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (!perusahaan) {
      return res.status(404).json({
        message: `Perusahaan dengan kode ${noInduk} tidak ditemukan.`,
      });
    }

    const result = await prisma.contactPersonPerusahaan.create({
      data: {
        kodePerusahaan: noInduk,
        nama: nama.trim(),
        teknisTertinggi: Boolean(teknisTertinggi),
        jabatan: jabatan || null,
        hp: hp || null,
        email: email || null,
        posisi: posisi || null,
        keuangan: keuangan || null,
        minta: minta || null,
        ket: ket || null,
      },
    });

    return res.status(201).json({
      message: "Contact person berhasil ditambahkan.",
      data: result,
    });
  } catch (err) {
    console.error("[createContactPerson error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const updateContactPerson = async (req, res) => {
  try {
    const { noInduk, kode } = req.params;
    const body = req.body;

    // 1. Cek contact person ada & milik perusahaan ini
    const existing = await prisma.contactPersonPerusahaan.findUnique({
      where: { kode },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Contact person tidak ditemukan." });
    }

    if (existing.kodePerusahaan !== noInduk) {
      return res
        .status(403)
        .json({ message: "Contact person bukan milik perusahaan ini." });
    }

    // 2. Cari nama user yang merubah (Logic yang sama dengan updatePerusahaan)
    const userId = req.user?.userId ?? "system";
    let userName = "system";
    if (userId !== "system") {
      const userWithPegawai = await prisma.user.findUnique({
        where: { id: userId },
        select: { pegawai: { select: { nama: true } } },
      });
      if (userWithPegawai?.pegawai) userName = userWithPegawai.pegawai.nama;
    }

    // 3. Jalankan Transaksi
    const result = await prisma.$transaction(async (tx) => {
      const logs = [];
      const ignoredFields = [
        "updatedAt",
        "createdAt",
        "kode",
        "kodePerusahaan",
      ];

      // Bandingkan perubahan
      for (const key in body) {
        if (
          body[key] !== undefined &&
          !ignoredFields.includes(key) &&
          body[key] !== existing[key]
        ) {
          logs.push({
            perusahaanId: noInduk, // Tetap arahkan ke noInduk perusahaan
            field: `CP_${existing.nama}_${key.toUpperCase()}`, // Field name lebih deskriptif
            dataLama: existing[key] !== null ? String(existing[key]) : "KOSONG",
            dataBaru: body[key] !== null ? String(body[key]) : "KOSONG",
            diubahOleh: userName,
          });
        }
      }

      // Update Contact Person
      const updatedCP = await tx.contactPersonPerusahaan.update({
        where: { kode },
        data: {
          ...(body.nama !== undefined && { nama: body.nama.trim() }),
          ...(body.teknisTertinggi !== undefined && {
            teknisTertinggi: Boolean(body.teknisTertinggi),
          }),
          ...(body.jabatan !== undefined && { jabatan: body.jabatan || null }),
          ...(body.hp !== undefined && { hp: body.hp || null }),
          ...(body.email !== undefined && { email: body.email || null }),
          ...(body.posisi !== undefined && { posisi: body.posisi || null }),
          ...(body.keuangan !== undefined && {
            keuangan: body.keuangan || null,
          }),
          ...(body.minta !== undefined && { minta: body.minta || null }),
          ...(body.ket !== undefined && { ket: body.ket || null }),
        },
      });

      // Simpan Logs
      if (logs.length > 0) {
        await tx.logPerubahanPerusahaan.createMany({ data: logs });
      }

      return updatedCP;
    });

    return res.status(200).json({
      message: "Contact person berhasil diperbarui.",
      data: result,
    });
  } catch (err) {
    console.error("[updateContactPerson error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const deleteContactPerson = async (req, res) => {
  try {
    const { noInduk, kode } = req.params;

    // Cek contact person ada & milik perusahaan ini
    const existing = await prisma.contactPersonPerusahaan.findUnique({
      where: { kode },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Contact person tidak ditemukan.",
      });
    }

    if (existing.kodePerusahaan !== noInduk) {
      return res.status(403).json({
        message: "Contact person bukan milik perusahaan ini.",
      });
    }

    await prisma.contactPersonPerusahaan.delete({
      where: { kode },
    });

    return res.status(200).json({
      message: "Contact person berhasil dihapus.",
    });
  } catch (err) {
    console.error("[deleteContactPerson error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getOneContactPerson = async (req, res) => {
  try {
    const { noInduk, kode } = req.params;

    const contactPerson = await prisma.contactPersonPerusahaan.findUnique({
      where: { kode },
    });

    if (!contactPerson) {
      return res.status(404).json({
        message: "Contact person tidak ditemukan.",
      });
    }

    if (contactPerson.kodePerusahaan !== noInduk) {
      return res.status(403).json({
        message: "Contact person bukan milik perusahaan ini.",
      });
    }

    return res.status(200).json({
      message: "Data contact person berhasil diambil.",
      data: contactPerson,
    });
  } catch (err) {
    console.error("[getOneContactPerson error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getDailyActivityList = async (req, res) => {
  try {
    const { noInduk } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const where = {
      perusahaanId: noInduk,
      ...(search && {
        OR: [
          { kontak: { contains: search } },
          { jenisTraining: { contains: search } },
          { keterangan: { contains: search } },
          { kategori: { contains: search } },
          { perusahaan: { contains: search } },
          { pegawai: { nama: { contains: search } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.dailyActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pegawai: {
            select: {
              id: true,
              nama: true,
              jabatan: true,
            },
          },
        },
      }),
      prisma.dailyActivity.count({ where }),
    ]);

    return res.status(200).json({
      message: "Data daily activity berhasil diambil.",
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[getDailyActivityList error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getOneDailyActivity = async (req, res) => {
  try {
    const { noInduk, id } = req.params;

    const dailyActivity = await prisma.dailyActivity.findUnique({
      where: { id },
      include: {
        pegawai: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
    });

    if (!dailyActivity) {
      return res.status(404).json({
        message: "Daily activity tidak ditemukan.",
      });
    }

    if (dailyActivity.perusahaanId !== noInduk) {
      return res.status(403).json({
        message: "Daily activity bukan milik perusahaan ini.",
      });
    }

    return res.status(200).json({
      message: "Data daily activity berhasil diambil.",
      data: dailyActivity,
    });
  } catch (err) {
    console.error("[getOneDailyActivity error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const createDailyActivity = async (req, res) => {
  try {
    const { noInduk } = req.params;
    const {
      pegawaiId,
      kontak,
      jenisTraining,
      keterangan,
      kategori,
      inout,
      tanggal,
      perusahaan,
      dateTarget,
    } = req.body;

    // Validasi minimal
    if (!pegawaiId) {
      return res
        .status(400)
        .json({ message: "Field 'pegawaiId' wajib diisi." });
    }
    if (!kontak) {
      return res.status(400).json({ message: "Field 'kontak' wajib diisi." });
    }

    // Cek perusahaan ada
    const perusahaanExist = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (!perusahaanExist) {
      return res.status(404).json({
        message: `Perusahaan dengan kode ${noInduk} tidak ditemukan.`,
      });
    }

    // Cek pegawai ada
    const pegawaiExist = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
    });

    if (!pegawaiExist) {
      return res.status(404).json({
        message: `Pegawai dengan id ${pegawaiId} tidak ditemukan.`,
      });
    }

    const result = await prisma.dailyActivity.create({
      data: {
        perusahaanId: noInduk,
        pegawaiId,
        kontak: kontak || "",
        jenisTraining: jenisTraining || "",
        keterangan: keterangan || "",
        kategori: kategori || "",
        inout: inout || "",
        tanggal: tanggal || "",
        perusahaan: perusahaan || perusahaanExist.company || "",
        dateTarget: dateTarget ? new Date(dateTarget) : null,
      },
      include: {
        pegawai: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Daily activity berhasil ditambahkan.",
      data: result,
    });
  } catch (err) {
    console.error("[createDailyActivity error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const updateDailyActivity = async (req, res) => {
  try {
    const { noInduk, id } = req.params;
    const {
      pegawaiId,
      kontak,
      jenisTraining,
      keterangan,
      kategori,
      inout,
      tanggal,
      perusahaan,
      dateTarget,
    } = req.body;

    // Cek daily activity ada & milik perusahaan ini
    const existing = await prisma.dailyActivity.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Daily activity tidak ditemukan.",
      });
    }

    if (existing.perusahaanId !== noInduk) {
      return res.status(403).json({
        message: "Daily activity bukan milik perusahaan ini.",
      });
    }

    // Kalau pegawaiId diubah, validasi pegawai baru
    if (pegawaiId && pegawaiId !== existing.pegawaiId) {
      const pegawaiExist = await prisma.pegawai.findUnique({
        where: { id: pegawaiId },
      });
      if (!pegawaiExist) {
        return res.status(404).json({
          message: `Pegawai dengan id ${pegawaiId} tidak ditemukan.`,
        });
      }
    }

    const result = await prisma.dailyActivity.update({
      where: { id },
      data: {
        ...(pegawaiId !== undefined && { pegawaiId }),
        ...(kontak !== undefined && { kontak }),
        ...(jenisTraining !== undefined && { jenisTraining }),
        ...(keterangan !== undefined && { keterangan }),
        ...(kategori !== undefined && { kategori }),
        ...(inout !== undefined && { inout }),
        ...(tanggal !== undefined && { tanggal }),
        ...(perusahaan !== undefined && { perusahaan }),
        ...(dateTarget !== undefined && {
          dateTarget: dateTarget ? new Date(dateTarget) : null, // ← tambah
        }),
      },
      include: {
        pegawai: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Daily activity berhasil diperbarui.",
      data: result,
    });
  } catch (err) {
    console.error("[updateDailyActivity error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const deleteDailyActivity = async (req, res) => {
  try {
    const { noInduk, id } = req.params;

    // Cek daily activity ada & milik perusahaan ini
    const existing = await prisma.dailyActivity.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Daily activity tidak ditemukan.",
      });
    }

    if (existing.perusahaanId !== noInduk) {
      return res.status(403).json({
        message: "Daily activity bukan milik perusahaan ini.",
      });
    }

    await prisma.dailyActivity.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Daily activity berhasil dihapus.",
    });
  } catch (err) {
    console.error("[deleteDailyActivity error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getHakAksesPerusahaan = async (req, res) => {
  try {
    const { perusahaanId } = req.params;

    // ── Validasi input ──
    if (!perusahaanId) {
      return res.status(400).json({
        message: "ID perusahaan wajib diisi.",
      });
    }

    // ── Ambil data perusahaan ──
    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk: perusahaanId },
      select: {
        noInduk: true, // Kode perusahaan
        company: true, // Nama perusahaan
        idSimpel: true, // ID Simpel
        inputter: true, // Inputter (userId)
      },
    });

    if (!perusahaan) {
      return res.status(404).json({
        message: `Perusahaan dengan ID ${perusahaanId} tidak ditemukan.`,
      });
    }

    // ── Ambil nama inputter dari tabel Pegawai (relasi ke User) ──
    let inputterName = "Unknown";
    if (perusahaan.inputter) {
      const inputter = await prisma.user.findUnique({
        where: { id: perusahaan.inputter },
        select: {
          pegawai: {
            select: {
              nama: true,
            },
          },
        },
      });

      if (inputter?.pegawai?.nama) {
        inputterName = inputter.pegawai.nama;
      }
    }

    // ── Ambil data hak akses perusahaan ──
    const akses = await prisma.hakAksesKaryawan.findMany({
      where: { perusahaanId },
      select: {
        jenisAkses: true,
        status: true,
        pegawai: {
          select: {
            id: true,
            nama: true,
            jabatan: true,
            kode: true,
            prefix: true,
          },
        },
      },
    });

    // ── Format response ──
    const response = {
      perusahaanId: perusahaan.noInduk,
      company: perusahaan.company,
      idSimpel: perusahaan.idSimpel,
      inputter: {
        userId: perusahaan.inputter,
        name: inputterName,
      },
      akses: akses.map((item) => ({
        jenisAkses: item.jenisAkses,
        status: item.status,
        pegawai: item.pegawai,
      })),
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("[getHakAksesPerusahaan error]", err);
    return res.status(500).json({
      message: "Terjadi kesalahan server.",
    });
  }
};

const editHakAksesPerusahaan = async (req, res) => {
  try {
    const { perusahaanId, akses } = req.body;

    // ── 1. Validasi Input Awal ──
    if (!perusahaanId || !akses || !Array.isArray(akses)) {
      return res
        .status(400)
        .json({ message: "perusahaanId dan akses (array) wajib diisi." });
    }

    const validJenisAkses = ["ENV", "CSR", "TSM", "EPM"];

    // ── 2. Cek Perusahaan & User yang Mengubah ──
    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk: perusahaanId },
      select: { noInduk: true, company: true },
    });

    if (!perusahaan) {
      return res.status(404).json({
        message: `Perusahaan dengan ID ${perusahaanId} tidak ditemukan.`,
      });
    }

    const userName = await getEditorName(req); // Pakai helper yang kita bikin tadi

    // ── 3. Jalankan Transaksi ──
    await prisma.$transaction(async (tx) => {
      for (const item of akses) {
        const { jenisAkses, pegawaiIds, status } = item;

        // Validasi Item
        if (!jenisAkses || !Array.isArray(pegawaiIds)) {
          throw new Error("Format item akses tidak valid.");
        }
        if (!validJenisAkses.includes(jenisAkses)) {
          throw new Error(`Jenis akses tidak valid: ${jenisAkses}`);
        }

        // A. Validasi Bisnis: Maksimal 4 pegawai per jenis akses
        if (pegawaiIds.length > 4) {
          throw new Error(
            `Jenis akses ${jenisAkses} tidak boleh memiliki lebih dari 4 pegawai.`,
          );
        }

        // B. Validasi Bisnis: Pegawai tidak boleh > 2 jenis akses di perusahaan ini
        for (const pegawaiId of pegawaiIds) {
          const existingAksesPegawai = await tx.hakAksesKaryawan.findMany({
            where: { perusahaanId, pegawaiId },
          });

          const isAlreadyInThisAkses = existingAksesPegawai.some(
            (a) => a.jenisAkses === jenisAkses,
          );

          if (existingAksesPegawai.length >= 2 && !isAlreadyInThisAkses) {
            throw new Error(
              `Pegawai dengan ID ${pegawaiId} sudah memiliki 2 jenis akses di perusahaan ini.`,
            );
          }
        }

        // C. LOGGING: Ambil Nama Lama vs Nama Baru
        const oldAkses = await tx.hakAksesKaryawan.findMany({
          where: { perusahaanId, jenisAkses },
          include: { pegawai: { select: { nama: true } } },
        });
        const namaLama =
          oldAkses
            .map((a) => a.pegawai.nama)
            .sort()
            .join(", ") || "KOSONG";

        const newPegawais = await tx.pegawai.findMany({
          where: { id: { in: pegawaiIds } },
          select: { nama: true },
        });
        const namaBaru =
          newPegawais
            .map((p) => p.nama)
            .sort()
            .join(", ") || "KOSONG";

        // Bandingkan dan catat log jika ada perubahan personil
        if (namaLama !== namaBaru) {
          await tx.logPerubahanPerusahaan.create({
            data: {
              perusahaanId,
              field: `AKSES_${jenisAkses}`,
              dataLama: namaLama,
              dataBaru: namaBaru,
              diubahOleh: userName,
            },
          });
        }

        // D. EKSEKUSI DATA: Delete & Create (Sinkronisasi)
        await tx.hakAksesKaryawan.deleteMany({
          where: { perusahaanId, jenisAkses },
        });

        if (pegawaiIds.length > 0) {
          await tx.hakAksesKaryawan.createMany({
            data: pegawaiIds.map((id) => ({
              perusahaanId,
              pegawaiId: id,
              jenisAkses,
              status: status,
              tanggalDibuat: new Date(),
            })),
          });
        }
      }
    });

    // ── 4. Ambil Data Terbaru untuk Response ──
    const updatedAkses = await prisma.hakAksesKaryawan.findMany({
      where: { perusahaanId },
      include: { pegawai: { select: { id: true, nama: true, jabatan: true } } },
    });

    const formattedAkses = validJenisAkses.map((jenis) => {
      const filtered = updatedAkses.filter((a) => a.jenisAkses === jenis);
      return {
        jenisAkses: jenis,
        status: filtered.length > 0 ? filtered[0].status : null,
        pegawai: filtered.map((f) => f.pegawai),
      };
    });

    return res.status(200).json({
      perusahaanId: perusahaan.noInduk,
      company: perusahaan.company,
      akses: formattedAkses,
    });
  } catch (err) {
    console.error("[editHakAksesPerusahaan error]", err);
    const errorMessage = err.message || "Terjadi kesalahan server.";

    // Identifikasi apakah ini error validasi yang kita buat (400) atau error database (500)
    const isValidationError =
      errorMessage.includes("tidak boleh memiliki") ||
      errorMessage.includes("sudah memiliki 2 jenis akses") ||
      errorMessage.includes("Format item") ||
      errorMessage.includes("tidak ditemukan");

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: errorMessage,
    });
  }
};

const getLogPerusahaan = async (req, res) => {
  try {
    const { perusahaanId } = req.params;
    const { page = 1, limit = 10, search = "" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const searchString = String(search || "").trim();

    // ── KUNCI PERBAIKAN DI SINI ──
    // Kita filter dulu mana yang bisa di-search pake 'contains'
    const whereClause = {
      perusahaanId,
      ...(searchString && {
        OR: [
          { field: { contains: searchString, mode: "insensitive" } },
          { diubahOleh: { contains: searchString, mode: "insensitive" } },
          // { dataLama: ... } dihapus karena tipenya JSON (Penyebab Error)
          // { dataBaru: ... } dihapus karena tipenya JSON (Penyebab Error)
        ],
      }),
    };

    // 1. Hitung total data
    const totalData = await prisma.logPerubahanPerusahaan.count({
      where: whereClause,
    });

    // 2. Ambil data
    const logs = await prisma.logPerubahanPerusahaan.findMany({
      where: whereClause,
      orderBy: { tanggal: "desc" },
      skip,
      take,
    });

    const totalPages = Math.ceil(totalData / take);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        totalData,
        totalPages,
        currentPage: Number(page),
        limit: take,
      },
    });
  } catch (err) {
    console.error("[getLogPerusahaan error]", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil history perubahan.",
    });
  }
};

// ── CREATE ──
const createPosPerusahaan = async (req, res) => {
  try {
    const { noInduk, nama, jabatan, acc, followUp } = req.body;

    if ((!noInduk || !nama || !jabatan, !acc)) {
      return res
        .status(400)
        .json({ message: "noInduk, nama, dan jabatan wajib diisi." });
    }

    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
      select: { noInduk: true, company: true },
    });
    if (!perusahaan)
      return res
        .status(404)
        .json({ message: `Perusahaan ${noInduk} tidak ditemukan.` });

    const userName = await getEditorName(req);

    const pos = await prisma.$transaction(async (tx) => {
      const created = await tx.tabPosPerusahaan.create({
        data: { noInduk, nama, jabatan, acc, followUp },
      });

      await tx.logPerubahanPerusahaan.create({
        data: {
          perusahaanId: noInduk,
          field: "POS_PERUSAHAAN",
          dataLama: null,
          dataBaru: { id: created.id, nama, jabatan, acc, followUp },
          diubahOleh: userName,
        },
      });

      return created;
    });

    return res.status(201).json(pos);
  } catch (err) {
    console.error("[createPosPerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── GET ──
const getPosPerusahaan = async (req, res) => {
  try {
    const { idPerusahaan } = req.params;

    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk: idPerusahaan },
      select: { noInduk: true },
    });
    if (!perusahaan)
      return res
        .status(404)
        .json({ message: `Perusahaan ${idPerusahaan} tidak ditemukan.` });

    const pos = await prisma.tabPosPerusahaan.findMany({
      where: { noInduk: idPerusahaan },
    });

    return res.status(200).json(pos);
  } catch (err) {
    console.error("[getPosPerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── UPDATE ──
const updatePosPerusahaan = async (req, res) => {
  try {
    const { idPerusahaan } = req.params;
    const { id, nama, jabatan, acc, followUp } = req.body;

    if (!id) return res.status(400).json({ message: "id pos wajib diisi." });

    const existing = await prisma.tabPosPerusahaan.findFirst({
      where: { id, noInduk: idPerusahaan },
    });
    if (!existing)
      return res.status(404).json({ message: "POS tidak ditemukan." });

    const userName = await getEditorName(req);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.tabPosPerusahaan.update({
        where: { id },
        data: {
          ...(nama && { nama }),
          ...(jabatan && { jabatan }),
          ...(acc && { acc }),
          ...(followUp !== undefined && { followUp }),
        },
      });

      await tx.logPerubahanPerusahaan.create({
        data: {
          perusahaanId: idPerusahaan,
          field: "POS_PERUSAHAAN",
          dataLama: {
            id: existing.id,
            nama: existing.nama,
            jabatan: existing.jabatan,
            followUp: existing.followUp,
          },
          dataBaru: {
            id: result.id,
            nama: result.nama,
            jabatan: result.jabatan,
            followUp: result.followUp,
          },
          diubahOleh: userName,
        },
      });

      return result;
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("[updatePosPerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── DELETE ──
const deletePosPerusahaan = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) return res.status(400).json({ message: "id pos wajib diisi." });

    const existing = await prisma.tabPosPerusahaan.findUnique({
      where: { id },
    });
    if (!existing)
      return res.status(404).json({ message: "POS tidak ditemukan." });

    const userName = await getEditorName(req);

    await prisma.$transaction(async (tx) => {
      await tx.tabPosPerusahaan.delete({ where: { id } });

      await tx.logPerubahanPerusahaan.create({
        data: {
          perusahaanId: existing.noInduk,
          field: "POS_PERUSAHAAN",
          dataLama: {
            id: existing.id,
            nama: existing.nama,
            jabatan: existing.jabatan,
            followUp: existing.followUp,
          },
          dataBaru: null,
          diubahOleh: userName,
        },
      });
    });

    return res.status(200).json({ message: "POS berhasil dihapus." });
  } catch (err) {
    console.error("[deletePosPerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const createPenawaran = async (req, res) => {
  try {
    const { kodePelatihan } = req.body;

    if (!kodePelatihan) {
      return res.status(400).json({ message: "kodePelatihan wajib diisi." });
    }

    const kodeArray = Array.isArray(kodePelatihan)
      ? kodePelatihan
      : JSON.parse(kodePelatihan);

    const penawaran = await prisma.penawaran.create({
      data: { kodePelatihan: kodeArray },
    });

    return res.status(201).json(penawaran);
  } catch (err) {
    console.error("[createPenawaran error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── GET ALL ──
const getPenawaran = async (req, res) => {
  try {
    const penawaran = await prisma.penawaran.findMany({
      orderBy: { tanggal: "desc" },
    });
    return res.status(200).json(penawaran);
  } catch (err) {
    console.error("[getPenawaran error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── GET BY ID ──
const getPenawaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const penawaran = await prisma.penawaran.findUnique({ where: { id } });
    if (!penawaran)
      return res.status(404).json({ message: "Penawaran tidak ditemukan." });
    return res.status(200).json(penawaran);
  } catch (err) {
    console.error("[getPenawaranById error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── UPDATE ──
const updatePenawaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { kodePelatihan, tanggal } = req.body;
    const file = req.file;

    const existing = await prisma.penawaran.findUnique({ where: { id } });
    if (!existing) {
      if (file) fs.unlinkSync(file.path);
      return res.status(404).json({ message: "Penawaran tidak ditemukan." });
    }

    const kodeArray = kodePelatihan
      ? Array.isArray(kodePelatihan)
        ? kodePelatihan
        : JSON.parse(kodePelatihan)
      : existing.kodePelatihan;

    // Hapus file lama kalau ada file baru
    if (file && existing.filePath && fs.existsSync(existing.filePath)) {
      fs.unlinkSync(existing.filePath);
    }

    const updated = await prisma.penawaran.update({
      where: { id },
      data: {
        kodePelatihan: kodeArray,
        ...(tanggal && { tanggal: new Date(tanggal) }),
        ...(file && { filePath: file.path }),
      },
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("[updatePenawaran error]", err);
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── DELETE ──
const deletePenawaran = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.penawaran.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Penawaran tidak ditemukan." });

    if (existing.filePath && fs.existsSync(existing.filePath)) {
      fs.unlinkSync(existing.filePath);
    }

    await prisma.penawaran.delete({ where: { id } });

    return res.status(200).json({ message: "Penawaran berhasil dihapus." });
  } catch (err) {
    console.error("[deletePenawaran error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── 1. CREATE (Pegawai Mengajukan) ──
const createPermohonanHakAkses = async (req, res) => {
  try {
    const { perusahaanId, jenisAkses } = req.body;
    const userId = req.user?.userId;

    if (!perusahaanId || !jenisAkses) {
      return res.status(400).json({
        message: "perusahaanId dan jenisAkses wajib diisi.",
      });
    }

    if (!validJenisAkses.includes(jenisAkses)) {
      return res.status(400).json({
        message: `jenisAkses tidak valid. Pilih: ${validJenisAkses.join(", ")}`,
      });
    }

    // Lookup pegawaiId dari userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pegawaiId: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }

    const pegawaiId = user.pegawaiId;

    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk: perusahaanId },
      select: { noInduk: true },
    });

    if (!perusahaan)
      return res.status(404).json({ message: "Perusahaan tidak ditemukan." });

    const pendingExist = await prisma.permohonanHakAkses.findFirst({
      where: { perusahaanId, pegawaiId, jenisAkses, terima: null },
    });
    if (pendingExist) {
      return res.status(400).json({
        message: "Sudah ada permohonan pending untuk jenis akses ini.",
      });
    }

    const aksesAktif = await prisma.hakAksesKaryawan.findMany({
      where: { perusahaanId, pegawaiId },
    });
    const sudahDiJenisIni = aksesAktif.some((a) => a.jenisAkses === jenisAkses);
    if (aksesAktif.length >= 2 && !sudahDiJenisIni) {
      return res.status(400).json({
        message: "Pegawai sudah memiliki 2 jenis akses di perusahaan ini.",
      });
    }

    const slotTerisi = await prisma.hakAksesKaryawan.count({
      where: { perusahaanId, jenisAkses },
    });
    if (slotTerisi >= 4) {
      return res
        .status(400)
        .json({ message: `Slot ${jenisAkses} di perusahaan ini sudah penuh.` });
    }

    const permohonan = await prisma.permohonanHakAkses.create({
      data: { perusahaanId, pegawaiId, jenisAkses },
      include: {
        perusahaan: { select: { noInduk: true, company: true } },
        pegawai: { select: { id: true, nama: true } },
      },
    });

    return res.status(201).json(permohonan);
  } catch (err) {
    console.error("[createPermohonanHakAkses error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── 2. GET ALL PAGINATION ──
const getPermohonanHakAkses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            {
              perusahaan: {
                company: { contains: search, mode: "insensitive" },
              },
            },
            {
              perusahaan: {
                noInduk: { contains: search, mode: "insensitive" },
              },
            },
            { pegawai: { nama: { contains: search, mode: "insensitive" } } },
            { jenisAkses: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, data] = await Promise.all([
      prisma.permohonanHakAkses.count({ where }),
      prisma.permohonanHakAkses.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { tanggal: "desc" },
        include: {
          perusahaan: { select: { noInduk: true, company: true } },
          pegawai: { select: { id: true, nama: true } },
        },
      }),
    ]);

    // Ambil pegawai yang sudah assign di jenis yang sama per permohonan
    const enriched = await Promise.all(
      data.map(async (item) => {
        const pegawaiAssigned = await prisma.hakAksesKaryawan.findMany({
          where: {
            perusahaanId: item.perusahaanId,
            jenisAkses: item.jenisAkses,
          },
          include: { pegawai: { select: { id: true, nama: true } } },
        });

        return {
          id: item.id,
          kodePerusahaan: item.perusahaan.noInduk,
          namaPerusahaan: item.perusahaan.company,
          jenisAkses: item.jenisAkses,
          pegawaiAssigned: pegawaiAssigned.map((a) => a.pegawai),
          pegawaiPengaju: item.pegawai,
          tanggal: item.tanggal,
          status:
            item.terima === null
              ? "pending"
              : item.terima
                ? "diterima"
                : "ditolak",
        };
      }),
    );

    return res.status(200).json({
      data: enriched,
      pagination: {
        totalData: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error("[getPermohonanHakAkses error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ── 3. TERIMA / TOLAK ──
const updateStatusPermohonan = async (req, res) => {
  try {
    const { id } = req.params;
    const { terima } = req.body;

    if (typeof terima !== "boolean") {
      return res.status(400).json({ message: "Field terima harus boolean." });
    }

    const permohonan = await prisma.permohonanHakAkses.findUnique({
      where: { id },
    });
    if (!permohonan)
      return res.status(404).json({ message: "Permohonan tidak ditemukan." });
    if (permohonan.terima !== null) {
      return res
        .status(400)
        .json({ message: "Permohonan sudah diproses sebelumnya." });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.permohonanHakAkses.update({
        where: { id },
        data: { terima },
        include: {
          perusahaan: { select: { noInduk: true, company: true } },
          pegawai: { select: { id: true, nama: true } },
        },
      });

      if (terima) {
        // Re-validasi saat approve
        const [slotTerisi, aksesAktif] = await Promise.all([
          tx.hakAksesKaryawan.count({
            where: {
              perusahaanId: permohonan.perusahaanId,
              jenisAkses: permohonan.jenisAkses,
            },
          }),
          tx.hakAksesKaryawan.findMany({
            where: {
              perusahaanId: permohonan.perusahaanId,
              pegawaiId: permohonan.pegawaiId,
            },
          }),
        ]);

        if (slotTerisi >= 4)
          throw new Error(
            `Slot ${permohonan.jenisAkses} sudah penuh saat approve.`,
          );

        const sudahDiJenisIni = aksesAktif.some(
          (a) => a.jenisAkses === permohonan.jenisAkses,
        );
        if (aksesAktif.length >= 2 && !sudahDiJenisIni) {
          throw new Error(
            "Pegawai sudah memiliki 2 jenis akses di perusahaan ini.",
          );
        }

        await tx.hakAksesKaryawan.create({
          data: {
            perusahaanId: permohonan.perusahaanId,
            pegawaiId: permohonan.pegawaiId,
            jenisAkses: permohonan.jenisAkses,
            tanggalDibuat: new Date(),
          },
        });
      }

      return result;
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error("[updateStatusPermohonan error]", err);
    const isValidation =
      err.message?.includes("penuh") || err.message?.includes("sudah memiliki");
    return res
      .status(isValidation ? 400 : 500)
      .json({ message: err.message || "Terjadi kesalahan server." });
  }
};

const validJenisAkses = ["ENV", "CSR", "TSM", "EPM"];

module.exports = {
  getTabPerusahaanList,
  createTabPerusahaan,
  getOnePerusahaan,
  updatePerusahaan,
  getContactPersonList,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
  getOneContactPerson,
  getDailyActivityList,
  getOneDailyActivity,
  createDailyActivity,
  updateDailyActivity,
  deleteDailyActivity,
  getHakAksesPerusahaan,
  editHakAksesPerusahaan,
  getLogPerusahaan,
  createPosPerusahaan,
  getPosPerusahaan,
  updatePosPerusahaan,
  deletePosPerusahaan,
  createPenawaran,
  getPenawaran,
  getPenawaranById,
  updatePenawaran,
  deletePenawaran,
  createPermohonanHakAkses,
  getPermohonanHakAkses,
  updateStatusPermohonan,
};

// Taruh ini di bagian atas file controller lo
const getEditorName = async (req) => {
  try {
    const userId = req.user?.userId;

    if (!userId) return "system";

    const userWithPegawai = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pegawai: {
          select: { nama: true },
        },
      },
    });

    return userWithPegawai?.pegawai?.nama || "system";
  } catch (error) {
    console.error("Error in getEditorName:", error);
    return "system";
  }
};
