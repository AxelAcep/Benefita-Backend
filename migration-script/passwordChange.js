const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      pegawai: { select: { nama: true } },
    },
  });

  const results = [];

  for (const u of users) {
    const namaDepan = (u.pegawai?.nama || "user")
      .trim()
      .split(" ")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const plainPassword = `${namaDepan}123`;
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    await prisma.user.update({
      where: { id: u.id },
      data: { password: hashedPassword },
    });

    results.push({
      nama: u.pegawai?.nama ?? "Unknown",
      email: u.email,
      password: plainPassword,
    });

    console.log(`🔐 Updated: ${u.email} -> ${plainPassword}`);
  }

  console.log(`\nDone. Total updated: ${results.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
