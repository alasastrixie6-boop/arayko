/**
 * Database layer
 * Uses localStorage for persistence. Designed to be swappable with a real
 * backend (PostgreSQL/MySQL) by replacing the storage implementation.
 */
const DB_KEY = 'arayko_poultry_db_v1';

const DEFAULT_DB = {
  users: [],
  categories: [
    { id: 'cat-4', name: '4-Month-Old Chickens', description: 'Young pullets and cockerels ready for growing.', minAge: 4, maxAge: 4, order: 1 },
    { id: 'cat-5', name: '5-Month-Old Chickens', description: 'Nearly mature birds ideal for starting production.', minAge: 5, maxAge: 5, order: 2 },
    { id: 'cat-6', name: '6-Month-Old Chickens and Older', description: 'Mature, fully developed layers and breeders.', minAge: 6, maxAge: 999, order: 3 },
  ],
  products: [],
  carts: [],
  orders: [],
  settings: {
    lowStockThreshold: 5,
    deliveryFee: 0,
    businessName: 'Arayko Poultry Farm',
    currency: 'PHP',
    contactPhone: '+63 900 000 0000',
    contactEmail: 'orders@arayko.example',
    pickupAddress: 'Barangay Sample, City, Province',
  },
};

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) { save(DEFAULT_DB); return structuredClone(DEFAULT_DB); }
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      categories: parsed.categories || [],
      products: parsed.products || [],
      carts: parsed.carts || [],
      orders: parsed.orders || [],
      settings: { ...DEFAULT_DB.settings, ...(parsed.settings || {}) },
    };
  } catch (e) {
    console.error('DB load failed, resetting', e);
    save(DEFAULT_DB);
    return structuredClone(DEFAULT_DB);
  }
}

function save(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('DB save failed', e);
  }
}

function mutate(fn) {
  const db = load();
  const result = fn(db);
  save(db);
  return result;
}

function read(fn) {
  const db = load();
  return fn(db);
}

const db = { load, save, mutate, read };

export default db;