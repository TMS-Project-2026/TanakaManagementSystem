const db = require('../config/db');

// 1. READ: Mengambil daftar promo yang sedang berjalan (Dipanggil saat web Promo dimuat)
exports.getPromoAktif = (req, res) => {
    // Memanggil dari tabel promo_aktif sesuai database
    const sql = "SELECT * FROM promo_aktif ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

// 2. CREATE: Menyimpan promo baru dari form React
exports.aktifkanPromo = (req, res) => {
    // Variabel INI HARUS SAMA dengan state formData di React!
    const { produk, harga_awal, diskon, harga_promo, status } = req.body;

    // Validasi pencegahan error database
    if (!produk || harga_awal === '' || harga_awal === undefined || diskon === '' || diskon === undefined || !harga_promo) {
        return res.status(400).json({ message: "Semua data wajib diisi dengan benar!" });
    }

    const sql = `INSERT INTO promo_aktif (nama_produk, harga_awal, diskon_persen, harga_promo, status, tanggal_diaktifkan) VALUES (?, ?, ?, ?, ?, CURDATE())`;

    // Pastikan urutan array sama dengan tanda tanya (?)
    db.query(sql, [produk, harga_awal, diskon, harga_promo, status || 'Aktif'], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Promo diaktifkan!" });
    });
};

// 3. DELETE: Menghapus promo (Fitur tombol tong sampah di React)
exports.hapusPromo = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM promo_aktif WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Promo berhasil dihapus." });
    });
};

// ==========================================
// FITUR PINTAR (Saran dari kodemu sebelumnya)
// ==========================================

// Mengambil barang yang sudah mengendap > 90 hari (Bisa dipakai untuk auto-suggest di React nanti)
exports.getRekomendasi = (req, res) => {
    const sql = `
        SELECT id, nama_produk, stok, harga_jual, tanggal_masuk,
        DATEDIFF(CURDATE(), tanggal_masuk) as lama_mengendap
        FROM produk
        WHERE DATEDIFF(CURDATE(), tanggal_masuk) > 90 AND stok > 0
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};