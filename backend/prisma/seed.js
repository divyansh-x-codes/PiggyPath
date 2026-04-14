const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Stocks
  const stocks = [
    { name: 'Megasoft', symbol: 'MSFT', currentPrice: 420.69, sector: 'Technology', description: 'Global software leader.' },
    { name: 'Bapplee', symbol: 'AAPL', currentPrice: 185.32, sector: 'Consumer Electronics', description: 'Fruit-themed hardware.' },
    { name: 'Goggles', symbol: 'GOOGL', currentPrice: 142.10, sector: 'Internet Services', description: 'Searching for everything.' },
    { name: 'Nvidis', symbol: 'NVDA', currentPrice: 720.50, sector: 'Semiconductors', description: 'AI hardware giant.' },
  ];

  for (const s of stocks) {
    await prisma.stock.upsert({
      where: { symbol: s.symbol },
      update: { currentPrice: s.currentPrice },
      create: s,
    });
  }
  console.log('✅ Stocks seeded');

  // 2. Create System Bot User
  const systemBot = await prisma.user.upsert({
    where: { firebaseUid: 'system-bot-uuid' },
    update: {},
    create: {
      firebaseUid: 'system-bot-uuid',
      name: 'PiggyPath Official',
      balance: 999999999,
      email: 'bot@piggypath.com',
    },
  });
  console.log('✅ System bot created');

  // 3. Create initial Posts
  const dbStocks = await prisma.stock.findMany();
  const posts = [
    {
      userId: systemBot.id,
      title: 'Why We Have To Sell Microsoft',
      content: 'Institutional investors are rebalancing their portfolios as tech valuations reach all-time highs. Megasoft is showing signs of resistance at the 450 level.',
      stockId: dbStocks.find(s => s.symbol === 'MSFT')?.id,
    },
    {
      userId: systemBot.id,
      title: 'Bapplee earnings preview: What to expect',
      content: 'Analysts are divided on the upcoming Bapplee release. Supply chain issues in Asia might impact hardware margins this quarter.',
      stockId: dbStocks.find(s => s.symbol === 'AAPL')?.id,
    }
  ];

  for (const p of posts) {
    await prisma.post.create({ data: p });
  }
  console.log('✅ Social posts seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
