const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Ambil semua Pegawai beserta User-nya
  const pegawaiList = await prisma.pegawai.findMany({
    include: {
      user: { select: { id: true, createdAt: true } },
    },
  });

  // Group by nama exact
  const grouped = {};
  for (const p of pegawaiList) {
    const nama = p.nama;
    if (!grouped[nama]) grouped[nama] = [];
    grouped[nama].push(p);
  }

  const successLog = [];
  const failedLog = [];

  for (const [nama, group] of Object.entries(grouped)) {
    if (group.length <= 1) continue;

    // Pisah yang punya user dan yang tidak
    const withUser = group.filter((p) => p.user !== null);
    const withoutUser = group.filter((p) => p.user === null);

    // Sort yang punya user by createdAt ASC, keep yang pertama
    withUser.sort((a, b) => a.user.createdAt - b.user.createdAt);

    // Yang di-keep: withUser[0] (paling lama), sisanya dihapus
    // Kalau tidak ada yang punya user, hapus semua (tidak ada yang di-keep)
    const toDelete = [...withoutUser, ...withUser.slice(1)];

    for (const pegawai of toDelete) {
      try {
        await prisma.$transaction(async (tx) => {
          // Hapus relasi User dulu kalau ada
          if (pegawai.user) {
            await tx.deviceTrusted.deleteMany({
              where: { userId: pegawai.user.id },
            });
            await tx.otpCode.deleteMany({ where: { userId: pegawai.user.id } });
            await tx.refreshToken.deleteMany({
              where: { userId: pegawai.user.id },
            });
            await tx.user.delete({ where: { id: pegawai.user.id } });
          }

          // Hapus relasi Pegawai
          await tx.dokumenPegawai.deleteMany({
            where: { pegawaiId: pegawai.id },
          });
          await tx.dailyActivity.deleteMany({
            where: { pegawaiId: pegawai.id },
          });
          await tx.hakAksesKaryawan.deleteMany({
            where: { pegawaiId: pegawai.id },
          });
          await tx.permohonanHakAkses.deleteMany({
            where: { pegawaiId: pegawai.id },
          });
          await tx.pengajuanJudulTraining.deleteMany({
            where: { inputOlehId: pegawai.id },
          });
          await tx.jadwalTraining.deleteMany({
            where: { updateOleh: pegawai.id },
          });
          await tx.pesertaTraining.deleteMany({
            where: {
              OR: [
                { inputOleh: pegawai.id },
                { updateOleh: pegawai.id },
                { konfirmasiOleh: pegawai.id },
              ],
            },
          });
          await tx.pengajuanIzin.deleteMany({
            where: { pegawaiId: pegawai.id },
          });
          await tx.permintaanNomorSurat.deleteMany({
            where: { pengirimId: pegawai.id },
          });

          // Hapus Pegawai
          await tx.pegawai.delete({ where: { id: pegawai.id } });
        });

        successLog.push({ nama, pegawaiId: pegawai.id });
        console.log(`✅ Deleted: ${nama} (pegawaiId: ${pegawai.id})`);
      } catch (err) {
        failedLog.push({ nama, pegawaiId: pegawai.id, error: err.message });
        console.error(
          `❌ Failed: ${nama} (pegawaiId: ${pegawai.id}) — ${err.message}`,
        );
      }
    }
  }

  console.log("\n========== SUMMARY ==========");
  console.log(`✅ Success: ${successLog.length}`);
  console.log(`❌ Failed : ${failedLog.length}`);

  if (failedLog.length > 0) {
    console.log("\nFailed details:");
    for (const f of failedLog) {
      console.log(
        `  - ${f.nama} | pegawaiId: ${f.pegawaiId} | error: ${f.error}`,
      );
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
