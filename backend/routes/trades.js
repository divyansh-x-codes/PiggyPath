const express = require('express');
const authMiddleware = require('../middlewares/auth');
const {
  placeBuyOrder,
  placeSellOrder,
  getOrders,
  getTransactions,
  cancelOrder,
} = require('../controllers/tradeController');

const router = express.Router();

// All trade routes require authentication
router.use(authMiddleware);

// POST /buy — place a buy order
router.post('/buy', placeBuyOrder);

// POST /sell — place a sell order
router.post('/sell', placeSellOrder);

// GET /orders — get user's orders
router.get('/orders', getOrders);

// GET /transactions — get user's executed trades
router.get('/transactions', getTransactions);

// DELETE /orders/:id — cancel an open order
router.delete('/orders/:id', cancelOrder);

module.exports = router;
