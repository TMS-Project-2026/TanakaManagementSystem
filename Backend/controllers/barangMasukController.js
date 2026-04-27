const db = require('../config/db');

exports.getAllBarangMasuk = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = `
            SELECT bm.*, s.nama_barang, s.cabang_id 
            FROM barang_masuk bm
            JOIN stok s ON bm.barang_id = s.id
            ORDER BY bm.tanggal DESC, bm.id DESC
        `;
        const [results] = await promiseDb.query(sql);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get barang_masuk:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createBarangMasuk = async (req, res) => {
    try {
        const { barang_id, jumlah, tanggal, supplier } = req.body;
        if (!barang_id || !jumlah || !tanggal) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        const promiseDb = db.promise();
        
        // 1. Insert into barang_masuk
        const sqlInsert = "INSERT INTO barang_masuk (barang_id, jumlah, tanggal, supplier) VALUES (?, ?, ?, ?)";
        await promiseDb.query(sqlInsert, [barang_id, jumlah, tanggal, supplier]);
        
        // 2. Update stok
        const sqlUpdate = "UPDATE stok SET jumlah = jumlah + ? WHERE id = ?";
        await promiseDb.query(sqlUpdate, [jumlah, barang_id]);

        res.status(201).json({ message: "Barang masuk berhasil dicatat dan stok bertambah!" });
    } catch (error) {
        console.error("Error create barang_masuk:", error);
        res.status(500).json({ message: error.message });
    }
};
