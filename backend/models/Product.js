const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  createdAt: { type: Number, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'store' },
  qrisImage: { type: String, default: '' }
});

module.exports = {
  Product: mongoose.model('Product', ProductSchema),
  Setting: mongoose.model('Setting', SettingsSchema)
};
