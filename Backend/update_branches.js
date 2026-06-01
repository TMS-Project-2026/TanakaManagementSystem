const db = require('./config/db');

async function updateAllToBanua() {
    try {
        const promiseDb = db.promise();
        console.log("Updating stok to Banua...");
        const [resStok] = await promiseDb.query("UPDATE stok SET cabang_id = 'Banua' WHERE cabang_id != 'Banua'");
        console.log("Updated stok rows:", resStok.affectedRows);
        
        // Also update barang_masuk if it had cabang_id (it doesn't, barang_masuk links to stok which has cabang_id)
        
        console.log("Done.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

updateAllToBanua();
