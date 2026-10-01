const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      password: true,
      pegawai: {
        select: { nama: true },
      },
    },
  });

  console.log(`Total user: ${users.length}\n`);

  for (const u of users) {
    console.log(`${u.pegawai?.nama ?? "Unknown"} | ${u.email} | ${u.password}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
