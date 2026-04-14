import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { useAppContext } from '../context/AppContext';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ─── SEEDED PRNG: same chart every refresh, no random flickering ─────────────
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function getStockSeed(id) {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137;
}
// Deterministic history — Same stock+range = same chart. Trade impacts on top.
function getPriceHistory(stock, range, trades = []) {
  const pts = range === '1d' ? 24 : range === '6m' ? 24 : range === '1y' ? 52 : 104;
  const rng = seededRandom(getStockSeed(stock.id || 'x') + pts * 7);
  let base = stock.basePrice * 0.8;
  const hist = [];
  for (let i = 0; i < pts; i++) {
    base += base * (rng() * 0.04 - 0.018);
    hist.push(+base.toFixed(2));
  }
  // Apply trade impacts (exact HTML logic)
  let runPrice = hist[hist.length - 1];
  trades.forEach((t, ti) => {
    const idx = Math.max(pts - trades.length + ti, 0);
    const type = t.type || t.tradeType;
    const delta = type === 'buy' ? runPrice * 0.015 : -(runPrice * 0.01);
    runPrice += delta;
    for (let j = idx; j < pts; j++) {
      hist[j] = +(hist[j] + delta * (j - idx + 1) / pts).toFixed(2);
    }
  });
  hist.push(stock.basePrice);
  return hist;
}

