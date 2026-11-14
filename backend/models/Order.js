const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  buyerWa: { type: String, default: '-' },
  buyerAddress: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'Lagi Diproses' },
  proofImage: { type: String, default: '' },
  adminNote: { type: String, default: '' },
  createdAt: { type: Number, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
