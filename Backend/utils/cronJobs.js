const cron = require('node-cron');
const db = require('../config/db');

exports.startCronJobs = () => {
    // Skrip ini berjalan otomatis setiap hari pada jam 00:00
    cron.schedule('0 0 * * *', () => {
        console.log('[CRON] Memulai pemindaian barang Dead-Stock (>20 hari)...');
        
        const sql = `
            UPDATE produk 
            SET is_promo = 1 
            WHERE DATEDIFF(NOW(), tanggal_masuk) > 20 
            AND stok > 0 
            AND is_promo = 0
        `;
        
        db.query(sql, (err, result) => {
            if (err) {
                console.error('[CRON ERROR] Gagal update promo:', err.message);
            } else {
                console.log(`[CRON SUCCESS] ${result.affectedRows} barang otomatis diubah menjadi PROMO.`);
            }
        });
    });
};