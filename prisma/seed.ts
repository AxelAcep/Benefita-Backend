// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const data = Array.from({ length: 20 }, (_, i) => ({
    noInduk: `PR${String(i + 1).padStart(5, "0")}`,
    company: `PT Perusahaan ${i + 1}`,
    alamat: `Jl. Contoh No. ${i + 1}, Jakarta`,
    alamatWaktu: "2026",
    kategoriCpn:
      i % 3 === 0 ? "Industri" : i % 3 === 1 ? "Energi" : "Manufaktur",
    alamatFactory: `Kawasan Industri Blok ${String.fromCharCode(65 + i)}, Bekasi`,
    alamatFactoryWaktu: "2026",
    telp: `021-${String(1000000 + i)}`,
    fax: i % 2 === 0 ? `021-${String(2000000 + i)}` : null,
    email: `info@perusahaan${i + 1}.co.id`,
    lineOfBusiness:
      i % 4 === 0
        ? "14-EPC & Prop"
        : i % 4 === 1
          ? "7-MM :MPJ"
          : i % 4 === 2
            ? "10-Energi"
            : "5-Otomotif",
    produksi: null,
    iso9000: i % 2 === 0 ? "Ya" : null,
    csrPr: null,
    iso14000: i % 3 === 0 ? "Ya" : null,
    proper:
      i % 5 === 0
        ? "Emas"
        : i % 5 === 1
          ? "Hijau"
          : i % 5 === 2
            ? "Biru"
            : i % 5 === 3
              ? "Merah"
              : "Hitam",
    ohsas18001smk3: null,
    group: null,
    tglRecord: "2026-01-01",
    acc: i % 4 === 0 ? "SL" : i % 4 === 1 ? "EE" : i % 4 === 2 ? "NW" : "MG",
    accCsr: "SL",
    accTsm: "SL",
    accEpm: "EE",
    ket: null,
    noGroup: null,
    groupInduk: null,
    infoKeu: "",
    tglInfoKeu: "",
    prioritasMa: null,
    prioritasAe: null,
    kd2: null,
    kd3: null,
    kd4: null,
    kd5: null,
    fasilitas: null,
    ims: null,
    khusus: null,
    region: i % 3 === 0 ? "Jakarta" : i % 3 === 1 ? "Jawa Barat" : "Jawa Timur",
    tglRecordEnv: "",
    tglRecordCsr: "",
    tglRecordTsm: "",
    tglRecordEpm: "",
    permodalan: null,
    inputter: "admin",
    dateInput: new Date(),
    updatter: "admin",
    dateUpdate: new Date(),
    recquestAcount: "",
    dateRecquestAcount: new Date(),
    pesertaTot: Math.floor(Math.random() * 50),
    pesertaInh: Math.floor(Math.random() * 20),
    butuhTraining: "",
    kirimPos: null,
    vendor: "",
    expiredVendor: new Date("2027-12-31"),
    indukKab: "",
    indukProv: "",
    bdoAction: "",
    subBidangProper: "",
    nilaiSubBidangProper: 0,
  }));

  for (const item of data) {
    await prisma.tabPerusahaan.upsert({
      where: { noInduk: item.noInduk },
      update: item,
      create: item,
    });
  }

  console.log("✅ Seed 20 data berhasil");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
