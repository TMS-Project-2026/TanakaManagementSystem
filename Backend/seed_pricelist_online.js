// Script seed data pricelist_online ke database
// Jalankan: node seed_pricelist_online.js
require('dotenv').config({ quiet: true });
const db = require('./config/db');

const data = [
  // HONDA MOTOR
  { kode:'HM001', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'FLP MERAH COWOK',                             bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HM002', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'FLP PUTIH COWOK',                             bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HM003', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'FLP MERAH CEWEK',                             bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HM004', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'FLP PUTIH CEWEK',                             bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HM005', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'FLP MERAH PANJANG CEWEK',                     bahan:'UNIONE', harga_jual:172000, hpp:120400, pot_shopee:34400, margin:17200 },
  { kode:'HM006', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'FLP PUTIH PANJANG CEWEK',                     bahan:'UNIONE', harga_jual:172000, hpp:120400, pot_shopee:34400, margin:17200 },
  { kode:'HM007', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'BAJU CELANA MEKANIK HONDA',                   bahan:'UNIONE', harga_jual:268000, hpp:187600, pot_shopee:53600, margin:26800 },
  { kode:'HM008', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'BAJU MEKANIK HONDA',                          bahan:'UNIONE', harga_jual:150000, hpp:105000, pot_shopee:30000, margin:15000 },
  { kode:'HM009', grup_produk:'PRODUK HONDA MOTOR', jenis:'CELANA',   nama_produk:'CELANA MEKANIK HONDA',                        bahan:'UNIONE', harga_jual:129000, hpp:90300,  pot_shopee:25800, margin:12900 },
  { kode:'HM010', grup_produk:'PRODUK HONDA MOTOR', jenis:'TOPI',     nama_produk:'TOPI HONDA PUTIH',                            bahan:'-',      harga_jual:38000,  hpp:26600,  pot_shopee:7600,  margin:3800  },
  { kode:'HM011', grup_produk:'PRODUK HONDA MOTOR', jenis:'TOPI',     nama_produk:'TOPI HONDA MERAH',                            bahan:'-',      harga_jual:38000,  hpp:26600,  pot_shopee:7600,  margin:3800  },
  { kode:'HM012', grup_produk:'PRODUK HONDA MOTOR', jenis:'APRON',    nama_produk:'APRON HONDA',                                 bahan:'-',      harga_jual:38000,  hpp:26600,  pot_shopee:7600,  margin:3800  },
  { kode:'HM013', grup_produk:'PRODUK HONDA MOTOR', jenis:'FULL SET', nama_produk:'BAJU CELANA MEKANIK HONDA (INCLUDE TOPI APRON)', bahan:'UNIONE', harga_jual:295000, hpp:206500, pot_shopee:59000, margin:29500 },
  { kode:'HM014', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'POLO MERAH HONDA',                            bahan:'PIQUE',  harga_jual:118000, hpp:82600,  pot_shopee:23600, margin:11800 },
  { kode:'HM015', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'HRC HITAM HONDA',                             bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HM016', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'HRC PUTIH HONDA',                             bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HM017', grup_produk:'PRODUK HONDA MOTOR', jenis:'PDH',      nama_produk:'HRC NAVY HONDA',                              bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  // YAMAHA
  { kode:'YM001', grup_produk:'PRODUK YAMAHA MOTOR', jenis:'WEARPACK', nama_produk:'WEARPACK YAMAHA',              bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  { kode:'YM004', grup_produk:'PRODUK YAMAHA MOTOR', jenis:'PDH',      nama_produk:'BAJU SERVICE ADVISOR YAMAHA',  bahan:'UNIONE', harga_jual:172000, hpp:120400, pot_shopee:34400, margin:17200 },
  // HONDA MOBIL
  { kode:'HMM001', grup_produk:'PRODUK HONDA MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK HONDA MOBIL',                bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  { kode:'HMM004', grup_produk:'PRODUK HONDA MOBIL', jenis:'PDL',      nama_produk:'BAJU PDL MOBIL',                      bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HMM005', grup_produk:'PRODUK HONDA MOBIL', jenis:'CELANA',   nama_produk:'CELANA HONDA MOBIL',                  bahan:'UNIONE', harga_jual:129000, hpp:90300,  pot_shopee:25800, margin:12900 },
  { kode:'HMM006', grup_produk:'PRODUK HONDA MOBIL', jenis:'PDL',      nama_produk:'BAJU CELANA PDL MOBIL',               bahan:'UNIONE', harga_jual:268000, hpp:187600, pot_shopee:53600, margin:26800 },
  { kode:'HMM007', grup_produk:'PRODUK HONDA MOBIL', jenis:'PDL',      nama_produk:'BAJU SERVICE ADVISOR (SA) MOBIL',     bahan:'UNIONE', harga_jual:168000, hpp:117600, pot_shopee:33600, margin:16800 },
  { kode:'HMM009', grup_produk:'PRODUK HONDA MOBIL', jenis:'TOPI',     nama_produk:'TOPI HONDA MOBIL',                    bahan:'-',      harga_jual:49000,  hpp:34300,  pot_shopee:9800,  margin:4900  },
  // MITSUBISHI
  { kode:'MHM001', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK MITSUBISHI MOBIL',            bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  { kode:'MHM004', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'PDH',      nama_produk:'BAJU FOREMAN MITSUBISHI MOBIL',        bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'MHM005', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'PDH',      nama_produk:'BAJU SERVICE ADVISOR MITSUBISHI MOBIL',bahan:'UNIONE', harga_jual:168000, hpp:117600, pot_shopee:33600, margin:16800 },
  { kode:'MHM006', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'PDH',      nama_produk:'BAJU SALES MITSUBISHI MOBIL COWOK',    bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'MHM007', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'PDH',      nama_produk:'BAJU SALES MITSUBISHI MOBIL CEWEK',    bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'MHM008', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'PDH',      nama_produk:'BAJU SALES FUSO MITSUBISHI COWOK',     bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'MHM009', grup_produk:'PRODUK MITSUBISHI MOBIL', jenis:'PDH',      nama_produk:'BAJU SALES FUSO MITSUBISHI CEWEK',     bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  // TOYOTA
  { kode:'TM001', grup_produk:'PRODUK TOYOTA MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK TOYOTA',   bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  { kode:'TM004', grup_produk:'PRODUK TOYOTA MOBIL', jenis:'PDH',      nama_produk:'SALES TOYOTA MERAH',bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'TM005', grup_produk:'PRODUK TOYOTA MOBIL', jenis:'PDH',      nama_produk:'SALES TOYOTA BIRU', bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  // SUZUKI
  { kode:'SM001', grup_produk:'PRODUK SUZUKI MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK SUZUKI MOBIL HIJAU', bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  { kode:'SM004', grup_produk:'PRODUK SUZUKI MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK SUZUKI MOBIL BIRU',  bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  // ISUZU
  { kode:'IM001', grup_produk:'PRODUK ISUZU MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK ISUZU MOBIL', bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  // HYUNDAI
  { kode:'HYM001', grup_produk:'PRODUK HYUNDAI MOBIL', jenis:'PDL',    nama_produk:'BAJU CELANA HYUNDAI BIRU MUDA', bahan:'UNIONE', harga_jual:268000, hpp:187600, pot_shopee:53600, margin:26800 },
  { kode:'HYM002', grup_produk:'PRODUK HYUNDAI MOBIL', jenis:'PDL',    nama_produk:'BAJU HYUNDAI BIRU MUDA',        bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HYM003', grup_produk:'PRODUK HYUNDAI MOBIL', jenis:'CELANA', nama_produk:'CELANA HYUNDAI BIRU MUDA',      bahan:'UNIONE', harga_jual:140000, hpp:98000,  pot_shopee:28000, margin:14000 },
  { kode:'HYM004', grup_produk:'PRODUK HYUNDAI MOBIL', jenis:'PDL',    nama_produk:'BAJU CELANA HYUNDAI BIRU TUA',  bahan:'UNIONE', harga_jual:268000, hpp:187600, pot_shopee:53600, margin:26800 },
  { kode:'HYM005', grup_produk:'PRODUK HYUNDAI MOBIL', jenis:'PDL',    nama_produk:'BAJU HYUNDAI BIRU TUA',         bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'HYM006', grup_produk:'PRODUK HYUNDAI MOBIL', jenis:'CELANA', nama_produk:'CELANA HYUNDAI BIRU TUA',       bahan:'UNIONE', harga_jual:140000, hpp:98000,  pot_shopee:28000, margin:14000 },
  // WULING
  { kode:'WM001', grup_produk:'PRODUK WULING MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK WULING',             bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  { kode:'WM004', grup_produk:'PRODUK WULING MOBIL', jenis:'PDL',      nama_produk:'BAJU CELANA WULING',          bahan:'UNIONE', harga_jual:268000, hpp:187600, pot_shopee:53600, margin:26800 },
  { kode:'WM005', grup_produk:'PRODUK WULING MOBIL', jenis:'PDL',      nama_produk:'BAJU WULING',                 bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'WM006', grup_produk:'PRODUK WULING MOBIL', jenis:'PDH',      nama_produk:'BAJU SALES WULING CEWEK',     bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'WM007', grup_produk:'PRODUK WULING MOBIL', jenis:'PDH',      nama_produk:'BAJU SALES WULING COWOK',     bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'WM008', grup_produk:'PRODUK WULING MOBIL', jenis:'CELANA',   nama_produk:'CELANA WULING',               bahan:'UNIONE', harga_jual:140000, hpp:98000,  pot_shopee:28000, margin:14000 },
  { kode:'WM009', grup_produk:'PRODUK WULING MOBIL', jenis:'PDH',      nama_produk:'BAJU SERVICE ADVISOR WULING', bahan:'UNIONE', harga_jual:168000, hpp:117600, pot_shopee:33600, margin:16800 },
  { kode:'WM010', grup_produk:'PRODUK WULING MOBIL', jenis:'PDL',      nama_produk:'BAJU CELANA PARTMAN WULING',  bahan:'UNIONE', harga_jual:268000, hpp:187600, pot_shopee:53600, margin:26800 },
  { kode:'WM011', grup_produk:'PRODUK WULING MOBIL', jenis:'PDL',      nama_produk:'BAJU PARTMAN WULING',         bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'WM012', grup_produk:'PRODUK WULING MOBIL', jenis:'CELANA',   nama_produk:'CELANA PARTMAN WULING',       bahan:'UNIONE', harga_jual:140000, hpp:98000,  pot_shopee:28000, margin:14000 },
  { kode:'WM013', grup_produk:'PRODUK WULING MOBIL', jenis:'TOPI',     nama_produk:'TOPI WULING',                 bahan:'-',      harga_jual:38000,  hpp:26600,  pot_shopee:7600,  margin:3800  },
  // MAZDA
  { kode:'MM001', grup_produk:'PRODUK MAZDA MOBIL', jenis:'WEARPACK', nama_produk:'WEARPACK MAZDA', bahan:'UNIONE', harga_jual:300000, hpp:210000, pot_shopee:60000, margin:30000 },
  // ALFAMART
  { kode:'AM001', grup_produk:'PRODUK ALFAMART', jenis:'KEMEJA', nama_produk:'KEMEJA ALFAMART COWOK', bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
  { kode:'AM002', grup_produk:'PRODUK ALFAMART', jenis:'KEMEJA', nama_produk:'KEMEJA ALFAMART CEWEK', bahan:'UNIONE', harga_jual:161000, hpp:112700, pot_shopee:32200, margin:16100 },
];

// Buat tabel dulu
const createSQL = `
CREATE TABLE IF NOT EXISTS pricelist_online (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  kode        VARCHAR(20)   NOT NULL UNIQUE,
  grup_produk VARCHAR(100)  NOT NULL DEFAULT '',
  jenis       VARCHAR(50)   NOT NULL DEFAULT '',
  nama_produk VARCHAR(255)  NOT NULL,
  bahan       VARCHAR(100)  NOT NULL DEFAULT '-',
  harga_jual  DECIMAL(15,2) NOT NULL DEFAULT 0,
  hpp         DECIMAL(15,2) NOT NULL DEFAULT 0,
  pot_shopee  DECIMAL(15,2) NOT NULL DEFAULT 0,
  margin      DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)`;

db.query(createSQL, (err) => {
  if (err) { console.error('❌ Gagal buat tabel:', err.message); process.exit(1); }
  console.log('✅ Tabel pricelist_online siap.');

  const sql = `INSERT IGNORE INTO pricelist_online (kode, grup_produk, jenis, nama_produk, bahan, harga_jual, hpp, pot_shopee, margin) VALUES ?`;
  const values = data.map(i => [i.kode, i.grup_produk, i.jenis, i.nama_produk, i.bahan, i.harga_jual, i.hpp, i.pot_shopee, i.margin]);

  db.query(sql, [values], (err2, result) => {
    if (err2) { console.error('❌ Gagal seed:', err2.message); process.exit(1); }
    console.log(`✅ ${result.affectedRows} data berhasil dimasukkan (${data.length - result.affectedRows} sudah ada).`);
    process.exit(0);
  });
});
