const db = require('../config/db');

exports.getAllStok = async (req, res) => {
    try {
        const promiseDb = db.promise();
        let query = "SELECT * FROM stok";
        const queryParams = [];

        if (req.query.cabang_id) {
            query += " WHERE cabang_id = ?";
            queryParams.push(req.query.cabang_id);
        }

        query += " ORDER BY nama_barang ASC";

        const [results] = await promiseDb.query(query, queryParams);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAnalisisStok = async (req, res) => {
    try {
        const promiseDb = db.promise();
        
        // 1. Fast Moving (Terjual banyak dalam 30 hari terakhir)
        // Kita menggunakan tabel marketing_orders_online sebagai proksi penjualan. 
        // Idealnya digabungkan dengan sales_offline jika ada tabelnya.
        const [fastMoving] = await promiseDb.query(`
            SELECT s.nama_barang, s.jumlah, SUM(m.qty) as total_terjual 
            FROM stok s 
            LEFT JOIN marketing_orders_online m ON s.nama_barang = m.product_name 
            WHERE m.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
            GROUP BY s.nama_barang, s.jumlah 
            ORDER BY total_terjual DESC 
            LIMIT 5
        `);

        // 2. Dead Stock (Stok > 10, tidak ada penjualan dalam 60 hari)
        const [deadStock] = await promiseDb.query(`
            SELECT s.nama_barang, s.jumlah 
            FROM stok s 
            WHERE s.jumlah > 10 
            AND s.nama_barang NOT IN (
                SELECT DISTINCT product_name FROM marketing_orders_online 
                WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
            )
            ORDER BY s.jumlah DESC 
            LIMIT 5
        `);

        // 3. Stok Menipis (jumlah < minimum_stok)
        const [stokMenipis] = await promiseDb.query(`
            SELECT nama_barang, jumlah, minimum_stok 
            FROM stok 
            WHERE jumlah < minimum_stok OR jumlah = 0
            ORDER BY jumlah ASC 
            LIMIT 5
        `);

        res.status(200).json({
            status: "success",
            data: {
                fastMoving,
                deadStock,
                stokMenipis
            }
        });
    } catch (error) {
        console.error("Error get analisis stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createStok = async (req, res) => {
    try {
        const { nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran } = req.body;
        if (!nama_barang || !kategori || !cabang_id) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        const promiseDb = db.promise();
        const sql = "INSERT INTO stok (nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const [result] = await promiseDb.query(sql, [nama_brand || null, nama_barang, jumlah || 0, kategori, cabang_id, minimum_stok || 5, kode_rak || null, ukuran || null]);

        res.status(201).json({ message: "Barang berhasil ditambahkan!", id: result.insertId });
    } catch (error) {
        console.error("Error create stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateStok = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran } = req.body;

        const promiseDb = db.promise();
        const sql = "UPDATE stok SET nama_brand=?, nama_barang=?, jumlah=?, kategori=?, cabang_id=?, minimum_stok=?, kode_rak=?, ukuran=? WHERE id=?";
        const [result] = await promiseDb.query(sql, [nama_brand || null, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak || null, ukuran || null, id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        res.status(200).json({ message: "Barang berhasil diperbarui!" });
    } catch (error) {
        console.error("Error update stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStok = async (req, res) => {
    try {
        const { id } = req.params;
        const promiseDb = db.promise();
        const sql = "DELETE FROM stok WHERE id = ?";
        const [result] = await promiseDb.query(sql, [id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        res.status(200).json({ message: "Barang berhasil dihapus!" });
    } catch (error) {
        console.error("Error delete stok:", error);
        res.status(500).json({ message: error.message });
    }
};
