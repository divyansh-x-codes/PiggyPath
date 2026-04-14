const { prisma } = require('../prisma/client');
const isSafeMode = () => process.env.DB_OFFLINE === 'true';

// POST /ipo/apply
exports.applyIpo = async (req, res) => {
  const { stockId, amount } = req.body;
  const userId = req.user.id;

  if (isSafeMode()) {
    return res.json({ 
      message: 'IPO Application successful (Simulation Mode)', 
      order: { id: `mock-ipo-${Date.now()}`, stockId, amount, status: 'SUBMITTED' } 
    });
  }

  if (!stockId || !amount) {
    return res.status(400).json({ error: 'Stock ID and Application Amount are required' });
  }

  try {
    // Basic validation: user has enough balance
    if (req.user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance for IPO application' });
    }

    const ipoOrder = await prisma.ipoOrder.create({
      data: {
        userId,
        stockId,
        amount: parseFloat(amount),
        status: 'SUBMITTED'
      },
      include: { stock: { select: { name: true, symbol: true } } }
    });

    // Optionally: Lock the balance (Deduct immediately)
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: parseFloat(amount) } }
    });

    res.json({ message: 'IPO Application successful', order: ipoOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply for IPO', details: err.message });
  }
};

// GET /ipo/orders
exports.getIpoOrders = async (req, res) => {
  try {
    const orders = await prisma.ipoOrder.findMany({
      where: { userId: req.user.id },
      include: { stock: { select: { name: true, symbol: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch IPO orders' });
  }
};
