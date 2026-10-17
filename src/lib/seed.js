import db from './db'
import { uid } from './security'
import { slugify } from './security'

function assignCategory(age) {
  if (age === 4) return 'cat-4';
  if (age === 5) return 'cat-5';
  return 'cat-6';
}

function makeProduct(p, images) {
  return {
    id: uid('prod'),
    slug: slugify(p.name),
    name: p.name,
    breed: p.breed || '',
    age: Number(p.age) || 0,
    categoryId: assignCategory(Number(p.age) || 0),
    description: p.description || '',
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    gender: p.gender || '',
    weight: p.weight || '',
    healthInfo: p.healthInfo || '',
    images: images && images.length ? images : ['/images/placeholder-chicken.svg'],
    featured: Boolean(p.featured),
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function seed() {
  const existing = db.read(d => d.products.length);
  if (existing > 0) return { ok: false, message: 'Seed data already exists. Call resetSeed() to replace.' };

  const products = [
    { name: 'Free-Range Rhode Island Red', breed: 'Rhode Island Red', age: 4, description: 'Healthy 4-month pullet raised on open-range pasture. Ideal for starting a laying flock.', price: 450, stock: 12, gender: 'Female', weight: '1.2 kg', healthInfo: 'Vaccinated against Newcastle Disease', featured: true },
    { name: 'Purebred Leghorn Cockerel', breed: 'Leghorn', age: 4, description: 'Vigorous 4-month cockerel from a premier hatchery line. Good for flock leadership.', price: 380, stock: 8, gender: 'Male', weight: '1.4 kg', healthInfo: 'Vaccinated, dewormed', featured: false },
    { name: 'Buff Orpington Pullet', breed: 'Buff Orpington', age: 5, description: 'Docile 5-month pullet known for consistent egg production and calm temperament.', price: 620, stock: 6, gender: 'Female', weight: '1.5 kg', healthInfo: 'Vaccinated against Mareks', featured: true },
    { name: 'Barred Plymouth Rock Hen', breed: 'Plymouth Rock', age: 5, description: 'Hardy 5-month hen with excellent foraging ability and winter resilience.', price: 580, stock: 10, gender: 'Female', weight: '1.6 kg', healthInfo: 'Vaccinated, routine health check', featured: false },
    { name: 'Australorp Layer Hen', breed: 'Australorp', age: 6, description: 'Mature 6-month layer hen with outstanding egg-laying records. Ready for production.', price: 720, stock: 5, gender: 'Female', weight: '1.7 kg', healthInfo: 'Vaccinated, verified breed registry', featured: true },
    { name: 'Brahma Broody Rooster', breed: 'Brahma', age: 6, description: 'Large 6-month rooster with calm disposition. Excellent for backyard flock supervision.', price: 850, stock: 3, gender: 'Male', weight: '2.4 kg', healthInfo: 'Vaccinated, dewormed', featured: false },
    { name: 'Sussex Heritage Layer', breed: 'Sussex', age: 7, description: 'Mature 7-month heritage layer with rich brown eggs and strong disease resistance.', price: 780, stock: 4, gender: 'Female', weight: '1.8 kg', healthInfo: 'Vaccinated, heritage certified', featured: false },
    { name: 'Wyandotte Dual-Purpose Hen', breed: 'Wyandotte', age: 8, description: 'Proven 8-month dual-purpose hen offering both meat and reliable egg production.', price: 920, stock: 2, gender: 'Female', weight: '2.0 kg', healthInfo: 'Vaccinated, health verified', featured: true },
    { name: 'Easter Egger Cockerel', breed: 'Easter Egger', age: 5, description: 'Colorful 5-month cockerel that produces blue and green tinted eggs in the flock.', price: 540, stock: 7, gender: 'Male', weight: '1.3 kg', healthInfo: 'Vaccinated', featured: false },
    { name: 'ISA Brown Layer', breed: 'ISA Brown', age: 6, description: 'High-production 6-month layer engineered for commercial egg output.', price: 690, stock: 9, gender: 'Female', weight: '1.6 kg', healthInfo: 'Vaccinated, production verified', featured: false },
  ];

  const images = [
    '/images/chicken-1.svg', '/images/chicken-2.svg', '/images/chicken-3.svg',
    '/images/chicken-4.svg', '/images/chicken-5.svg', '/images/chicken-6.svg',
  ];

  db.mutate(d => {
    products.forEach((p, idx) => {
      d.products.push(makeProduct(p, [images[idx % images.length]]));
    });
  });

  return { ok: true, message: 'Seeded ' + products.length + ' sample products.' };
}

function resetSeed() {
  db.mutate(d => {
    d.products = [];
    d.orders = [];
    d.carts = [];
  });
  return seed();
}

const Seed = { seed, resetSeed };
export default Seed;