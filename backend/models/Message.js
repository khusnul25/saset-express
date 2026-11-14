const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  channel: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, default: "" },
  mediaData: { type: String, default: "" }, // Pastikan ini ada
  mediaType: { type: String, default: "" }, // Pastikan ini ada
  mediaName: { type: String, default: "" }, // Pastikan ini ada
  createdAt: { type: Number, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);