require('dotenv').config({ path: '../.env' });
const db = require('../config/db');

async function migrate() {
    try {
        const promiseDb = db.promise();
        console.log("Memulai migrasi data HPP historis...");
        const [result] = await promiseDb.query("UPDATE marketing_orders_online SET total_hpp_aktual = hpp WHERE type = 'online'");
        console.log(`Migrasi berhasil. Baris yang diubah: ${result.affectedRows}`);
    } catch (e) {
        console.error("Migrasi gagal:", e);
    } finally {
        process.exit(0);
    }
}
migrate();
