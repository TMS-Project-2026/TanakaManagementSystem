// Script: alter tabel stok, hapus data lama, isi ulang dari pricelist_online
// Jalankan: node reset_stok_from_pricelist.js
require('dotenv').config({ quiet: true });
const db = require('./config/db');

async function run() {
  const query = (sql, params = []) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => err ? reject(err) : resolve(result));
  });

  try {
    // 1. Tambah kolom baru ke tabel stok jika belum ada
    console.log('📌 Menambah kolom kode_produk dan bahan ke tabel stok...');
    await query(`ALTER TABLE stok ADD COLUMN IF NOT EXISTS kode_produk VARCHAR(20) NULL DEFAULT NULL AFTER id`).catch(() => {});
    await query(`ALTER TABLE stok ADD COLUMN IF NOT EXISTS bahan VARCHAR(100) NULL DEFAULT NULL AFTER nama_barang`).catch(() => {});
    console.log('✅ Kolom siap.');

    // 2. Hapus semua data stok lama
    console.log('🗑️  Menghapus semua data stok lama...');
    await query('DELETE FROM stok');
    await query('ALTER TABLE stok AUTO_INCREMENT = 1');
    console.log('✅ Data stok lama dihapus.');

    // 3. Ambil semua data dari pricelist_online
    console.log('📦 Mengambil data dari pricelist_online...');
    const pricelist = await query('SELECT * FROM pricelist_online ORDER BY grup_produk ASC, kode ASC');
    console.log(`   → ${pricelist.length} produk ditemukan.`);

    if (pricelist.length === 0) {
      console.error('❌ Tidak ada data di pricelist_online. Jalankan seed_pricelist_online.js dulu.');
      process.exit(1);
    }

    // 4. Insert ke stok — 1 baris per produk (jumlah 0, ukuran All Size, cabang Banua)
    const sql = `INSERT INTO stok 
      (kode_produk, nama_brand, nama_barang, bahan, jumlah, kategori, cabang_id, minimum_stok, kode_rak, ukuran, created_at)
      VALUES ?`;

    const values = pricelist.map(p => [
      p.kode,                          // kode_produk
      p.grup_produk,                   // nama_brand  (dipakai sebagai grup/brand)
      p.nama_produk,                   // nama_barang
      p.bahan || '-',                  // bahan
      0,                               // jumlah (0, nanti diisi saat barang masuk)
      p.jenis || 'Reguler',            // kategori (jenis produk)
      'Banua',                         // cabang_id default
      5,                               // minimum_stok
      null,                            // kode_rak
      'All Size',                      // ukuran
      new Date()
    ]);

    const result = await query(sql, [values]);
    console.log(`✅ ${result.affectedRows} item stok berhasil dimasukkan.`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
