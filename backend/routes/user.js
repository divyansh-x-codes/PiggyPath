const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

/**
 * GET /api/me
 * Protected route to get current user data
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    balance: req.user.balance,
    email: req.user.email
  });
});

module.exports = router;
