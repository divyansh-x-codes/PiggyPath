require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');

// Firebase Admin
const { db } = require('./firebaseAdmin');

// Sockets
const { initSocket } = require('./sockets');

// Services
const { startPriceEngine } = require('./services/priceEngine');

// Routes
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const tradeRouter = require('./routes/trades');
const healthRoutes = express.Router().get('/', (req, res) => res.json({ status: 'ok' }));

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost',
    'capacitor://localhost',
    'http://10.0.2.2:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.use('/health', healthRoutes);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = initSocket(httpServer, process.env.FRONTEND_URL);

// ─── API Routes ───────────────────────────────────────────────────────────────
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/', require('./routes/user.js')); 
apiRouter.use('/stocks', stockRoutes);
apiRouter.use('/social', require('./routes/social'));
apiRouter.use('/ipo', require('./routes/ipo'));
apiRouter.use('/', tradeRouter); 

// Mount all API routes under /api
app.use('/api', apiRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Startup ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    if (!process.env.VERCEL) {
      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`\n🐷 PiggyPath Backend running on port ${PORT}`);
        console.log(`   API Base URL: http://localhost:${PORT}/api`);
      });

      // Start the Global Price Engine
      startPriceEngine();
    }
  } catch (err) {
    console.error('\n❌ [Server] STARTUP FAILED:', err.message);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
