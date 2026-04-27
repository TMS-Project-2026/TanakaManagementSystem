const db = require('../config/db');

exports.getJadwal = async (req, res) => {
    try {
        // Gabungkan order yang sedang diproses dan tugas-tugas tim
        const [orders] = await db.promise().query("SELECT id, kode_order, nama_produk, deadline, prioritas, status FROM produksi_order WHERE status != 'selesai' ORDER BY deadline ASC");
        const [assignments] = await db.promise().query("SELECT a.nama_tim, a.target_selesai, o.kode_order, o.nama_produk FROM produksi_assign a JOIN produksi_order o ON a.order_id = o.id WHERE o.status != 'selesai'");

        res.status(200).json({
            status: "success",
            data: {
                orders,
                assignments
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
