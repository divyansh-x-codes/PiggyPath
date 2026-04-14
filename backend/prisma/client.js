const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Seed initial stocks
const INITIAL_STOCKS = [
  { name: 'Megasoft', symbol: 'MSFT', currentPrice: 3200.00, sector: 'Technology', description: 'Global software and cloud computing leader.' },
  { name: 'Bapplee', symbol: 'AAPL', currentPrice: 17500.00, sector: 'Technology', description: 'Consumer electronics and ecosystem company.' },
  { name: 'Tata Consultancy', symbol: 'TCS', currentPrice: 3900.00, sector: 'IT Services', description: 'India\'s largest IT services company.' },
  { name: 'Reliance Industries', symbol: 'RIL', currentPrice: 2850.00, sector: 'Energy', description: 'Diversified conglomerate across energy, retail, and telecom.' },
  { name: 'HDFC Bank', symbol: 'HDFC', currentPrice: 1680.00, sector: 'Banking', description: 'India\'s leading private sector bank.' },
  { name: 'Infosys', symbol: 'INFY', currentPrice: 1420.00, sector: 'IT Services', description: 'Global technology services and consulting.' },
  { name: 'Zomato', symbol: 'ZOMATO', currentPrice: 215.00, sector: 'Consumer', description: 'Food delivery and quick commerce platform.' },
  { name: 'Paytm', symbol: 'PAYTM', currentPrice: 380.00, sector: 'Fintech', description: 'Digital payments and financial services.' },
];

const seedStocks = async () => {
  for (const stock of INITIAL_STOCKS) {
    const existing = await prisma.stock.findUnique({ where: { symbol: stock.symbol } });
    if (!existing) {
      const created = await prisma.stock.create({ data: stock });
      // Insert first price history entry
      await prisma.priceHistory.create({
        data: { stockId: created.id, price: created.currentPrice },
      });
      console.log(`[Seed] Created stock: ${stock.symbol} @ ₹${stock.currentPrice}`);
    }
  }
};

module.exports = { prisma, seedStocks, INITIAL_STOCKS };
