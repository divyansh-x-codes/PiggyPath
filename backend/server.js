require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');

// Supabase is initialized in the middleware

// Database + seeder
const { prisma, seedStocks } = require('./prisma/client');

// Sockets
const { initSocket } = require('./sockets');

// Services
const MatchingEngine = require('./services/matchingEngine');
const { startMarketBot } = require('./services/marketBot');

// Routes
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stocks');
const createTradeRouter = require('./routes/trades');

// Firebase Admin initialization removed

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'PiggyPath Backend' });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = initSocket(httpServer, process.env.FRONTEND_URL);

// ─── Matching Engine (inject socket.io) ───────────────────────────────────────
const engine = new MatchingEngine(io);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/me', authRoutes); // auth routes are mounted at /auth, but /me is inside it
app.use('/stocks', stockRoutes);
app.use('/social', require('./routes/social'));
app.use('/ipo', require('./routes/ipo'));

// Trade routes need engine injected
const tradeRouter = createTradeRouter(engine);
app.use('/', tradeRouter); // Mount at root so POST /buy and POST /sell work

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
const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('[Database] Connected to PostgreSQL');

    // Seed stocks if empty
    await seedStocks();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`\n🐷 PiggyPath Backend running on port ${PORT}`);
      console.log(`   Health:      http://localhost:${PORT}/health`);
      console.log(`   Stocks API:  http://localhost:${PORT}/stocks`);
      console.log(`   Trading:     POST http://localhost:${PORT}/buy | /sell`);
      console.log(`   Auth:        POST http://localhost:${PORT}/auth/login\n`);
    });

    // Start market bot
    const botInterval = parseInt(process.env.MARKET_BOT_INTERVAL) || 10000;
    startMarketBot(engine, botInterval);

  } catch (err) {
    console.error('[Server] Failed to start:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
