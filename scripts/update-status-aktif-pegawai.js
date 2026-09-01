/**
 * ONE-OFF SCRIPT — update statusAktif = true untuk sekumpulan Pegawai tertentu.
 *
 * Dibuat untuk migrasi data setelah field `statusAktif` (default false)
 * ditambahkan ke model Pegawai. List `PEGAWAI_IDS` di bawah adalah cuid
 * Pegawai yang sudah dikonfirmasi aktif.
 *
 * STATUS: SUDAH DIJALANKAN pada 2026-09-01 (36/36 record ter-update sukses,
 * sudah diverifikasi). Eksekusinya di-comment di bagian bawah file supaya
 * TIDAK ke-run lagi secara tidak sengaja di deployment berikutnya. Kalau
 * memang perlu run ulang secara sadar (mis. environment lain), un-comment
 * pemanggilan main() di paling bawah.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PEGAWAI_IDS = [
  "cmq67eg2w0023jc1cq2v2qets",
  "cmq67feia0027jc1chy4j53k6",
  "cmq67jqy60002jcs8cejwgbhd",
  "cmq67m7fm0000jc4wafuhw4j6",
  "cmq67oa800004jc4wzfnrwspn",
  "cmq67p4o30006jc4w3vp1um2l",
  "cmq67px7v0008jc4wr1hcindk",
  "cmq67qist000cjc4wq0nz96c3",
  "cmqs494kh000hjct8ts4fpfb9",
  "cmqs494lk000yjct8rglynesq",
  "cmqs494n8002kjct8t7fbx1ki",
  "cmqs494nb002ljct8zm1tfps0",
  "cmqs494nf002mjct8usizhlcn",
  "cmqs494nh002njct8ctgqss52",
  "cmqs494nk002ojct8tvpafqqa",
  "cmqs494nn002pjct8vxklqnn7",
  "cmqs494nq002qjct84tw98wmg",
  "cmqs494nt002rjct881nzu383",
  "cmqs494o2002vjct8q4p92r9f",
  "cmqs49x4g003bjcuouozl20q8",
  "cmqs4gajg0000jcd0evfyeg79",
  "cmqs4gak60006jcd0m2yt7ric",
  "cmqs4gakb0009jcd0wrpu7n4l",
  "cmqs4gakf000cjcd0ykjc31bw",
  "cmqs4gakj000fjcd0pnbh5kpw",
  "cmqs4gako000ijcd0fugwthx7",
  "cmqs4gal1000ojcd0wf1gmv1q",
  "cmqs4gala000ujcd0i3glommm",
  "cmqs4gamg001ijcd0rv0suu5j",
  "cmqs4ganl0026jcd0cg46nb6e",
  "cmqs4gant002cjcd0976dafmv",
  "cmqs4gaoy0039jcd0etxcvgqn",
  "cmqs4gap5003fjcd05xlop67f",
  "cmqs4gaph003ojcd0b6tf3ysk",
  "cmqs4gapp003ujcd02t2lxk43",
  "cmqs4gapx0040jcd0khj3da1w",
];

async function main() {
  console.log(`🔄 Update statusAktif = true untuk ${PEGAWAI_IDS.length} pegawai...`);

  const result = await prisma.pegawai.updateMany({
    where: { id: { in: PEGAWAI_IDS } },
    data: { statusAktif: true },
  });

  console.log(`✅ Selesai. ${result.count} record ter-update.`);

  if (result.count !== PEGAWAI_IDS.length) {
    console.warn(
      `⚠️ Jumlah ter-update (${result.count}) beda dengan jumlah id di list (${PEGAWAI_IDS.length}) — kemungkinan ada id yang tidak ditemukan di tabel Pegawai.`,
    );
  }
}

// Sudah dijalankan sekali (2026-09-01) — di-comment supaya tidak ke-run lagi
// di deployment berikutnya. Un-comment secara sadar kalau memang perlu.
// main()
//   .catch((e) => {
//     console.error("❌ Error saat update statusAktif:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
