const db = require('../config/db');

exports.getAllProduk = (req, res) => {
    const sql = "SELECT id, nama_produk, stok, harga_beli, harga_jual, tanggal_masuk, stok_minimum FROM produk ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });

        // Format disesuaikan agar langsung terbaca oleh Frontend React kamu
        res.status(200).json({ status: "success", data: results, stok_menipis: results });
    });
};

exports.tambahProduk = (req, res) => {
    const { nama_produk, stok, stok_minimum, harga_beli, harga_jual, tanggal_masuk } = req.body;

    if (!nama_produk || !harga_beli || !harga_jual) {
        return res.status(400).json({ message: "Data produk tidak lengkap!" });
    }

    const sql = "INSERT INTO produk (nama_produk, stok, stok_minimum, harga_beli, harga_jual, tanggal_masuk) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [
        nama_produk,
        stok || 0,
        stok_minimum || 10,
        harga_beli,
        harga_jual,
        tanggal_masuk || new Date().toISOString().split('T')[0]
    ];
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Produk berhasil ditambahkan ke Gudang!" });
    });
};