const StockDetail = () => {
  const { 
    currentStock, goBack, goScreen, tradeHistory, portfolio, 
    getPrice, marketHistory, userData, setUserData, currentUser,
    addLocalTrade
  } = useAppContext();

  const [range, setRange] = useState('1d'); // default = Current view
  const [tab, setTab] = useState('overview');
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [tradeQty, setTradeQty] = useState(1);
  const [showConfirm, setShowConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [localPortfolio, setLocalPortfolio] = useState({});

  // Generate chart data using HTML's getPriceHistory algo
  const stockTrades = tradeHistory.filter(t => t.stockId === currentStock?.id);
  const chartHistory = marketHistory[currentStock?.id]?.length > 5
    ? marketHistory[currentStock?.id]
    : getPriceHistory(currentStock || { basePrice: 100, id: 'x' }, range, stockTrades);

  if (!currentStock) return null;

  const price = getPrice(currentStock);
  const isUp = chartHistory[chartHistory.length - 1] >= chartHistory[0];
  const color = isUp ? '#22C55E' : '#EF4444';
  const startPrice = chartHistory[0] || price;
  const chgPercent = (((price - startPrice) / startPrice) * 100).toFixed(2);

  const chartData = {
    labels: chartHistory.map(() => ''),
    datasets: [{
      data: chartHistory,
      borderColor: color,
      borderWidth: 2.5,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      backgroundColor: color + '18',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: { 
        mode: 'index', intersect: false,
        callbacks: { label: c => `₹ ${c.raw.toLocaleString()}` }
      }
    },
    scales: {
      x: { display: false },
      y: { display: false, grid: { display: false } }
    }
  };

  // Merge Firestore portfolio with local state
  const allPortfolio = { ...portfolio, ...localPortfolio };
  const holding = allPortfolio[currentStock.id];
  const qty = holding?.quantity || holding?.qty || 0;
  const avgPrice = holding?.avgPrice || 0;
  const invested = qty * avgPrice;
  const currValue = price * qty;
  const pnl = currValue - invested;

  // ─── LOCAL TRADE (works without backend) ──────────────────────────────────
  const handleConfirmTrade = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const totalCost = price * tradeQty;

      if (tradeType === 'buy') {
        // Check balance
        if ((userData.balance || 0) < totalCost) {
          alert('Insufficient balance!');
          setLoading(false);
          return;
        }
        
        // Update local portfolio state immediately
        const existing = allPortfolio[currentStock.id];
        const newQty = (existing?.quantity || 0) + tradeQty;
        const newInvested = (existing?.quantity || 0) * (existing?.avgPrice || 0) + totalCost;
        const newAvgPrice = newInvested / newQty;
        
        setLocalPortfolio(prev => ({
          ...prev,
          [currentStock.id]: { quantity: newQty, avgPrice: +newAvgPrice.toFixed(2) }
        }));
        
        // Deduct balance locally
        setUserData(prev => ({ ...prev, balance: (prev.balance || 0) - totalCost }));

        // ── MARKET IMPACT: BUY pushes price UP +1.2% ──
        addLocalTrade(currentStock.id, 'buy');

        // Sync to Firestore in background (non-blocking)
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const portRef = doc(db, 'portfolio', `${currentUser.uid}_${currentStock.id}`);
          Promise.all([
            updateDoc(userRef, { balance: increment(-totalCost) }).catch(() =>
              setDoc(userRef, { balance: 100000 - totalCost }, { merge: true })
            ),
            setDoc(portRef, {
              userId: currentUser.uid,
              stockId: currentStock.id,
              quantity: newQty,
              avgPrice: +newAvgPrice.toFixed(2),
              updatedAt: serverTimestamp()
            }, { merge: true }),
            addDoc(collection(db, 'transactions'), {
              userId: currentUser.uid,
              stockId: currentStock.id,
              type: 'buy',
              quantity: tradeQty,
              price: price,
              total: totalCost,
              createdAt: serverTimestamp()
            })
          ]).catch(err => console.warn('[Firestore] Sync failed (non-fatal):', err.message));
        }

      } else {
        // SELL
        if (!holding || qty < tradeQty) {
          alert('Not enough shares to sell!');
          setLoading(false);
          return;
        }

        const proceeds = price * tradeQty;
        const newQty = qty - tradeQty;
        
        setLocalPortfolio(prev => ({
          ...prev,
          [currentStock.id]: newQty <= 0
            ? { quantity: 0, avgPrice: 0 }
            : { quantity: newQty, avgPrice: avgPrice }
        }));

        setUserData(prev => ({ ...prev, balance: (prev.balance || 0) + proceeds }));

        // ── MARKET IMPACT: SELL pushes price DOWN -0.9% ──
        addLocalTrade(currentStock.id, 'sell');

        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const portRef = doc(db, 'portfolio', `${currentUser.uid}_${currentStock.id}`);
          Promise.all([
            updateDoc(userRef, { balance: increment(proceeds) }).catch(() => {}),
            newQty <= 0
              ? updateDoc(portRef, { quantity: 0 }).catch(() => {})
              : setDoc(portRef, { quantity: newQty, avgPrice: avgPrice, updatedAt: serverTimestamp() }, { merge: true }),
            addDoc(collection(db, 'transactions'), {
              userId: currentUser.uid,
              stockId: currentStock.id,
              type: 'sell',
              quantity: tradeQty,
              price: price,
              total: proceeds,
              createdAt: serverTimestamp()
            })
          ]).catch(err => console.warn('[Firestore] Sync failed (non-fatal):', err.message));
        }
      }

      const msg = tradeType === 'buy' ? `✅ Bought ${tradeQty} share(s)!` : `✅ Sold ${tradeQty} share(s)!`;
      setShowConfirm(msg);
      setTimeout(() => {
        setTradeModalOpen(false);
        setShowConfirm('');
      }, 900);

    } catch (err) {
      console.error('[Trade Error]', err);
      alert(err.message || 'Trade failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white' }}>
        <div onClick={goBack} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'black' }}>{currentStock.name}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>{currentStock.ticker || currentStock.id.toUpperCase()}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        
        {/* Price Card with Graph */}
        <div style={{ margin: '0 16px 20px', border: '1.5px solid var(--border)', borderRadius: 24, padding: '24px 0 16px', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: (currentStock.color || '#7C3AED') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: currentStock.color || '#7C3AED' }}>
              {typeof currentStock.logo === 'string' && currentStock.logo.length <= 3 ? currentStock.logo : currentStock.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
          
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 32, textAlign: 'center', marginBottom: 4, color: 'black' }}>
            ₹ {price.toLocaleString()}
          </p>
          <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444', marginBottom: 16 }}>
            {isUp ? '▲ +' : '▼ '}{Math.abs(Number(chgPercent)).toFixed(2)}%
          </div>

          {/* THE GRAPH — using getPriceHistory from HTML */}
          <div style={{ position: 'relative', width: '100%', height: 160, marginBottom: 12 }}>
            <Line key={`${currentStock.id}-${range}`} data={chartData} options={chartOptions} />
          </div>

          {/* Range Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '0 16px' }}>
            {[['1d', 'Current'], ['6m', '6 MON'], ['1y', '12 MON']].map(([r, label]) => (
              <button key={r} onClick={() => setRange(r)} style={{ padding: '8px 18px', borderRadius: 50, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: range === r ? 'none' : '1px solid #e5e7eb', background: range === r ? '#7C3AED' : 'white', color: range === r ? 'white' : 'black' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* BUY / SELL / NEWS */}
        <div style={{ display: 'flex', gap: 10, margin: '0 16px 20px' }}>
          <button onClick={() => { setTradeType('buy'); setTradeQty(1); setShowConfirm(''); setTradeModalOpen(true); }} style={{ flex: 1.2, padding: '15px 0', borderRadius: 50, background: '#22c55e', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>BUY</button>
          <button onClick={() => { setTradeType('sell'); setTradeQty(1); setShowConfirm(''); setTradeModalOpen(true); }} style={{ flex: 1.2, padding: '15px 0', borderRadius: 50, background: '#7C3AED', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>SELL</button>
          <button onClick={() => goScreen('news')} style={{ flex: 1, padding: '15px 0', borderRadius: 50, background: 'white', color: 'black', fontWeight: 700, fontSize: 15, border: '1px solid #e5e7eb', cursor: 'pointer' }}>News</button>
        </div>

        {/* Tabs */}
        <div style={{ margin: '0 16px 20px', background: '#f3f4f6', borderRadius: 50, padding: 4, display: 'flex' }}>
          {['overview', 'fundamentals'].map(t => (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: tab === t ? '#7C3AED' : 'transparent', color: tab === t ? 'white' : '#6b7280', transition: 'all 0.2s', textTransform: 'capitalize' }}>
              {t}
            </div>
          ))}
        </div>

        <div style={{ padding: '0 16px' }}>
          {tab === 'overview' ? (
            <div>
              {/* YOUR POSITION */}
              <h3 style={{ fontWeight: 800, fontSize: 16, color: 'black', marginBottom: 12 }}>Your Holdings</h3>
              {qty === 0 ? (
                <div style={{ padding: 20, border: '1px dashed #d1d5db', borderRadius: 20, textAlign: 'center', marginBottom: 24 }}>
                  <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 500, margin: 0 }}>You don't own any {currentStock.name} yet. Click BUY to start!</p>
                </div>
              ) : (
                <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1.5px solid #e5e7eb', marginBottom: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { label: 'Quantity', value: qty },
                      { label: 'Invested', value: `₹ ${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                      { label: 'Current Value', value: `₹ ${currValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                      { label: 'P&L', value: `${pnl >= 0 ? '+' : ''}₹ ${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: pnl >= 0 ? '#22c55e' : '#ef4444' }
                    ].map(({ label, value, color: c }) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                        <p style={{ fontWeight: 800, fontSize: 17, color: c || 'black', margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>AVG PRICE</span>
                    <span style={{ fontSize: 12, color: 'black', fontWeight: 800 }}>₹ {avgPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Key Stats */}
              <h3 style={{ fontWeight: 800, fontSize: 16, color: 'black', marginBottom: 12 }}>Key Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { k: 'Volume', v: currentStock.volume },
                  { k: 'Avg Price', v: `₹ ${currentStock.avgPrice?.toLocaleString()}` },
                  { k: 'P/E Ratio', v: currentStock.pe },
                  { k: 'Market Cap', v: currentStock.mktCap }
                ].map(({ k, v }) => (
                  <div key={k} style={{ background: '#f9fafb', borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'black' }}>{v}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>
                {currentStock.desc}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { k: 'P/E Ratio', v: currentStock.pe },
                { k: 'EPS', v: `₹ ${currentStock.eps}` },
                { k: 'Market Cap', v: currentStock.mktCap },
                { k: 'Sector', v: currentStock.sector }
              ].map(({ k, v }) => (
                <div key={k} style={{ background: '#f9fafb', borderRadius: 16, padding: '16px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, marginBottom: 6 }}>{k}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'black' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trade Modal */}
      {tradeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '28px 28px 0 0', padding: '28px 24px 36px', width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontWeight: 800, fontSize: 20, color: 'black', margin: 0 }}>{tradeType === 'buy' ? 'Buy Asset' : 'Sell Position'}</h3>
              <div onClick={() => setTradeModalOpen(false)} style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800, fontSize: 16 }}>✕</div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Market Execution Price</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 34, color: 'black' }}>₹ {price.toLocaleString()}</div>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'black', marginBottom: 8, display: 'block' }}>Quantity Configuration</label>
              <input type="number" value={tradeQty} min="1" onChange={(e) => setTradeQty(Number(e.target.value) || 1)} style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1px solid #e5e7eb', fontSize: 18, fontWeight: 700, boxSizing: 'border-box', background: '#f9fafb', outline: 'none' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginBottom: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Estimated Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'black' }}>₹ {(price * tradeQty).toFixed(2)}</span>
            </div>

            {tradeType === 'buy' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 12 }}>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Available Balance</span>
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 800 }}>₹ {Number(userData.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            )}
            
            <button onClick={handleConfirmTrade} disabled={loading} style={{ width: '100%', padding: 18, borderRadius: 50, background: loading ? '#9ca3af' : tradeType === 'buy' ? '#22c55e' : '#7C3AED', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Processing...' : `Confirm ${tradeType === 'buy' ? 'Buy' : 'Sell'} Order`}
            </button>
            
            {showConfirm && (
              <div style={{ textAlign: 'center', marginTop: 14, fontSize: 14, fontWeight: 800, color: tradeType === 'buy' ? '#22c55e' : '#7C3AED' }}>
                {showConfirm}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
