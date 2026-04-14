const express = require('express');
const router = express.Router();
const { getAllStocks, getStock, getStockHistory } = require('../controllers/stockController');

// GET /stocks — public, list all stocks
router.get('/', getAllStocks);

// GET /stocks/:id — public, single stock
router.get('/:id', getStock);

// GET /stocks/:id/history — public, graph data
// Query params: ?range=1d|1w|1m|1y  ?limit=200
router.get('/:id/history', getStockHistory);

module.exports = router;
