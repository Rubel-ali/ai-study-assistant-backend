const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = '812c287b-c37b-4793-9ca0-9ffe07708f64';
  const topic = await prisma.topic.findUnique({ where: { id } });
  console.log('Topic found:', topic);
  
  const allTopics = await prisma.topic.findMany({
    select: { id: true, name: true }
  });
  const match = allTopics.find(t => t.id.startsWith('812c287b'));
  console.log('Match by prefix:', match);
}

main().catch(console.error).finally(() => prisma.$disconnect());
