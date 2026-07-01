const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  generic:     { type: String },          // generic/chemical name
  category:    { type: String },          // e.g. Antibiotic, Painkiller
  description: { type: String },
  manufacturer:{ type: String },
  requiresPrescription: { type: Boolean, default: false }
}, { timestamps: true });

medicineSchema.index({ name: 'text', generic: 'text', category: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
