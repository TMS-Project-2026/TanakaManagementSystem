-- Update struktur tabel marketing_leads untuk Sales Offline
DROP TABLE IF EXISTS marketing_leads;

CREATE TABLE marketing_leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_customer VARCHAR(100) NOT NULL,
  produk VARCHAR(200) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  harga_awal DECIMAL(12, 2),
  harga_potongan DECIMAL(12, 2),
  jenis_pembayaran VARCHAR(50) DEFAULT 'Lunas',
  nominal_dp DECIMAL(12, 2) DEFAULT 0,
  tanggal_masuk DATE NOT NULL,
  deadline_final DATE,
  catatan TEXT,
  status VARCHAR(50) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tambah index untuk performa query filter tanggal
CREATE INDEX idx_tanggal_masuk ON marketing_leads(tanggal_masuk);
CREATE INDEX idx_status ON marketing_leads(status);
