const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Reservation = require('../models/Reservation');

// Helper: get pharmacy owned by logged-in user
const getMyPharmacy = async (userId) => Pharmacy.findOne({ owner: userId });

// POST /api/pharmacy/inventory/add
exports.addInventory = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy profile not found' });

    const { medicineName, generic, category, manufacturer, requiresPrescription,
            quantity, price, expiryDate } = req.body;

    // Find or create medicine
    let medicine = await Medicine.findOne({ name: { $regex: `^${medicineName}$`, $options: 'i' } });
    if (!medicine) {
      medicine = await Medicine.create({ name: medicineName, generic, category, manufacturer, requiresPrescription });
    }

    // Check if inventory entry already exists
    let inventory = await Inventory.findOne({ pharmacy: pharmacy._id, medicine: medicine._id });
    if (inventory) {
      inventory.quantity += Number(quantity);
      inventory.price = price;
      if (expiryDate) inventory.expiryDate = expiryDate;
      await inventory.save();
    } else {
      inventory = await Inventory.create({ pharmacy: pharmacy._id, medicine: medicine._id, quantity, price, expiryDate });
    }

    // Emit real-time update
    req.app.get('io').emit('inventoryUpdate', { pharmacyId: pharmacy._id, medicine: medicine.name, quantity: inventory.quantity, available: inventory.available });

    res.status(201).json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

// PUT /api/pharmacy/inventory/update/:id
exports.updateInventory = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

    const inventory = await Inventory.findOne({ _id: req.params.id, pharmacy: pharmacy._id });
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    const { quantity, price, expiryDate } = req.body;
    if (quantity !== undefined) inventory.quantity = quantity;
    if (price !== undefined) inventory.price = price;
    if (expiryDate !== undefined) inventory.expiryDate = expiryDate;
    await inventory.save();

    req.app.get('io').emit('inventoryUpdate', { pharmacyId: pharmacy._id, inventoryId: inventory._id, quantity: inventory.quantity, available: inventory.available });

    res.json({ success: true, data: inventory });
  } catch (err) { next(err); }
};

// DELETE /api/pharmacy/inventory/delete/:id
exports.deleteInventory = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

    const inventory = await Inventory.findOneAndDelete({ _id: req.params.id, pharmacy: pharmacy._id });
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory item not found' });

    res.json({ success: true, message: 'Inventory item removed' });
  } catch (err) { next(err); }
};

// GET /api/pharmacy/inventory — get own inventory
exports.getMyInventory = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

    const inventory = await Inventory.find({ pharmacy: pharmacy._id }).populate('medicine', 'name generic category');
    res.json({ success: true, pharmacy: pharmacy.name, data: inventory });
  } catch (err) { next(err); }
};

// GET /api/pharmacy/reservations — view reservations for own pharmacy
exports.getMyReservations = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

    const reservations = await Reservation.find({ pharmacy: pharmacy._id })
      .populate('user', 'name email phone')
      .populate('medicine', 'name generic')
      .sort('-createdAt');

    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (err) { next(err); }
};

// GET /api/pharmacy/profile
exports.getProfile = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    res.json({ success: true, data: pharmacy });
  } catch (err) { next(err); }
};

// PUT /api/pharmacy/location
exports.updateLocation = async (req, res, next) => {
  try {
    const pharmacy = await getMyPharmacy(req.user._id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });

    const { latitude, longitude } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid latitude and longitude are required' });
    }

    pharmacy.latitude = lat;
    pharmacy.longitude = lng;
    pharmacy.location = { lat, lng };
    await pharmacy.save();

    res.json({ success: true, message: 'Location updated', data: pharmacy });
  } catch (err) { next(err); }
};
