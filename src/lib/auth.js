import db from './db'
import { hashPassword, verifyPassword, generateToken, sanitize, slugify, uid, clamp, formatCurrency, isValidEmail } from './security'

const SESSION_KEY = 'arayko_session';

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; }
  catch { return null; }
}
function setSession(user) {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

const AUTH = {
  async register({ name, email, password }) {
    name = sanitize(name); email = sanitize(email).toLowerCase();
    if (!name || name.length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
    if (!isValidEmail(email)) return { ok: false, error: 'Invalid email address.' };
    if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
    const existing = db.read(d => d.users.find(u => u.email === email));
    if (existing) return { ok: false, error: 'Email already registered.' };
    const hash = await hashPassword(password);
    const user = {
      id: uid('usr'),
      name,
      email,
      passwordHash: hash,
      role: 'customer',
      createdAt: new Date().toISOString(),
      addresses: [],
    };
    db.mutate(d => { d.users.push(user); return user; });
    setSession({ id: user.id, role: user.role, name: user.name, email: user.email });
    return { ok: true, user: { id: user.id, name, email, role: user.role } };
  },

  async login({ email, password }) {
    email = sanitize(email).toLowerCase();
    const user = db.read(d => d.users.find(u => u.email === email));
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { ok: false, error: 'Invalid email or password.' };
    setSession({ id: user.id, role: user.role, name: user.name, email: user.email });
    return { ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  },

  logout() { setSession(null); return { ok: true }; },

  getCurrentUser() {
    const s = getSession();
    if (!s) return null;
    const user = db.read(d => d.users.find(u => u.id === s.id));
    if (!user) { setSession(null); return null; }
    return { id: user.id, name: user.name, email: user.email, role: user.role, addresses: user.addresses || [] };
  },

  isAdmin() {
    const s = getSession();
    return s && s.role === 'admin';
  },

  requireAuth() {
    const s = getSession();
    if (!s) return false;
    return true;
  },
};

export default AUTH;