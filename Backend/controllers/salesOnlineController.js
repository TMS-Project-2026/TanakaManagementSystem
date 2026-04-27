const db = require('../config/db');

exports.getAllSales = (req, res) => {
    const sql = "SELECT * FROM sales_online ORDER BY tanggal DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.addSale = (req, res) => {
    const { tanggal, akun_toko, nama_produk, qty, harga_satuan, potongan_marketplace, hpp_satuan, catatan } = req.body;
    
    const total_harga = qty * harga_satuan;
    const total_hpp = qty * hpp_satuan;
    const profit = total_harga - potongan_marketplace - total_hpp;

    const sql = `INSERT INTO sales_online 
                 (tanggal, akun_toko, nama_produk, qty, harga_satuan, total_harga, potongan_marketplace, hpp_satuan, total_hpp, profit, catatan) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                 
    db.query(sql, [tanggal, akun_toko, nama_produk, qty, harga_satuan, total_harga, potongan_marketplace, hpp_satuan, total_hpp, profit, catatan], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menyimpan: " + err.message });
        res.status(201).json({ message: "Data berhasil ditambahkan!" });
    });
};

exports.deleteSale = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM sales_online WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Data dihapus." });
    });
};
// Ambil semua ringkasan data untuk dashboard
exports.getDashboardData = async (req, res) => {
    try {
        // 1. Hitung 5 Metrik Utama
        const summarySql = `
            SELECT 
                SUM(total_harga) as totalRevenue,
                SUM(profit) as totalProfit,
                SUM(total_hpp) as totalHPP,
                SUM(qty) as totalQty,
                SUM(potongan_marketplace) as totalPotongan
            FROM sales_online`;
        
        // 2. Hitung Pendapatan Per Akun Toko
        const shopSql = `SELECT akun_toko as nama, SUM(total_harga) as total FROM sales_online GROUP BY akun_toko`;

        // 3. Ambil Tren Penjualan (7 Data terakhir)
        const trendSql = `SELECT DATE_FORMAT(tanggal, '%d %b') as tgl, SUM(total_harga) as sales FROM sales_online GROUP BY tanggal ORDER BY tanggal DESC LIMIT 7`;

        // 4. Top 5 Produk
        const topProductSql = `SELECT nama_produk as nama, SUM(total_harga) as total FROM sales_online GROUP BY nama_produk ORDER BY total DESC LIMIT 5`;

        const [summary] = await db.promise().query(summarySql);
        const [shops] = await db.promise().query(shopSql);
        const [trend] = await db.promise().query(trendSql);
        const [products] = await db.promise().query(topProductSql);

        res.json({
            summary: summary[0],
            shops: shops,
            trend: trend.reverse(), // Supaya urutan tanggalnya maju
            products: products
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};