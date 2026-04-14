import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { auth, db, provider } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithRedirect, 
  getRedirectResult,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { loginWithBackend } from '../api';
import { Capacitor } from '@capacitor/core';

const INPUT_STYLE = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: 50,
  padding: '13px 18px',
  fontSize: 15,
  outline: 'none',
  background: 'white',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
};

const Auth = () => {
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [radio, setRadio] = useState('sms');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [checked, setChecked] = useState(true);
  const [error, setError] = useState('');
  const { goScreen } = useAppContext();

  // 1. Listen for Auth State Changes (User already logged in)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("[Auth] State detected: User logged in", user.email);
        // We sync and navigate
        handlePostLogin(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Redirect Result (After returning from Google)
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("[Auth] Redirect Result success:", result.user.email);
          localStorage.setItem("user", JSON.stringify(result.user));
          await handlePostLogin(result.user);
        }
      } catch (err) {
        if (err.code !== 'auth/web-storage-unsupported') {
            console.error("[Auth] Redirect Login Error:", err);
            setError("Redirect login failed: " + err.message);
        }
      }
    };
    handleRedirect();
  }, []);

  const handlePostLogin = async (user) => {
    try {
      // 1. Create/Update profile in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
          const username = `user_${Math.random().toString(36).substring(2, 8)}`;
          await setDoc(userDocRef, {
              uid: user.uid,
              firebaseUid: user.uid, 
              email: user.email,
              username: username,
              balance: 100000,
              createdAt: serverTimestamp()
          });
          console.log("[Auth] New user document created for:", user.email);
      }

      // 2. Sync with Backend
      await loginWithBackend();
      
      // 3. Final Navigation
      goScreen('home', false);
    } catch (err) {
      console.error("[Auth] Post Login Sync Error:", err);
      setError("Failed to sync profile: " + err.message);
    }
  };

  const onEmailAuth = async () => {
    setError('');
    if (!email) return setError('Please enter your email address');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      if (isSignup) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle navigation
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle navigation
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const onSocialLogin = async (providerName) => {
    setError('');
    setLoading(true);
    try {
      if (providerName === 'google') {
        console.log("[Auth] Starting Google Redirect Login...");
        await signInWithRedirect(auth, provider);
      } else {
        setError(`${providerName} login is not implemented yet.`);
        setLoading(false);
      }
    } catch (err) {
      console.error("[Auth] Social Login Trigger Error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', background: '#FAFAFA', overflowY: 'auto' }}>

      <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 26, textAlign: 'center', marginBottom: 20, color: 'black' }}>
        Enter phone or email
      </h1>

      {/* Email / Phone Tab Toggle */}
      <div style={{ display: 'flex', position: 'relative', marginBottom: 24, padding: '0 4px' }}>
        {tab === 'email' ? (
          <>
            <div style={{ flex: 1, background: '#6D28D9', color: 'white', textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>Email</div>
            <div onClick={() => { setTab('phone'); setError(''); }} style={{ flex: 1, background: 'white', color: 'black', textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: 'pointer', zIndex: 1, border: '1px solid black', marginLeft: -30, paddingLeft: 30 }}>Phone</div>
          </>
        ) : (
          <>
            <div onClick={() => { setTab('email'); setError(''); }} style={{ flex: 1, background: 'white', color: 'black', textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: 'pointer', zIndex: 1, border: '1px solid black', marginRight: -30, paddingRight: 30 }}>Email</div>
            <div style={{ flex: 1, background: '#6D28D9', color: 'white', textAlign: 'center', padding: '12px 0', borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: 'pointer', zIndex: 2, boxShadow: '0 4px 12px rgba(109,40,217,0.3)' }}>Phone</div>
          </>
        )}
      </div>

      {/* ── EMAIL TAB ── */}
      {tab === 'email' ? (
        <>
          {/* Login / Create Account sub-toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button onClick={() => { setIsSignup(false); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 50, border: !isSignup ? '2px solid #6D28D9' : '1px solid #d1d5db', background: !isSignup ? '#f5f3ff' : 'white', color: !isSignup ? '#6D28D9' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Login
            </button>
            <button onClick={() => { setIsSignup(true); setError(''); }} style={{ flex: 1, padding: '10px', borderRadius: 50, border: isSignup ? '2px solid #6D28D9' : '1px solid #d1d5db', background: isSignup ? '#f5f3ff' : 'white', color: isSignup ? '#6D28D9' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Create Account
            </button>
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block', paddingLeft: 4 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              style={INPUT_STYLE}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block', paddingLeft: 4 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onEmailAuth()}
                placeholder={isSignup ? 'Create a password (min 6 chars)' : 'Enter your password'}
                style={{ ...INPUT_STYLE, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af' }}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14, fontWeight: 500 }}>
              {error}
            </div>
          ) : null}

          {/* Agree */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'black', marginBottom: 20, cursor: 'pointer', lineHeight: 1.4, padding: '0 4px' }}>
            <div onClick={() => setChecked(!checked)} style={{ marginTop: 1, background: checked ? 'black' : 'white', border: '1px solid black', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span>Agree to receive communications.</span>
          </label>

          {/* CTA */}
          <button onClick={onEmailAuth} disabled={loading} style={{ width: '100%', background: '#22C55E', color: 'white', border: 'none', borderRadius: 50, padding: '15px', fontSize: 16, fontWeight: 700, marginBottom: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </>
      ) : (
        /* ── PHONE TAB ── */
        <>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block', paddingLeft: 4 }}>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', fontWeight: 500, fontSize: 15, color: 'black', display: 'flex', alignItems: 'center' }}>
                +91 <span style={{ marginLeft: 6, fontWeight: 300 }}>|</span>
              </div>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" style={{ ...INPUT_STYLE, paddingLeft: 64 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 18, paddingLeft: 4 }}>
            <div onClick={() => setRadio('sms')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: radio === 'sms' ? '6px solid #6D28D9' : '1px solid black', boxSizing: 'border-box' }} />
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>SMS</span>
            </div>
            <div onClick={() => setRadio('whatsapp')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: radio === 'whatsapp' ? '6px solid #6D28D9' : '1px solid black', boxSizing: 'border-box' }} />
              <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>WhatsApp</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <input type="text" placeholder="Enter OTP" style={{ ...INPUT_STYLE, flex: 1, textAlign: 'center' }} />
            <span style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#6D28D9', whiteSpace: 'nowrap' }}>Resend OTP</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'black', marginBottom: 20, cursor: 'pointer', lineHeight: 1.4, padding: '0 4px' }}>
            <div onClick={() => setChecked(!checked)} style={{ marginTop: 1, background: checked ? 'black' : 'white', border: '1px solid black', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <span>Agree to receive communications.</span>
          </label>

          <button style={{ width: '100%', background: '#22C55E', color: 'white', border: 'none', borderRadius: 50, padding: '15px', fontSize: 16, fontWeight: 700, marginBottom: 12, cursor: 'pointer' }}>
            Send OTP
          </button>
        </>
      )}

      {/* ── Social Login ── */}
      <div style={{ marginTop: 'auto', paddingTop: 16, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>

          {/* Google */}
          <button onClick={() => onSocialLogin('google')} disabled={loading} title="Sign in with Google"
            style={{ width: 60, height: 60, borderRadius: '50%', border: '1.5px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {loading
              ? <span style={{ fontSize: 20 }}>⏳</span>
              : <svg width="24" height="24" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.999,35.205,44,30,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
            }
          </button>

          {/* Apple */}
          <button onClick={() => onSocialLogin('apple')} title="Sign in with Apple"
            style={{ width: 60, height: 60, borderRadius: '50%', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <svg width="24" height="24" viewBox="0 0 384 512" fill="white">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.1-44.6-35.9-2.8-74.3 22.7-95.1 22.7-20.3 0-51-22.3-81.8-22.3-43.2 0-85.3 25.8-108.3 67.5-47.2 85.3-12.7 212.1 33.7 279 23.1 33.5 50 69.8 85.6 68.6 34.6-1.2 46.8-22.5 89.2-22.5 42.1 0 53.6 22.5 89.6 22.1 36.7-.4 60.1-33.8 82.8-67.1 26.6-39.6 37.6-78.2 38.3-80.2-1.1-.5-75.1-28.5-74.9-106zM254.6 96.5c19.1-23.7 32.1-56.7 28.5-89.5-28.2 1.2-62.8 19-82.6 42.7-16.7 20-31.5 54.1-26.9 86.4 31.8 2.5 63.8-16.3 81-39.6z"/>
            </svg>
          </button>

          {/* Discord */}
          <button onClick={() => onSocialLogin('discord')} title="Sign in with Discord"
            style={{ width: 60, height: 60, borderRadius: '50%', background: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(88,101,242,0.35)' }}>
            <svg width="26" height="20" viewBox="0 0 127.14 96.36" fill="white">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
          </button>

        </div>
      </div>
    </div>
  );
};

export default Auth;
