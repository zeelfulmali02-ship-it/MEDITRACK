const Reservation = require('../models/Reservation');
const Inventory = require('../models/Inventory');

// POST /api/reservation/create
exports.createReservation = async (req, res, next) => {
  try {
    const { inventoryId, quantity = 1 } = req.body;

    const inventory = await Inventory.findById(inventoryId).populate('pharmacy').populate('medicine');
    if (!inventory) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (!inventory.available || inventory.quantity < quantity)
      return res.status(400).json({ success: false, message: 'Insufficient stock' });

    // Deduct quantity
    inventory.quantity -= quantity;
    await inventory.save();

    const reservation = await Reservation.create({
      user: req.user._id,
      inventory: inventory._id,
      pharmacy: inventory.pharmacy._id,
      medicine: inventory.medicine._id,
      quantity
    });

    // Emit real-time update
    req.app.get('io').emit('inventoryUpdate', {
      pharmacyId: inventory.pharmacy._id,
      inventoryId: inventory._id,
      quantity: inventory.quantity,
      available: inventory.available
    });

    res.status(201).json({ success: true, reservationId: reservation.reservationId, data: reservation });
  } catch (err) { next(err); }
};

// DELETE /api/reservation/cancel/:id
exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });
    if (reservation.status === 'CANCELLED')
      return res.status(400).json({ success: false, message: 'Already cancelled' });

    // Restore inventory
    const inventory = await Inventory.findById(reservation.inventory);
    if (inventory) {
      inventory.quantity += reservation.quantity;
      await inventory.save();
      req.app.get('io').emit('inventoryUpdate', { inventoryId: inventory._id, quantity: inventory.quantity, available: inventory.available });
    }

    reservation.status = 'CANCELLED';
    await reservation.save();

    res.json({ success: true, message: 'Reservation cancelled', data: reservation });
  } catch (err) { next(err); }
};

// GET /api/reservation/my — user's reservation history
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('medicine', 'name generic')
      .populate('pharmacy', 'name address city')
      .sort('-createdAt');
    res.json({ success: true, count: reservations.length, data: reservations });
  } catch (err) { next(err); }
};

// PUT /api/reservation/status/:id — pharmacy updates reservation status
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });

    const Pharmacy = require('../models/Pharmacy');
    const pharmacy = await Pharmacy.findOne({ owner: req.user._id });
    if (!pharmacy)
      return res.status(403).json({ success: false, message: 'Pharmacy profile not found' });

    const reservation = await Reservation.findOne({ _id: req.params.id, pharmacy: pharmacy._id });
    if (!reservation)
      return res.status(404).json({ success: false, message: 'Reservation not found' });

    // Prevent updating terminal states
    if (['COMPLETED', 'CANCELLED'].includes(reservation.status))
      return res.status(400).json({ success: false, message: `Cannot update a ${reservation.status} reservation` });

    // Restore inventory if cancelling
    if (status === 'CANCELLED') {
      const inventory = await Inventory.findById(reservation.inventory);
      if (inventory) {
        inventory.quantity += reservation.quantity;
        await inventory.save();
        req.app.get('io').emit('inventoryUpdate', {
          inventoryId: inventory._id,
          quantity: inventory.quantity,
          available: inventory.available
        });
      }
    }

    reservation.status = status;
    await reservation.save();

    res.json({ success: true, message: `Reservation ${status.toLowerCase()}`, data: reservation });
  } catch (err) { next(err); }
};
