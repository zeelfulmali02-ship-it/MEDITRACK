const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  addInventory, updateInventory, deleteInventory,
  getMyInventory, getMyReservations, getProfile, updateLocation
} = require('../controllers/pharmacyController');
const { updateReservationStatus } = require('../controllers/reservationController');

router.use(protect, authorize('PHARMACY'));

router.get('/profile', getProfile);
router.put('/location', updateLocation);
router.get('/inventory', getMyInventory);
router.post('/inventory/add', addInventory);
router.put('/inventory/update/:id', updateInventory);
router.delete('/inventory/delete/:id', deleteInventory);
router.get('/reservations', getMyReservations);
router.put('/reservations/:id/status', updateReservationStatus);

module.exports = router;
