const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { createReservation, cancelReservation, getMyReservations } = require('../controllers/reservationController');

router.use(protect, authorize('USER'));

router.post('/create', createReservation);
router.delete('/cancel/:id', cancelReservation);
router.get('/my', getMyReservations);

module.exports = router;
