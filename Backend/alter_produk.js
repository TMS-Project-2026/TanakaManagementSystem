const db = require('./config/db');

const query = "ALTER TABLE produk ADD COLUMN kategori VARCHAR(100) DEFAULT 'Lainnya' AFTER nama;";

db.query(query, (err, results) => {
    if (err) {
        console.error("Error altering table:", err);
        process.exit(1);
    }
    console.log("Table altered successfully:", results);
    process.exit(0);
});
