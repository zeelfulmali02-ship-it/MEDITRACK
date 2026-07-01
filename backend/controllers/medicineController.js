const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');

// GET /api/medicines/search?name=&city=
exports.searchMedicines = async (req, res, next) => {
  try {
    const { name, city } = req.query;
    if (!name) return res.status(400).json({ success: false, message: 'Search name is required' });

    // Find medicines matching name
    const medicines = await Medicine.find({
      $or: [
        { name: { $regex: name, $options: 'i' } },
        { generic: { $regex: name, $options: 'i' } },
        { category: { $regex: name, $options: 'i' } }
      ]
    });

    if (!medicines.length)
      return res.json({ success: true, data: [], message: 'No medicines found' });

    const medicineIds = medicines.map(m => m._id);

    // Find inventory for these medicines
    let inventoryQuery = { medicine: { $in: medicineIds } };

    const inventory = await Inventory.find(inventoryQuery)
      .populate('medicine', 'name generic category requiresPrescription')
      .populate({ path: 'pharmacy', select: 'name address city phone latitude longitude location', match: city ? { city: { $regex: city, $options: 'i' } } : {} });

    // Filter out null pharmacy (city filter)
    const results = inventory.filter(i => i.pharmacy !== null).map(i => ({
      inventoryId: i._id,
      medicine: i.medicine,
      pharmacy: i.pharmacy,
      quantity: i.quantity,
      price: i.price,
      available: i.available,
      expiryDate: i.expiryDate
    }));

    res.json({ success: true, count: results.length, data: results });
  } catch (err) { next(err); }
};

// GET /api/medicines — list all medicines (admin/public)
exports.getAllMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find().sort('name');
    res.json({ success: true, count: medicines.length, data: medicines });
  } catch (err) { next(err); }
};
