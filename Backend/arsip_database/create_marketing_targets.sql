-- Tabel untuk menyimpan target marketing online (harian, bulanan, tahunan)
CREATE TABLE IF NOT EXISTS marketing_targets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_name VARCHAR(100) NOT NULL COMMENT 'Nama akun toko',
  target_type ENUM('harian', 'bulanan', 'tahunan') NOT NULL COMMENT 'Tipe target',
  target_value DECIMAL(18,2) NOT NULL DEFAULT 0 COMMENT 'Nilai target (sudah dibulatkan)',
  branch VARCHAR(50) NOT NULL DEFAULT 'Banua',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_target (account_name, target_type, branch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hapus data lama
DELETE FROM marketing_targets WHERE branch = 'Banua';

-- Seed data target dengan nama akun PERSIS dari tabel orders (dibulatkan ke jutaan)
INSERT INTO marketing_targets (account_name, target_type, target_value, branch) VALUES
  -- Target Harian
  ('BANUA MITRA LESTARI', 'harian', 5000000, 'Banua'),
  ('TheSunan57', 'harian', 3000000, 'Banua'),
  ('Tiktok BML', 'harian', 2000000, 'Banua'),

  -- Target Bulanan
  ('BANUA MITRA LESTARI', 'bulanan', 100000000, 'Banua'),
  ('TheSunan57', 'bulanan', 50000000, 'Banua'),
  ('Tiktok BML', 'bulanan', 30000000, 'Banua'),

  -- Target Tahunan
  ('BANUA MITRA LESTARI', 'tahunan', 1000000000, 'Banua'),
  ('TheSunan57', 'tahunan', 500000000, 'Banua'),
  ('Tiktok BML', 'tahunan', 300000000, 'Banua')
ON DUPLICATE KEY UPDATE target_value = VALUES(target_value);
