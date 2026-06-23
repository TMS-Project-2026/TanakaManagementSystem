CREATE TABLE IF NOT EXISTS akun (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_akun VARCHAR(20) NOT NULL UNIQUE,
    nama_akun VARCHAR(100) NOT NULL,
    kategori ENUM('Aktiva', 'Pasiva', 'Ekuitas', 'Pendapatan', 'Beban') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jurnal_umum (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    akun_id INT NOT NULL,
    cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0,
    kredit DECIMAL(15,2) DEFAULT 0,
    keterangan TEXT,
    referensi VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (akun_id) REFERENCES akun(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hutang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier VARCHAR(150) NOT NULL,
    nominal DECIMAL(15,2) NOT NULL,
    jatuh_tempo DATE NOT NULL,
    status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS piutang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer VARCHAR(150) NOT NULL,
    nominal DECIMAL(15,2) NOT NULL,
    jatuh_tempo DATE NOT NULL,
    status ENUM('Unpaid', 'Paid') DEFAULT 'Unpaid',
    cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expense ADD COLUMN cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL DEFAULT 'Banua';
ALTER TABLE payment ADD COLUMN cabang ENUM('Banua', 'Tanaka', 'Acestreet') NOT NULL DEFAULT 'Banua';

-- Insert Default Chart of Accounts (COA)
INSERT IGNORE INTO akun (kode_akun, nama_akun, kategori) VALUES
('1-100', 'Kas', 'Aktiva'),
('1-110', 'Bank', 'Aktiva'),
('1-120', 'Piutang Usaha', 'Aktiva'),
('1-130', 'Persediaan', 'Aktiva'),
('1-200', 'Aset Tetap', 'Aktiva'),
('2-100', 'Hutang Usaha', 'Pasiva'),
('2-200', 'Hutang Bank', 'Pasiva'),
('3-100', 'Modal Disetor', 'Ekuitas'),
('3-200', 'Laba Ditahan', 'Ekuitas'),
('4-100', 'Pendapatan Jasa', 'Pendapatan'),
('4-200', 'Pendapatan Penjualan', 'Pendapatan'),
('5-100', 'Beban Gaji', 'Beban'),
('5-200', 'Beban Operasional', 'Beban'),
('5-300', 'Beban Listrik & Air', 'Beban');
