const db = require('../config/db');

exports.getAllMutasi = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = `
            SELECT mb.*, s.nama_barang 
            FROM mutasi_barang mb
            JOIN stok s ON mb.barang_id = s.id
            ORDER BY mb.tanggal DESC, mb.id DESC
        `;
        const [results] = await promiseDb.query(sql);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get mutasi_barang:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createMutasi = async (req, res) => {
    // transaction logic needed for mutasi
    const promiseDb = db.promise();
    try {
        const { barang_id, dari_cabang, ke_cabang, jumlah, tanggal } = req.body;
        if (!barang_id || !dari_cabang || !ke_cabang || !jumlah || !tanggal) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        if (dari_cabang === ke_cabang) {
            return res.status(400).json({ message: "Cabang asal dan tujuan tidak boleh sama!" });
        }

        await promiseDb.query("START TRANSACTION");

        // 1. Cek stok di cabang asal
        const [stokAsalResult] = await promiseDb.query("SELECT id, jumlah FROM stok WHERE nama_barang = (SELECT nama_barang FROM stok WHERE id = ?) AND cabang_id = ?", [barang_id, dari_cabang]);
        if (stokAsalResult.length === 0) {
            await promiseDb.query("ROLLBACK");
            return res.status(404).json({ message: `Barang tidak ditemukan di cabang asal: ${dari_cabang}` });
        }
        
        const stokAsal = stokAsalResult[0];
        if (stokAsal.jumlah < jumlah) {
            await promiseDb.query("ROLLBACK");
            return res.status(400).json({ message: `Stok cabang asal tidak cukup! Stok saat ini: ${stokAsal.jumlah}` });
        }

        // 2. Kurangi stok cabang asal
        await promiseDb.query("UPDATE stok SET jumlah = jumlah - ? WHERE id = ?", [jumlah, stokAsal.id]);

        // 3. Tambah stok cabang tujuan (atau buat baru jika belum ada)
        const [stokTujuanResult] = await promiseDb.query("SELECT id FROM stok WHERE nama_barang = (SELECT nama_barang FROM stok WHERE id = ?) AND cabang_id = ?", [barang_id, ke_cabang]);
        
        if (stokTujuanResult.length > 0) {
            await promiseDb.query("UPDATE stok SET jumlah = jumlah + ? WHERE id = ?", [jumlah, stokTujuanResult[0].id]);
        } else {
            // Get original item details
            const [itemResult] = await promiseDb.query("SELECT nama_barang, kategori, minimum_stok FROM stok WHERE id = ?", [barang_id]);
            const item = itemResult[0];
            await promiseDb.query(
                "INSERT INTO stok (nama_barang, jumlah, kategori, cabang_id, minimum_stok) VALUES (?, ?, ?, ?, ?)",
                [item.nama_barang, jumlah, item.kategori, ke_cabang, item.minimum_stok]
            );
        }

        // 4. Catat mutasi
        const sqlInsert = "INSERT INTO mutasi_barang (barang_id, dari_cabang, ke_cabang, jumlah, tanggal) VALUES (?, ?, ?, ?, ?)";
        await promiseDb.query(sqlInsert, [stokAsal.id, dari_cabang, ke_cabang, jumlah, tanggal]);

        await promiseDb.query("COMMIT");
        res.status(201).json({ message: "Mutasi berhasil dicatat! Stok antar cabang telah disesuaikan." });
    } catch (error) {
        await promiseDb.query("ROLLBACK");
        console.error("Error create mutasi_barang:", error);
        res.status(500).json({ message: error.message });
    }
};