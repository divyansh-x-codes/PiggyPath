import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import classNames from 'classnames';
import { useAppContext } from '../context/AppContext';
import { getStockHistory, subscribeToStock, unsubscribeFromStock, getSocket } from '../api';

const StockDetail = () => {
  const { currentStock, goBack, goScreen, tradeHistory, portfolio, getPrice, confirmTrade } = useAppContext();
  const [range, setRange] = useState('1m');
  const [tab, setTab] = useState('overview');
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [tradeQty, setTradeQty] = useState(1);
  const [showConfirm, setShowConfirm] = useState('');
  const [localHistory, setLocalHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Initial History Fetch
  useEffect(() => {
    if (!currentStock) return;
    
    let isMounted = true;
    setIsHistoryLoading(true);
    
    getStockHistory(currentStock.id, range).then(data => {
      if (!isMounted) return;
      // Convert to simple array of prices
      const prices = data.map(h => h.price);
      // If empty, add current price as starting point
      if (prices.length === 0) prices.push(getPrice(currentStock));
      setLocalHistory(prices);
      setIsHistoryLoading(false);
    }).catch(err => {
      console.error("Failed to load history:", err);
      setLocalHistory([getPrice(currentStock)]);
      setIsHistoryLoading(false);
    });

    // Real-time socket subscription
    subscribeToStock(currentStock.id);
    const socket = getSocket();
    
    const onPriceUpdate = (data) => {
      if (data.stockId === currentStock.id) {
        setLocalHistory(prev => [...prev.slice(-100), data.price]);
      }
    };
    
    if (socket) socket.on('price_update', onPriceUpdate);

    return () => {
      isMounted = false;
      unsubscribeFromStock(currentStock.id);
      if (socket) socket.off('price_update', onPriceUpdate);
    };
  }, [currentStock, range]);

  if (!currentStock) return null;

  const price = getPrice(currentStock);
  const isUp = localHistory.length > 1 ? price >= localHistory[0] : true;
  const color = isUp ? '#22C55E' : '#EF4444';
  const chgPercent = localHistory.length > 1 ? (((price - localHistory[0]) / localHistory[0]) * 100).toFixed(2) : '0.00';

  const chartData = {
    labels: localHistory.map((_, i) => i),
    datasets: [{
      data: localHistory,
      borderColor: color,
      borderWidth: 2,
      tension: 0.1,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      backgroundColor: color + '22',
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false, callbacks: { label: c => `₹ ${c.raw.toLocaleString()}` } }
    },
    scales: {
      x: { display: false },
      y: { display: false, grid: { display: false } }
    }
  };

  const holding = portfolio[currentStock.id];
  const currHValue = holding ? price * holding.qty : 0;
  const pnl = holding ? currHValue - holding.invested : 0;

  const handleOpenTrade = (type) => {
    setTradeType(type);
    setTradeQty(1);
    setShowConfirm('');
    setTradeModalOpen(true);
  };

  const handleConfirmTrade = () => {
    if (confirmTrade(tradeType, tradeQty)) {
      setShowConfirm(tradeType === 'buy' ? '✅ Bought ' : '✅ Sold ');
      setTimeout(() => {
        setTradeModalOpen(false);
        setShowConfirm('');
      }, 900);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
      
      {/* Floating Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white', position: 'relative', zIndex: 10 }}>
        <div onClick={goBack} style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'black', lineHeight: 1.1 }}>{currentStock.name}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginTop: 2 }}>{currentStock.ticker}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        
        {/* Core Hero Frame */}
        <div style={{ margin: '0 20px 24px', border: '1px solid #e5e7eb', borderRadius: 32, padding: '32px 0 24px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Centralized Focus Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#8b5cf6' }}>
              {currentStock.name.substring(0,2).toUpperCase()}
            </div>
          </div>
          <p style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 800, fontSize: 36, textAlign: 'center', marginBottom: 4, color: 'black', letterSpacing: '-1px' }}>
            ₹ {price.toLocaleString()}
          </p>
          <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444', marginBottom: 12 }}>
            {isUp ? '▲ +' : '▼ '}{Math.abs(Number(chgPercent)).toFixed(2)}%
          </div>

          <div style={{ position: 'relative', width: '100%', height: 180, marginBottom: 16 }}>
            <Line data={chartData} options={chartOptions} />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '0 20px' }}>
            <button onClick={() => setRange('6m')} style={{ padding: '8px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: range === '6m' ? 'none' : '1px solid #e5e7eb', background: range === '6m' ? '#8b5cf6' : 'white', color: range === '6m' ? 'white' : 'black' }}>
              6 MON
            </button>
            <button onClick={() => setRange('1y')} style={{ padding: '8px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: range === '1y' ? 'none' : '1px solid #e5e7eb', background: range === '1y' ? '#8b5cf6' : 'white', color: range === '1y' ? 'white' : 'black' }}>
              12 MON
            </button>
            <button onClick={() => setRange('2y')} style={{ padding: '8px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: range === '2y' ? 'none' : '1px solid #e5e7eb', background: range === '2y' ? '#8b5cf6' : 'white', color: range === '2y' ? 'white' : 'black' }}>
              2 YEAR
            </button>
          </div>
        </div>

        {/* Triple Action Bar */}
        <div style={{ display: 'flex', gap: 12, margin: '0 20px 24px' }}>
          <button onClick={() => handleOpenTrade('buy')} style={{ flex: 1.2, padding: '16px 0', borderRadius: 50, background: '#22c55e', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
            BUY
          </button>
          <button onClick={() => handleOpenTrade('sell')} style={{ flex: 1.2, padding: '16px 0', borderRadius: 50, background: '#8b5cf6', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer' }}>
            SELL
          </button>
          <button onClick={() => goScreen('news')} style={{ flex: 1, padding: '16px 0', borderRadius: 50, background: 'white', color: 'black', fontWeight: 700, fontSize: 15, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
            News
          </button>
        </div>

        {/* Global Segments */}
        <div style={{ margin: '0 20px 24px', background: '#f3f4f6', borderRadius: 50, padding: 4, display: 'flex' }}>
          <div onClick={() => setTab('overview')} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: tab === 'overview' ? '#8b5cf6' : 'transparent', color: tab === 'overview' ? 'white' : 'black', transition: 'all 0.2s' }}>
            Overview
          </div>
          <div onClick={() => setTab('fundamentals')} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: tab === 'fundamentals' ? '#8b5cf6' : 'transparent', color: tab === 'fundamentals' ? 'white' : 'black', transition: 'all 0.2s' }}>
            Fundamentals
          </div>
        </div>

        <div style={{ padding: '0 24px' }}>
          {tab === 'overview' ? (
            <div>
              {/* YOUR POSITION - Moved here for better visibility as requested */}
              <div style={{ marginBottom: 32 }}>
                 <h3 style={{ fontWeight: 800, fontSize: 18, color: 'black', marginBottom: 16 }}>Your Position</h3>
                 {(!holding || holding.quantity === 0) ? (
                    <div style={{ padding: '20px', border: '1px dashed #ced4da', borderRadius: 24, textAlign: 'center' }}>
                       <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 500, margin: 0 }}>You don't own any {currentStock.name} yet.</p>
                    </div>
                 ) : (
                    <div style={{ background: '#f9fafb', borderRadius: 24, padding: 20, border: '1.5px solid black' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div>
                             <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Shares Owned</div>
                             <div style={{ fontSize: 22, fontWeight: 800, color: 'black' }}>{holding.quantity}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Current Value</div>
                             <div style={{ fontSize: 22, fontWeight: 800, color: 'black' }}>₹ {currHValue.toLocaleString()}</div>
                          </div>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: 12 }}>
                          <div>
                             <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Avg Price</div>
                             <div style={{ fontSize: 14, fontWeight: 800, color: 'black' }}>₹ {(holding.avgPrice || price).toLocaleString()}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>Total Returns</div>
                             <div style={{ fontSize: 14, fontWeight: 800, color: pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                               {pnl >= 0 ? '+' : '-'}₹ {Math.abs(pnl).toLocaleString()} ({((pnl / (holding.invested || 1)) * 100).toFixed(2)}%)
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              {/* RECENT TRANSACTIONS */}
              <div style={{ marginBottom: 32 }}>
                 <h3 style={{ fontWeight: 800, fontSize: 18, color: 'black', marginBottom: 16 }}>Recent Orders</h3>
                 {tradeHistory.filter(t => t.stockId === currentStock.id).length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>No trade history for this asset.</p>
                 ) : (
                    <div>
                    {tradeHistory.filter(t => t.stockId === currentStock.id).slice(0, 5).map((t, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: t.type === 'buy' ? '#22c55e' : '#8b5cf6' }}>{t.type.toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{new Date(t.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{t.quantity} shares</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>at ₹ {t.price}</div>
                        </div>
                      </div>
                    ))}
                    </div>
                 )}
              </div>

              <h3 style={{ fontWeight: 800, fontSize: 18, color: 'black', marginBottom: 16 }}>Key Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Volume</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'black' }}>{currentStock.volume}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Avg Price</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'black' }}>₹ {currentStock.avgPrice.toLocaleString()}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, marginBottom: 24, fontWeight: 500 }}>
                {currentStock.desc}
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>P/E Ratio</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'black' }}>{currentStock.pe}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>EPS</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'black' }}>₹ {currentStock.eps}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Market Cap</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'black' }}>{currentStock.mktCap}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Sector</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'black' }}>{currentStock.sector}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {tradeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '32px 32px 0 0', padding: 32, width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontWeight: 800, fontSize: 22, color: 'black', margin: 0 }}>{tradeType === 'buy' ? 'Buy Asset' : 'Sell Position'}</h3>
              <div onClick={() => setTradeModalOpen(false)} style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>✕</div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Market Execution Price</div>
              <div style={{ fontWeight: 800, fontSize: 36, color: 'black', letterSpacing: '-1px' }}>₹ {price.toLocaleString()}</div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 700, color: 'black', marginBottom: 8, display: 'block' }}>Quantity Configuration</label>
              <input type="number" value={tradeQty} min="1" onChange={(e) => setTradeQty(Number(e.target.value) || 1)} style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: '1px solid #e5e7eb', fontSize: 18, fontWeight: 700, boxSizing: 'border-box', background: '#f9fafb' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid #e5e7eb', marginBottom: 24 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>Estimated Total</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: 'black' }}>₹ {(price * tradeQty).toFixed(2)}</span>
            </div>
            
            <button onClick={handleConfirmTrade} style={{ width: '100%', padding: 20, borderRadius: 50, background: tradeType === 'buy' ? '#22c55e' : '#8b5cf6', color: 'white', fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer' }}>
              Confirm {tradeType === 'buy' ? 'Buy Order' : 'Sell Order'}
            </button>
            
            {showConfirm && (
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, fontWeight: 700, color: tradeType === 'buy' ? '#22c55e' : '#8b5cf6' }}>
                {showConfirm} {tradeQty} unit(s) of {currentStock.name} successfully evaluated!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
