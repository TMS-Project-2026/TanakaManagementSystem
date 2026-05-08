const db = require('../config/db');

exports.getAllInvoice = (req, res) => {
    // Optional filtering
    const { status, cabang } = req.query;
    
    let sql = "SELECT * FROM invoice WHERE 1=1";
    const params = [];

    if (status) {
        sql += " AND status = ?";
        params.push(status);
    }
    if (cabang) {
        sql += " AND cabang = ?";
        params.push(cabang);
    }

    sql += " ORDER BY created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.getInvoiceById = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM invoice WHERE id = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) return res.status(404).json({ status: "error", message: "Invoice tidak ditemukan!" });
        res.status(200).json({ status: "success", data: results[0] });
    });
};

exports.createInvoice = (req, res) => {
    const {
        no_invoice,
        cabang,
        tanggal_transaksi,
        tanggal_terbit,
        tanggal_jatuh_tempo,
        nama_pt = '',
        alamat_pt = '',
        up_penagihan = '',
        cp_penagihan = '',
        email = '',
        deskripsi = '',
        detail_pekerjaan = '',
        items,
        qty = 1,
        harga_satuan = 0,
        subtotal = 0,
        ppn_persen = 0,
        jumlah_ppn = 0,
        grand_total = 0,
        keterangan = '',
        note = '',
        materai = 0,
        ttd = 0,
        nama_accounting = '',
        penanggung_jawab = '',
        jabatan = '',
        status = 'Draft'
    } = req.body;
    
    const generatedNoInvoice = (no_invoice && no_invoice.trim() !== '') ? no_invoice.trim() : null;

    const sql = `
        INSERT INTO invoice (
            no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo,
            nama_pt, alamat_pt, up_penagihan, cp_penagihan, email,
            deskripsi, detail_pekerjaan, items, qty, harga_satuan, subtotal, ppn_persen, jumlah_ppn, grand_total, keterangan,
            note, materai, ttd, nama_accounting, penanggung_jawab, jabatan, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        generatedNoInvoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo,
        nama_pt, alamat_pt, up_penagihan, cp_penagihan, email,
        deskripsi, detail_pekerjaan, items ? JSON.stringify(items) : null, qty || 1, harga_satuan || 0, subtotal || 0, ppn_persen || 0, jumlah_ppn || 0, grand_total || 0, keterangan,
        note, materai ? 1 : 0, ttd ? 1 : 0, nama_accounting, penanggung_jawab, jabatan, status || 'Draft'
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", message: "Invoice berhasil dibuat!", id: result.insertId });
    });
};

exports.updateInvoice = (req, res) => {
    const { id } = req.params;
    
    const fields = req.body;
    
    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ status: "error", message: "Data update kosong!" });
    }

    // Remove invalid columns
    delete fields.id;
    delete fields.Diskon;
    delete fields.created_at;
    delete fields.updated_at;

    let setClause = [];
    let values = [];

    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === null) continue; // skip empty fields
        setClause.push(`${key} = ?`);
        if (key === 'items' && typeof value === 'object') {
            // Ensure items are stored as JSON string
            values.push(JSON.stringify(value));
        } else {
            values.push(value);
        }
    }
    values.push(id);

    const sql = `UPDATE invoice SET ${setClause.join(', ')} WHERE id = ?`;

    db.query(sql, values, async (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ status: "error", message: "Invoice tidak ditemukan!" });

        // JEMBATAN KE GUDANG DAN PRODUKSI
        // Jika status invoice diupdate menjadi 'Terbit' atau 'Lunas', potong stok.
        if (fields.status === 'Terbit' || fields.status === 'Lunas') {
            try {
                // Ambil items dari invoice ini
                const [invRows] = await db.promise().query("SELECT items, cabang FROM invoice WHERE id = ?", [id]);
                if (invRows.length > 0) {
                    const invoiceData = invRows[0];
                    let itemsArray = [];
                    if (typeof invoiceData.items === 'string') {
                        try { itemsArray = JSON.parse(invoiceData.items); } catch(e) {}
                    } else if (Array.isArray(invoiceData.items)) {
                        itemsArray = invoiceData.items;
                    }

                    // Loop items untuk potong stok
                    for (const item of itemsArray) {
                        const nama_barang = item.rincian || item.description || item.nama_barang;
                        const qty = parseInt(item.qty) || 1;

                        if (nama_barang) {
                            // Cek stok saat ini
                            const [stokRows] = await db.promise().query("SELECT * FROM stok WHERE nama_barang = ?", [nama_barang]);
                            if (stokRows.length > 0) {
                                const stokData = stokRows[0];
                                const currentStock = stokData.jumlah;
                                const minStock = stokData.minimum_stok || 10;
                                const newStock = Math.max(0, currentStock - qty);
                                
                                // Update tabel stok
                                await db.promise().query("UPDATE stok SET jumlah = ? WHERE id = ?", [newStock, stokData.id]);

                                // Jika stok setelah dipotong kurang dari minimum stok, atau habis, buat request produksi
                                if (newStock <= minStock) {
                                    const qtyRequest = Math.max(minStock * 2, 50); // Contoh: minta produksi 2x min stok atau 50
                                    // Cek apakah sudah ada request produksi pending untuk barang ini di produksi_order
                                    const [reqRows] = await db.promise().query("SELECT * FROM produksi_order WHERE nama_produk = ? AND status IN ('antre', 'diproses', 'jahit')", [nama_barang]);
                                    if (reqRows.length === 0) {
                                        const kode_order = `PROD-${Date.now()}`;
                                        await db.promise().query(
                                            "INSERT INTO produksi_order (kode_order, nama_customer, nama_produk, qty, deadline, prioritas, status, catatan, created_by) VALUES (?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'urgent', 'antre', 'Auto-generated karena stok menipis (Invoice Terbit)', 'System')",
                                            [kode_order, 'Internal (Stok Habis)', nama_barang, qtyRequest]
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (errStock) {
                console.error("Gagal potong stok atau buat jadwal produksi:", errStock);
                // Tidak me-return error karena invoice sudah berhasil diupdate
            }
        }

        res.status(200).json({ status: "success", message: "Invoice berhasil diperbarui!" });
    });
};

exports.deleteInvoice = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM invoice WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ status: "error", message: "Invoice tidak ditemukan!" });
        res.status(200).json({ status: "success", message: "Invoice berhasil dihapus!" });
    });
};
