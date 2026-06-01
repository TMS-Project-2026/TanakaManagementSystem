-- =============================================
-- CASH BANK TABLES - TANAKA MANAGEMENT SYSTEM
-- =============================================

-- CASH OUT BANK
CREATE TABLE IF NOT EXISTS cash_out_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id VARCHAR(50) UNIQUE NOT NULL,
  tanggal_transaksi DATE NOT NULL,
  nama_vendor VARCHAR(150) NOT NULL,
  cabang ENUM('Banua','Tanaka','Acestreet') NOT NULL DEFAULT 'Banua',
  bank VARCHAR(50) NOT NULL DEFAULT 'BCA',
  keterangan TEXT,
  kategori VARCHAR(100) DEFAULT 'Pembayaran Supplier',
  satuan VARCHAR(20) DEFAULT 'pcs',
  qty INT DEFAULT 1,
  harga_satuan DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  due_date DATE,
  status ENUM('Paid','Pending','Overdue','Void') DEFAULT 'Pending',
  bukti_transfer VARCHAR(255),
  catatan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TRANSFER REKENING
CREATE TABLE IF NOT EXISTS transfer_rekening (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id VARCHAR(50) UNIQUE NOT NULL,
  tanggal_transaksi DATE NOT NULL,
  dari_bank VARCHAR(50) NOT NULL,
  ke_bank VARCHAR(50) NOT NULL,
  dari_cabang ENUM('Banua','Tanaka','Acestreet') NOT NULL,
  ke_cabang ENUM('Banua','Tanaka','Acestreet') NOT NULL,
  nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
  biaya_transfer DECIMAL(15,2) DEFAULT 0,
  keterangan TEXT,
  status ENUM('Completed','Pending','Void') DEFAULT 'Pending',
  bukti_transfer VARCHAR(255),
  catatan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PETTY CASH
CREATE TABLE IF NOT EXISTS petty_cash (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaksi_id VARCHAR(50) UNIQUE NOT NULL,
  tanggal_transaksi DATE NOT NULL,
  nama_penerima VARCHAR(150) NOT NULL,
  cabang ENUM('Banua','Tanaka','Acestreet') NOT NULL DEFAULT 'Banua',
  kategori VARCHAR(100) DEFAULT 'ATK',
  nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
  keterangan TEXT,
  status ENUM('Approved','Pending','Void') DEFAULT 'Pending',
  bukti VARCHAR(255),
  catatan TEXT,
  is_replenishment TINYINT(1) DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PETTY CASH SALDO PER CABANG
CREATE TABLE IF NOT EXISTS petty_cash_saldo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cabang ENUM('Banua','Tanaka','Acestreet') NOT NULL UNIQUE,
  saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
  saldo_minimum DECIMAL(15,2) DEFAULT 500000,
  batas_per_transaksi DECIMAL(15,2) DEFAULT 5000000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO petty_cash_saldo (cabang, saldo, saldo_minimum, batas_per_transaksi) VALUES
('Banua', 5000000, 500000, 5000000),
('Tanaka', 5000000, 500000, 5000000),
('Acestreet', 3000000, 300000, 3000000);
