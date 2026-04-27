DROP TABLE IF EXISTS cash_in_bank;

CREATE TABLE cash_in_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id VARCHAR(50) NOT NULL UNIQUE,
  cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL,
  nama_vendor VARCHAR(150) NOT NULL,
  keterangan VARCHAR(255),
  deskripsi TEXT,
  satuan ENUM('day', 'pcs', 'pckg') NOT NULL,
  qty INT DEFAULT 1,
  harga_satuan DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) DEFAULT 0,
  bank ENUM('BRI', 'BCA', 'BNI', 'Mandiri', 'Cash') NOT NULL,
  tanggal_transaksi DATE NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Paid', 'Unpaid', 'Pending', 'Overdue') DEFAULT 'Pending',
  catatan TEXT,
  saldo_awal DECIMAL(15,2) DEFAULT 0,
  saldo_setelah DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
