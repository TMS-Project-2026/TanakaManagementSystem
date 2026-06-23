const db = require('./config/db');

const products = [
  { nama: 'Wearpack Mitsubishi', mgr: 213777.86, spv: 222328.97, jual: 239431.20 },
  { nama: 'Baju Foreman', mgr: 115664.73, spv: 120291.32, jual: 129544.50 },
  { nama: 'Baju SA Mitsubishi', mgr: 111321.70, spv: 115774.56, jual: 124680.30 },
  { nama: 'Sales Mitsubishi Cowok', mgr: 109885.98, spv: 114281.42, jual: 123072.30 },
  { nama: 'Sales Mitsubishi Cewek', mgr: 109885.98, spv: 114281.42, jual: 123072.30 },
  { nama: 'Sales Fuso Cowok', mgr: 109024.55, spv: 113385.54, jual: 122107.50 },
  { nama: 'Sales Fuso Cewek', mgr: 109024.55, spv: 113385.54, jual: 122107.50 },
  { nama: 'Wearpack Toyota', mgr: 185637.86, spv: 193063.37, jual: 207914.40 },
  { nama: 'Sales Toyota Merah', mgr: 117082.50, spv: 121765.80, jual: 131132.40 },
  { nama: 'Sales Toyota Biru', mgr: 117082.50, spv: 121765.80, jual: 131132.40 },
  { nama: 'Wearpack Suzuki Mobil', mgr: 218838.75, spv: 227592.30, jual: 245099.40 },
  { nama: 'Wearpack Isuzu', mgr: 205809.64, spv: 214042.03, jual: 230506.80 },
  { nama: 'Seragam Mekanik Hyundai', mgr: 197419.69, spv: 205316.48, jual: 221110.05 },
  { nama: 'Kemeja Alfamart Cowok', mgr: 114803.30, spv: 119395.44, jual: 128579.70 },
  { nama: 'Kemeja Alfamart Cewek', mgr: 114803.30, spv: 119395.44, jual: 128579.70 },
  { nama: 'FLP Merah H', mgr: 117082.50, spv: 121765.80, jual: 131132.40 },
  { nama: 'FLP Putih H', mgr: 117082.50, spv: 121765.80, jual: 131132.40 },
  { nama: 'Seragam Mekanik Honda', mgr: 197419.69, spv: 205316.48, jual: 221110.05 },
  { nama: 'Celana Mekanik H', mgr: 91401.16, spv: 95057.21, jual: 102369.30 },
  { nama: 'Baju Mekanik H', mgr: 114067.50, spv: 118630.20, jual: 127755.60 },
  { nama: 'FLP Merah Cewek H', mgr: 117082.50, spv: 121765.80, jual: 131132.40 },
  { nama: 'FLP Putih Cewek H', mgr: 117082.50, spv: 121765.80, jual: 131132.40 },
  { nama: 'FLP Merah Panjang Cewek', mgr: 126037.77, spv: 131079.28, jual: 141162.30 },
  { nama: 'FLP Putih Panjang Cewek', mgr: 126037.77, spv: 131079.28, jual: 141162.30 },
  { nama: 'Topi Honda Putih', mgr: 21984.38, spv: 22863.75, jual: 24622.50 },
  { nama: 'Topi Honda Merah', mgr: 21984.38, spv: 22863.75, jual: 24622.50 },
  { nama: 'Apron Honda', mgr: 21984.38, spv: 22863.75, jual: 24622.50 },
  { nama: 'Wearpack Yamaha', mgr: 229911.70, spv: 239108.16, jual: 257501.10 },
  { nama: 'Baju SA Yamaha', mgr: 117728.57, spv: 122437.71, jual: 131856.00 },
  { nama: 'Baju Biru Yamaha', mgr: 153495.80, spv: 159635.64, jual: 171915.30 },
  { nama: 'Wearpack Honda', mgr: 191497.37, spv: 199157.26, jual: 214477.05 },
  { nama: 'Mekanik Honda Mobil New', mgr: 202920.27, spv: 211037.08, jual: 227270.70 },
  { nama: 'Baju Mekanik Honda Mobil', mgr: 114067.50, spv: 118630.20, jual: 127755.60 },
  { nama: 'Celana Mekanik Honda Mobil', mgr: 91401.16, spv: 95057.21, jual: 102369.30 },
  { nama: 'Service Advisor (SA)', mgr: 112016.89, spv: 116497.57, jual: 125458.92 },
  { nama: 'Sperpat', mgr: 116346.70, spv: 121000.56, jual: 130308.30 },
  { nama: 'Topi Honda Mobil', mgr: 21984.38, spv: 22863.75, jual: 24622.50 },
  { nama: 'Wearpack Mazda', mgr: 205809.64, spv: 214042.03, jual: 230506.80 },
  { nama: 'Kemeja Indomaret Cowok', mgr: 114803.30, spv: 119395.44, jual: 128579.70 },
  { nama: 'Kemeja Indomaret Cewek', mgr: 114803.30, spv: 119395.44, jual: 128579.70 },
  { nama: 'Safari Hitam', mgr: 212324.20, spv: 220817.16, jual: 237803.10 },
  { nama: 'Baju Safari', mgr: 118823.30, spv: 123576.24, jual: 133082.10 },
  { nama: 'Celana Safari', mgr: 89014.29, spv: 92574.86, jual: 99696.00 },
  { nama: 'PDL Kuning', mgr: 199366.88, spv: 207341.55, jual: 223290.90 },
  { nama: 'Baju PDL', mgr: 104394.38, spv: 108570.15, jual: 116921.70 },
  { nama: 'Celana PDL', mgr: 89014.29, spv: 92574.86, jual: 99696.00 },
  { nama: 'Pertamina Operator (Merah)', mgr: 198596.97, spv: 206540.85, jual: 222428.61 },
  { nama: 'Baju Pertamina Operator', mgr: 104394.38, spv: 108570.15, jual: 116921.70 },
  { nama: 'Celana Pertamina Operator', mgr: 91903.66, spv: 95579.81, jual: 102932.10 },
  { nama: 'Pertamina Teknisi (Biru)', mgr: 198596.97, spv: 206540.85, jual: 222428.61 },
  { nama: 'Baju Pertamina Teknisi', mgr: 104394.38, spv: 108570.15, jual: 116921.70 },
  { nama: 'Celana Pertamina Teknisi', mgr: 91903.66, spv: 95579.81, jual: 102932.10 },
  { nama: 'Pertamina Supervisor (Hitam)', mgr: 198596.97, spv: 206540.85, jual: 222428.61 },
  { nama: 'Baju Pertamina Supervisor', mgr: 104394.38, spv: 108570.15, jual: 116921.70 },
  { nama: 'Celana Pertamina Supervisor', mgr: 91903.66, spv: 95579.81, jual: 102932.10 },
  { nama: 'Pertamina OB (Hijau)', mgr: 198596.97, spv: 206540.85, jual: 222428.61 },
  { nama: 'Baju Pertamina OB', mgr: 104394.38, spv: 108570.15, jual: 116921.70 },
  { nama: 'Celana Pertamina OB', mgr: 91903.66, spv: 95579.81, jual: 102932.10 },
  { nama: 'Topi Pertamina', mgr: 21984.38, spv: 22863.75, jual: 24622.50 }
];

