const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { applyIpo, getIpoOrders } = require('../controllers/ipoController');

router.use(authMiddleware);

router.post('/apply', applyIpo);
router.get('/orders', getIpoOrders);

module.exports = router;
