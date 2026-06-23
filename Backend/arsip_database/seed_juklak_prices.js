const db = require('./config/db');

// =============================================
// Mapping dari produk LAMA (id 1-89) ke harga juklak
// Berdasarkan kecocokan nama produk
// =============================================
const priceUpdates = [
  // --- Honda Motor ---
  { id: 1,  nama: 'Mekanik Honda 1 Set',             mgr: 197419.69, spv: 205316.48, jual: 221110.05 }, // = Seragam Mekanik Honda
  { id: 2,  nama: 'SET SERAGAM MEKANIK + Topi / Apron', mgr: 197419.69, spv: 205316.48, jual: 221110.05 }, // = Seragam Mekanik Honda
  { id: 3,  nama: 'Mekanik Honda',                   mgr: 197419.69, spv: 205316.48, jual: 221110.05 }, // = Seragam Mekanik Honda
  { id: 4,  nama: 'Baju Honda',                      mgr: 114067.50, spv: 118630.20, jual: 127755.60 }, // = Baju Mekanik H
  { id: 5,  nama: 'Celana Honda',                    mgr: 91401.16,  spv: 95057.21,  jual: 102369.30 }, // = Celana Mekanik H
  { id: 6,  nama: 'FLP Merah',                       mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // = FLP Merah H
  { id: 7,  nama: 'FLP Putih',                       mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // = FLP Putih H
  { id: 8,  nama: 'FLP Merah Cewek',                 mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // = FLP Merah Cewek H
  { id: 9,  nama: 'FLP Putih Cewek',                 mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // = FLP Putih Cewek H
  { id: 10, nama: 'FLP Merah cewek LP',              mgr: 126037.77, spv: 131079.28, jual: 141162.30 }, // = FLP Merah Panjang Cewek
  { id: 11, nama: 'FLP Putih Cewek LP',              mgr: 126037.77, spv: 131079.28, jual: 141162.30 }, // = FLP Putih Panjang Cewek
  { id: 12, nama: 'Kepala Bengkel Honda',             mgr: 197419.69, spv: 205316.48, jual: 221110.05 }, // = Seragam Mekanik Honda (Kepala Bengkel)

  // --- Yamaha ---
  // id 13 = Wearpack Yamaha - sudah ada harga
  { id: 14, nama: 'Yamaha SA',                       mgr: 117728.57, spv: 122437.71, jual: 131856.00 }, // = Baju SA Yamaha

  // --- Indomaret ---
  { id: 15, nama: 'Indomaret',                       mgr: 114803.30, spv: 119395.44, jual: 128579.70 }, // = Kemeja Indomaret Cowok
  { id: 16, nama: 'Indomaret Cewek',                 mgr: 114803.30, spv: 119395.44, jual: 128579.70 }, // = Kemeja Indomaret Cewek

  // --- Alfamart ---
  { id: 17, nama: 'Alfamart',                        mgr: 114803.30, spv: 119395.44, jual: 128579.70 }, // = Kemeja Alfamart Cowok
  { id: 18, nama: 'Alfamart Cewek',                  mgr: 114803.30, spv: 119395.44, jual: 128579.70 }, // = Kemeja Alfamart Cewek

  // --- Wuling (dalam juklak tertulis sebagai Honda Mobil) ---
  { id: 19, nama: 'Mekanik Wulling',                 mgr: 202920.27, spv: 211037.08, jual: 227270.70 }, // = Mekanik Honda Mobil New
  { id: 20, nama: 'Baju Wulling',                    mgr: 114067.50, spv: 118630.20, jual: 127755.60 }, // = Baju Mekanik Honda Mobil
  { id: 21, nama: 'Celana Wulling',                  mgr: 91401.16,  spv: 95057.21,  jual: 102369.30 }, // = Celana Mekanik Honda Mobil
  { id: 22, nama: 'Sales Wulling',                   mgr: 112016.89, spv: 116497.57, jual: 125458.92 }, // = Service Advisor (SA)

  // --- Honda Mobil ---
  { id: 23, nama: 'Mekanik Honda Mobil',             mgr: 202920.27, spv: 211037.08, jual: 227270.70 }, // = Mekanik Honda Mobil New
  { id: 24, nama: 'Baju Honda Mobil',                mgr: 114067.50, spv: 118630.20, jual: 127755.60 }, // = Baju Mekanik Honda Mobil
  { id: 25, nama: 'Celana Honda Mobil',              mgr: 91401.16,  spv: 95057.21,  jual: 102369.30 }, // = Celana Mekanik Honda Mobil
  { id: 26, nama: 'Wearpack Honda Mobil',            mgr: 191497.37, spv: 199157.26, jual: 214477.05 }, // = Wearpack Honda

  // --- Mitsubishi ---
  // id 27 = Wearpack Mitsubishi - sudah ada harga
  { id: 28, nama: 'Sales Mitsubishi',                mgr: 109885.98, spv: 114281.42, jual: 123072.30 }, // = Sales Mitsubishi Cowok
  { id: 29, nama: 'Mitsubishi Formen',               mgr: 115664.73, spv: 120291.32, jual: 129544.50 }, // = Baju Foreman

  // --- Toyota ---
  // id 30 = Wearpack Toyota - sudah ada harga
  { id: 31, nama: 'Wearpack Daihatsu',               mgr: 185637.86, spv: 193063.37, jual: 207914.40 }, // = pakai harga Wearpack Toyota (mirip)
  
  // --- Suzuki ---
  { id: 32, nama: 'Wearpack Suzuki',                 mgr: 218838.75, spv: 227592.30, jual: 245099.40 }, // = Wearpack Suzuki Mobil

  // --- Isuzu, Mazda sudah ada harga (id 33, 34) ---

  // --- Polo/Security ---
  { id: 35, nama: 'Polo Security',                   mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // estimasi = FLP level
  { id: 36, nama: 'Polo Merah Honda',                mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // = FLP Merah H

  // --- Topi & Aksesoris Honda ---
  // id 37 = Topi Honda Mobil - sudah ada harga
  { id: 38, nama: 'Topi Merah Honda',                mgr: 21984.38, spv: 22863.75, jual: 24622.50 }, // = Topi Honda Merah
  { id: 39, nama: 'Topi',                            mgr: 21984.38, spv: 22863.75, jual: 24622.50 }, // = Topi Honda Putih
  { id: 40, nama: 'Apron',                           mgr: 21984.38, spv: 22863.75, jual: 24622.50 }, // = Apron Honda

  // --- Pertamina / SPBU ---
  { id: 41, nama: 'SPBU Merah',                      mgr: 198596.97, spv: 206540.85, jual: 222428.61 }, // = Pertamina Operator (Merah)
  { id: 42, nama: 'Baju SPBU Merah',                 mgr: 104394.38, spv: 108570.15, jual: 116921.70 }, // = Baju Pertamina Operator
  { id: 43, nama: 'Celana SPBU Merah',               mgr: 91903.66,  spv: 95579.81,  jual: 102932.10 }, // = Celana Pertamina Operator
  { id: 44, nama: 'Topi SPBU Merah',                 mgr: 21984.38,  spv: 22863.75,  jual: 24622.50 }, // = Topi Pertamina
  { id: 45, nama: 'SPBU Biru',                       mgr: 198596.97, spv: 206540.85, jual: 222428.61 }, // = Pertamina Teknisi (Biru)
  { id: 46, nama: 'Baju SPBU Biru',                  mgr: 104394.38, spv: 108570.15, jual: 116921.70 }, // = Baju Pertamina Teknisi
  { id: 47, nama: 'Celana SPBU Biru',                mgr: 91903.66,  spv: 95579.81,  jual: 102932.10 }, // = Celana Pertamina Teknisi
  { id: 48, nama: 'Topi SPBU Biru',                  mgr: 21984.38,  spv: 22863.75,  jual: 24622.50 }, // = Topi Pertamina
  { id: 49, nama: 'SPBU Hijau',                      mgr: 198596.97, spv: 206540.85, jual: 222428.61 }, // = Pertamina OB (Hijau)
  { id: 50, nama: 'Baju SPBU Hijau',                 mgr: 104394.38, spv: 108570.15, jual: 116921.70 }, // = Baju Pertamina OB
  { id: 51, nama: 'Celana SPBU Hijau',               mgr: 91903.66,  spv: 95579.81,  jual: 102932.10 }, // = Celana Pertamina OB
  { id: 52, nama: 'Topi SPBU Hijau',                 mgr: 21984.38,  spv: 22863.75,  jual: 24622.50 }, // = Topi Pertamina
  { id: 53, nama: 'SPBU Hitam',                      mgr: 198596.97, spv: 206540.85, jual: 222428.61 }, // = Pertamina Supervisor (Hitam)
  { id: 54, nama: 'Baju SPBU Hitam',                 mgr: 104394.38, spv: 108570.15, jual: 116921.70 }, // = Baju Pertamina Supervisor
  { id: 55, nama: 'Celana SPBU Hitam',               mgr: 91903.66,  spv: 95579.81,  jual: 102932.10 }, // = Celana Pertamina Supervisor
  { id: 56, nama: 'Topi SPBU Hitam',                 mgr: 21984.38,  spv: 22863.75,  jual: 24622.50 }, // = Topi Pertamina

  // --- Fuso ---
  { id: 57, nama: 'Sales Fuso',                      mgr: 109024.55, spv: 113385.54, jual: 122107.50 }, // = Sales Fuso Cowok

  // --- Satpam ---
  { id: 58, nama: 'Satpam PDL',                      mgr: 199366.88, spv: 207341.55, jual: 223290.90 }, // = PDL/Kuning
  { id: 59, nama: 'Satpam Safari',                   mgr: 212324.20, spv: 220817.16, jual: 237803.10 }, // = Safari/Hitam
  { id: 60, nama: 'Baju Satpam PDL',                 mgr: 104394.38, spv: 108570.15, jual: 116921.70 }, // = Baju PDL
  { id: 61, nama: 'Celana Satpam PDL',               mgr: 89014.29,  spv: 92574.86,  jual: 99696.00 },  // = Celana PDL
  { id: 62, nama: 'Baju Satpam Safari',              mgr: 118823.30, spv: 123576.24, jual: 133082.10 }, // = Baju Safari
  { id: 63, nama: 'Celana Satpam Safari',            mgr: 89014.29,  spv: 92574.86,  jual: 99696.00 },  // = Celana Safari

  // --- Sales Toyota ---
  { id: 89, nama: 'sales toyota',                    mgr: 117082.50, spv: 121765.80, jual: 131132.40 }, // = Sales Toyota Merah
];

// Produk sekolah (id 64-88) tidak ada di juklak, jadi tetap 0

const updatePrices = async () => {
  let updated = 0;
  let errors = 0;

  console.log('🚀 Mulai update harga produk dari Juklak 2026...\n');

  for (const p of priceUpdates) {
    await new Promise((resolve) => {
      const sql = `UPDATE produk SET harga_manager = ?, harga_spv = ?, harga_jual = ? WHERE id = ?`;
      db.query(sql, [p.mgr, p.spv, p.jual, p.id], (err, result) => {
        if (err) {
          console.error(`❌ Error updating id ${p.id} (${p.nama}):`, err.message);
          errors++;
        } else if (result.affectedRows > 0) {
          console.log(`✅ Updated id ${p.id}: ${p.nama} → Mgr: ${p.mgr}, SPV: ${p.spv}, Jual: ${p.jual}`);
          updated++;
        } else {
          console.log(`⚠️  No match for id ${p.id}: ${p.nama}`);
        }
        resolve();
      });
    });
  }

  console.log(`\n========================================`);
  console.log(`✅ Total updated: ${updated}`);
  console.log(`❌ Total errors: ${errors}`);
  console.log(`⚠️  Produk sekolah (id 64-88) tidak termasuk dalam juklak`);
  console.log(`========================================`);

  // Verify: show all products with their prices
  await new Promise((resolve) => {
    db.query(
      'SELECT id, nama_produk, harga_manager, harga_spv, harga_jual FROM produk ORDER BY id',
      (err, rows) => {
        if (err) {
          console.error('Error verifying:', err.message);
        } else {
          console.log('\n📋 DAFTAR SEMUA PRODUK DENGAN HARGA:\n');
          const withPrice = rows.filter(r => parseFloat(r.harga_manager) > 0);
          const noPrice = rows.filter(r => parseFloat(r.harga_manager) === 0);
          console.log(`Produk dengan harga: ${withPrice.length}`);
          console.log(`Produk tanpa harga: ${noPrice.length}`);
          if (noPrice.length > 0) {
            console.log('\nProduk tanpa harga (belum ada di juklak):');
            noPrice.forEach(r => console.log(`  - id ${r.id}: ${r.nama_produk}`));
          }
        }
        resolve();
      }
    );
  });

  process.exit(0);
};

updatePrices();
