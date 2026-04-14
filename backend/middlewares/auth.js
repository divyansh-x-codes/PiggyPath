const { auth } = require('../firebaseAdmin');
const { prisma } = require('../prisma/client');

/**
 * Production-Ready Auth Middleware (Firebase)
 * 1. Reads token from Authorization: Bearer <token>
 * 2. Verifies ID Token using Firebase Admin SDK
 * 3. Fetches user from DB (Using firebaseUid)
 * 4. Attaches user to req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];

    // 2. Verify ID Token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 3. Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid }
    });

    if (!user) {
      console.warn(`[Auth] User document not found for UID: ${uid}`);
      // Depending on your flow, you might want to auto-create here, 
      // but usually the frontend does a /login sync right after Firebase Signup.
      return res.status(404).json({ error: 'User not registered in database' });
    }

    // 4. Attach user to req.user
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;
