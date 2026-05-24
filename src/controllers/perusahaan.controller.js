const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Controller to get a paginated and searchable list of TabPerusahaan
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getTabPerusahaanList = async (req, res) => {
  try {
    // Extract query parameters for pagination and search
    const { page = 1, limit = 10, search = "" } = req.query;

    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Calculate the offset for pagination
    const offset = (pageNumber - 1) * pageSize;

    // Query the database with pagination and search
    const [data, total] = await Promise.all([
      prisma.tabPerusahaan.findMany({
        where: {
          OR: [
            { company: { contains: search, mode: "insensitive" } },
            { alamat: { contains: search, mode: "insensitive" } },
            { telp: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          noInduk: true,
          company: true,
          alamat: true,
          telp: true,
        },
        skip: offset,
        take: pageSize,
      }),
      prisma.tabPerusahaan.count({
        where: {
          OR: [
            { company: { contains: search, mode: "insensitive" } },
            { alamat: { contains: search, mode: "insensitive" } },
            { telp: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    // Return the response
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

const createPerusahaan = async (req, res) => {
  try {
    const {
      // Card Perusahaan
      noInduk,
      company,
      idSimpel,

      // Card Lokasi
      alamat,
      alamatWaktu,
      alamatFactory,
      alamatFactoryWaktu,

      // Card Sertifikasi
      iso9000,
      iso14000,
      ohsas18001smk3,

      // Card Klasifikasi & Kepemilikan
      kategoriCpn,
      lineOfBusiness,
      lineBisnisSub,
      permodalan,

      // Card Properti & Finansial
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

      // Card Informasi Lainnya
      cabangSite,
      pesaing,
      butuhTraining,
      prosedurPelatihan,

      // Kontak
      telp,
      fax,
      email,
    } = req.body;

    // ── Validasi wajib ──
    if (!noInduk || !company) {
      return res.status(400).json({
        message: "noInduk dan company wajib diisi.",
      });
    }

    // ── Cek duplikat noInduk ──
    const existing = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (existing) {
      return res.status(409).json({
        message: `Perusahaan dengan kode ${noInduk} sudah ada.`,
      });
    }

    const now = new Date();
    const userId = req.user?.userId ?? "system";

    let userName = "system";
    if (userId !== "system") {
      const userWithPegawai = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          pegawai: {
            select: {
              nama: true,
            },
          },
        },
      });

      if (userWithPegawai?.pegawai) {
        userName = userWithPegawai.pegawai.nama;
      }
    }

    // Sekarang kamu punya userName yang bisa dipakai
    console.log("Nama user:", userName);

    // ── Buat perusahaan baru ──
    const perusahaan = await prisma.tabPerusahaan.create({
      data: {
        // Perusahaan
        noInduk,
        company,
        idSimpel: idSimpel ?? null,

        // Lokasi
        alamat: alamat ?? null,
        alamatWaktu: alamatWaktu ?? "WIB",
        alamatFactory: alamatFactory ?? null,
        alamatFactoryWaktu: alamatFactoryWaktu ?? "-",

        // Sertifikasi
        iso9000: iso9000 ?? null,
        iso14000: iso14000 ?? null,
        ohsas18001smk3: ohsas18001smk3 ?? null,

        // Klasifikasi
        kategoriCpn: kategoriCpn ?? null,
        lineOfBusiness: lineOfBusiness ?? null,
        lineBisnisSub: lineBisnisSub ?? null,
        permodalan: permodalan ?? null,

        // Properti & Finansial
        nilaiSubBidangProper: nilaiSubBidangProper ?? 0,
        batasEmas: batasEmas ?? 0,
        batasHijau: batasHijau ?? 0,
        fasilitas: fasilitas ?? null,
        infoKeu: infoKeu ?? "",
        ket: ket ?? null,
        group: group ?? null,
        bdoAction: bdoAction ?? "",
        prioritasMa: prioritasMa ?? null,
        prioritasAe: prioritasAe ?? null,
        vendor: vendor ?? "",

        // Informasi Lainnya
        cabangSite: cabangSite ?? null,
        pesaing: pesaing ?? null,
        butuhTraining: butuhTraining ?? "",
        prosedurPelatihan: prosedurPelatihan ?? null,

        telp: telp ?? null,
        fax: fax ?? null,
        email: email ?? null,

        // Field sistem — diisi otomatis
        inputter: userName,
        dateInput: now,
        updatter: userName,
        dateUpdate: now,
        proper: "",
        accCsr: "",
        accTsm: "",
        accEpm: "",
        infoKeu: infoKeu ?? "",
        tglInfoKeu: "",
        tglRecordCsr: "",
        tglRecordTsm: "",
        tglRecordEpm: "",
        recquestAcount: "",
        dateRecquestAcount: now,
        pesertaTot: 0,
        pesertaInh: 0,
        vendor: vendor ?? "",
        expiredVendor: now,
        indukKab: "",
        indukProv: "",
        subBidangProper: "",
      },
    });

    // ── Tambahkan slot akses default (ENV, CSR, TSM, EPM) ──
    const jenisAkses = ["ENV", "CSR", "TSM", "EPM"];
    const aksesData = jenisAkses.map((jenis) => ({
      perusahaanId: perusahaan.noInduk,
      jenisAkses: jenis,
      status: null, // Default status kosong
      tanggalDibuat: now,
    }));

    await prisma.hakAksesKaryawan.createMany({
      data: aksesData,
    });

    return res.status(201).json({
      message: "Data perusahaan berhasil dibuat beserta slot akses default.",
      data: perusahaan,
    });
  } catch (err) {
    console.error("[createPerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

const getOnePerusahaan = async (req, res) => {
  try {
    const { noInduk } = req.params;

    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (!perusahaan) {
      return res.status(404).json({
        message: `Perusahaan dengan kode ${noInduk} tidak ditemukan.`,
      });
    }

    // Sertifikasi BNSP — hardcode sementara
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

    return res.status(200).json({
      message: "Data perusahaan berhasil diambil.",
      data: {
        ...perusahaan,
        sertifikasiBnsp,
      },
    });
  } catch (err) {
    console.error("[getOnePerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ─────────────────────────────────────────────
// UPDATE (EDIT)
// ─────────────────────────────────────────────

const updatePerusahaan = async (req, res) => {
  try {
    const { noInduk } = req.params;
    const body = req.body; // Kita ambil body utuh buat diloop nanti

    // 1. Cek data lama (Existing)
    const existing = await prisma.tabPerusahaan.findUnique({
      where: { noInduk },
    });

    if (!existing) {
      return res.status(404).json({
        message: `Perusahaan dengan kode ${noInduk} tidak ditemukan.`,
      });
    }

    const now = new Date();
    const userId = req.user?.userId ?? "system";
    let userName = "system";

    // 2. Cari nama user yang merubah
    if (userId !== "system") {
      const userWithPegawai = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          pegawai: { select: { nama: true } },
        },
      });
      if (userWithPegawai?.pegawai) {
        userName = userWithPegawai.pegawai.nama;
      }
    }

    // 3. Eksekusi Update & Logging dalam satu Transaksi
    const result = await prisma.$transaction(async (tx) => {
      // List field yang mau kita abaikan (yang gak perlu masuk log history)
      const ignoredFields = ["updatter", "dateUpdate", "dateInput", "inputter"];
      const logs = [];

      // Bandingkan data lama vs data baru
      for (const key in body) {
        // Cek apakah field ada di model, bukan ignored, dan nilainya berubah
        if (
          body[key] !== undefined &&
          !ignoredFields.includes(key) &&
          body[key] !== existing[key]
        ) {
          logs.push({
            perusahaanId: noInduk,
            field: key.toUpperCase(),
            dataLama: existing[key] !== null ? String(existing[key]) : "KOSONG",
            dataBaru: body[key] !== null ? String(body[key]) : "KOSONG",
            diubahOleh: userName,
            tanggal: now,
          });
        }
      }

      // Jalankan Update Perusahaan
      const updatedData = await tx.tabPerusahaan.update({
        where: { noInduk },
        data: {
          ...body, // Prisma bakal otomatis ignore field yang gak ada di skema
          updatter: userName,
          dateUpdate: now,
        },
      });

      // Simpan Log Perubahan jika ada
      if (logs.length > 0) {
        await tx.logPerubahanPerusahaan.createMany({
          data: logs,
        });
      }

      return updatedData;
    });

    return res.status(200).json({
      message: "Data perusahaan berhasil diperbarui.",
      data: result,
    });
  } catch (err) {
    console.error("[updatePerusahaan error]", err);
    return res.status(500).json({ message: "Terjadi kesalahan server." });
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

module.exports = {
  getTabPerusahaanList,
  createPerusahaan,
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
