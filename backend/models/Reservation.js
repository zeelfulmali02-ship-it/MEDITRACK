const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, unique: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  pharmacy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicine:  { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity:  { type: Number, required: true, min: 1, default: 1 },
  status:    { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], default: 'PENDING' },
  expiresAt: { type: Date }
}, { timestamps: true });

// Generate reservation ID before save
reservationSchema.pre('save', function (next) {
  if (!this.reservationId) {
    this.reservationId = 'RES-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  if (!this.expiresAt) {
    // Reservation valid for 24 hours
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
