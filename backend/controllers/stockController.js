const { prisma, INITIAL_STOCKS } = require('../prisma/client');

const isSafeMode = () => process.env.DB_OFFLINE === 'true';

// GET /stocks — list all stocks with current price
const getAllStocks = async (req, res) => {
  if (isSafeMode()) {
    return res.json(INITIAL_STOCKS.map((s, i) => ({ ...s, id: `mock-${i}` })));
  }
  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { symbol: 'asc' },
    });
    res.json(stocks);
  } catch (err) {
    console.error('[StockController] getAllStocks error:', err);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
};

// GET /stocks/:id — single stock with holding info if logged in
const getStock = async (req, res) => {
  try {
    const { id } = req.params;

    if (isSafeMode()) {
      const mockStock = INITIAL_STOCKS.find(s => s.symbol === id || id.includes(s.symbol)) || INITIAL_STOCKS[0];
      return res.json({ ...mockStock, id, openBuys: 5, openSells: 3 });
    }

    const stock = await prisma.stock.findUnique({ where: { id } });
    if (!stock) return res.status(404).json({ error: 'Stock not found' });

    // Get open orders stats
    const [buyOrders, sellOrders] = await Promise.all([
      prisma.order.count({ where: { stockId: id, type: 'BUY', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } } }),
      prisma.order.count({ where: { stockId: id, type: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] } } }),
    ]);

    res.json({ ...stock, openBuys: buyOrders, openSells: sellOrders });
  } catch (err) {
    console.error('[StockController] getStock error:', err);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};

// GET /stocks/:id/history — price history for graph
const getStockHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 200, range } = req.query;

    if (isSafeMode()) {
      // Return 20 points of random-ish price history
      const points = 20;
      const history = Array.from({ length: points }).map((_, i) => ({
        price: 3000 + Math.random() * 500,
        timestamp: new Date(Date.now() - (points - i) * 3600000).toISOString()
      }));
      return res.json(history);
    }

    let history = await prisma.priceHistory.findMany({
      where: { stockId: id },
      orderBy: { timestamp: 'asc' },
      take: parseInt(limit),
    });

    // CRITICAL: If history is too short for a line chart (< 2 points), generate synthetic fallback
    if (history.length < 2) {
      const stock = await prisma.stock.findUnique({ where: { id } });
      const basePrice = stock ? stock.currentPrice : 3000;
      const syntheticPoints = 20;
      history = Array.from({ length: syntheticPoints }).map((_, i) => ({
        price: basePrice * (0.95 + Math.random() * 0.1),
        timestamp: new Date(Date.now() - (syntheticPoints - i) * 3600000).toISOString()
      }));
      console.log(`[StockController] Generated ${syntheticPoints} synthetic points for ${id}`);
    }

    res.json(history.map((h) => ({ price: h.price, timestamp: h.timestamp })));
  } catch (err) {
    console.error('[StockController] getStockHistory error:', err);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
};

module.exports = { getAllStocks, getStock, getStockHistory };
