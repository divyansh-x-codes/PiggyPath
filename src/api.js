import { supabase } from './lib/supabase';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
let socket;

export const initSocket = (userId) => {
  if (socket) socket.disconnect();
  socket = io(API_BASE, {
    withCredentials: true,
  });
  
  if (userId) {
    socket.emit('subscribe_user', userId);
  }
  
  return socket;
};

export const getSocket = () => socket;

export const subscribeToStock = (stockId) => {
  if (socket) socket.emit('subscribe_stock', stockId);
};

export const unsubscribeFromStock = (stockId) => {
  if (socket) socket.emit('unsubscribe_stock', stockId);
};

/**
 * Get the current user's Supabase access token for backend auth
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not logged in');
  return session.access_token;
};

/**
 * Authenticated fetch — attaches Supabase Access Token to every request
 */
const apiFetch = async (path, options = {}) => {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
};

/**
 * Public fetch — no token required (e.g. stock list, price history)
 */
const publicFetch = async (path) => {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Register/login with backend after Supabase auth. Call this right after sign-in. */
export const loginWithBackend = () => apiFetch('/auth/login', { method: 'POST' });

/** Get current user's profile, balance, and holdings from backend */
export const getMe = () => apiFetch('/me');

// ─── Stocks ───────────────────────────────────────────────────────────────────

/** Get all stocks */
export const getStocks = () => publicFetch('/stocks');

/** Get single stock */
export const getStock = (id) => publicFetch(`/stocks/${id}`);

/**
 * Get price history for graph
 * @param {string} id - stock ID
 * @param {string} range - '1d' | '1w' | '1m' | '1y'
 */
export const getStockHistory = (id, range = '1m') =>
  publicFetch(`/stocks/${id}/history?range=${range}`);

// ─── Trading ──────────────────────────────────────────────────────────────────

/**
 * Place a buy order
 * @param {string} stockId
 * @param {number} price - limit price per share
 * @param {number} quantity - number of shares (integer)
 */
export const placeBuy = (stockId, price, quantity) =>
  apiFetch('/buy', {
    method: 'POST',
    body: JSON.stringify({ stockId, price, quantity }),
  });

/**
 * Place a sell order
 * @param {string} stockId
 * @param {number} price
 * @param {number} quantity
 */
export const placeSell = (stockId, price, quantity) =>
  apiFetch('/sell', {
    method: 'POST',
    body: JSON.stringify({ stockId, price, quantity }),
  });

/** Get user's order history */
export const getOrders = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiFetch(`/orders${params ? `?${params}` : ''}`);
};

/** Get user's executed transactions */
export const getTransactions = () => apiFetch('/transactions');

/** Cancel an open order */
export const cancelOrder = (orderId) =>
  apiFetch(`/orders/${orderId}`, { method: 'DELETE' });

// ─── Social ───────────────────────────────────────────────────────────────────

/** Get all news/social posts */
export const getPosts = () => apiFetch('/social/posts');

/** Toggle like on a post */
export const toggleLike = (postId) =>
  apiFetch('/social/like', {
    method: 'POST',
    body: JSON.stringify({ postId }),
  });

/** Add a comment to a post */
export const addComment = (postId, content) =>
  apiFetch('/social/comment', {
    method: 'POST',
    body: JSON.stringify({ postId, content }),
  });

/** Get comments for a post */
export const getComments = (postId) => apiFetch(`/social/posts/${postId}/comments`);

// ─── IPO ──────────────────────────────────────────────────────────────────────

/** Apply for an IPO */
export const applyIpo = (stockId, amount) =>
  apiFetch('/ipo/apply', {
    method: 'POST',
    body: JSON.stringify({ stockId, amount }),
  });

/** Get user's IPO orders */
export const getIpoOrders = () => apiFetch('/ipo/orders');
