import React, { createContext, useState, useContext, useEffect } from 'react';
import { STOCKS, NEWS, IPO_DATA } from '../data/mockData';
import { loginWithBackend, getMe, placeBuy, placeSell, getStocks, applyIpo, getPosts, toggleLike, initSocket, getSocket } from '../api';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [prevScreens, setPrevScreens] = useState([]);
  const [portfolio, setPortfolio] = useState({});
  const [marketPrices, setMarketPrices] = useState({});
  const [tradeHistory, setTradeHistory] = useState([]);
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

  // ─── AUTH LISTENER (SUPABASE) ────────────────────────────────────────────────
  useEffect(() => {
    const handleUserSync = async (sbUser) => {
      try {
        const metadataName = sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0];
        const formattedName = metadataName ? metadataName.charAt(0).toUpperCase() + metadataName.slice(1) : 'Trader';
        
        setCurrentUser(sbUser);
        setUserData(prev => ({ ...prev, name: formattedName }));

        // Initial Data Fetch
        fetchPosts().catch(console.error);

        // Try to sync with backend, but don't block
        let me = null;
        try {
          await loginWithBackend();
          me = await getMe();
          if (me) {
            setUserData(me);
            setPortfolio(me.holdings || {});
            
            // Initialize Socket
            if (me.id) {
              const socket = initSocket(me.id);
              socket.on('profile_updated', async () => {
                const updated = await getMe();
                setUserData(updated);
                setPortfolio(updated.holdings || {});
              });
              socket.on('price_update', (data) => {
                setMarketPrices(prev => ({ ...prev, [data.stockId]: data.price }));
              });
            }
          }
        } catch (apiErr) {
          console.warn("Backend sync failed, using local/mock data", apiErr);
        }
        
        // Transition to home if on splash/auth
        setCurrentScreen(prev => (prev === 'auth' || prev === 'splash') ? 'home' : prev);
      } catch (err) {
        console.error("Supabase error:", err);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        handleUserSync(session.user);
      } else {
        setCurrentUser(null);
        setUserData({ name: '', balance: 100000 });
        setPortfolio({});
        setCurrentScreen('auth');
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleUserSync(session.user);
      else {
        setCurrentScreen('auth');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Only run ONCE on mount

  // ─── MARKET & SOCKET LISTENER ──────────────────────────────────────────────
  useEffect(() => {
    // Initial prices from Mock Data
    const initialPrices = {};
    STOCKS.forEach(s => initialPrices[s.id] = s.basePrice);
    setMarketPrices(initialPrices);

    // Try to fetch current prices from API
    getStocks().then(stocks => {
      const prices = {};
      stocks.forEach(s => prices[s.id] = s.currentPrice);
      setMarketPrices(prev => ({ ...prev, ...prices }));
    }).catch(() => console.log("Real-time prices temporarily unavailable, using mock."));

    // TODO: Connect Socket.io for live updates
    // For now, satisfy the "proper logic" by using the mock bot's speed
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

  const getPrice = (s) => marketPrices[s.id] || s.basePrice;

  // Restore the "Old Resilient Logic" for portfolio
  const getPortfolioValue = () => {
    let total = 0;
    if (portfolio && typeof portfolio === 'object') {
      Object.entries(portfolio).forEach(([id, h]) => {
        const s = STOCKS.find(x => x.id === id);
        if (s) total += getPrice(s) * (h.quantity || h.qty || 0);
      });
    }
    return total;
  };

  const openStockDetail = (stockId) => {
    const s = STOCKS.find(x => x.id === stockId);
    setCurrentStock(s);
    goScreen('stock-detail');
  };

  const applyIPO = async (ipoData) => {
    if (!currentUser) return false;
    try {
      // Mock logic: stockId is ipoData.id (which should exist in DB)
      // Amount is usually minInv formatted as number
      const amount = parseFloat(ipoData.minInv.replace(/,/g, ''));
      
      const res = await applyIpo(ipoData.id, amount);
      
      // Update local state immediately
      setIpoOrders(prev => [...prev, res.order]);
      
      // Refresh user data (balance changed)
      const me = await getMe();
      setUserData(me);
      
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    }
  };

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const { liked } = await toggleLike(postId);
      // Optimistic update
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isLiked: liked, likeCount: liked ? p.likeCount + 1 : p.likeCount - 1 } 
          : p
      ));
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const confirmTrade = async (type, qty) => {
    if (!currentUser || !currentStock) return false;
    const numQty = Number(qty);
    const price = getPrice(currentStock);
    const total = price * numQty;

    // We do a small local validation but rely on backend for the "real" money usage
    if (type === 'buy' && userData.balance < total) {
      alert("Insufficient balance");
      return false;
    }

    try {
      if (type === 'buy') {
        const res = await placeBuy(currentStock.id, price, numQty);
        // The balance and portfolio will update via 'profile_updated' socket event
        // But for better UX, we can refresh immediately if match was instant
        if (res.matchedTrades > 0) {
           const me = await getMe();
           setUserData(me);
           setPortfolio(me.holdings || {});
        }
      } else {
        const res = await placeSell(currentStock.id, price, numQty);
        if (res.matchedTrades > 0) {
           const me = await getMe();
           setUserData(me);
           setPortfolio(me.holdings || {});
        }
      }
      return true;
    } catch (e) {
      alert(e.message);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, currentScreen, goScreen, goBack,
      portfolio, tradeHistory, currentStock, ipoOrders, watchlist, setWatchlist,
      userData, setUserData,
      getPrice, getPortfolioValue, openStockDetail, confirmTrade, applyIPO,
      posts, fetchPosts, handleLike, setCurrentStock
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
