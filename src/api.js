import { auth } from "./lib/firebase";

const API_BASE = "http://localhost:5000/api";

// Sync Firebase user to backend (called after login)
export const loginWithBackend = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    const res = await fetch(`${API_BASE}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    // Backend may be offline — non-fatal, Firebase auth still works
    console.warn('[API] Backend sync failed (non-fatal):', err.message);
    return null;
  }
};

const getHeaders = async () => {
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const tradeApi = {
    buy: async (stockId, quantity) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/buy`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ stockId, quantity })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Buy failed");
        return data;
    },
    sell: async (stockId, quantity) => {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/sell`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ stockId, quantity })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sell failed");
        return data;
    }
};

// ... existing social/user api functions if any ...
export const getComments = async (postId) => [];
export const addComment = async (postId, content) => ({ id: Date.now(), user: { name: 'You' }, content });
