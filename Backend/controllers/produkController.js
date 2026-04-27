const db = require('../config/db');

exports.getAllProduk = (req, res) => {
    const sql = "SELECT id, nama_produk, hpp_satuan FROM produk ORDER BY id ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.tambahProduk = (req, res) => {
    const { nama_produk, hpp_satuan } = req.body;

    if (!nama_produk || !hpp_satuan) {
        return res.status(400).json({ message: "Data produk tidak lengkap! Pastikan nama_produk dan hpp_satuan terisi." });
    }

    const sql = "INSERT INTO produk (nama_produk, hpp_satuan) VALUES (?, ?)";
    const values = [nama_produk, hpp_satuan];
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Produk berhasil ditambahkan!" });
    });
};