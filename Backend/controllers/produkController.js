const db = require('../config/db');

exports.getAllProduk = (req, res) => {
    const sql = "SELECT * FROM produk ORDER BY id ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.tambahProduk = (req, res) => {
    const { 
        nama_produk, nama, kategori, bahan, variasi, hpp_satuan, margin, harga_jual, keterangan, 
        harga_direktur, harga_gm, harga_manager, harga_spv 
    } = req.body;

    if (!nama_produk || !hpp_satuan) {
        return res.status(400).json({ message: "Data produk tidak lengkap! Pastikan nama_produk dan hpp_satuan terisi." });
    }

    const sql = `INSERT INTO produk 
        (nama_produk, nama, kategori, bahan, variasi, hpp_satuan, margin, harga_jual, keterangan, harga_direktur, harga_gm, harga_manager, harga_spv) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        nama_produk, nama || null, kategori || 'Lainnya', bahan, variasi, hpp_satuan, margin, harga_jual || 0, keterangan, 
        harga_direktur || 0, harga_gm || 0, harga_manager || 0, harga_spv || 0
    ];
    
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Produk berhasil ditambahkan!" });
    });
};

exports.updateProduk = (req, res) => {
    const { id } = req.params;
    const { 
        nama_produk, nama, kategori, bahan, variasi, hpp_satuan, margin, harga_jual, keterangan, 
        harga_direktur, harga_gm, harga_manager, harga_spv 
    } = req.body;

    const sql = `UPDATE produk SET 
        nama_produk=?, nama=?, kategori=?, bahan=?, variasi=?, hpp_satuan=?, margin=?, harga_jual=?, keterangan=?, 
        harga_direktur=?, harga_gm=?, harga_manager=?, harga_spv=? 
        WHERE id=?`;
    const values = [
        nama_produk, nama || null, kategori || 'Lainnya', bahan, variasi, hpp_satuan, margin, harga_jual || 0, keterangan, 
        harga_direktur || 0, harga_gm || 0, harga_manager || 0, harga_spv || 0, id
    ];

    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ message: "Produk berhasil diupdate!" });
    });
};

exports.deleteProduk = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM produk WHERE id=?";
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ message: "Produk berhasil dihapus!" });
    });
};

exports.importProduk = (req, res) => {
    const data = req.body; // Expects an array of product objects
    
    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: "Data tidak valid atau kosong." });
    }

    const sql = `INSERT INTO produk 
        (nama_produk, nama, bahan, variasi, hpp_satuan, margin, harga_jual, keterangan, harga_direktur, harga_gm, harga_manager, harga_spv) 
        VALUES ?`;
        
    const values = data.map(item => [
        item.nama_produk || '', 
        item.nama || null,
        item.bahan || '', 
        item.variasi || '', 
        item.hpp_satuan || 0, 
        item.margin || '', 
        item.harga_jual || 0, 
        item.keterangan || '', 
        item.harga_direktur || 0, 
        item.harga_gm || 0, 
        item.harga_manager || 0, 
        item.harga_spv || 0
    ]);

    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error('Import error:', err);
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: `${result.affectedRows} Produk berhasil diimport!` });
    });
};