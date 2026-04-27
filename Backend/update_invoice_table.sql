DROP TABLE IF EXISTS invoice;

CREATE TABLE invoice (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_invoice VARCHAR(50) NOT NULL UNIQUE,
  cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL,
  tanggal_transaksi DATE NOT NULL,
  tanggal_terbit DATE NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  
  nama_pt VARCHAR(150) NOT NULL,
  alamat_pt TEXT NOT NULL,
  cp_penagihan VARCHAR(100),
  email VARCHAR(150),
  
  deskripsi TEXT,
  detail_pekerjaan TEXT,
  qty INT DEFAULT 1,
  harga_satuan DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) DEFAULT 0,
  ppn_persen DECIMAL(5,2) DEFAULT 0,
  jumlah_ppn DECIMAL(15,2) DEFAULT 0,
  grand_total DECIMAL(15,2) DEFAULT 0,
  keterangan TEXT,
  
  note TEXT,
  materai BOOLEAN DEFAULT FALSE,
  ttd BOOLEAN DEFAULT FALSE,
  penanggung_jawab VARCHAR(100),
  jabatan VARCHAR(100),
  
  status ENUM('Draft', 'Terbit', 'Lunas', 'Overdue') DEFAULT 'Draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
