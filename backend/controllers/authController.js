const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, pharmacyName, address, city, latitude, longitude } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const allowedRoles = ['USER', 'PHARMACY'];
    const userRole = allowedRoles.includes(role) ? role : 'USER';

    const user = await User.create({ name, email, password, phone, role: userRole });

    // If registering as pharmacy, create pharmacy profile
    if (userRole === 'PHARMACY') {
      if (!pharmacyName || !address || !city)
        return res.status(400).json({ success: false, message: 'Pharmacy name, address and city are required' });
      const lat = Number(latitude || 0);
      const lng = Number(longitude || 0);
      await Pharmacy.create({
        owner: user._id,
        name: pharmacyName,
        address,
        city,
        phone,
        email,
        latitude: lat,
        longitude: lng,
        location: { lat, lng }
      });
    }

    res.status(201).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated' });

    res.json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
