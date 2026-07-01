const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const Reservation = require('../models/Reservation');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [users, pharmacies, medicines, reservations, pendingRes, cancelledRes] = await Promise.all([
      User.countDocuments(),
      Pharmacy.countDocuments(),
      Medicine.countDocuments(),
      Reservation.countDocuments(),
      Reservation.countDocuments({ status: 'PENDING' }),
      Reservation.countDocuments({ status: 'CANCELLED' })
    ]);

    const recentReservations = await Reservation.find()
      .populate('user', 'name email')
      .populate('medicine', 'name')
      .populate('pharmacy', 'name city')
      .sort('-createdAt').limit(10);

    res.json({
      success: true,
      analytics: { users, pharmacies, medicines, reservations, pendingRes, cancelledRes },
      recentReservations
    });
  } catch (err) { next(err); }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};

// PUT /api/admin/users/:id/toggle — activate/deactivate user
exports.toggleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: { id: user._id, isActive: user.isActive } });
  } catch (err) { next(err); }
};

// GET /api/admin/pharmacies
exports.getPharmacies = async (req, res, next) => {
  try {
    const pharmacies = await Pharmacy.find().populate('owner', 'name email').sort('-createdAt');
    res.json({ success: true, count: pharmacies.length, data: pharmacies });
  } catch (err) { next(err); }
};

// PUT /api/admin/pharmacies/:id/toggle
exports.togglePharmacy = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    pharmacy.isActive = !pharmacy.isActive;
    await pharmacy.save();
    res.json({ success: true, message: `Pharmacy ${pharmacy.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
};
