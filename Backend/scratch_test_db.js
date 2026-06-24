require('dotenv').config();
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
console.log('DB_NAME:', process.env.DB_NAME);

const mysql = require('mysql2');
const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'tms_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi:', err.message);
    process.exit(1); 
  }
  console.log('✅ Berhasil!');
  process.exit(0);
});
