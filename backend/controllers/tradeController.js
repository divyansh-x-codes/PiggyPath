const { db } = require('../firebaseAdmin');
const admin = require('firebase-admin');

/**
 * Multi-user Real-time Trade Controller
 */

// POST /trade/buy
const placeBuyOrder = async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.uid; // From authMiddleware (Firebase UID)

    if (!stockId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid stockId or quantity' });
    }

    // 1. Get Live Price from Firestore
    const stockRef = db.collection('stocks').doc(stockId);
    const stockSnap = await stockRef.get();
    if (!stockSnap.exists) return res.status(404).json({ error: 'Stock not found' });
    
    const stockData = stockSnap.data();
    const price = stockData.price;
    const totalCost = price * quantity;

    // 2. Check User Balance
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    
    const userData = userSnap.data();
    if ((userData.balance || 0) < totalCost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 3. EXECUTE TRADE (Atomic Transaction)
    await db.runTransaction(async (t) => {
      // Deduct Balance
      t.update(userRef, {
        balance: admin.firestore.FieldValue.increment(-totalCost)
      });

      // Update Portfolio
      const portfolioRef = db.collection('portfolio').doc(`${userId}_${stockId}`);
      const portSnap = await t.get(portfolioRef);
      
      if (portSnap.exists) {
        const pData = portSnap.data();
        const newQty = pData.quantity + quantity;
        const newAvg = ((pData.avgPrice * pData.quantity) + (price * quantity)) / newQty;
        t.update(portfolioRef, { quantity: newQty, avgPrice: newAvg });
      } else {
        t.set(portfolioRef, { userId, stockId, quantity, avgPrice: price });
      }

      // Record Transaction
      const transRef = db.collection('transactions').doc();
      t.set(transRef, {
        userId, stockId, type: 'BUY', quantity, price, total: totalCost, createdAt: new Date()
      });

      // GLOBAL PRICE IMPACT (User Request: +1.2%)
      const newPrice = +(price * 1.012).toFixed(2);
      t.update(stockRef, { price: newPrice });
    });

    res.json({ success: true, message: 'Buy successful' });

  } catch (err) {
    console.error('[TradeController] Buy error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /trade/sell
const placeSellOrder = async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.uid;

    const portfolioRef = db.collection('portfolio').doc(`${userId}_${stockId}`);
    const portSnap = await portfolioRef.get();

    if (!portSnap.exists || portSnap.data().quantity < quantity) {
      return res.status(400).json({ error: 'Not enough shares' });
    }

    const stockRef = db.collection('stocks').doc(stockId);
    const stockSnap = await stockRef.get();
    const price = stockSnap.data().price;
    const totalCredit = price * quantity;

    await db.runTransaction(async (t) => {
      // Add Balance
      const userRef = db.collection('users').doc(userId);
      t.update(userRef, {
        balance: admin.firestore.FieldValue.increment(totalCredit)
      });

      // Update Portfolio
      const pData = portSnap.data();
      const newQty = pData.quantity - quantity;
      if (newQty === 0) {
        t.delete(portfolioRef);
      } else {
        t.update(portfolioRef, { quantity: newQty });
      }

      // Record Transaction
      const transRef = db.collection('transactions').doc();
      t.set(transRef, {
        userId, stockId, type: 'SELL', quantity, price, total: totalCredit, createdAt: new Date()
      });

      // GLOBAL PRICE IMPACT (User Request: -0.9%)
      const newPrice = +(price * 0.991).toFixed(2);
      t.update(stockRef, { price: newPrice });
    });

    res.json({ success: true, message: 'Sell successful' });

  } catch (err) {
    console.error('[TradeController] Sell error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const snap = await db.collection('stocks').doc(id).get();
        if (!snap.exists) return res.status(404).json({ error: 'Stock not found' });
        res.json({ id: snap.id, ...snap.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getOrders = async (req, res) => res.json([]); 
const getTransactions = async (req, res) => {
    const snap = await db.collection('transactions').where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
};
const cancelOrder = async (req, res) => res.json({ success: true });

module.exports = { placeBuyOrder, placeSellOrder, getOrders, getTransactions, cancelOrder };
