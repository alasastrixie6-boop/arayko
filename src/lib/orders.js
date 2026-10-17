import db from './db'
import { uid } from './security'

function createOrder({ userId, customerName, contactNumber, address, pickup, notes, paymentMethod, items }) {
  if (!items || !items.length) return { ok: false, error: 'Cart is empty.' };
  if (!customerName) return { ok: false, error: 'Customer name is required.' };
  if (!contactNumber) return { ok: false, error: 'Contact number is required.' };
  if (!pickup && !address) return { ok: false, error: 'Delivery address is required.' };

  const result = db.mutate(d => {
    const settings = d.settings;
    const orderItems = [];
    let subtotal = 0;
    for (const ci of items) {
      const prod = d.products.find(p => p.id === ci.productId);
      if (!prod || prod.archived) return { ok: false, error: 'Product not found.' };
      if (ci.quantity > prod.stock) return { ok: false, error: 'Only ' + prod.stock + ' of ' + prod.name + ' available.' };
      const lineTotal = Math.round((prod.price * ci.quantity) * 100) / 100;
      subtotal += lineTotal;
      orderItems.push({
        id: uid('oi'),
        productId: prod.id,
        name: prod.name,
        breed: prod.breed,
        age: prod.age,
        price: prod.price,
        quantity: ci.quantity,
        lineTotal,
      });
      prod.stock -= ci.quantity;
      prod.updatedAt = new Date().toISOString();
    }
    const deliveryFee = pickup ? 0 : (Number(settings.deliveryFee) || 0);
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const order = {
      id: uid('ord'),
      orderNumber: 'ARAYKO-' + Date.now().toString(36).toUpperCase(),
      userId: userId || null,
      customerName,
      contactNumber,
      address: pickup ? null : address,
      pickup: Boolean(pickup),
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash-on-delivery',
      paymentStatus: 'unpaid',
      status: 'pending',
      subtotal,
      deliveryFee,
      total,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{ status: 'pending', at: new Date().toISOString() }],
    };
    d.orders.push(order);
    const cart = d.carts.find(c => c.userId === userId);
    if (cart) { cart.items = []; cart.updatedAt = new Date().toISOString(); }
    return { ok: true, order };
  });
  return result;
}

function listByUser(userId) {
  return db.read(d => d.orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}
function listAll() {
  return db.read(d => [...d.orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}
function findById(id) {
  return db.read(d => d.orders.find(o => o.id === id));
}
function findByOrderNumber(num) {
  return db.read(d => d.orders.find(o => o.orderNumber === num));
}

const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready-for-pickup', 'shipped', 'cancelled'],
  'ready-for-pickup': ['completed', 'cancelled'],
  shipped: ['out-for-delivery', 'completed', 'cancelled'],
  'out-for-delivery': ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function updateStatus(id, newStatus, note = '') {
  const result = db.mutate(d => {
    const order = d.orders.find(o => o.id === id);
    if (!order) return { ok: false, error: 'Order not found.' };
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      return { ok: false, error: 'Cannot transition from ' + order.status + ' to ' + newStatus + '.' };
    }
    const prevStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({ status: newStatus, at: new Date().toISOString(), note });
    if (newStatus === 'completed') {
      order.paymentStatus = order.paymentStatus === 'unpaid' ? 'paid' : order.paymentStatus;
    }
    if (newStatus === 'cancelled') {
      for (const item of order.items) {
        const prod = d.products.find(p => p.id === item.productId);
        if (prod) { prod.stock += item.quantity; prod.updatedAt = new Date().toISOString(); }
      }
    }
    return { ok: true, order, prevStatus };
  });
  return result;
}

function updatePaymentStatus(id, status) {
  return db.mutate(d => {
    const order = d.orders.find(o => o.id === id);
    if (!order) return { ok: false, error: 'Order not found.' };
    order.paymentStatus = status;
    order.updatedAt = new Date().toISOString();
    return order;
  });
}

function stats() {
  return db.read(d => {
    const products = d.products.filter(p => !p.archived);
    const totalProducts = products.length;
    const totalInventory = products.reduce((s, p) => s + p.stock, 0);
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= d.settings.lowStockThreshold).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const orders = d.orders;
    const totalOrders = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const salesTotal = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
    const pendingSales = orders.filter(o => o.status === 'pending' || o.status === 'confirmed' || o.status === 'processing').reduce((s, o) => s + o.total, 0);
    return {
      totalProducts, totalInventory, lowStock, outOfStock,
      totalOrders, pending, completed, salesTotal, pendingSales,
      recentOrders: [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    };
  });
}

const Orders = { createOrder, listByUser, listAll, findById, findByOrderNumber, updateStatus, updatePaymentStatus, stats, VALID_TRANSITIONS };
export default Orders;