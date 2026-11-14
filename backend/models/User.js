const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, default: '' },
  wa: { type: String, default: '' },
  role: { type: String, default: 'buyer' },
  photo: { type: String, default: '' },
  createdAt: { type: Number, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
