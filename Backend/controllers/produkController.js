const db = require('../config/db');

exports.getAllProduk = (req, res) => {
    const sql = "SELECT * FROM produk ORDER BY id_produk DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        
        // Format disesuaikan agar langsung terbaca oleh Frontend React kamu
        res.status(200).json({ status: "success", data: results, stok_menipis: results });
    });
};

exports.tambahProduk = (req, res) => {
    const { nama_barang, stok, stok_minimum, harga_beli, harga_jual, cabang } = req.body;
    
    if (!nama_barang || !cabang) {
        return res.status(400).json({ message: "Data produk tidak lengkap!" });
    }

    const sql = "INSERT INTO produk (nama_barang, stok, stok_minimum, harga_beli, harga_jual, cabang) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [nama_barang, stok, stok_minimum, harga_beli, harga_jual, cabang], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Produk berhasil ditambahkan ke Gudang!" });
    });
};