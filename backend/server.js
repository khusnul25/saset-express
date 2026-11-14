require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User');
const { Product, Setting } = require('./models/Product');
const Order = require('./models/Order');
const Message = require('./models/Message');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Dinaikkan ke 50mb untuk mendukung upload musik/video chat

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Koneksi Mongoose yang dioptimalkan untuk Vercel Serverless
let cachedDb = null;
async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI tidak ditemukan di Environment Variables!");
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = db;
    console.log("✅ Berhasil terhubung ke MongoDB Atlas!");
    return db;
  } catch (err) {
    console.error("❌ Gagal terhubung ke MongoDB:", err.message);
    throw err;
  }
}

// Route Root
app.get('/', (req, res) => {
  res.json({ status: "success", message: "Saset Express Backend Aktif & Berjalan Normal!" });
});

// Endpoint Sync Utama (Dilengkapi Pembuatan Akun Admin Otomatis Jika Kosong)
app.get('/api/sync', async (req, res) => {
  try {
    await connectDB();

    // Pastikan akun admin master selalu ada agar tidak pernah kosong
    let admin = await User.findOne({ email: 'admin@saset.com' });
    if (!admin) {
      admin = await User.create({
        uid: 'admin_master_saset',
        name: 'Admin Saset Express',
        email: 'admin@saset.com',
        password: 'admin123',
        role: 'admin',
        address: 'Kebun Utama Saset Express, Surabaya',
        wa: '081200009999',
        photo: 'https://placehold.co/150x150/FACC15/0F172A?text=ADMIN'
      });
    }

    // Pastikan produk awal selalu ada
    const prodCount = await Product.countDocuments();
    if (prodCount === 0) {
      await Product.insertMany([
        {
          id: 'prod_1',
          name: 'Bayam Hijau Hidroponik (250g)',
          price: 7500,
          stock: 30,
          description: 'Bayam hijau segar bebas pestisida, dipanen pagi ini langsung dari instalasi hidroponik.',
          image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'prod_2',
          name: 'Pakcoy Organik Segar (300g)',
          price: 9000,
          stock: 25,
          description: 'Pakcoy baby organik dengan batang putih renyah dan daun hijau pekat.',
          image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=600&q=80'
        }
      ]);
    }

    const users = await User.find().lean() || [];
    const products = await Product.find().sort({ createdAt: -1 }).lean() || [];
    const orders = await Order.find().sort({ createdAt: -1 }).lean() || [];
    const messages = await Message.find().sort({ createdAt: 1 }).lean() || [];
    const setting = await Setting.findOne({ key: 'store' }).lean() || { qrisImage: '' };

    res.json({ users, products, orders, messages, qrisImage: setting?.qrisImage || '' });
  } catch (err) {
    console.error("API Sync Error:", err);
    res.status(500).json({ 
      users: [], 
      products: [], 
      orders: [], 
      messages: [], 
      qrisImage: '', 
      error: err.message 
    });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    await connectDB();
    const user = new User(req.body);
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:uid', async (req, res) => {
  try {
    await connectDB();
    const updated = await User.findOneAndUpdate({ uid: req.params.uid }, req.body, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', async (req, res) => {
  try {
    await connectDB();
    await User.findOneAndDelete({ uid: req.params.uid });
    await Message.deleteMany({ channel: `private_${req.params.uid}` });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    await connectDB();
    const prod = new Product(req.body);
    await prod.save();
    res.json({ success: true, prod });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    await connectDB();
    const updated = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await connectDB();
    await Product.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    await connectDB();
    const { items, ...orderData } = req.body;
    for (const item of items) {
      const p = await Product.findOne({ id: item.productId });
      if (p) {
        p.stock = Math.max(0, p.stock - item.qty);
        await p.save();
      }
    }
    const order = new Order({ items, ...orderData });
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    await connectDB();
    const updated = await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json({ success: true, updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint DELETE Pesanan (Sudah dioptimalkan dengan connectDB)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await connectDB();
    const orderId = req.params.id;
    const result = await Order.findOneAndDelete({ id: orderId });
    
    if (!result) {
      return res.status(404).json({ success: false, error: "Pesanan tidak ditemukan di database" });
    }
    
    res.json({ success: true, message: "Pesanan berhasil dihapus secara permanen" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    await connectDB();
    const msg = new Message(req.body);
    await msg.save();
    res.json({ success: true, msg });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint DELETE Pesan Chat
app.delete('/api/messages/:id', async (req, res) => {
  try {
    await connectDB();
    const msgId = req.params.id;
    const result = await Message.findOneAndDelete({ id: msgId });
    
    if (!result) {
      return res.status(404).json({ success: false, error: "Pesan tidak ditemukan" });
    }
    
    res.json({ success: true, message: "Pesan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/settings/qris', async (req, res) => {
  try {
    await connectDB();
    await Setting.findOneAndUpdate(
      { key: 'store' },
      { qrisImage: req.body.qrisImage },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server Backend berjalan di port ${PORT}`));