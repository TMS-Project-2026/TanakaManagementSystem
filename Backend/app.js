const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db'); 

const app = express();

// Middleware Utama
app.use(cors());
app.use(express.json());

// Import & Daftarkan Rute
const authRoutes = require('./routes/authRoutes');
const produkRoutes = require('./routes/produkRoutes'); 
const salesRoutes = require('./routes/salesRoutes'); 

app.use('/api/auth', authRoutes);
app.use('/api/produk', produkRoutes); 
app.use('/api/po', salesRoutes); 

app.get('/', (req, res) => {
  res.json({ message: 'API Tanaka Management System Berjalan Lancar!' });
});

// Menyalakan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});