const router = require('express').Router();
const { searchMedicines, getAllMedicines } = require('../controllers/medicineController');

router.get('/search', searchMedicines);
router.get('/', getAllMedicines);

module.exports = router;
