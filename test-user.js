const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  console.log('User in DB:', user);
  if (user) {
    const isValid = await bcrypt.compare('SuperSecureAdminPassword123', user.password);
    console.log('Is valid with SuperSecureAdminPassword123?', isValid);
    const isValidQuotes = await bcrypt.compare('"SuperSecureAdminPassword123"', user.password);
    console.log('Is valid with "SuperSecureAdminPassword123"?', isValidQuotes);
  }
}

main().finally(() => prisma.$disconnect());
