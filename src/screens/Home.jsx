import React from 'react';
import { useAppContext } from '../context/AppContext';
import { STOCKS } from '../data/mockData';
import { BottomNav } from '../components/Shared';

const Home = () => {
  const { 
    goScreen, portfolio, getPortfolioValue, userData, 
    posts, fetchPosts, setCurrentStock, getPrice, openStockDetail 
  } = useAppContext();
  const portfolioValue = getPortfolioValue();

  const renderLogo = (logoType) => {
    if (logoType === 'ms') {
      return (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'white', display: 'flex', flexWrap: 'wrap', padding: 3, border: '1px solid var(--border)' }}>
          <div style={{ width: '50%', height: '50%', background: '#F25022', borderRadius: '4px 0 0 0', border: '1px solid white' }}></div>
          <div style={{ width: '50%', height: '50%', background: '#7FBA00', borderRadius: '0 4px 0 0', border: '1px solid white' }}></div>
          <div style={{ width: '50%', height: '50%', background: '#00A4EF', border: '1px solid white' }}></div>
          <div style={{ width: '50%', height: '50%', background: '#FFB900', border: '1px solid white' }}></div>
        </div>
      );
    }
    if (logoType === 'apple') {
      return (
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
          <svg width="20" height="20" viewBox="0 0 384 512"><path fill="#111" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.1-44.6-35.9-2.8-74.3 22.7-95.1 22.7-20.3 0-51-22.3-81.8-22.3-43.2 0-85.3 25.8-108.3 67.5-47.2 85.3-12.7 212.1 33.7 279 23.1 33.5 50 69.8 85.6 68.6 34.6-1.2 46.8-22.5 89.2-22.5 42.1 0 53.6 22.5 89.6 22.1 36.7-.4 60.1-33.8 82.8-67.1 26.6-39.6 37.6-78.2 38.3-80.2-1.1-.5-75.1-28.5-74.9-106zM254.6 96.5c19.1-23.7 32.1-56.7 28.5-89.5-28.2 1.2-62.8 19-82.6 42.7-16.7 20-31.5 54.1-26.9 86.4 31.8 2.5 63.8-16.3 81-39.6z" /></svg>
        </div>
      );
    }
    return <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{logoType.substring(0,2).toUpperCase()}</div>;
  };

  const renderPortfolioCards = () => {
    const holdingIds = Object.keys(portfolio);
    if (holdingIds.length === 0) {
      return (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ padding: 20, background: 'white', borderRadius: 20, border: '1.5px dashed #ccc', textAlign: 'center', color: '#666', fontSize: 13, fontWeight: 500 }}>
            No assets owned. Start trading to see your portfolio here!
          </div>
        </div>
      );
    }

    return (
      <div className="scroll-row" style={{ padding: '0 20px 20px 20px', gap: 16 }}>
        {holdingIds.map(id => {
          const stock = STOCKS.find(s => s.id === id);
          if (!stock) return null;
          const price = getPrice(stock);
          const h = portfolio[id];
          const qty = h.quantity || h.qty || 0;
          const value = price * qty;
          const isUp = price >= (h.avgPrice || stock.basePrice);
          const change = h.avgPrice ? (((price - h.avgPrice) / h.avgPrice) * 100).toFixed(2) : '0.00';

          return (
            <div key={id} onClick={() => openStockDetail(id)} style={{ minWidth: 160, background: '#6D28D9', borderRadius: 20, border: '1.5px solid black', padding: '14px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {renderLogo(stock.logo || stock.id)}
                <div style={{ color: 'white', paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.1 }}>{stock.name}</div>
                  <div style={{ fontSize: 9, opacity: .9, marginTop: 2 }}>{qty} Shares</div>
                </div>
              </div>
              <div style={{ color: 'white', marginTop: 14 }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.5px', opacity: 0.8 }}>CURRENT VALUE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>₹ {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div style={{ fontSize: 10, color: Number(change) >= 0 ? '#4ade80' : '#f87171', fontWeight: 800 }}>{Number(change) >= 0 ? '▲' : '▼'}{Math.abs(change)}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAFA' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', position: 'relative', zIndex: 10, marginTop: 20 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', border: '1.5px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>

        <div style={{ flex: 1, margin: '0 12px', border: '1.5px solid black', borderRadius: 50, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'white' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>Search stocks, IPO...</span>
        </div>

        <div style={{ width: 42, height: 42, borderRadius: '50%', border: '1.5px solid black', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        
        {/* HERO CARD (Proper Logic) */}
        <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', margin: 16, borderRadius: 24, padding: 24, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
          <p style={{ fontSize: 13, opacity: 0.8, fontWeight: 600 }}>Hello {userData.name || 'Investor'} 👋</p>
          <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 20 }}>Welcome to your PiggyPath Dashboard</p>

          <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.8px', marginBottom: 6 }}>Local Account</p>
              <h2 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: 26, margin: 0 }}>₹ {Number(userData.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }}></div>
            <div>
              <p style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.8px', marginBottom: 6 }}>Portfolio Value</p>
              <h2 style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: 26, margin: 0 }}>₹ {Number(getPortfolioValue()).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Money</button>
            <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px', borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Analytics</button>
          </div>
        </div>

        {/* Shortcuts — emojis from piggypath_trading_app.html */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 16px 20px' }}>
          {[
            { id: 'stocks',    icon: '📈', label: 'Stocks'    },
            { id: 'ipo',       icon: '🏦', label: 'IPO'       },
            { id: 'watchlist', icon: '👁️', label: 'Watchlist' },
            { id: 'bucket',    icon: '🪣', label: 'Bucket'    }
          ].map(item => (
            <div key={item.id} onClick={() => goScreen(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 56, height: 56, border: '1.5px solid var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, background: 'white' }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'black' }}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'black', fontFamily: '"Syne", sans-serif' }}>My Portfolio</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }} onClick={() => goScreen('stocks')}>View all</span>
        </div>
        {renderPortfolioCards()}

        {/* News Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'black', fontFamily: '"Syne", sans-serif' }}>Market Pulse</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }} onClick={fetchPosts}>Refresh</span>
        </div>

        {posts.length === 0 ? (
          <div style={{ margin: '0 20px', padding: 24, textAlign: 'center', background: 'white', borderRadius: 24, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>No updates in your cluster yet.</p>
          </div>
        ) : (
          posts.slice(0, 3).map(post => (
            <div key={post.id} onClick={() => { 
                const s = STOCKS.find(s => s.id === post.stockId);
                if (s) setCurrentStock(s);
                goScreen('article'); 
              }} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 24, padding: 20, margin: '0 20px 12px 20px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED' }}>{post.user?.name}</div>
                 <div style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
               </div>
               <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: 'black', lineHeight: 1.3 }}>{post.title}</h3>
               <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4, margin: '0 0 12px' }}>{post.content.substring(0, 85)}...</p>
               
               <div style={{ display: 'flex', gap: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                   <span style={{ fontSize: 12 }}>{post.isLiked ? '❤️' : '🤍'}</span>
                   <span style={{ fontSize: 10, fontWeight: 700 }}>{post.likeCount}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                   <span style={{ fontSize: 12 }}>💬</span>
                   <span style={{ fontSize: 10, fontWeight: 700 }}>{post.commentCount}</span>
                 </div>
               </div>
            </div>
          ))
        )}

        {/* Trending Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', marginTop: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'black', fontFamily: '"Syne", sans-serif' }}>Trending</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }} onClick={() => goScreen('stocks')}>View all</span>
        </div>
        <div className="scroll-row" style={{ padding: '0 20px 20px 20px', gap: 12 }}>
          {STOCKS.map(s => {
            const p = getPrice(s);
            const isUp = p >= s.basePrice;
            return (
              <div key={s.id} onClick={() => openStockDetail(s.id)} style={{ minWidth: 150, background: 'white', borderRadius: 24, border: '1.5px solid #e5e7eb', padding: '16px', flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  {renderLogo(s.logo || s.id)}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>{s.ticker}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600 }}>{s.name.substring(0, 8)}..</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>₹ {p.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: isUp ? '#22c55e' : '#ef4444', fontWeight: 800, marginTop: 2 }}>
                    {isUp ? '▲+' : '▼-'}{Math.abs(((p - s.basePrice) / s.basePrice) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
};

export default Home;
