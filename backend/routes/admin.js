const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboard, getUsers, toggleUser, getPharmacies, togglePharmacy } = require('../controllers/adminController');

router.use(protect, authorize('ADMIN'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUser);
router.get('/pharmacies', getPharmacies);
router.put('/pharmacies/:id/toggle', togglePharmacy);

module.exports = router;
