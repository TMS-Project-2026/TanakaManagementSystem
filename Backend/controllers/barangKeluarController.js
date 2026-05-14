const db = require('../config/db');

exports.getAllBarangKeluar = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = `
            SELECT bk.*, s.nama_brand, s.nama_barang, s.cabang_id, s.ukuran 
            FROM barang_keluar bk
            JOIN stok s ON bk.barang_id = s.id
            ORDER BY bk.tanggal DESC, bk.id DESC
        `;
        const [results] = await promiseDb.query(sql);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get barang_keluar:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createBarangKeluar = async (req, res) => {
    try {
        const { nama_brand, nama_barang, cabang_id, tanggal, tujuan, items } = req.body;

        if (!nama_barang || !cabang_id || !tanggal || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Data tidak lengkap atau items kosong!" });
        }

        const promiseDb = db.promise();

        // Generate grouped transaksi_id
        const transaksiId = `TRX-OUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // STEP 1: VALIDASI STOK (ALL-OR-NOTHING CHECK)
        const validatedItems = [];

        for (const item of items) {
            const size = item.ukuran;
            const qty = Number(item.jumlah);

            if (!size || isNaN(qty) || qty <= 0) {
                return res.status(400).json({ message: `Item ukuran atau jumlah keluar tidak valid!` });
            }

            // Cari data stok untuk Brand + Nama Barang + Cabang + Ukuran ini
            let findSql = `
                SELECT id, jumlah 
                FROM stok 
                WHERE TRIM(LOWER(nama_barang)) = TRIM(LOWER(?)) 
                  AND TRIM(LOWER(cabang_id)) = TRIM(LOWER(?)) 
                  AND BINARY ukuran = ?
            `;
            let findParams = [nama_barang.trim(), cabang_id.trim(), size.trim()];

            if (nama_brand && nama_brand.trim() !== '') {
                findSql += " AND TRIM(LOWER(nama_brand)) = TRIM(LOWER(?))";
                findParams.push(nama_brand.trim());
            } else {
                findSql += " AND (nama_brand IS NULL OR TRIM(nama_brand) = '')";
            }

            const [stockRows] = await promiseDb.query(findSql, findParams);

            if (stockRows.length === 0) {
                return res.status(400).json({ 
                    message: `Gagal! Barang "${nama_brand || ''} - ${nama_barang}" ukuran ${size} di cabang ${cabang_id} tidak terdaftar di stok.` 
                });
            }

            const stockItem = stockRows[0];
            if (stockItem.jumlah < qty) {
                return res.status(400).json({ 
                    message: `Gagal! Stok untuk "${nama_brand || ''} - ${nama_barang}" ukuran ${size} di cabang ${cabang_id} saat ini hanya ada ${stockItem.jumlah} Pcs, tidak mencukupi untuk mengeluarkan ${qty} Pcs.` 
                });
            }

            validatedItems.push({
                stok_id: stockItem.id,
                jumlah: qty
            });
        }

        // STEP 2: EKSEKUSI PENGURANGAN STOK DAN LOG TRANSAKSI
        for (const validated of validatedItems) {
            // 1. Log ke barang_keluar
            const sqlInsert = `
                INSERT INTO barang_keluar (transaksi_id, barang_id, jumlah, tanggal, tujuan) 
                VALUES (?, ?, ?, ?, ?)
            `;
            await promiseDb.query(sqlInsert, [transaksiId, validated.stok_id, validated.jumlah, tanggal, tujuan || null]);

            // 2. Potong jumlah stok
            const sqlUpdate = "UPDATE stok SET jumlah = jumlah - ? WHERE id = ?";
            await promiseDb.query(sqlUpdate, [validated.jumlah, validated.stok_id]);
        }

        res.status(201).json({ status: "success", message: "Barang keluar berhasil dicatat dan stok berkurang!" });
    } catch (error) {
        console.error("Error create barang_keluar:", error);
        res.status(500).json({ message: error.message });
    }
};
