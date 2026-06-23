const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

const HPP_DATA = {
  "Mekanik Honda 1 Set": 184900,
  "SET SERAGAM MEKANIK + Topi / Apron": 167900,
  "Mekanik Honda": 150900,
  "Baju Honda": 81934,
  "Celana Honda": 71000,
  "FLP Merah": 84043,
  "FLP Putih": 84043,
  "FLP Merah Cewek": 84043,
  "FLP Putih Cewek": 84043,
  "FLP Merah cewek LP": 89043,
  "FLP Putih Cewek LP": 89043,
  "Kepala Bengkel Honda": 80525,
  "Wearpack Yamaha": 146500,
  "Yamaha SA": 80525,
  "Indomaret": 82443,
  "Indomaret Cewek": 82443,
  "Alfamart": 82443,
  "Alfamart Cewek": 82443,
  "Mekanik Wulling": 77243,
  "Baju Wulling": 80943,
  "Celana Wulling": 71000,
  "Sales Wulling": 80943,
  "Mekanik Honda Mobil": 143500,
  "Baju Honda Mobil": 80000,
  "Celana Honda Mobil": 70000,
  "Wearpack Honda Mobil": 147500,
  "Wearpack Mitsubishi": 151000,
  "Sales Mitsubishi": 79043,
  "Mitsubishi Formen": 83043,
  "Wearpack Toyota": 146500,
  "Wearpack Daihatsu": 146500,
  "Wearpack Suzuki": 146500,
  "Wearpack Isuzu": 146500,
  "Wearpack Mazda": 146500,
  "Polo Security": 75000,
  "Polo Merah Honda": 75000,
  "Topi Honda Mobil": 17500,
  "Topi Merah Honda": 15000,
  "Topi": 17500,
  "Apron": 17500,
  "SPBU Merah": 145000,
  "Baju SPBU Merah": 80000,
  "Celana SPBU Merah": 70000,
  "Topi SPBU Merah": 17500,
  "SPBU Biru": 145000,
  "Baju SPBU Biru": 80000,
  "Celana SPBU Biru": 70000,
  "Topi SPBU Biru": 17500,
  "SPBU Hijau": 145000,
  "Baju SPBU Hijau": 80000,
  "Celana SPBU Hijau": 70000,
  "Topi SPBU Hijau": 17500,
  "SPBU Hitam": 145000,
  "Baju SPBU Hitam": 80000,
  "Celana SPBU Hitam": 70000,
  "Topi SPBU Hitam": 17500,
  "Sales Fuso": 78443,
  "Satpam PDL": 141000,
  "Satpam Safari": 150000,
  "Baju Satpam PDL": 75243,
  "Celana Satpam PDL": 64600,
  "Baju Satpam Safari": 85243,
  "Celana Satpam Safari": 64600,
  "Batik TK Biru": 42000,
  "Batik TK Hijau": 42000,
  "Seragam SD Cewek": 85274,
  "Baju SD Lengan Panjang": 37113,
  "Rok SD": 48161,
  "Seragam SD Cowok": 77396,
  "Baju SD Lengan Pendek": 29235,
  "Celana SD": 48161,
  "Topi SD": 5000,
  "Dasi SD": 4000,
  "Seragam Pramuka SD Cewek": 85274,
  "Baju Pramuka SD Lengan Panjang": 37113,
  "Rok Pramuka SD": 48161,
  "Seragam Pramuka SD Cowok": 77396,
  "Baju Pramuka SD Lengan Pendek": 29235,
  "Celana Pramuka SD": 48161,
  "Topi Pramuka SD": 5000,
  "Seragam SMP Cewek": 94574,
  "Baju SMP Lengan Panjang": 42013,
  "Rok SMP": 52561,
  "Topi SMP": 5000,
  "Dasi SMP": 4000,
  "Seragam Pramuka SMP Cewek": 94574,
  "Dasi SMA": 4000,
  "Baju SD Banjarmasin": 20000,
  "Sales Toyota": 80943
};

db.connect(async (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
  console.log("✅ Terhubung ke database untuk migrasi HPP...");

  const products = Object.keys(HPP_DATA);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const name of products) {
    const hpp = HPP_DATA[name];

    try {
      // 1. Cek apakah produk dengan nama_produk tersebut sudah ada
      const checkSql = "SELECT id, hpp_satuan FROM produk WHERE nama_produk = ?";
      const [rows] = await db.promise().query(checkSql, [name]);

      if (rows.length > 0) {
        // 2. Jika sudah ada, update hpp_satuan
        const updateSql = "UPDATE produk SET hpp_satuan = ? WHERE id = ?";
        await db.promise().query(updateSql, [hpp, rows[0].id]);
        updated++;
      } else {
        // 3. Jika belum ada, masukkan sebagai produk baru
        const insertSql = "INSERT INTO produk (nama_produk, hpp_satuan) VALUES (?, ?)";
        await db.promise().query(insertSql, [name, hpp]);
        inserted++;
      }
    } catch (dbErr) {
      console.error(`❌ Gagal memproses produk "${name}":`, dbErr.message);
      errors++;
    }
  }

  console.log("\n==========================================");
  console.log("📊 RINGKASAN MIGRASI DATABASE HPP:");
  console.log("==========================================");
  console.log(`✨ Produk Baru yang Ditambahkan: ${inserted}`);
  console.log(`🔄 Produk yang Di-update HPP-nya: ${updated}`);
  console.log(`❌ Produk Error: ${errors}`);
  console.log("==========================================");

  db.end(() => {
    console.log("👋 Koneksi database ditutup.");
  });
});
