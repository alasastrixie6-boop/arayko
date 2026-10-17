import db from './db'
import { uid } from './security'

function getCart(userId) {
  let cart = db.read(d => d.carts.find(c => c.userId === userId));
  if (!cart) {
    cart = db.mutate(d => {
      const c = { id: uid('cart'), userId, items: [], updatedAt: new Date().toISOString() };
      d.carts.push(c);
      return c;
    });
  }
  return cart;
}

function addItem(userId, productId, quantity) {
  const result = db.mutate(d => {
    const prod = d.products.find(p => p.id === productId && !p.archived);
    if (!prod) return { ok: false, error: 'Product not found.' };
    const cart = d.carts.find(c => c.userId === userId) || (() => {
      const c = { id: uid('cart'), userId, items: [], updatedAt: new Date().toISOString() };
      d.carts.push(c);
      return c;
    })();
    const existing = cart.items.find(i => i.productId === productId);
    const qty = Math.max(1, Number(quantity) || 1);
    if (existing) {
      if (existing.quantity + qty > prod.stock) {
        return { ok: false, error: `Only ${prod.stock} available in stock.` };
      }
      existing.quantity += qty;
    } else {
      if (qty > prod.stock) return { ok: false, error: `Only ${prod.stock} available in stock.` };
      cart.items.push({
        id: uid('ci'),
        productId: prod.id,
        name: prod.name,
        breed: prod.breed,
        age: prod.age,
        price: prod.price,
        image: prod.images[0],
        quantity: qty,
      });
    }
    cart.updatedAt = new Date().toISOString();
    return { ok: true, cart };
  });
  return result;
}

function updateQuantity(userId, itemId, quantity) {
  return db.mutate(d => {
    const cart = d.carts.find(c => c.userId === userId);
    if (!cart) return { ok: false, error: 'Cart not found.' };
    const item = cart.items.find(i => i.id === itemId);
    if (!item) return { ok: false, error: 'Item not found.' };
    const prod = d.products.find(p => p.id === item.productId);
    if (!prod) return { ok: false, error: 'Product not found.' };
    const qty = Math.max(0, Number(quantity) || 0);
    if (qty === 0) {
      cart.items = cart.items.filter(i => i.id !== itemId);
    } else if (qty > prod.stock) {
      return { ok: false, error: `Only ${prod.stock} available in stock.` };
    } else {
      item.quantity = qty;
    }
    cart.updatedAt = new Date().toISOString();
    return { ok: true, cart };
  });
}

function removeItem(userId, itemId) {
  return db.mutate(d => {
    const cart = d.carts.find(c => c.userId === userId);
    if (!cart) return { ok: false, error: 'Cart not found.' };
    cart.items = cart.items.filter(i => i.id !== itemId);
    cart.updatedAt = new Date().toISOString();
    return { ok: true, cart };
  });
}

function clearCart(userId) {
  return db.mutate(d => {
    const cart = d.carts.find(c => c.userId === userId);
    if (cart) { cart.items = []; cart.updatedAt = new Date().toISOString(); }
    return cart;
  });
}

function subtotal(userId) {
  const cart = getCart(userId);
  return cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
}

function count(userId) {
  const cart = getCart(userId);
  return cart.items.reduce((s, i) => s + i.quantity, 0);
}

function currentPrices(userId) {
  const cart = getCart(userId);
  const products = db.read(d => d.products);
  return cart.items.map(i => {
    const prod = products.find(p => p.id === i.productId);
    return { ...i, currentPrice: prod ? prod.price : i.price, inStock: prod ? prod.stock : 0 };
  });
}

const Cart = { getCart, addItem, updateQuantity, removeItem, clearCart, subtotal, count, currentPrices };
export default Cart;