const seed = async () => {
    try {
        // Alter table to add columns if they don't exist
        const alters = [
            "ALTER TABLE produk ADD COLUMN harga_manager DECIMAL(15,2) DEFAULT 0",
            "ALTER TABLE produk ADD COLUMN harga_spv DECIMAL(15,2) DEFAULT 0",
            "ALTER TABLE produk ADD COLUMN harga_jual DECIMAL(15,2) DEFAULT 0"
        ];
        
        for (let q of alters) {
            await new Promise((resolve) => {
                db.query(q, (err) => {
                    if (err) console.log("Column may already exist:", err.message);
                    resolve();
                });
            });
        }

        // Insert or update products
        for (let p of products) {
            await new Promise((resolve) => {
                const q = "SELECT id FROM produk WHERE nama_produk = ?";
                db.query(q, [p.nama], (err, res) => {
                    if (res && res.length > 0) {
                        db.query("UPDATE produk SET harga_manager=?, harga_spv=?, harga_jual=? WHERE id=?", 
                            [p.mgr, p.spv, p.jual, res[0].id], 
                            () => resolve()
                        );
                    } else {
                        db.query("INSERT INTO produk (nama_produk, hpp_satuan, harga_manager, harga_spv, harga_jual) VALUES (?, 0, ?, ?, ?)", 
                            [p.nama, p.mgr, p.spv, p.jual], 
                            () => resolve()
                        );
                    }
                });
            });
        }
        
        console.log("Seeding completed!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
