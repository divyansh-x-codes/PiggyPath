const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.processTrade = functions.https.onCall(async (data, context) => {
  // Check auth
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in."
    );
  }

  const { stockId, type, quantity } = data;
  const userId = context.auth.uid;

  if (!stockId || !type || !quantity || quantity <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid trade parameters."
    );
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Fetch User Data
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("User not found.");
      const userData = userDoc.data();

      // 2. Fetch Stock Data
      const stockRef = db.collection("stocks").doc(stockId);
      const stockDoc = await transaction.get(stockRef);
      if (!stockDoc.exists) throw new Error("Stock not found.");
      const stockData = stockDoc.data();
      const currentPrice = stockData.price;

      // 3. Fetch Portfolio Data
      const portfolioRef = db.collection("portfolio").doc(userId);
      const portfolioDoc = await transaction.get(portfolioRef);
      let portfolio = portfolioDoc.exists ? portfolioDoc.data().holdings || {} : {};

      const totalCost = currentPrice * quantity;
      let newBalance = userData.balance;
      let newPrice = currentPrice;
      let stockQuantityInPortfolio = portfolio[stockId] ? portfolio[stockId].quantity : 0;

      if (type === "buy") {
        if (userData.balance < totalCost) {
            throw new Error("Insufficient balance.");
        }
        newBalance -= totalCost;
        stockQuantityInPortfolio += quantity;
        newPrice += quantity * 0.5;
      } else if (type === "sell") {
        if (stockQuantityInPortfolio < quantity) {
            throw new Error("Insufficient stock quantity.");
        }
        newBalance += totalCost;
        stockQuantityInPortfolio -= quantity;
        newPrice -= (quantity * 0.5);
        if (newPrice < 0) newPrice = 0.01; // Floor price
      } else {
        throw new Error("Invalid trade type.");
      }

      // 4. Update Database
      // New trade record
      const tradeRef = db.collection("trades").doc();
      transaction.set(tradeRef, {
        userId,
        stockId,
        type,
        quantity,
        price: currentPrice,
        total: totalCost,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update User Balance
      transaction.update(userRef, { balance: newBalance });

      // Update Portfolio
      portfolio[stockId] = {
          stockId,
          quantity: stockQuantityInPortfolio,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      transaction.set(portfolioRef, { holdings: portfolio }, { merge: true });

      // Update Stock Price
      transaction.update(stockRef, { price: newPrice });

      // Add to Price History
      const historyRef = stockRef.collection("price_history").doc();
      transaction.set(historyRef, {
          price: newPrice,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, newBalance, newPrice };
    });
  } catch (error) {
    console.error("Trade transaction failed: ", error);
    return { success: false, error: error.message };
  }
});

exports.seedData = functions.https.onCall(async (data, context) => {
    const stocks = [
        { id: 'msft', name: 'Microsoft', ticker: 'MSFT', price: 420, sector: 'IT', desc: 'Microsoft Corporation is an American multinational technology company.' },
        { id: 'aapl', name: 'Apple Inc', ticker: 'AAPL', price: 198, sector: 'IT', desc: 'Apple Inc. is an American multinational technology company.' },
        { id: 'reliance', name: 'Reliance', ticker: 'RIL', price: 2890, sector: 'Energy', desc: 'Reliance Industries Limited is an Indian multinational conglomerate.' },
        { id: 'tcs', name: 'TCS', ticker: 'TCS', price: 3520, sector: 'IT', desc: 'Tata Consultancy Services is an Indian multinational IT services company.' }
    ];

    const batch = db.batch();

    stocks.forEach(s => {
        const ref = db.collection('stocks').doc(s.id);
        batch.set(ref, { ...s, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        
        // Initial history point
        const hRef = ref.collection('price_history').doc();
        batch.set(hRef, { price: s.price, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    // Sample posts
    const posts = [
        { title: 'Why Microsoft is a buy', content: 'Cloud growth is strong...', createdAt: admin.firestore.FieldValue.serverTimestamp(), likeCount: 0, commentCount: 0, userId: 'system' },
        { title: 'Apple earnings outlook', content: 'Upcoming iPhone sales...', createdAt: admin.firestore.FieldValue.serverTimestamp(), likeCount: 0, commentCount: 0, userId: 'system' }
    ];

    posts.forEach(p => {
        const ref = db.collection('posts').doc();
        batch.set(ref, p);
    });

    await batch.commit();
    return { success: true };
});
