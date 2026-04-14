const { prisma } = require('../prisma/client');

/**
 * Market Bot — keeps the order book alive
 *
 * Every N seconds, the bot places realistic BUY and SELL orders around
 * the current market price for each stock. This prevents a "dead market"
 * where real users can't trade because there are no counterparties.
 *
 * Rules:
 * - Bot uses a dedicated system account
 * - Orders are priced within ±2% of current price
 * - Only places orders if the book is thin (< MIN_ORDERS threshold)
 */

const BOT_EMAIL = 'marketbot@piggypath.internal';
const MIN_ORDERS_PER_SIDE = 2; // Minimum open orders before bot intervenes
const PRICE_VARIANCE = 0.02;   // ±2% from current price

let botUserId = null;

const getBotUser = async () => {
  if (botUserId) return botUserId;

  let bot = await prisma.user.findFirst({ where: { email: BOT_EMAIL } });

  if (!bot) {
    bot = await prisma.user.create({
      data: {
        firebaseUid: 'SYSTEM_BOT_' + Date.now(),
        email: BOT_EMAIL,
        name: 'Market Bot',
        balance: 999_999_999, // Effectively unlimited
      },
    });
    console.log('[MarketBot] Bot user created');
  }

  botUserId = bot.id;
  return botUserId;
};

/**
 * Ensure bot has sufficient holdings of every stock to sell
 */
const ensureBotHoldings = async (botId, stockId, qty) => {
  const holding = await prisma.holding.findUnique({
    where: { userId_stockId: { userId: botId, stockId } },
  });

  if (!holding || holding.quantity < qty) {
    await prisma.holding.upsert({
      where: { userId_stockId: { userId: botId, stockId } },
      update: { quantity: { increment: 10000 } },
      create: { userId: botId, stockId, quantity: 10000, avgPrice: 0 },
    });
  }
};

/**
 * Place liquidity orders for a stock
 */
const placeBotOrdersForStock = async (stock, botId, engine) => {
  const price = stock.currentPrice;

  // Count current open orders (excluding bot's own)
  const openBuys = await prisma.order.count({
    where: { stockId: stock.id, type: 'BUY', status: { in: ['OPEN', 'PARTIALLY_FILLED'] }, userId: { not: botId } },
  });
  const openSells = await prisma.order.count({
    where: { stockId: stock.id, type: 'SELL', status: { in: ['OPEN', 'PARTIALLY_FILLED'] }, userId: { not: botId } },
  });

  // Place BUY orders if needed
  if (openBuys < MIN_ORDERS_PER_SIDE) {
    const variance = (Math.random() * PRICE_VARIANCE);
    const botBuyPrice = parseFloat((price * (1 - variance)).toFixed(2));
    const botBuyQty = Math.floor(Math.random() * 10) + 1;

    try {
      await engine.buy({ userId: botId, stockId: stock.id, price: botBuyPrice, quantity: botBuyQty });
    } catch (e) {
      // Silently continue — bot balance issue is non-critical
    }
  }

  // Place SELL orders if needed
  if (openSells < MIN_ORDERS_PER_SIDE) {
    const variance = (Math.random() * PRICE_VARIANCE);
    const botSellPrice = parseFloat((price * (1 + variance)).toFixed(2));
    const botSellQty = Math.floor(Math.random() * 10) + 1;

    await ensureBotHoldings(botId, stock.id, botSellQty);

    try {
      await engine.sell({ userId: botId, stockId: stock.id, price: botSellPrice, quantity: botSellQty });
    } catch (e) {
      // Silently continue
    }
  }
};

/**
 * Run the market bot — called on an interval
 */
const runMarketBot = async (engine) => {
  try {
    const botId = await getBotUser();
    const stocks = await prisma.stock.findMany();

    for (const stock of stocks) {
      await placeBotOrdersForStock(stock, botId, engine);
    }
  } catch (err) {
    console.error('[MarketBot] Error during bot run:', err.message);
  }
};

/**
 * Start the market bot with the given interval (ms)
 */
const startMarketBot = (engine, intervalMs = 10000) => {
  console.log(`[MarketBot] Starting with ${intervalMs}ms interval`);

  // Initial run after 3 seconds (allow server to fully start)
  setTimeout(() => runMarketBot(engine), 3000);

  // Recurring runs
  const interval = setInterval(() => runMarketBot(engine), intervalMs);

  return interval;
};

module.exports = { startMarketBot };
