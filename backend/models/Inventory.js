const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  pharmacy:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
  medicine:    { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity:    { type: Number, required: true, min: 0, default: 0 },
  price:       { type: Number, required: true, min: 0 },
  available:   { type: Boolean, default: true },
  expiryDate:  { type: Date }
}, { timestamps: true });

// Auto-set available based on quantity
inventorySchema.pre('save', function (next) {
  this.available = this.quantity > 0;
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
