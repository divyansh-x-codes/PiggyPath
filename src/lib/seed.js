import { db } from "./firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";

const STOCKS = [
  { id: 'msft', name: 'Microsoft', symbol: 'MSFT', price: 420.00, change: 0.0 },
  { id: 'aapl', name: 'Apple', symbol: 'AAPL', price: 180.00, change: 0.0 },
  { id: 'googl', name: 'Google', symbol: 'GOOGL', price: 150.00, change: 0.0 },
  { id: 'reliance', name: 'Reliance Industries', symbol: 'RELIANCE', price: 2890.00, change: 1.8 },
  { id: 'tcs', name: 'TCS', symbol: 'TCS', price: 3520.00, change: 0.9 },
  { id: 'infosys', name: 'Infosys', symbol: 'INFY', price: 1680.00, change: -0.6 },
];

export const seedStocks = async () => {
  console.log("[Seed] Starting Dynamic Seeding...");
  
  for (const stock of STOCKS) {
    try {
      // 1. Set main stock doc
      await setDoc(doc(db, "stocks", stock.id), {
        name: stock.name,
        symbol: stock.symbol,
        price: stock.price,
        change: stock.change,
        updatedAt: serverTimestamp()
      });

      // 2. Generate 20 Mock History points
      const historyRef = collection(db, "stocks", stock.id, "price_history");
      let tempPrice = stock.price;
      
      console.log(`[Seed] Generating history for ${stock.id}...`);
      
      for (let i = 0; i < 20; i++) {
        // Random fluctuation +/- 1%
        const fluctuation = 1 + (Math.random() * 0.02 - 0.01);
        tempPrice = Number((tempPrice * fluctuation).toFixed(2));
        
        await addDoc(historyRef, {
          price: tempPrice,
          createdAt: serverTimestamp() // Note: In real scenarios you'd offset timestamps, but for init this is fine
        });
      }

      console.log(`[Seed] Success: ${stock.id}`);
    } catch (e) {
      console.error(`[Seed] Error for ${stock.id}:`, e);
    }
  }
  console.log("[Seed] Process complete!");
};
