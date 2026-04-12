import React from 'react';
import { useAppContext } from '../context/AppContext';
import { STOCKS } from '../data/mockData';
import { BottomNav } from '../components/Shared';
import stocksIcon from '../assets/icons8-stocks-96.png';
import ipoIcon from '../assets/icons8-stock-share-96.png';

const Home = () => {
  const { 
    goScreen, portfolio, getPortfolioValue, userData, 
    posts, fetchPosts, setCurrentStock, getPrice, openStockDetail 
  } = useAppContext();
  const portfolioValue = getPortfolioValue();

  const mockupCards = [
    { id: 'ms', name: 'Megasoft', sub: 'microsoft.inc', logo: 'ms', price: '100,000', change: '+2.5%', isUp: true },
    { id: 'aapl1', name: 'Bapplee', sub: 'Apple.inc', logo: 'apple', price: '100,000', change: '-2.5%', isUp: false },
    { id: 'aapl2', name: 'Bapplee', sub: 'Apple.inc', logo: 'apple', price: '100,000', change: '-2.5%', isUp: false },
  ];

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
          const isUp = price >= stock.basePrice;
          const change = (((price - stock.basePrice) / stock.basePrice) * 100).toFixed(2);

          return (
            <div key={id} onClick={() => openStockDetail(id)} style={{ minWidth: 160, background: '#6D28D9', borderRadius: 20, border: '2px solid black', padding: '14px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {renderLogo(stock.logo || 'ms')}
                <div style={{ color: 'white', paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{stock.name}</div>
                  <div style={{ fontSize: 9, opacity: .9, marginTop: 2 }}>{qty} Shares</div>
                </div>
              </div>
              <div style={{ color: 'white', marginTop: 14 }}>
                <div style={{ fontSize: 8, fontWeight: 500, letterSpacing: '0.5px' }}>VALUE</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>₹ {value.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: isUp ? '#4ade80' : '#ef4444', fontWeight: 700 }}>{isUp ? '▲' : '▼'}{change}%</div>
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
        <div style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>

        <div style={{ flex: 1, margin: '0 16px', border: '2px solid black', borderRadius: 50, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, background: 'white' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: -70, right: -40, width: 130, height: 130, background: '#4ade80', borderRadius: '50%', zIndex: -1 }}></div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid black', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>

        {/* Hero Card */}
        <div style={{ margin: '0 20px', position: 'relative', marginTop: 16 }}>
          <div style={{ background: 'white', borderRadius: 28, padding: '20px 0', border: '2px solid black', boxShadow: '0 16px 32px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -50, left: -60, width: 180, height: 180, background: '#8b5cf6', borderRadius: '50%', zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-block', position: 'relative' }}>
                  <h1 style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 28, fontWeight: 700, margin: 0, color: 'black' }}>
                    Hello {userData.name}
                  </h1>
                  <div style={{ position: 'absolute', bottom: -4, left: -10, right: -10, height: 1.5, background: 'black' }}></div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12, fontWeight: 500 }}>Welcome Back, Let's continue</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px' }}>
                  <p style={{ fontSize: 10, color: 'black', marginBottom: 6, fontWeight: 500 }}>Local Account Value</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14, color: 'black' }}>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>₦</span>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>{(userData.balance || 0).toLocaleString()}</span>
                  </div>
                  <button style={{ border: '1.5px solid black', background: 'white', color: 'black', borderRadius: 50, padding: '6px 18px', fontSize: 11, fontWeight: 700 }}>Add Money</button>
                </div>

                <div style={{ width: 1.5, background: 'black', opacity: 0.2 }}></div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px' }}>
                  <p style={{ fontSize: 10, color: 'black', marginBottom: 6, fontWeight: 500 }}>Portfolio Account Value</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14, color: 'black' }}>
                     <span style={{ fontSize: 24, fontWeight: 700 }}>₦</span>
                    <span style={{ fontSize: 24, fontWeight: 700 }}>{portfolioValue.toLocaleString()}</span>
                  </div>
                  <button style={{ border: '1.5px solid black', background: 'white', color: 'black', borderRadius: 50, padding: '6px 18px', fontSize: 11, fontWeight: 700 }}>View Anaylytics</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
          <div onClick={() => goScreen('stocks')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 56, height: 56, border: '2px solid black', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
              <img src={stocksIcon} alt="Stocks" style={{ width: 32, height: 32 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'black' }}>Stocks</span>
          </div>
          <div onClick={() => goScreen('ipo')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 56, height: 56, border: '2px solid black', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'black' }}>
              <img src={ipoIcon} alt="IPO" style={{ width: 32, height: 32 }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'black' }}>IPO</span>
          </div>
          <div onClick={() => goScreen('watchlist')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 56, height: 56, border: '2px solid black', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3" fill="black"></circle></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'black' }}>Watchlist</span>
          </div>
          <div onClick={() => goScreen('bucket')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 56, height: 56, border: '2px solid black', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'black' }}>Bucket</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'black' }}>My Portfolio</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'black' }}>View all</span>
        </div>
        {renderPortfolioCards()}

        {/* News Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'black' }}>News Feed</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'black' }} onClick={fetchPosts}>Refresh</span>
        </div>

        {posts.length === 0 ? (
          <div style={{ margin: '0 20px', padding: 20, textAlign: 'center', background: 'white', borderRadius: 24, border: '1px solid #ddd' }}>
            No updates in your cluster yet.
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} onClick={() => { 
                const s = STOCKS.find(s => s.id === post.stockId);
                if (s) setCurrentStock(s);
                goScreen('article'); 
              }} style={{ background: 'white', border: '2px solid black', borderRadius: 24, padding: 20, margin: '0 20px 16px 20px', cursor: 'pointer' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                 <div style={{ fontSize: 12, fontWeight: 800 }}>{post.user?.name}</div>
                 <div style={{ fontSize: 10, color: '#6b7280' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
               </div>
               <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px', color: 'black' }}>{post.title}</h3>
               <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.4, margin: '0 0 12px' }}>{post.content.substring(0, 100)}...</p>
               
               <div style={{ display: 'flex', gap: 16 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                   <span style={{ fontSize: 14 }}>{post.isLiked ? '❤️' : '🤍'}</span>
                   <span style={{ fontSize: 11, fontWeight: 700 }}>{post.likeCount}</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                   <span style={{ fontSize: 14 }}>💬</span>
                   <span style={{ fontSize: 11, fontWeight: 700 }}>{post.commentCount}</span>
                 </div>
               </div>
            </div>
          ))
        )}

        {/* Trending Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'black' }}>Trending Stocks</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'black' }}>View all</span>
        </div>
        <div className="scroll-row" style={{ padding: '0 20px 20px 20px', gap: 16 }}>
          {STOCKS.map(s => {
            const p = getPrice(s);
            return (
              <div key={s.id} onClick={() => openStockDetail(s.id)} style={{ minWidth: 160, background: 'white', borderRadius: 20, border: '2px solid black', padding: '14px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{s.id.substring(0,2).toUpperCase()}</div>
                  <div style={{ color: 'black', paddingTop: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{s.name}</div>
                    <div style={{ fontSize: 9, opacity: .7, marginTop: 2 }}>{s.ticker}</div>
                  </div>
                </div>
                <div style={{ color: 'black', marginTop: 14 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.5px', color: '#6b7280' }}>LIVE PRICE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>₹ {p.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: p >= s.basePrice ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {p >= s.basePrice ? '▲+' : '▼-'}{Math.abs(((p - s.basePrice) / s.basePrice) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* IT Sector Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'black' }}>IT Sector</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'black' }}>View all</span>
        </div>
        <div className="scroll-row" style={{ padding: '0 20px 20px 20px', gap: 16 }}>
          {STOCKS.filter(s => s.sector === 'Technology' || s.name.includes('soft')).map(s => {
            const p = getPrice(s);
            return (
              <div key={s.id} onClick={() => openStockDetail(s.id)} style={{ minWidth: 160, background: 'white', borderRadius: 20, border: '2px solid black', padding: '14px', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{s.id.substring(0,2).toUpperCase()}</div>
                  <div style={{ color: 'black', paddingTop: 2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>{s.name}</div>
                    <div style={{ fontSize: 9, opacity: .7, marginTop: 2 }}>{s.ticker}</div>
                  </div>
                </div>
                <div style={{ color: 'black', marginTop: 14 }}>
                  <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.5px', color: '#6b7280' }}>LIVE PRICE</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>₹ {p.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: p >= s.basePrice ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {p >= s.basePrice ? '▲+' : '▼-'}{Math.abs(((p - s.basePrice) / s.basePrice) * 100).toFixed(2)}%
                    </div>
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
