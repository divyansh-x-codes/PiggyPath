import React, { createContext, useState, useContext, useEffect } from 'react';
import { STOCKS, NEWS, IPO_DATA } from '../data/mockData';
import { auth, db, functions } from '../lib/firebase';
import { io } from 'socket.io-client';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  getDocs,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [prevScreens, setPrevScreens] = useState([]);
  const [portfolio, setPortfolio] = useState({});
  const [marketPrices, setMarketPrices] = useState({});
  const [marketHistory, setMarketHistory] = useState({}); // { stockId: [price, price, ...] }
  const [socket, setSocket] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [localTrades, setLocalTrades] = useState([]); // session-only trade impacts
  const [currentStock, setCurrentStock] = useState(null);
  const [ipoOrders, setIpoOrders] = useState([]);
  const [watchlist, setWatchlist] = useState(['msft', 'aapl', 'tcs']);
  const [userData, setUserData] = useState({
    name: '',
    level: 0,
    xp: 0,
    streak: 0,
    completedLevels: 0,
    balance: 100000,
    id: '#000000'
  });
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [ipoList, setIpoList] = useState([]);

  // ─── AUTH LISTENER (FIREBASE) ────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // 1. Sync User Data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const unsubUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Safely get name from username, email, or phone
            const fallbackName = user.email ? user.email.split('@')[0] : (user.phoneNumber || 'Investor');
            setUserData(prev => ({ 
              ...prev, 
              ...data, 
              name: data.username || data.name || fallbackName 
            }));
          }
        });

        // 2. Real-time listener for Portfolio (COLLECTION-BASED)
        const qPortfolio = query(collection(db, 'portfolio'), where('userId', '==', user.uid));
        const unsubPortfolio = onSnapshot(qPortfolio, (snapshot) => {
            const holdings = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                holdings[data.stockId] = {
                  quantity: data.quantity,
                  avgPrice: data.avgPrice,
                  invested: data.quantity * data.avgPrice
                };
            });
            setPortfolio(holdings);
        });

        // 3. Real-time listener for Transactions
        const qTransactions = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
            const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTradeHistory(history);
        });

        // Transition to home
        setCurrentScreen(prev => (prev === 'auth' || prev === 'splash') ? 'home' : prev);
        setLoading(false); // ← MUST be called before return
        
        return () => {
          unsubUser();
          unsubPortfolio();
          unsubTransactions();
        };
      } else {
        setCurrentUser(null);
        setUserData({ name: '', balance: 100000 });
        setPortfolio({});
        setTradeHistory([]);
        setCurrentScreen('auth');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getBaseUrl = () => {
    return window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'http://10.0.2.2:5000';
  };

  // ─── REAL-TIME SYNC (SOCKET.IO) ──────────────────────────────────────────────
  useEffect(() => {
    const backendUrl = getBaseUrl();
    
    // Non-crashing socket — app works even if backend is offline
    const newSocket = io(backendUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 3,
      timeout: 5000,
      autoConnect: true
    });
    
    setSocket(newSocket);

    newSocket.on('priceUpdate', (data) => {
        if (!data?.id) return;
        setMarketPrices(prev => ({ ...prev, [data.id]: data.price }));
        if (data.history) setMarketHistory(prev => ({ ...prev, [data.id]: data.history }));
    });

    newSocket.on('connect_error', (err) => {
        console.warn('[Socket] Backend offline, running in local mode:', err.message);
    });

    return () => newSocket.disconnect();
  }, []);

  const goScreen = (id, addHistory = true) => {
    if (addHistory && currentScreen !== id) {
      setPrevScreens([...prevScreens, currentScreen]);
    } else if (!addHistory) {
      setPrevScreens([]);
    }
    setCurrentScreen(id);
  };

  const goBack = () => {
    const newPrev = [...prevScreens];
    const prev = newPrev.pop();
    setPrevScreens(newPrev);
    setCurrentScreen(prev || (currentUser ? 'home' : 'auth'));
  };

  // ─── MARKET IMPACT PRICE (Exact logic from piggypath_trading_app.html) ──────
  // BUY  → price * 1.012 (+1.2%)
  // SELL → price * 0.991 (-0.9%)
  const getPrice = (s) => {
    if (!s) return 0;
    // Start from backend socket price OR base price
    let price = marketPrices[s.id] || s.basePrice;
    
    // Apply impacts from ALL trades (Firestore + local session)
    const allTrades = [
      ...tradeHistory.filter(t => t.stockId === s.id),
      ...localTrades.filter(t => t.stockId === s.id)
    ];
    allTrades.forEach(t => {
      const type = t.type || t.tradeType;
      if (type === 'buy') {
        price = +(price * 1.012).toFixed(2);
      } else if (type === 'sell') {
        price = +(price * 0.991).toFixed(2);
      }
    });
    return price;
  };

  // Records a local trade impact immediately (no backend needed)
  const addLocalTrade = (stockId, type) => {
    setLocalTrades(prev => [...prev, { stockId, type, ts: Date.now() }]);
  };

  const getPortfolioValue = () => {
    let total = 0;
    Object.entries(portfolio).forEach(([id, h]) => {
      total += (marketPrices[id] || 0) * (h.quantity || 0);
    });
    return total;
  };

  const openStockDetail = async (stockId) => {
    const s = STOCKS.find(x => x.id === stockId);
    if (s) {
      setCurrentStock(s);
      goScreen('stock-detail');
      
      // Load initial history from backend
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();
        const res = await fetch(`${getBaseUrl()}/api/stocks/${stockId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.history) {
            setMarketHistory(prev => ({ ...prev, [stockId]: data.history }));
            setMarketPrices(prev => ({ ...prev, [stockId]: data.price }));
        }
      } catch (err) {
        console.error("Failed to load stock history:", err);
      }
    }
  };

  const applyIPO = async (ipoData) => {
    if (!currentUser) return false;
    try {
      const amount = parseFloat(ipoData.minInv.replace(/,/g, ''));
      const processIpo = httpsCallable(functions, 'applyIpo');
      const res = await processIpo({ ipoId: ipoData.id, amount });
      if (res.data.success) {
        setIpoOrders(prev => [...prev, res.data.order]);
        return true;
      }
      return false;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const fetchPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPosts(fetchedPosts);
      });
      return unsubscribe;
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const handleLike = async (postId) => {
    if (!currentUser) return;
    try {
      const likeId = `${currentUser.uid}_${postId}`;
      const likeRef = doc(db, 'likes', likeId);
      const likeSnap = await getDoc(likeRef);

      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          userId: currentUser.uid,
          postId: postId,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const confirmTrade = (type, qty) => {
    console.warn("confirmTrade is deprecated. Use buyStock/sellStock from lib/trade.js instead.");
    return false;
  };

  // Show Splash screen while Firebase is initializing (instead of blank "Loading...")
  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 42, letterSpacing: '-1px' }}>
          <span>PiggyPath</span>
          <span style={{ color: '#7C3AED' }}>.</span>
          <div style={{ width: 10, height: 10, background: '#22C55E', borderRadius: '50%', position: 'absolute', marginLeft: 2, animation: 'blink 1.2s infinite' }}></div>
        </div>
        <p style={{ color: '#6b7280', marginTop: 10, fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>Learn. Invest. Grow.</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      currentUser, currentScreen, goScreen, goBack,
      portfolio, tradeHistory, currentStock, ipoOrders, watchlist, setWatchlist,
      userData, setUserData, marketHistory, marketPrices,
      getPrice, getPortfolioValue, openStockDetail, confirmTrade, applyIPO,
      posts, fetchPosts, handleLike, setCurrentStock, addLocalTrade
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
