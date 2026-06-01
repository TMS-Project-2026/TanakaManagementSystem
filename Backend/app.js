const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db'); 

// 1. Inisialisasi Express
const app = express();

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// 3. Import Route
const authRoutes = require('./routes/authRoutes');
const produkRoutes = require('./routes/produkRoutes'); 
const marketingRoutes = require('./routes/marketingRoutes');
const salesOnlineRoutes = require('./routes/salesOnlineRoutes'); // Khusus Excel
const marketingOnlineBanuaRoutes = require('./routes/marketingOnlineBanuaRoutes'); // Khusus Marketing Online Banua
const marketingOfflineBanuaRoutes = require('./routes/marketingOfflineBanuaRoutes');
const marketingOfflineTanakaRoutes = require('./routes/marketingOfflineTanakaRoutes'); // Khusus Marketing Offline Tanaka
const salesRoutes = require('./routes/salesRoutes'); // Untuk Order B2B
const promoRoutes = require('./routes/promoRoutes'); // Menambahkan rute promo
const financeRoutes = require('./routes/financeRoutes');
const cashInBankRoutes = require('./routes/cashInBankRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const accountRoutes = require('./routes/accountRoutes');
const journalRoutes = require('./routes/journalRoutes');
const cashOutBankRoutes = require('./routes/cashOutBankRoutes');

const pettyCashRoutes = require('./routes/pettyCashRoutes');
const piutangRoutes = require('./routes/piutangRoutes');
const hutangRoutes = require('./routes/hutangRoutes');

const gudangRoutes = require('./routes/gudangRoutes');
const stokRoutes = require('./routes/stokRoutes');
const sparepartRoutes = require('./routes/sparepartRoutes');
const barangMasukRoutes = require('./routes/barangMasukRoutes');
const barangKeluarRoutes = require('./routes/barangKeluarRoutes');
const mutasiRoutes = require('./routes/mutasiRoutes');
const itRoutes = require('./routes/itRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const produksiRoutes = require('./routes/produksiRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const stokJalanRoutes = require('./routes/stokJalanRoutes');
const pengaturanKeuanganRoutes = require('./routes/pengaturanKeuanganRoutes');

// 4. Daftarkan Route ke API
app.use('/api/auth', authRoutes);
app.use('/api/produk', produkRoutes); 
app.use('/api/marketing', marketingRoutes);
app.use('/api/sales-online', salesOnlineRoutes); 
app.use('/api/marketing-online-banua', marketingOnlineBanuaRoutes);
app.use('/api/marketing-offline', marketingOfflineBanuaRoutes);
app.use('/api/marketing-offline-tanaka', marketingOfflineTanakaRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/promo', promoRoutes); // Mendaftarkan API Promo
app.use('/api/finance', financeRoutes);
app.use('/api/cash-in-bank', cashInBankRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/cash-out-bank', cashOutBankRoutes);

app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/piutang', piutangRoutes);
app.use('/api/hutang', hutangRoutes);

app.use('/api/gudang', gudangRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/sparepart', sparepartRoutes);
app.use('/api/barang-masuk', barangMasukRoutes);
app.use('/api/barang-keluar', barangKeluarRoutes);
app.use('/api/mutasi', mutasiRoutes);
app.use('/api/it', itRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/produksi', produksiRoutes);
app.use('/api/quotation', quotationRoutes);
app.use('/api/stok-jalan', stokJalanRoutes);
app.use('/api/pengaturan-keuangan', pengaturanKeuanganRoutes);

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Test Route
app.get('/', (req, res) => {
  res.json({ message: 'API Tanaka Management System Berjalan Lancar!' });
});

// 6. Menyalakan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

