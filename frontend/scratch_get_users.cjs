const mysql = require('mysql2');
require('dotenv').config({ path: 'd:\\TanakaManagementSystem\\backend\\.env' });

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.query("SELECT username, password, role, nama_lengkap FROM users", (err, results) => {
  if (err) {
    console.error("❌ Error querying users:", err.message);
  } else {
    console.log("👥 DATABASE USERS:");
    results.forEach(user => {
      console.log(`- Username: "${user.username}", Password: "${user.password}", Role: "${user.role}", Name: "${user.nama_lengkap}"`);
    });
  }
  db.end();
});
