require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  const allTopics = await prisma.topic.findMany({
    select: { id: true, name: true }
  });
  console.log('Topics:', allTopics);
}

main().catch(console.error).finally(() => prisma.$disconnect());
