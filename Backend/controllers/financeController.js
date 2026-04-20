const db = require('../config/db');

// Menerbitkan Tagihan (Invoice) baru berdasarkan PO
exports.buatInvoice = (req, res) => {
    const { id_po, total_tagihan } = req.body;

    if (!id_po || !total_tagihan) {
        return res.status(400).json({ message: "ID PO dan Total Tagihan wajib diisi!" });
    }

    const sql = `INSERT INTO invoice (id_po, total_tagihan) VALUES (?, ?)`;
    db.query(sql, [id_po, total_tagihan], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal membuat invoice: " + err.message });
        
        res.status(201).json({ 
            message: "Invoice berhasil diterbitkan!",
            id_invoice: result.insertId
        });
    });
};

// Melunasi Tagihan
exports.lunasiInvoice = (req, res) => {
    const { id_invoice } = req.params;
    
    // Format tanggal untuk MySQL (YYYY-MM-DD HH:MM:SS)
    const tanggal_bayar = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const sql = `UPDATE invoice SET status_bayar = 'Lunas', tanggal_bayar = ? WHERE id_invoice = ?`;
    db.query(sql, [tanggal_bayar, id_invoice], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal update pembayaran: " + err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Invoice tidak ditemukan." });

        res.json({ message: `Invoice #${id_invoice} berhasil dilunasi pada ${tanggal_bayar}` });
    });
};