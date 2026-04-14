import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BottomNav } from '../components/Shared';
import { STOCKS } from '../data/mockData';

const Profile = () => {
  const { goScreen, userData, portfolio, tradeHistory, getPrice } = useAppContext();

  // Calculate portfolio stats
  const portfolioEntries = Object.entries(portfolio).filter(([, h]) => (h.quantity || 0) > 0);
  const totalInvested = portfolioEntries.reduce((sum, [, h]) => sum + (h.quantity || 0) * (h.avgPrice || 0), 0);
  const totalCurrentValue = portfolioEntries.reduce((sum, [id, h]) => {
    const stock = STOCKS.find(s => s.id === id);
    const price = stock ? getPrice(stock) : (h.avgPrice || 0);
    return sum + price * (h.quantity || 0);
  }, 0);
  const totalPnL = totalCurrentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : '0.00';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAFA' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', paddingTop: 24, zIndex: 10 }}>
        {/* Back Button */}
        <div onClick={() => goScreen('home')} style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>

        {/* Name Block */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'black', letterSpacing: '0.2px' }}>Divyansh</span>
            <span style={{ fontSize: 9, marginTop: 4, marginLeft: 2, color: 'black', fontWeight: 600 }}>#546677</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'black', marginTop: -8, letterSpacing: '0.2px' }}>nav</div>
        </div>

        {/* Hamburger Menu */}
        <div style={{ padding: 8 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>

        {/* Hero Card */}
        <div style={{ margin: '0 20px', marginTop: 10, position: 'relative' }}>
          <div style={{ background: 'white', borderRadius: 32, border: '2.5px solid black', boxShadow: '0px 18px 40px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden', minHeight: 280 }}>

            {/* Avatar Video */}
            <div style={{ position: 'absolute', right: 20, top: 20, bottom: 45, zIndex: 1, width: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <video src="/r.mp4" autoPlay loop muted playsInline style={{ maxWidth: '800%', maxHeight: '100%', objectFit: 'cover' }} />
            </div>

            {/* Edit Button */}
            <div style={{ position: 'absolute', right: 28, bottom: 20, zIndex: 2 }}>
              <div style={{ background: 'white', border: '1px solid transparent', borderRadius: 30, padding: '7px 26px', fontSize: 20, fontWeight: 700, color: 'black', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                Edit
              </div>
            </div>

            {/* Left side Content Wrapper */}
            <div style={{ position: 'relative', zIndex: 2, padding: 20, width: '58%' }}>

              {/* Level Box */}
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, background: '#fbbf24', border: '1.5px solid black', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>7</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'black' }}>Level 0</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 600, marginTop: 1 }}>#546677</div>
                </div>
              </div>

              {/* Stats inline block */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: '#8b5cf6', fontSize: 11 }}>⭐</span> 3500 XP</div>
                <div style={{ fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: '#eab308' }}>🔥 17-Day Streak</div>
              </div>

              {/* Divider */}
              <div style={{ height: '1.5px', background: '#e2e8f0', width: '100%', marginBottom: 12 }}></div>

              {/* Completion text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: 'black', marginBottom: 36 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e"><circle cx="12" cy="12" r="12"></circle><path d="M17 8l-7 7-3-3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path></svg>
                Completed 32 Levels
              </div>

              {/* Social icons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── INVESTMENT SUMMARY ────────────────────────────────────────── */}
        <div style={{ margin: '16px 20px 0' }}>
          <div style={{ background: 'white', border: '2px solid black', borderRadius: 24, padding: '20px' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>Investment Summary</div>
            
            {/* 4 Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Balance', value: `₹ ${Number(userData.balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#7C3AED' },
                { label: 'Total Invested', value: `₹ ${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'black' },
                { label: 'Current Value', value: `₹ ${totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'black' },
                { label: 'Overall P&L', value: `${totalPnL >= 0 ? '+' : ''}₹ ${Math.abs(totalPnL).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: totalPnL >= 0 ? '#22c55e' : '#ef4444' }
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: '#f9fafb', borderRadius: 16, padding: '14px' }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* P&L % bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 14, background: totalPnL >= 0 ? '#f0fdf4' : '#fef2f2' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: totalPnL >= 0 ? '#16a34a' : '#dc2626' }}>
                {totalPnL >= 0 ? '▲' : '▼'} {Math.abs(pnlPercent)}% return
              </span>
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{portfolioEntries.length} stock(s)</span>
            </div>
          </div>
        </div>

        {/* ── PER-STOCK HOLDINGS ────────────────────────────────────────── */}
        {portfolioEntries.length > 0 && (
          <div style={{ margin: '16px 20px 0' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>My Holdings</div>
            {portfolioEntries.map(([id, h]) => {
              const stock = STOCKS.find(s => s.id === id);
              if (!stock) return null;
              const currPrice = getPrice(stock);
              const currVal = currPrice * (h.quantity || 0);
              const invested = (h.quantity || 0) * (h.avgPrice || 0);
              const pnl = currVal - invested;
              const isUp = pnl >= 0;
              return (
                <div key={id} onClick={() => goScreen('stock-detail')} style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 20, padding: '16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: (stock.color || '#7C3AED') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: stock.color || '#7C3AED' }}>
                        {(stock.logo || stock.name.substring(0,2)).toString().substring(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{stock.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>{h.quantity} shares · avg ₹{(h.avgPrice || 0).toFixed(0)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>₹ {currVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444' }}>
                        {isUp ? '+' : ''}₹ {pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.abs(pnlPercent))}%`, background: isUp ? '#22c55e' : '#ef4444', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {portfolioEntries.length === 0 && (
          <div style={{ margin: '16px 20px 0', padding: 24, background: 'white', border: '1.5px dashed #d1d5db', borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 4 }}>No investments yet</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Buy stocks to see your portfolio here</div>
          </div>
        )}

        {/* MAY 2026 button */}
        <div style={{ margin: '0 20px', marginTop: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid black', borderRadius: 40, padding: '6px 14px', gap: 10, background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="black"><path d="M15 18l-6-6 6-6z" /></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.5px' }}>MAY 2026</span>
          </div>
        </div>

        {/* Calendar Grid Card */}
        <div style={{ margin: '0 20px', marginTop: 16 }}>
          <div style={{ background: 'white', border: '2px solid black', borderRadius: 24, padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 11, fontWeight: 500, color: 'black', marginBottom: 16 }}>
              <div>SUN</div><div>MON</div><div>THU</div><div>WED</div><div>THR</div><div>FRI</div><div>SAT</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px 8px' }}>
              {/* Row 1 */}
              <div></div><div></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>

              {/* Row 2 */}
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>

              {/* Row 3 */}
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>

              {/* Row 4 */}
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>

              {/* Row 5 */}
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#4ade80', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
              <div style={{ height: 16, background: '#8b5cf6', borderRadius: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' }}></div>
            </div>
          </div>
        </div>

        {/* Financial Dashboard Card */}
        <div style={{ margin: '0 20px', marginTop: 16 }}>
          <div style={{ background: 'white', border: '2px solid black', borderRadius: 24, padding: '24px 20px 16px', position: 'relative' }}>

            {/* Half Donut Container */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              {/* CSS Half Donut implementation */}
              <div style={{ width: 140, height: 70, position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'conic-gradient(#6D28D9 0deg, #6D28D9 140deg, #e2e8f0 140deg, #e2e8f0 360deg)', position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}></div>
                <div style={{ width: 90, height: 90, background: 'white', borderRadius: '50%', position: 'absolute', bottom: -45, left: 25, zIndex: 1 }}></div>
              </div>
            </div>

            {/* Texts */}
            <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.1, color: 'black', marginBottom: 8, letterSpacing: '-0.2px' }}>
              Financial Journey<br />Completion
            </div>

            {/* Dashed line */}
            <div style={{ borderTop: '1px dashed #94a3b8', margin: '12px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'black' }}>↑ 28%</span>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>from last month</span>
            </div>

          </div>
        </div>

      </div>

      <BottomNav active="profile" />
    </div>
  );
};

export default Profile;
