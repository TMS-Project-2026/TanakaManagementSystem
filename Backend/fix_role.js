require('dotenv').config();
const db = require('./config/db');

async function fixEnum() {
    const promiseDb = db.promise();
    
    // Tambahkan marketing_online_tanaka ke ENUM
    const alterSQL = "ALTER TABLE users MODIFY COLUMN role ENUM('owner','admin_it','marketing_online','marketing_online_tanaka','marketing_offline','marketing_offline_tanaka','finance','gudang','produksi','marketing_accestret','gudang_accestret','produksi_accestret') NOT NULL";
    
    await promiseDb.query(alterSQL);
    console.log('ENUM column updated!');
    
    // Set role user
    const [r] = await promiseDb.query("UPDATE users SET role = 'marketing_online_tanaka' WHERE id_user = 17");
    console.log('Role set, changedRows:', r.changedRows);
    
    // Verifikasi
    const [check] = await promiseDb.query('SELECT username, role, password, status FROM users WHERE id_user = 17');
    console.log('Result:', JSON.stringify(check[0]));
    process.exit(0);
}

fixEnum().catch(e => { console.error('Error:', e.message); process.exit(1); });
