const db = require('../config/db');

exports.getAllBarangMasuk = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = `
            SELECT bm.*, s.nama_brand, s.nama_barang, s.cabang_id, s.ukuran, s.kategori, s.minimum_stok 
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
        const { barang_id, jumlah, tanggal, supplier, transaksi_id, items, nama_brand, nama_barang, kategori, cabang_id, kode_rak } = req.body;

        const promiseDb = db.promise();
        const trxId = transaksi_id || 'TRX-IN-' + Date.now() + Math.floor(Math.random() * 1000);

        // Jika request dalam format baru (multi-size / auto-create)
        if (items && Array.isArray(items)) {
            if (!nama_barang || !kategori || !cabang_id || !tanggal) {
                return res.status(400).json({ message: "Data utama tidak lengkap (Nama Barang, Kategori, Cabang, Tanggal wajib diisi)!" });
            }

            for (const item of items) {
                const qty = Number(item.jumlah) || 0;
                const minStok = Number(item.minimum_stok) || 5;
                const size = item.ukuran;

                if (!size) continue;
                // Hanya memproses ukuran dengan kuantitas masuk > 0
                if (qty <= 0) continue; 

                // Cari apakah stok dengan brand, nama, cabang, dan ukuran sudah ada
                let stockId = null;
                const [existing] = await promiseDb.query(
                    "SELECT id FROM stok WHERE TRIM(LOWER(nama_barang)) = TRIM(LOWER(?)) AND TRIM(LOWER(cabang_id)) = TRIM(LOWER(?)) AND BINARY ukuran = ? LIMIT 1",
                    [nama_barang, cabang_id, size]
                );

                if (existing.length > 0) {
                    stockId = existing[0].id;
                    // Update stok (akumulasi kuantitas, set minimal stok terbaru, dan metadata lainnya)
                    await promiseDb.query(
                        "UPDATE stok SET jumlah = jumlah + ?, minimum_stok = ?, nama_brand = ?, kategori = ?, kode_rak = ? WHERE id = ?",
                        [qty, minStok, nama_brand || null, kategori, kode_rak || null, stockId]
                    );
                } else {
                    // Create stok baru jika belum pernah ada
                    const [insertRes] = await promiseDb.query(
                        "INSERT INTO stok (nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [nama_brand || null, nama_barang, qty, kategori, cabang_id, minStok, kode_rak || null, size]
                    );
                    stockId = insertRes.insertId;
                }

                // Masukkan transaksi pencatatan barang masuk
                await promiseDb.query(
                    "INSERT INTO barang_masuk (transaksi_id, barang_id, jumlah, tanggal, supplier) VALUES (?, ?, ?, ?, ?)",
                    [trxId, stockId, qty, tanggal, supplier || null]
                );
            }

            return res.status(201).json({ message: "Barang masuk berhasil dicatat dan stok diperbarui!", transaksi_id: trxId });
        }

        // Fallback ke format lama (single item)
        if (!barang_id || !jumlah || !tanggal) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        const sqlInsert = "INSERT INTO barang_masuk (transaksi_id, barang_id, jumlah, tanggal, supplier) VALUES (?, ?, ?, ?, ?)";
        await promiseDb.query(sqlInsert, [trxId, barang_id, jumlah, tanggal, supplier]);
        
        const sqlUpdate = "UPDATE stok SET jumlah = jumlah + ? WHERE id = ?";
        await promiseDb.query(sqlUpdate, [jumlah, barang_id]);

        res.status(201).json({ message: "Barang masuk berhasil dicatat dan stok bertambah!", transaksi_id: trxId });
    } catch (error) {
        console.error("Error create barang_masuk:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateBarangMasuk = async (req, res) => {
    try {
        const { transaksi_id } = req.params;
        const { tanggal, cabang_id, nama_brand, nama_barang, kategori, kode_rak, items } = req.body;
        
        const promiseDb = db.promise();
        
        // 1. Revert old stock
        const [oldItems] = await promiseDb.query("SELECT * FROM barang_masuk WHERE transaksi_id = ?", [transaksi_id]);
        for (const old of oldItems) {
            await promiseDb.query("UPDATE stok SET jumlah = jumlah - ? WHERE id = ?", [old.jumlah, old.barang_id]);
        }
        
        // 2. Delete old barang_masuk
        await promiseDb.query("DELETE FROM barang_masuk WHERE transaksi_id = ?", [transaksi_id]);
        
        // 3. Create new records
        if (items && Array.isArray(items)) {
            for (const item of items) {
                const qty = Number(item.jumlah) || 0;
                const minStok = Number(item.minimum_stok) || 5;
                const size = item.ukuran;

                if (!size || qty <= 0) continue; 

                let stockId = null;
                const [existing] = await promiseDb.query(
                    "SELECT id FROM stok WHERE TRIM(LOWER(nama_barang)) = TRIM(LOWER(?)) AND TRIM(LOWER(cabang_id)) = TRIM(LOWER(?)) AND BINARY ukuran = ? LIMIT 1",
                    [nama_barang, cabang_id, size]
                );

                if (existing.length > 0) {
                    stockId = existing[0].id;
                    await promiseDb.query(
                        "UPDATE stok SET jumlah = jumlah + ?, minimum_stok = ?, nama_brand = ?, kategori = ?, kode_rak = ? WHERE id = ?",
                        [qty, minStok, nama_brand || null, kategori, kode_rak || null, stockId]
                    );
                } else {
                    const [insertRes] = await promiseDb.query(
                        "INSERT INTO stok (nama_brand, nama_barang, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [nama_brand || null, nama_barang, qty, kategori, cabang_id, minStok, kode_rak || null, size]
                    );
                    stockId = insertRes.insertId;
                }

                await promiseDb.query(
                    "INSERT INTO barang_masuk (transaksi_id, barang_id, jumlah, tanggal, supplier) VALUES (?, ?, ?, ?, ?)",
                    [transaksi_id, stockId, qty, tanggal, null]
                );
            }
        }
        
        res.status(200).json({ message: "Transaksi berhasil diupdate dan stok disesuaikan." });
    } catch (error) {
        console.error("Error update barang_masuk:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteBarangMasuk = async (req, res) => {
    try {
        const { transaksi_id } = req.params;
        const promiseDb = db.promise();
        
        const [items] = await promiseDb.query("SELECT * FROM barang_masuk WHERE transaksi_id = ?", [transaksi_id]);
        if (items.length === 0) {
            return res.status(404).json({ message: "Transaksi tidak ditemukan!" });
        }
        
        for (const item of items) {
            await promiseDb.query("UPDATE stok SET jumlah = jumlah - ? WHERE id = ?", [item.jumlah, item.barang_id]);
        }
        
        await promiseDb.query("DELETE FROM barang_masuk WHERE transaksi_id = ?", [transaksi_id]);
        
        res.status(200).json({ message: "Transaksi berhasil dihapus dan stok telah disesuaikan." });
    } catch (error) {
        console.error("Error delete barang_masuk:", error);
        res.status(500).json({ message: error.message });
    }
};
