import { User, LoginPayload, SignupPayload, AuthResponse } from '../types/auth';

const AUTH_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/auth` 
  : '/api/auth';
const TOKEN_KEY = 'stylora_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to save auth token to localStorage:', err);
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to clear auth token from localStorage:', err);
  }
}

async function safeJsonParse(res: Response, defaultErrorMsg: string): Promise<any> {
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok || text.includes('<!DOCTYPE') || !text.trim()) {
      throw new Error('Cannot connect to the backend server. Please make sure the backend API is running (port 5000 locally, or deployed on Render).');
    }
    throw new Error(defaultErrorMsg);
  }
  return data;
}

export async function login(payload: LoginPayload): Promise<{ user: User; token: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('Network error: Unable to reach the backend server. Please verify your connection.');
  }

  const data: AuthResponse = await safeJsonParse(res, 'Failed to log in.');
  if (!data.success || !data.token || !data.user) {
    throw new Error(data.error || 'Failed to log in.');
  }

  setStoredToken(data.token);
  return { user: data.user, token: data.token };
}

export async function signup(payload: SignupPayload): Promise<{ user: User; token: string }> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('Network error: Unable to reach the backend server. Please verify your connection.');
  }

  const data: AuthResponse = await safeJsonParse(res, 'Failed to create account.');
  if (!data.success || !data.token || !data.user) {
    throw new Error(data.error || 'Failed to create account.');
  }

  setStoredToken(data.token);
  return { user: data.user, token: data.token };
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${AUTH_BASE}/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await safeJsonParse(res, 'Session expired.');
  if (!data.success || !data.user) {
    clearStoredToken();
    throw new Error(data.error || 'Session expired.');
  }

  return data.user;
}

export async function logout(token?: string): Promise<void> {
  if (token) {
    try {
      await fetch(`${AUTH_BASE}/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Failed to invalidate server session:', err);
    }
  }
  clearStoredToken();
}

export async function updateProfile(updates: Partial<User>, token?: string): Promise<User> {
  const authToken = token || getStoredToken();
  const res = await fetch(`${AUTH_BASE}/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify(updates)
  });
  const data = await safeJsonParse(res, 'Failed to update profile');
  if (!data.success || !data.user) {
    throw new Error(data.error || 'Failed to update profile');
  }
  return data.user;
}
