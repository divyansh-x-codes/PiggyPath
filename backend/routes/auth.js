const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { firebaseLogin } = require('../controllers/userController');

// POST /login
// Validates token and performs initial sync if needed
router.post('/login', authMiddleware, firebaseLogin);

module.exports = router;
