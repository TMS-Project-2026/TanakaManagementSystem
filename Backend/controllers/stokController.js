const db = require('../config/db');

// ============ GET ALL STOK (dengan filter cabang opsional) ============
exports.getAllStok = (req, res) => {
    let query = "SELECT *, created_at FROM stok";
    const queryParams = [];

    if (req.query.cabang_id) {
        query += " WHERE LOWER(cabang_id) = LOWER(?)";
        queryParams.push(req.query.cabang_id);
    }

    query += " ORDER BY nama_barang ASC";

    db.query(query, queryParams, (error, results) => {
        if (error) {
            console.error("Error get stok:", error);
            return res.status(500).json({ message: error.message });
        }
        res.status(200).json({ status: "success", data: results });
    });
};

// ============ ANALISIS STOK ============
exports.getAnalisisStok = (req, res) => {
    // 1. Fast Moving (Terjual banyak dalam 30 hari terakhir)
    const sqlFastMoving = `
        SELECT s.nama_barang, s.jumlah, SUM(m.qty) as total_terjual 
        FROM stok s 
        LEFT JOIN marketing_orders_online m ON LOWER(s.nama_barang) = LOWER(m.product_name) 
        WHERE m.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
        GROUP BY s.nama_barang, s.jumlah 
        ORDER BY total_terjual DESC 
        LIMIT 5
    `;

    // 2. Dead Stock (Stok > 10, tidak ada penjualan dalam 60 hari)
    const sqlDeadStock = `
        SELECT s.nama_barang, s.jumlah 
        FROM stok s 
        WHERE s.jumlah > 10 
        AND LOWER(s.nama_barang) NOT IN (
            SELECT DISTINCT LOWER(product_name) FROM marketing_orders_online 
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        )
        ORDER BY s.jumlah DESC 
        LIMIT 5
    `;

    // 3. Stok Menipis
    const sqlStokMenipis = `
        SELECT nama_barang, jumlah, minimum_stok 
        FROM stok 
        WHERE jumlah < minimum_stok OR jumlah = 0
        ORDER BY jumlah ASC 
        LIMIT 5
    `;

    db.query(sqlFastMoving, [], (err1, fastMoving) => {
        if (err1) console.error("Error fastMoving:", err1);

        db.query(sqlDeadStock, [], (err2, deadStock) => {
            if (err2) console.error("Error deadStock:", err2);

            db.query(sqlStokMenipis, [], (err3, stokMenipis) => {
                if (err3) console.error("Error stokMenipis:", err3);

                res.status(200).json({
                    status: "success",
                    data: {
                        fastMoving: fastMoving || [],
                        deadStock: deadStock || [],
                        stokMenipis: stokMenipis || []
                    }
                });
            });
        });
    });
};

// ============ CREATE STOK ============
exports.createStok = (req, res) => {
    const { nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran } = req.body;
    if (!nama_barang || !kategori || !cabang_id) {
        return res.status(400).json({ message: "Data tidak lengkap!" });
    }

    const sql = "INSERT INTO stok (nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const params = [
        nama_brand || null,
        nama_barang,
        jumlah || 0,
        kategori,
        cabang_id,
        minimum_stok || 5,
        kode_rak || null,
        ukuran || null,
        req.body.created_at || new Date()
    ];

    db.query(sql, params, (error, result) => {
        if (error) {
            console.error("Error create stok:", error);
            return res.status(500).json({ message: error.message });
        }
        res.status(201).json({ message: "Barang berhasil ditambahkan!", id: result.insertId });
    });
};

// ============ UPDATE STOK ============
exports.updateStok = (req, res) => {
    const { id } = req.params;
    const { nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran } = req.body;

    const sql = "UPDATE stok SET nama_brand=?, nama_barang=?, jumlah=?, kategori=?, cabang_id=?, minimum_stok=?, kode_rak=?, ukuran=?, created_at=? WHERE id=?";
    const params = [
        nama_brand || null,
        nama_barang,
        jumlah,
        kategori,
        cabang_id,
        minimum_stok,
        kode_rak || null,
        ukuran || null,
        req.body.created_at || null,
        id
    ];

    db.query(sql, params, (error, result) => {
        if (error) {
            console.error("Error update stok:", error);
            return res.status(500).json({ message: error.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        res.status(200).json({ message: "Barang berhasil diperbarui!" });
    });
};

// ============ DELETE STOK ============
exports.deleteStok = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM stok WHERE id = ?", [id], (error, result) => {
        if (error) {
            console.error("Error delete stok:", error);
            return res.status(500).json({ message: error.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        res.status(200).json({ message: "Barang berhasil dihapus!" });
    });
};
