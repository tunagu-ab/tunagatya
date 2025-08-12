import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create sample cards
  const card1 = await prisma.card.create({
    data: {
      name: 'Common Goblin',
      description: 'A weak but numerous goblin.',
      image: '/placeholders/goblin.png',
      rarity: 'N',
    },
  });

  const card2 = await prisma.card.create({
    data: {
      name: 'Orc Warrior',
      description: 'A fierce warrior from the Orc tribes.',
      image: '/placeholders/orc.png',
      rarity: 'R',
    },
  });

  const card3 = await prisma.card.create({
    data: {
      name: 'High Elf Archer',
      description: 'A master of the bow with unmatched accuracy.',
      image: '/placeholders/elf.png',
      rarity: 'SR',
    },
  });

  const card4 = await prisma.card.create({
    data: {
      name: 'Ancient Dragon',
      description: 'A legendary dragon of immense power.',
      image: '/placeholders/dragon.png',
      rarity: 'SSR',
    },
  });

  // Create a standard oripa pack
  const standardOripa = await prisma.oripa.create({
    data: {
      name: 'Standard Pack',
      description: 'A pack containing common and rare cards.',
      price: 100,
    },
  });

  // Add cards to the standard oripa pack
  await prisma.oripaCard.createMany({
    data: [
      { oripaId: standardOripa.id, cardId: card1.id },
      { oripaId: standardOripa.id, cardId: card2.id },
    ],
  });

  // Create a premium oripa pack
  const premiumOripa = await prisma.oripa.create({
    data: {
      name: 'Premium Pack',
      description: 'A special pack with a chance to get super rare cards.',
      price: 500,
    },
  });

  // Add cards to the premium oripa pack
  await prisma.oripaCard.createMany({
    data: [
      { oripaId: premiumOripa.id, cardId: card1.id }, // Higher chance of N
      { oripaId: premiumOripa.id, cardId: card2.id }, // Higher chance of R
      { oripaId: premiumOripa.id, cardId: card3.id }, // Chance of SR
      { oripaId: premiumOripa.id, cardId: card4.id }, // Low chance of SSR
    ],
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
