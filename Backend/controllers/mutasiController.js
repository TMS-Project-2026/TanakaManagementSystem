const db = require('../config/db');

exports.catatMutasi = (req, res) => {
    // Menangkap data yang dikirim dari Frontend / Postman
    const { id_produk, jumlah, tipe, asal_cabang, tujuan_cabang, keterangan } = req.body;

    if (!id_produk || !jumlah || !tipe) {
        return res.status(400).json({ message: "Data mutasi (id_produk, jumlah, tipe) tidak lengkap!" });
    }

    // Langkah 1: Catat riwayat pergerakan barang di tabel mutasi_stok
    const sqlMutasi = `INSERT INTO mutasi_stok 
                      (id_produk, jumlah, tipe, asal_cabang, tujuan_cabang, keterangan) 
                      VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(sqlMutasi, [id_produk, jumlah, tipe, asal_cabang, tujuan_cabang, keterangan], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal mencatat mutasi: " + err.message });

        // Langkah 2: Update stok otomatis di tabel produk (Sistem Cerdas)
        let sqlUpdateStok = "";
        
        // Jika barang Masuk, stok ditambah. Jika Keluar/Transfer, stok dikurangi.
        if (tipe === 'Masuk') {
            sqlUpdateStok = "UPDATE produk SET stok = stok + ? WHERE id_produk = ?";
        } else if (tipe === 'Keluar' || tipe === 'Transfer') {
            sqlUpdateStok = "UPDATE produk SET stok = stok - ? WHERE id_produk = ?";
        }

        db.query(sqlUpdateStok, [jumlah, id_produk], (err2, result2) => {
            if (err2) return res.status(500).json({ message: "Gagal update stok produk: " + err2.message });
            
            res.status(201).json({ 
                message: `Mutasi dengan tipe '${tipe}' berhasil dicatat dan stok Gudang otomatis diperbarui!` 
            });
        });
    });
};