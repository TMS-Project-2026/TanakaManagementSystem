-- ============================================
-- SQL untuk membuat/melengkapi tabel produk
-- ============================================

-- Jika tabel sudah ada, drop dulu (opsional)
-- DROP TABLE IF EXISTS produk;

-- Buat tabel produk
CREATE TABLE IF NOT EXISTS produk (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama_produk VARCHAR(255) NOT NULL,
    stok INT NOT NULL DEFAULT 0,
    harga_beli DECIMAL(15, 2) NOT NULL COMMENT 'HPP (Harga Pokok Penjualan)',
    harga_jual DECIMAL(15, 2) NOT NULL,
    tanggal_masuk DATE NOT NULL,
    stok_minimum INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama_produk (nama_produk),
    INDEX idx_stok (stok)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Data Dummy untuk Tabel Produk
-- ============================================

INSERT INTO produk (nama_produk, stok, harga_beli, harga_jual, tanggal_masuk, stok_minimum) VALUES

-- Wearpack dan Seragam
('Wearpack Toyota', 45, 80525.00, 145000.00, '2026-01-13', 10),
('Wearpack Honda', 32, 82000.00, 148000.00, '2026-01-15', 10),
('Seragam PDH Premium', 60, 75000.00, 135000.00, '2026-01-10', 15),
('Seragam Pramuka', 28, 65000.00, 120000.00, '2026-01-12', 10),

-- Jaket dan Jas
('Jaket Safety Orange', 50, 120000.00, 200000.00, '2026-02-01', 10),
('Jaket Denim Blue', 35, 95000.00, 165000.00, '2026-02-03', 8),
('Jas Formal Hitam', 22, 300000.00, 500000.00, '2026-02-05', 5),
('Jas Formal Biru', 18, 300000.00, 500000.00, '2026-02-05', 5),

-- Celana
('Celana Kerja Khaki', 80, 45000.00, 85000.00, '2026-02-10', 20),
('Celana Jeans Biru', 55, 55000.00, 95000.00, '2026-02-12', 15),
('Celana Formal Hitam', 40, 65000.00, 120000.00, '2026-02-14', 10),
('Celana Cargo', 65, 50000.00, 90000.00, '2026-02-16', 15),

-- Kaos dan Baju
('Kaos Polos Putih', 150, 15000.00, 35000.00, '2026-03-01', 30),
('Kaos Polos Biru', 140, 15000.00, 35000.00, '2026-03-01', 30),
('Kaos Polos Merah', 130, 15000.00, 35000.00, '2026-03-01', 30),
('Kaos Kerah Polo', 95, 25000.00, 55000.00, '2026-03-03', 20),
('Baju Kemeja Putih', 70, 45000.00, 95000.00, '2026-03-05', 15),
('Baju Kemeja Biru', 65, 45000.00, 95000.00, '2026-03-05', 15),

-- Sepatu
('Sepatu Safety', 40, 120000.00, 220000.00, '2026-03-10', 10),
('Sepatu Formal Hitam', 35, 150000.00, 270000.00, '2026-03-12', 8),
('Sepatu Sneaker', 45, 85000.00, 165000.00, '2026-03-14', 10),
('Sepatu Kasual', 50, 75000.00, 145000.00, '2026-03-16', 12),

-- Topi dan Aksesoris
('Topi Cap Polos', 120, 12000.00, 28000.00, '2026-04-01', 30),
('Topi Safety', 60, 22000.00, 45000.00, '2026-04-03', 15),
('Sarung Tangan', 200, 8000.00, 18000.00, '2026-04-05', 50),
('Dasi Formal', 85, 18000.00, 42000.00, '2026-04-07', 20),
('Ikat Pinggang', 95, 15000.00, 38000.00, '2026-04-09', 20);

-- ============================================
-- Query untuk verifikasi
-- ============================================

-- Cek total produk
SELECT COUNT(*) as total_produk FROM produk;

-- Cek semua produk
SELECT id, nama_produk, stok, harga_beli, harga_jual, tanggal_masuk FROM produk ORDER BY id ASC;

-- Cek produk dengan stok minimum
SELECT id, nama_produk, stok, harga_beli, harga_jual FROM produk WHERE stok < stok_minimum;
