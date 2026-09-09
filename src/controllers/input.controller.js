const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// GET LIST PESERTA BY JADWAL
// ─────────────────────────────────────────────

const getPesertaTraining = async (req, res) => {
  try {
    const { noJadwal } = req.params;
    const { page = 1, limit = 10, search = "", status, final } = req.query;

    if (!noJadwal) {
      return res.status(400).json({ message: "noJadwal wajib diisi." });
    }

    const jadwal = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
      select: {
        noJadwal: true,
        metode: true,
        biaya: true,
        status: true,
        jenisTraining: true,
        kodePelatihan: true,
        lokasiDetail: true,
        judulLengkap: true,
        catatan: true,
        tglMulai: true,
        tglSelesai: true,
        kota: true,
        peserta: {
          select: {
            metode: true, // untuk hitung fix offline / online
          },
        },
      },
    });

    if (!jadwal) {
      return res
        .status(404)
        .json({ message: "Jadwal Training tidak ditemukan." });
    }

    const pesertaFixOffline = jadwal.peserta.filter(
      (p) => p.metode === "Offline",
    ).length;
    const pesertaFixOnline = jadwal.peserta.filter(
      (p) => p.metode === "Online",
    ).length;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      noJadwal,
      AND: [
        ...(status
          ? [{ status: { equals: status, mode: "insensitive" } }]
          : []),
        ...(final !== undefined
          ? [{ statusFinal: final === "true" }]
          : []),
        ...(search
          ? [
              {
                OR: [
                  { nama: { contains: search, mode: "insensitive" } },
                  { accExecutive: { contains: search, mode: "insensitive" } },
                  {
                    perusahaan: {
                      company: { contains: search, mode: "insensitive" },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    const [total, peserta] = await Promise.all([
      prisma.pesertaTraining.count({ where }),
      prisma.pesertaTraining.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { tglInput: "desc" },
        select: {
          id: true,
          nama: true,
          perusahaan: { select: { noInduk: true, company: true } },
          accExecutive: true,
          ownEnv: true,
          status: true,
          ujian: true,
          konfirmasiOleh: true,
          konTgl: true,
          statusFinal: true,
          finalTgl: true,
          hargaTotal: true,
          diskon: true,
          ppn: true,
          bayar: true,
          cashback: true,
          infoPembayaran: true,
          catatan: true,
          tglInput: true,
          tglUpdate: true,
          pegawaiInput: { select: { id: true, nama: true } },
          pegawaiUpdate: { select: { id: true, nama: true } },
          pegawaiKonfirmasi: { select: { id: true, nama: true } },
          pegawaiFinal: { select: { id: true, nama: true } },
        },
      }),
    ]);

    // hitung sisa per peserta
    const pesertaWithSisa = peserta.map((p) => ({
      ...p,
      sisa: (p.hargaTotal ?? 0) - (p.bayar ?? 0),
    }));

    res.status(200).json({
      jadwal: {
        noJadwal: jadwal.noJadwal,
        metode: jadwal.metode,
        biaya: jadwal.biaya,
        status: jadwal.status,
        jenisTraining: jadwal.jenisTraining,
        kodePelatihan: jadwal.kodePelatihan,
        lokasiDetail: jadwal.lokasiDetail,
        judulLengkap: jadwal.judulLengkap,
        catatan: jadwal.catatan,
        tglMulai: jadwal.tglMulai,
        tglSelesai: jadwal.tglSelesai,
        kota: jadwal.kota,
        pesertaFixOffline,
        pesertaFixOnline,
      },
      data: pesertaWithSisa,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// CREATE PESERTA TRAINING
// ─────────────────────────────────────────────

const createPesertaTraining = async (req, res) => {
  try {
    const { noJadwal } = req.params;
    const {
      nama,
      jabatan,
      alamat,
      noTelp,
      noFax,
      email,
      alamatPengirimanSertifikat,
      catatan,
      industri,
      status,
      ownEnv,
      metode,
      noIndukPerusahaan,
      accExecutive,
      ujian,
      noInvUjian,
      noKwtUjian,
      diskon,
      ppn,
      cashback,
      hargaTotal,
      bayar,
      infoPembayaran,
      infoPenagihan,
      tglBayar,
      noInvoice,
      noKwitansi,
    } = req.body;

    const fileBuktiPembayaran =
      req.files?.fileBuktiPembayaran?.[0]?.path ?? null;
    const filePendaftaran = req.files?.filePendaftaran?.[0]?.path ?? null;

    const inputOleh = req.user?.userId;
    if (!inputOleh) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: inputOleh },
      select: { pegawaiId: true },
    });

    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    if (!noJadwal) {
      return res.status(400).json({ message: "noJadwal wajib diisi." });
    }

    const jadwal = await prisma.jadwalTraining.findUnique({
      where: { noJadwal },
    });
    if (!jadwal) {
      return res
        .status(404)
        .json({ message: "Jadwal Training tidak ditemukan." });
    }

    if (!noIndukPerusahaan) {
      return res
        .status(400)
        .json({ message: "noIndukPerusahaan wajib diisi." });
    }

    const perusahaan = await prisma.tabPerusahaan.findUnique({
      where: { noInduk: noIndukPerusahaan },
    });
    if (!perusahaan) {
      return res.status(404).json({ message: "Perusahaan tidak ditemukan." });
    }

    if (!nama) {
      return res.status(400).json({ message: "Nama peserta wajib diisi." });
    }

    const data = await prisma.pesertaTraining.create({
      data: {
        nama,
        jabatan,
        alamat,
        noTelp,
        noFax,
        email,
        alamatPengirimanSertifikat,
        catatan,
        industri,
        status,
        ownEnv,
        metode,
        accExecutive,
        noIndukPerusahaan,
        noJadwal,
        ujian: ujian ?? null,
        noInvUjian,
        noKwtUjian,
        diskon: diskon ? parseInt(diskon) : null,
        ppn: ppn ? parseInt(ppn) : null,
        cashback: cashback ? parseInt(cashback) : null,
        hargaTotal: hargaTotal ? parseInt(hargaTotal) : null,
        bayar: bayar ? parseInt(bayar) : null,
        infoPembayaran,
        infoPenagihan,
        tglBayar: tglBayar ? new Date(tglBayar) : null,
        noInvoice,
        noKwitansi,
        inputOleh: user.pegawaiId,
        fileBuktiPembayaran,
        filePendaftaran,
      },
      include: {
        perusahaan: { select: { noInduk: true, company: true } },
        pegawaiInput: { select: { id: true, nama: true } },
        jadwalTraining: { select: { noJadwal: true, judulLengkap: true } },
      },
    });

    res
      .status(201)
      .json({ message: "Peserta Training berhasil ditambahkan.", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE PESERTA TRAINING
// ─────────────────────────────────────────────

const updatePesertaTraining = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const {
      nama,
      jabatan,
      alamat,
      noTelp,
      noFax,
      email,
      alamatPengirimanSertifikat,
      catatan,
      industri,
      status,
      ownEnv,
      metode,
      noIndukPerusahaan,
      accExecutive,
      ujian,
      noInvUjian,
      noKwtUjian,
      diskon,
      ppn,
      cashback,
      hargaTotal,
      bayar,
      infoPembayaran,
      infoPenagihan,
      tglBayar,
      noInvoice,
      noKwitansi,
      konfirmasiOleh,
    } = req.body;

    const updateOlehId = req.user?.userId;
    if (!updateOlehId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: updateOlehId },
      select: { pegawaiId: true },
    });

    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const existing = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    const fileBuktiPembayaran =
      req.files?.fileBuktiPembayaran?.[0]?.path ?? existing.fileBuktiPembayaran;
    const filePendaftaran =
      req.files?.filePendaftaran?.[0]?.path ?? existing.filePendaftaran;

    // Validasi perusahaan jika diganti
    if (noIndukPerusahaan && noIndukPerusahaan !== existing.noIndukPerusahaan) {
      const perusahaan = await prisma.tabPerusahaan.findUnique({
        where: { noInduk: noIndukPerusahaan },
      });
      if (!perusahaan) {
        return res.status(404).json({ message: "Perusahaan tidak ditemukan." });
      }
    }

    // Validasi konfirmasiOleh jika diisi
    if (konfirmasiOleh) {
      const pegawaiKonf = await prisma.pegawai.findUnique({
        where: { id: konfirmasiOleh },
      });
      if (!pegawaiKonf) {
        return res
          .status(404)
          .json({ message: "Pegawai konfirmasi tidak ditemukan." });
      }
    }

    const data = await prisma.pesertaTraining.update({
      where: { id: parsedId },
      data: {
        nama: nama ?? existing.nama,
        jabatan: jabatan ?? existing.jabatan,
        alamat: alamat ?? existing.alamat,
        noTelp: noTelp ?? existing.noTelp,
        noFax: noFax ?? existing.noFax,
        email: email ?? existing.email,
        alamatPengirimanSertifikat:
          alamatPengirimanSertifikat ?? existing.alamatPengirimanSertifikat,
        catatan: catatan ?? existing.catatan,
        industri: industri ?? existing.industri,
        status: status ?? existing.status,
        ownEnv: ownEnv ?? existing.ownEnv,
        metode: metode ?? existing.metode,
        accExecutive: accExecutive ?? existing.accExecutive,
        noIndukPerusahaan: noIndukPerusahaan ?? existing.noIndukPerusahaan,
        ujian: ujian ?? existing.ujian,
        noInvUjian: noInvUjian ?? existing.noInvUjian,
        noKwtUjian: noKwtUjian ?? existing.noKwtUjian,
        diskon: diskon ? parseInt(diskon) : existing.diskon,
        ppn: ppn ? parseInt(ppn) : existing.ppn,
        cashback: cashback ? parseInt(cashback) : existing.cashback,
        hargaTotal: hargaTotal ? parseInt(hargaTotal) : existing.hargaTotal,
        bayar: bayar ? parseInt(bayar) : existing.bayar,
        infoPembayaran: infoPembayaran ?? existing.infoPembayaran,
        infoPenagihan: infoPenagihan ?? existing.infoPenagihan,
        tglBayar: tglBayar ? new Date(tglBayar) : existing.tglBayar,
        noInvoice: noInvoice ?? existing.noInvoice,
        noKwitansi: noKwitansi ?? existing.noKwitansi,
        updateOleh: user.pegawaiId,
        konfirmasiOleh:
          konfirmasiOleh && konfirmasiOleh !== ""
            ? konfirmasiOleh
            : existing.konfirmasiOleh,
        // masuk ke data update:
        fileBuktiPembayaran,
        filePendaftaran,
      },
      include: {
        perusahaan: { select: { noInduk: true, company: true } },
        pegawaiInput: { select: { id: true, nama: true } },
        pegawaiUpdate: { select: { id: true, nama: true } },
        pegawaiKonfirmasi: { select: { id: true, nama: true } },
        jadwalTraining: { select: { noJadwal: true, judulLengkap: true } },
      },
    });

    res
      .status(200)
      .json({ message: "Peserta Training berhasil diupdate.", data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE STATUS FINAL PESERTA
// Peserta yang statusnya Final = udah nyelesain training & berhak
// didaftarkan ke uji kompetensi (buat sertifikat LSP).
// ─────────────────────────────────────────────

const updateStatusFinalPeserta = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    // Default true — tombol "Peserta Final" di tabel manggil endpoint ini
    // tanpa body, tapi tetep bisa di-un-final-in dengan kirim { statusFinal: false }.
    const statusFinal =
      req.body?.statusFinal === undefined ? true : !!req.body.statusFinal;

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pegawaiId: true },
    });
    if (!user?.pegawaiId) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    const existing = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    const data = await prisma.pesertaTraining.update({
      where: { id: parsedId },
      data: statusFinal
        ? {
            statusFinal: true,
            finalTgl: new Date(),
            finalOleh: user.pegawaiId,
          }
        : {
            statusFinal: false,
            finalTgl: null,
            finalOleh: null,
          },
      include: {
        perusahaan: { select: { noInduk: true, company: true } },
        pegawaiFinal: { select: { id: true, nama: true } },
      },
    });

    res.status(200).json({
      message: statusFinal
        ? "Peserta berhasil ditandai Final."
        : "Status Final peserta dibatalkan.",
      data,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

// ─────────────────────────────────────────────
// BRIDGE: DAFTARKAN PESERTA (FINAL) KE UJI KOMPETENSI (LSP)
// Dipanggil dari tombol "Daftarkan ke Uji" di JadwalTraining yang jenisnya "UJI".
// ─────────────────────────────────────────────

const getSkemaKualifikasiOptions = async (req, res) => {
  try {
    const data = await prisma.skemaKualifikasi.findMany({
      orderBy: { kode: "asc" },
      select: { id: true, kode: true, nama: true },
    });
    res.status(200).json({ data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const createPesertaUjiFromTraining = async (req, res) => {
  try {
    const { pesertaTrainingId, skemaId } = req.body;

    const parsedPesertaId = parseInt(pesertaTrainingId);
    if (!pesertaTrainingId || isNaN(parsedPesertaId)) {
      return res
        .status(400)
        .json({ message: "pesertaTrainingId wajib diisi." });
    }

    const parsedSkemaId = parseInt(skemaId);
    if (!skemaId || isNaN(parsedSkemaId)) {
      return res.status(400).json({ message: "skemaId wajib diisi." });
    }

    const peserta = await prisma.pesertaTraining.findUnique({
      where: { id: parsedPesertaId },
      include: {
        perusahaan: { select: { company: true } },
      },
    });
    if (!peserta) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    if (!peserta.statusFinal) {
      return res.status(400).json({
        message:
          "Peserta belum berstatus Final, belum bisa didaftarkan ke uji kompetensi.",
      });
    }

    const skema = await prisma.skemaKualifikasi.findUnique({
      where: { id: parsedSkemaId },
    });
    if (!skema) {
      return res
        .status(404)
        .json({ message: "Skema kualifikasi tidak ditemukan." });
    }

    const data = await prisma.pesertaUji.create({
      data: {
        pesertaTrainingId: peserta.id,
        nama: peserta.nama,
        instansi:
          peserta.perusahaan?.company ??
          peserta.namaPerusahaan ??
          peserta.instansi ??
          null,
        email: peserta.email,
        wa: peserta.noHp ?? peserta.noTelp ?? null,
        skemaId: parsedSkemaId,
        status: "CALON",
      },
      include: {
        skema: { select: { id: true, kode: true, nama: true } },
        pesertaTraining: { select: { id: true, nama: true, noJadwal: true } },
      },
    });

    res.status(201).json({
      message: "Peserta berhasil didaftarkan ke uji kompetensi.",
      data,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const getPesertaTrainingById = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const data = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
      include: {
        perusahaan: {
          select: { noInduk: true, company: true, alamat: true, telp: true },
        },
        jadwalTraining: {
          select: {
            noJadwal: true,
            judulLengkap: true,
            judulPendek: true,
            metode: true,
            biaya: true,
            status: true,
            kodePelatihan: true,
            lokasiDetail: true,
            kota: true,
            tglMulai: true,
            tglSelesai: true,
            catatan: true,
          },
        },
        pegawaiInput: { select: { id: true, nama: true } },
        pegawaiUpdate: { select: { id: true, nama: true } },
        pegawaiKonfirmasi: { select: { id: true, nama: true } },
        pegawaiFinal: { select: { id: true, nama: true } },
      },
    });

    if (!data) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    const result = {
      ...data,
      sisa: (data.hargaTotal ?? 0) - (data.bayar ?? 0),
    };

    res.status(200).json({ data: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const updateBiodataPeserta = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const {
      nama,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      noIndukPerusahaan,
      jabatan,
      bidang,
      email,
      noHp,
    } = req.body;

    const existing = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
    });

    if (!existing) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    if (noIndukPerusahaan !== undefined) {
      const perusahaan = await prisma.tabPerusahaan.findUnique({
        where: { noInduk: noIndukPerusahaan },
      });
      if (!perusahaan) {
        return res.status(400).json({ message: "Perusahaan tidak ditemukan." });
      }
    }

    const dataUpdate = {};

    if (nama !== undefined) dataUpdate.nama = nama;
    if (tempatLahir !== undefined) dataUpdate.tempatLahir = tempatLahir;
    if (tanggalLahir !== undefined)
      dataUpdate.tanggalLahir = tanggalLahir ? new Date(tanggalLahir) : null;
    if (jenisKelamin !== undefined) dataUpdate.jenisKelamin = jenisKelamin;
    if (noIndukPerusahaan !== undefined)
      dataUpdate.noIndukPerusahaan = noIndukPerusahaan;
    if (jabatan !== undefined) dataUpdate.jabatan = jabatan;
    if (bidang !== undefined) dataUpdate.bidang = bidang;
    if (email !== undefined) dataUpdate.email = email;
    if (noHp !== undefined) dataUpdate.noHp = noHp;

    const updated = await prisma.pesertaTraining.update({
      where: { id: parsedId },
      data: dataUpdate,
      include: {
        perusahaan: {
          select: { noInduk: true, company: true, alamat: true, telp: true },
        },
        jadwalTraining: {
          select: {
            noJadwal: true,
            judulLengkap: true,
            judulPendek: true,
          },
        },
      },
    });

    res
      .status(200)
      .json({ message: "Biodata berhasil diperbarui.", data: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const getBiodataPeserta = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const data = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        nama: true,
        tempatLahir: true,
        tanggalLahir: true,
        jenisKelamin: true,
        jabatan: true,
        bidang: true,
        email: true,
        noHp: true,
        noIndukPerusahaan: true,
        perusahaan: {
          select: {
            noInduk: true,
            company: true,
            alamat: true,
            telp: true,
          },
        },
      },
    });

    if (!data) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    res.status(200).json({ data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const getEvaluasiContext = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const peserta = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        nama: true,
        noJadwal: true,
        jadwalTraining: {
          select: {
            noJadwal: true,
            judulLengkap: true,
            judulPendek: true,
            tglMulai: true,
            tglSelesai: true,
          },
        },
        evaluasi: {
          select: { id: true },
        },
      },
    });

    if (!peserta) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    res.status(200).json({
      data: {
        pesertaTrainingId: peserta.id,
        nama: peserta.nama,
        jadwalTraining: peserta.jadwalTraining,
        sudahMengisi: !!peserta.evaluasi,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * GET LIST JUDUL TRAINING (public)
 * Opsi checkbox "Pelatihan lain yang diminati"
 */
const getJudulTrainingOptions = async (req, res) => {
  try {
    const data = await prisma.judulTraining.findMany({
      select: {
        id: true,
        kode: true,
        judulTraining: true,
        tipe: true,
      },
      orderBy: { kode: "asc" },
    });

    res.status(200).json({ data });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

/**
 * CREATE EVALUASI PELATIHAN
 */
const createEvaluasiPelatihan = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId)) {
      return res.status(400).json({ message: "ID tidak valid." });
    }

    const {
      nilaiSistematikaMateri,
      nilaiTampilanSlide,
      nilaiAlokasiWaktu,
      nilaiPenerapanMateri,
      nilaiPeningkatanKompetensi,
      nilaiTrainer,
      manfaatUntukPeserta,
      manfaatUntukPerusahaan,
      divisiDisarankan,
      prosedurPengajuan,
      pelatihanDiminatiIds, // array of JudulTraining.id, misal [3, 15, 42]
    } = req.body;

    const peserta = await prisma.pesertaTraining.findUnique({
      where: { id: parsedId },
      include: { evaluasi: true },
    });

    if (!peserta) {
      return res
        .status(404)
        .json({ message: "Peserta Training tidak ditemukan." });
    }

    if (peserta.evaluasi) {
      return res
        .status(409)
        .json({ message: "Evaluasi untuk peserta ini sudah pernah diisi." });
    }

    const nilaiFields = {
      nilaiSistematikaMateri,
      nilaiTampilanSlide,
      nilaiAlokasiWaktu,
      nilaiPenerapanMateri,
      nilaiPeningkatanKompetensi,
      nilaiTrainer,
    };

    for (const [key, val] of Object.entries(nilaiFields)) {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        return res.status(400).json({
          message: `Field ${key} harus berupa angka 1-5.`,
        });
      }
    }

    let judulTrainingIds = [];
    if (Array.isArray(pelatihanDiminatiIds)) {
      judulTrainingIds = pelatihanDiminatiIds
        .map((v) => parseInt(v))
        .filter((v) => !isNaN(v));
    }

    const created = await prisma.evaluasiPelatihan.create({
      data: {
        pesertaTrainingId: parsedId,
        nilaiSistematikaMateri: Number(nilaiSistematikaMateri),
        nilaiTampilanSlide: Number(nilaiTampilanSlide),
        nilaiAlokasiWaktu: Number(nilaiAlokasiWaktu),
        nilaiPenerapanMateri: Number(nilaiPenerapanMateri),
        nilaiPeningkatanKompetensi: Number(nilaiPeningkatanKompetensi),
        nilaiTrainer: Number(nilaiTrainer),
        manfaatUntukPeserta: manfaatUntukPeserta || null,
        manfaatUntukPerusahaan: manfaatUntukPerusahaan || null,
        divisiDisarankan: divisiDisarankan || null,
        prosedurPengajuan: prosedurPengajuan || null,
        pelatihanDiminati: {
          create: judulTrainingIds.map((judulTrainingId) => ({
            judulTraining: { connect: { id: judulTrainingId } },
          })),
        },
      },
      include: {
        pelatihanDiminati: {
          include: { judulTraining: true },
        },
      },
    });

    res
      .status(201)
      .json({ message: "Evaluasi berhasil disimpan.", data: created });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ message: "Evaluasi untuk peserta ini sudah pernah diisi." });
    }
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

module.exports = {
  getPesertaTraining,
  updatePesertaTraining,
  createPesertaTraining,
  getPesertaTrainingById,
  updateStatusFinalPeserta,
  getSkemaKualifikasiOptions,
  createPesertaUjiFromTraining,
  updateBiodataPeserta,
  getBiodataPeserta,
  getEvaluasiContext,
  getJudulTrainingOptions,
  createEvaluasiPelatihan,
};
