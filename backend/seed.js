require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Pharmacy = require('./models/Pharmacy');
const Medicine = require('./models/Medicine');
const Inventory = require('./models/Inventory');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  await Promise.all([User.deleteMany(), Pharmacy.deleteMany(), Medicine.deleteMany(), Inventory.deleteMany()]);

  // Create users
  const admin = await User.create({ name: 'Admin User', email: 'admin@meditrack.com', password: 'admin123', role: 'ADMIN' });
  const pharmaUser1 = await User.create({ name: 'John Pharmacy', email: 'john@pharmacy.com', password: 'pharma123', role: 'PHARMACY' });
  const pharmaUser2 = await User.create({ name: 'Mary Meds', email: 'mary@pharmacy.com', password: 'pharma123', role: 'PHARMACY' });
  const customer = await User.create({ name: 'Alice Customer', email: 'alice@user.com', password: 'user123', role: 'USER' });

  // Create pharmacies
  const pharmacy1 = await Pharmacy.create({ owner: pharmaUser1._id, name: 'LifeCare Pharmacy', address: '12 MG Road', city: 'Mumbai', phone: '9876543210', email: 'john@pharmacy.com', location: { lat: 19.076, lng: 72.877 } });
  const pharmacy2 = await Pharmacy.create({ owner: pharmaUser2._id, name: 'MedPlus Store', address: '45 Park Street', city: 'Delhi', phone: '9123456780', email: 'mary@pharmacy.com', location: { lat: 28.613, lng: 77.209 } });

  // Create medicines
  const meds = await Medicine.insertMany([
    { name: 'Paracetamol', generic: 'Acetaminophen', category: 'Painkiller', manufacturer: 'GSK', requiresPrescription: false },
    { name: 'Amoxicillin', generic: 'Amoxicillin Trihydrate', category: 'Antibiotic', manufacturer: 'Cipla', requiresPrescription: true },
    { name: 'Cetirizine', generic: 'Cetirizine HCl', category: 'Antihistamine', manufacturer: 'Sun Pharma', requiresPrescription: false },
    { name: 'Metformin', generic: 'Metformin HCl', category: 'Antidiabetic', manufacturer: 'Lupin', requiresPrescription: true },
    { name: 'Omeprazole', generic: 'Omeprazole', category: 'Antacid', manufacturer: 'Dr. Reddy', requiresPrescription: false }
  ]);

  // Create inventory
  await Inventory.insertMany([
    { pharmacy: pharmacy1._id, medicine: meds[0]._id, quantity: 100, price: 25, expiryDate: new Date('2026-12-31') },
    { pharmacy: pharmacy1._id, medicine: meds[1]._id, quantity: 50,  price: 120, expiryDate: new Date('2026-06-30') },
    { pharmacy: pharmacy1._id, medicine: meds[2]._id, quantity: 0,   price: 45, expiryDate: new Date('2026-09-30') },
    { pharmacy: pharmacy2._id, medicine: meds[0]._id, quantity: 200, price: 22, expiryDate: new Date('2026-12-31') },
    { pharmacy: pharmacy2._id, medicine: meds[3]._id, quantity: 75,  price: 85, expiryDate: new Date('2026-08-31') },
    { pharmacy: pharmacy2._id, medicine: meds[4]._id, quantity: 60,  price: 55, expiryDate: new Date('2026-11-30') }
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:    admin@meditrack.com   / admin123');
  console.log('  Pharmacy: john@pharmacy.com     / pharma123');
  console.log('  Pharmacy: mary@pharmacy.com     / pharma123');
  console.log('  User:     alice@user.com        / user123\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
