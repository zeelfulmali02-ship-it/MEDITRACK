const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true, trim: true },
  address:  { type: String, required: true },
  city:     { type: String, required: true },
  phone:    { type: String },
  email:    { type: String },
  isActive: { type: Boolean, default: true },
  latitude: { type: Number, default: 0 },
  longitude:{ type: Number, default: 0 },
  location: {
    lat:  { type: Number, default: 0 },
    lng:  { type: Number, default: 0 }
  }
}, { timestamps: true });

// Keep legacy `location` and new latitude/longitude fields in sync.
pharmacySchema.pre('save', function syncLocationFields(next) {
  if ((this.latitude || this.longitude) && (!this.location?.lat && !this.location?.lng)) {
    this.location = { lat: this.latitude, lng: this.longitude };
  }
  if ((this.location?.lat || this.location?.lng) && (!this.latitude && !this.longitude)) {
    this.latitude = this.location.lat;
    this.longitude = this.location.lng;
  }
  next();
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
