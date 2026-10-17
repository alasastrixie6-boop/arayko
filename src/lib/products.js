import db from './db'
import { slugify, uid } from './security'

function assignCategory(age) {
  if (age === 4) return 'cat-4';
  if (age === 5) return 'cat-5';
  return 'cat-6';
}

function list() { return db.read(d => d.products.filter(p => !p.archived)) }
function listAll() { return db.read(d => d.products) }
function findById(id) { return db.read(d => d.products.find(p => p.id === id)) }
function featured() { return db.read(d => d.products.filter(p => p.featured && !p.archived)) }

function add(product, images = []) {
  const p = {
    id: uid('prod'),
    slug: slugify(product.name),
    name: product.name,
    breed: product.breed || '',
    age: Number(product.age) || 0,
    categoryId: product.categoryId || assignCategory(Number(product.age) || 0),
    description: product.description || '',
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    gender: product.gender || '',
    weight: product.weight || '',
    healthInfo: product.healthInfo || '',
    images: images.length ? images : ['/images/placeholder-chicken.svg'],
    featured: Boolean(product.featured),
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.mutate(d => { d.products.push(p); return p; });
  return p;
}

function update(id, updates, images = null) {
  const p = db.mutate(d => {
    const prod = d.products.find(x => x.id === id);
    if (!prod) return null;
    Object.assign(prod, updates);
    if (updates.name) prod.slug = slugify(updates.name);
    if (images !== null) prod.images = images.length ? images : ['/images/placeholder-chicken.svg'];
    if (updates.age !== undefined) {
      prod.age = Number(updates.age) || 0;
      prod.categoryId = prod.categoryId || assignCategory(prod.age);
    }
    prod.updatedAt = new Date().toISOString();
    return prod;
  });
  return p;
}

function remove(id) {
  return db.mutate(d => {
    const idx = d.products.findIndex(x => x.id === id);
    if (idx === -1) return false;
    d.products[idx].archived = true;
    d.products[idx].updatedAt = new Date().toISOString();
    return true;
  });
}

function permanentDelete(id) {
  return db.mutate(d => {
    const idx = d.products.findIndex(x => x.id === id);
    if (idx === -1) return false;
    d.products.splice(idx, 1);
    return true;
  });
}

function adjustStock(id, delta, reason = 'adjustment') {
  return db.mutate(d => {
    const prod = d.products.find(x => x.id === id);
    if (!prod) return null;
    const next = Math.max(0, prod.stock + delta);
    prod.stock = next;
    prod.updatedAt = new Date().toISOString();
    return { product: prod, adjustment: { id: uid('adj'), productId: id, delta, reason, at: new Date().toISOString() } };
  });
}

function search(query) {
  const q = (query || '').toLowerCase();
  return list().filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.breed.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}

function filter({ category, breed, minPrice, maxPrice, available, age, sort, q }) {
  let results = listAll().filter(p => !p.archived);
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.breed.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }
  if (category) results = results.filter(p => p.categoryId === category);
  if (breed) results = results.filter(p => p.breed.toLowerCase() === breed.toLowerCase());
  if (age !== '' && age != null) results = results.filter(p => p.age === Number(age));
  if (minPrice !== '' && minPrice != null) results = results.filter(p => p.price >= Number(minPrice));
  if (maxPrice !== '' && maxPrice != null) results = results.filter(p => p.price <= Number(maxPrice));
  if (available) results = results.filter(p => p.stock > 0);

  switch (sort) {
    case 'price-asc': results.sort((a, b) => a.price - b.price); break;
    case 'price-desc': results.sort((a, b) => b.price - a.price); break;
    case 'age-asc': results.sort((a, b) => a.age - b.age); break;
    case 'age-desc': results.sort((a, b) => b.age - a.age); break;
    case 'newest': results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    case 'oldest': results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
    default: results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return results;
}

function breeds() {
  return Array.from(new Set(listAll().map(p => p.breed).filter(Boolean))).sort();
}

function settings() { return db.read(d => d.settings); }

const Products = { list, listAll, findById, featured, add, update, remove, permanentDelete, adjustStock, search, filter, breeds, settings, assignCategory };
export default Products;