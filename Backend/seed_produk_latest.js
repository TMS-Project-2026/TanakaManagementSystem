const db = require('./config/db');

const products = [
  // Honda Motor
  { kode: 'HM001', kategori: 'PDH', produk: 'FLP Merah Cowok', bahan: 'UNIONE', sm: 128800, spv: 135000, offline: 140500 },
  { kode: 'HM002', kategori: 'PDH', produk: 'FLP Putih Cowok', bahan: 'UNIONE', sm: 128800, spv: 135000, offline: 140500 },
  { kode: 'HM003', kategori: 'PDH', produk: 'FLP Merah Cewek', bahan: 'UNIONE', sm: 129000, spv: 135000, offline: 141000 },
  { kode: 'HM004', kategori: 'PDH', produk: 'FLP Putih Cewek', bahan: 'UNIONE', sm: 129000, spv: 135000, offline: 141000 },
  { kode: 'HM005', kategori: 'PDH', produk: 'FLP Merah Panjang Cewek', bahan: 'UNIONE', sm: 138800, spv: 145000, offline: 151500 },
  { kode: 'HM006', kategori: 'PDH', produk: 'FLP Putih Panjang Cewek', bahan: 'UNIONE', sm: 138800, spv: 145000, offline: 151500 },
  { kode: 'HM007', kategori: 'PDH', produk: 'Baju Celana Mekanik Honda', bahan: 'UNIONE', sm: 217500, spv: 227000, offline: 240000 },
  { kode: 'HM008', kategori: 'PDH', produk: 'Baju Mekanik Honda', bahan: 'UNIONE', sm: 125500, spv: 131500, offline: 137000 },
  { kode: 'HM009', kategori: 'Celana', produk: 'Celana Mekanik Honda', bahan: 'UNIONE', sm: 101000, spv: 105000, offline: 110000 },
  { kode: 'HM010', kategori: 'Topi', produk: 'Topi Honda Putih', bahan: '', sm: 24300, spv: 25500, offline: 27000 },
  { kode: 'HM011', kategori: 'Topi', produk: 'Topi Honda Merah', bahan: '', sm: 24300, spv: 25500, offline: 27000 },
  { kode: 'HM012', kategori: 'Apron', produk: 'Apron Honda', bahan: '', sm: 24300, spv: 25500, offline: 27000 },
  { kode: 'HM013', kategori: 'Full Set', produk: 'Baju Celana Mekanik Honda (Include Topi & Apron)', bahan: 'UNIONE', sm: 250000, spv: 260000, offline: 270000 },
  { kode: 'HM014', kategori: 'PDH', produk: 'Polo Merah Honda', bahan: 'PIQUE', sm: 107000, spv: 112000, offline: 115000 },
  { kode: 'HM015', kategori: 'PDH', produk: 'HRC Hitam Honda', bahan: 'UNIONE', sm: 128800, spv: 135000, offline: 140500 },
  { kode: 'HM016', kategori: 'PDH', produk: 'HRC Putih Honda', bahan: 'UNIONE', sm: 128800, spv: 135000, offline: 140500 },
  { kode: 'HM017', kategori: 'PDH', produk: 'HRC Navy Honda', bahan: 'UNIONE', sm: 128800, spv: 135000, offline: 140500 },

  // Yamaha Motor
  { kode: 'YM001', kategori: 'Wearpack', produk: 'Wearpack Yamaha', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },
  { kode: 'YM004', kategori: 'PDH', produk: 'Baju Service Advisor Yamaha', bahan: 'UNIONE', sm: 130000, spv: 135500, offline: 141500 },

  // Honda Mobil
  { kode: 'HMM001', kategori: 'Wearpack', produk: 'Wearpack Honda Mobil', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },
  { kode: 'HMM004', kategori: 'PDL', produk: 'Baju Honda Mobil', bahan: 'UNIONE', sm: 129000, spv: 135000, offline: 141000 },
  { kode: 'HMM005', kategori: 'Celana', produk: 'Celana Honda Mobil', bahan: 'UNIONE', sm: 101000, spv: 105000, offline: 110000 },
  { kode: 'HMM006', kategori: 'PDL', produk: 'Baju Celana Honda Mobil', bahan: 'UNIONE', sm: 217500, spv: 227000, offline: 240000 },
  { kode: 'HMM007', kategori: 'PDL', produk: 'Baju Service Advisor (SA) Mobil', bahan: 'UNIONE', sm: 130000, spv: 135500, offline: 141500 },
  { kode: 'HMM009', kategori: 'Topi', produk: 'Topi Honda Mobil', bahan: 'UNIONE', sm: 27500, spv: 30000, offline: 35000 },

  // Mitsubishi Mobil
  { kode: 'MHM001', kategori: 'Wearpack', produk: 'Wearpack Mitsubishi Mobil', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },
  { kode: 'MHM004', kategori: 'PDH', produk: 'Baju Foreman Mitsubishi Mobil', bahan: 'UNIONE', sm: 127000, spv: 133500, offline: 139500 },
  { kode: 'MHM005', kategori: 'PDH', produk: 'Baju Service Advisor Mitsubishi Mobil', bahan: 'UNIONE', sm: 122500, spv: 128500, offline: 134500 },
  { kode: 'MHM006', kategori: 'PDH', produk: 'Baju Sales Mitsubishi Mobil Cowok', bahan: 'UNIONE', sm: 121000, spv: 126500, offline: 132500 },
  { kode: 'MHM007', kategori: 'PDH', produk: 'Baju Sales Mitsubishi Mobil Cewek', bahan: 'UNIONE', sm: 121000, spv: 126500, offline: 132500 },
  { kode: 'MHM008', kategori: 'PDH', produk: 'Baju Sales Fuso Mitsubishi Cowok', bahan: 'UNIONE', sm: 121000, spv: 126500, offline: 132500 },
  { kode: 'MHM009', kategori: 'PDH', produk: 'Baju Sales Fuso Mitsubishi Cewek', bahan: 'UNIONE', sm: 121000, spv: 126500, offline: 132500 },

  // Toyota Mobil
  { kode: 'TM001', kategori: 'Wearpack', produk: 'Wearpack Toyota', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },
  { kode: 'TM004', kategori: 'PDH', produk: 'Sales Toyota Merah', bahan: 'UNIONE', sm: 128800, spv: 134800, offline: 140000 },
  { kode: 'TM005', kategori: 'PDH', produk: 'Sales Toyota Biru', bahan: 'UNIONE', sm: 128800, spv: 134800, offline: 140000 },

  // Suzuki Mobil
  { kode: 'SM001', kategori: 'Wearpack', produk: 'Wearpack Suzuki Mobil Hijau', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },
  { kode: 'SM004', kategori: 'Wearpack', produk: 'Wearpack Suzuki Mobil Biru', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },

  // Isuzu Mobil
  { kode: 'IM001', kategori: 'Wearpack', produk: 'Wearpack Isuzu Mobil', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },

  // Hyundai Mobil
  { kode: 'HYM001', kategori: 'PDL', produk: 'Baju Celana Hyundai Biru Muda', bahan: 'UNIONE', sm: 217500, spv: 228000, offline: 245000 },
  { kode: 'HYM002', kategori: 'PDL', produk: 'Baju Hyundai Biru Muda', bahan: 'UNIONE', sm: 127000, spv: 133500, offline: 139500 },
  { kode: 'HYM003', kategori: 'Celana', produk: 'Celana Hyundai Biru Muda', bahan: 'UNIONE', sm: 101000, spv: 105000, offline: 110000 },
  { kode: 'HYM004', kategori: 'PDL', produk: 'Baju Celana Hyundai Biru Tua', bahan: 'UNIONE', sm: 217500, spv: 228000, offline: 245000 },
  { kode: 'HYM005', kategori: 'PDL', produk: 'Baju Hyundai Biru Tua', bahan: 'UNIONE', sm: 127000, spv: 133500, offline: 139500 },
  { kode: 'HYM006', kategori: 'Celana', produk: 'Celana Hyundai Biru Tua', bahan: 'UNIONE', sm: 101000, spv: 105000, offline: 110000 },

  // Wuling Mobil
  { kode: 'WM001', kategori: 'Wearpack', produk: 'Wearpack Wuling', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },
  { kode: 'WM004', kategori: 'PDL', produk: 'Baju Celana Wuling', bahan: 'UNIONE', sm: 223500, spv: 233500, offline: 245500 },
  { kode: 'WM005', kategori: 'PDL', produk: 'Baju Wuling', bahan: 'UNIONE', sm: 125500, spv: 131500, offline: 137000 },
  { kode: 'WM006', kategori: 'PDH', produk: 'Baju Sales Wuling Cewek', bahan: 'UNIONE', sm: 125500, spv: 131500, offline: 137000 },
  { kode: 'WM007', kategori: 'PDH', produk: 'Baju Sales Wuling Cowok', bahan: 'UNIONE', sm: 125500, spv: 131500, offline: 137000 },
  { kode: 'WM008', kategori: 'Celana', produk: 'Celana Wuling', bahan: 'UNIONE', sm: 100500, spv: 105200, offline: 110000 },
  { kode: 'WM009', kategori: 'PDH', produk: 'Baju Service Advisor Wuling', bahan: 'UNIONE', sm: 123500, spv: 129000, offline: 135000 },
  { kode: 'WM010', kategori: 'PDL', produk: 'Baju Celana Partman Wuling', bahan: 'UNIONE', sm: 223500, spv: 233500, offline: 245500 },
  { kode: 'WM011', kategori: 'PDL', produk: 'Baju Partman Wuling', bahan: 'UNIONE', sm: 128000, spv: 134000, offline: 140000 },
  { kode: 'WM012', kategori: 'Celana', produk: 'Celana Partman Wuling', bahan: 'UNIONE', sm: 100500, spv: 105200, offline: 110000 },
  { kode: 'WM013', kategori: 'Topi', produk: 'Topi Wuling', bahan: '', sm: 24300, spv: 25500, offline: 27000 },

  // Mazda Mobil
  { kode: 'MM001', kategori: 'Wearpack', produk: 'Wearpack Mazda', bahan: 'UNIONE', sm: 237500, spv: 257000, offline: 278000 },

  // Alfamart
  { kode: 'AM001', kategori: 'Kemeja', produk: 'Kemeja Alfamart Cowok', bahan: 'UNIONE', sm: 126500, spv: 132000, offline: 138000 },
  { kode: 'AM002', kategori: 'Kemeja', produk: 'Kemeja Alfamart Cewek', bahan: 'UNIONE', sm: 126500, spv: 132000, offline: 138000 },

  // Indomaret
  { kode: 'IDM001', kategori: 'Kemeja', produk: 'Kemeja Indomaret Cowok', bahan: 'UNIONE', sm: 126500, spv: 132000, offline: 138000 },
  { kode: 'IDM002', kategori: 'Kemeja', produk: 'Kemeja Indomaret Cewek', bahan: 'UNIONE', sm: 126500, spv: 132000, offline: 138000 },

  // Satpam
  { kode: 'SP001', kategori: 'PDH', produk: 'Baju Celana Safari Hitam', bahan: 'UNIONE', sm: 234800, spv: 245500, offline: 254800 },
  { kode: 'SP002', kategori: 'PDH', produk: 'Baju Safari Hitam', bahan: 'UNIONE', sm: 131000, spv: 137000, offline: 143000 },
  { kode: 'SP003', kategori: 'Celana', produk: 'Celana Safari Hitam', bahan: 'UNIONE', sm: 98000, spv: 102500, offline: 118000 },
  { kode: 'SP004', kategori: 'PDL', produk: 'Baju Celana Satpam PDL Kuning', bahan: 'UNIONE', sm: 219500, spv: 137500, offline: 220000 }, // Wait, SPV 137500 and SM 219500?? Checked prompt: Rp219.500 | Rp137.500 | Rp220.000. It's an error in prompt but I'll write what's given.
  { kode: 'SP005', kategori: 'PDL', produk: 'Baju Satpam PDL Kuning', bahan: 'UNIONE', sm: 115000, spv: 120000, offline: 125500 },
  { kode: 'SP006', kategori: 'Celana', produk: 'Celana PDL Kuning', bahan: 'UNIONE', sm: 98000, spv: 102500, offline: 107000 },
  { kode: 'SP007', kategori: 'Polo', produk: 'Polo Satpam', bahan: 'PIQUE', sm: 107000, spv: 112000, offline: 120000 },

  // Seragam RS
  { kode: 'SRS001', kategori: 'Seragam RS', produk: 'Baju Celana OKK SRS', bahan: 'UNIONE', sm: 205000, spv: 215000, offline: 220000 },
  { kode: 'SRS002', kategori: 'Seragam RS', produk: 'Baju OKK SRS', bahan: 'UNIONE', sm: 115000, spv: 120000, offline: 125500 },
  { kode: 'SRS003', kategori: 'Celana', produk: 'Celana OKK SRS', bahan: 'UNIONE', sm: 98000, spv: 102500, offline: 107000 },

  // Pertamina
  { kode: 'PTA001', kategori: 'PDL', produk: 'Baju Celana Operator Merah', bahan: 'UNIONE', sm: 218500, spv: 226000, offline: 236000 },
  { kode: 'PTA002', kategori: 'PDL', produk: 'Baju Pertamina Operator', bahan: 'UNIONE', sm: 115000, spv: 120000, offline: 125500 },
  { kode: 'PTA003', kategori: 'Celana', produk: 'Celana Pertamina Operator', bahan: 'UNIONE', sm: 101000, spv: 106000, offline: 110500 },
  { kode: 'PTA004', kategori: 'PDL', produk: 'Pertamina Teknisi Biru', bahan: 'UNIONE', sm: 218500, spv: 226000, offline: 236000 },
  { kode: 'PTA005', kategori: 'PDL', produk: 'Baju Pertamina Teknisi', bahan: 'UNIONE', sm: 115000, spv: 120000, offline: 125500 },
  { kode: 'PTA006', kategori: 'Celana', produk: 'Celana Pertamina Teknisi', bahan: 'UNIONE', sm: 101000, spv: 106000, offline: 110500 },
  { kode: 'PTA007', kategori: 'PDL', produk: 'Pertamina Supervisor Hitam', bahan: 'UNIONE', sm: 218500, spv: 228500, offline: 238500 },
  { kode: 'PTA008', kategori: 'PDL', produk: 'Baju Pertamina Supervisor', bahan: 'UNIONE', sm: 115000, spv: 120000, offline: 125500 },
  { kode: 'PTA009', kategori: 'Celana', produk: 'Celana Pertamina Supervisor', bahan: 'UNIONE', sm: 101000, spv: 106000, offline: 110500 },
  { kode: 'PTA010', kategori: 'PDL', produk: 'Baju Celana Pertamina OB Hijau', bahan: 'UNIONE', sm: 218500, spv: 228500, offline: 238500 },
  { kode: 'PTA011', kategori: 'PDL', produk: 'Baju Pertamina OB', bahan: 'UNIONE', sm: 115000, spv: 120000, offline: 125500 },
  { kode: 'PTA012', kategori: 'Celana', produk: 'Celana Pertamina OB', bahan: 'UNIONE', sm: 101000, spv: 106000, offline: 110500 },
  { kode: 'PTA013', kategori: 'Topi', produk: 'Topi Pertamina', bahan: 'UNIONE', sm: 24500, spv: 25500, offline: 26500 },
];

async function seedData() {
  try {
    console.log("Truncating produk table...");
    await new Promise((resolve, reject) => {
      db.query('TRUNCATE TABLE produk', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log("Inserting new records...");
    for (const p of products) {
      const sql = `INSERT INTO produk 
        (kode, nama_produk, nama, kategori, bahan, harga_manager, harga_spv, harga_jual, hpp_satuan)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`;
      
      const bahan = p.bahan === '—' ? '' : p.bahan;
      
      // We set nama = null as it is no longer strictly required for the new layout, 
      // but we still pass null to avoid mismatch.
      await new Promise((resolve, reject) => {
        db.query(sql, [
          p.kode,
          p.produk,
          p.produk, // using produk name as 'nama' as well just in case legacy code needs it
          p.kategori,
          bahan,
          p.sm,
          p.spv,
          p.offline
        ], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    console.log("Successfully inserted " + products.length + " products!");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding data:", err);
    process.exit(1);
  }
}

seedData();
