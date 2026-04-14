const { db } = require('../firebaseAdmin');
const { getIO } = require('../sockets/index');

/**
 * GLOBAL PRICE ENGINE
 * Fluctuates stock prices every 2 seconds and broadcasts to all users.
 */
const startPriceEngine = () => {
    console.log('[PriceEngine] Started');
    
    setInterval(async () => {
        try {
            const stocksRef = db.collection('stocks');
            const snapshot = await stocksRef.get();
            
            if (snapshot.empty) return;

            const io = getIO();
            const batch = db.batch();

            snapshot.forEach(doc => {
                const data = doc.data();
                const stockId = doc.id;
                
                // ─── INITIALIZATION (If history is empty, pre-fill) ───
                let history = data.history || [];
                let currentPrice = parseFloat(data.price || 100);

                if (history.length < 100) {
                   console.log(`[PriceEngine] Pre-filling history for ${stockId}...`);
                   while (history.length < 100) {
                      const drift = Math.random() * 0.04 - 0.018;
                      currentPrice = +(currentPrice + (currentPrice * drift)).toFixed(2);
                      history.push(currentPrice);
                   }
                }

                // ─── "PROPER" RANDOM WALK LOGIC ───
                const drift = Math.random() * 0.04 - 0.018;
                let newPrice = +(currentPrice + (currentPrice * drift)).toFixed(2);
                if (newPrice < 1) newPrice = 1.00;
                
                history.push(newPrice);
                if (history.length > 100) history.shift(); 

                // Update Firestore
                batch.update(doc.ref, {
                    price: newPrice,
                    history: history,
                    lastUpdated: new Date()
                });

                // ─── BROADCAST (Socket.io) ───
                io.emit('priceUpdate', {
                    id: stockId,
                    price: newPrice,
                    history: history
                });
            });

            await batch.commit();
            
        } catch (err) {
            console.error('[PriceEngine] Error:', err.message);
        }
    }, 2000);
};

module.exports = { startPriceEngine };
