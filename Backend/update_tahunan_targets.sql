DELETE FROM marketing_targets WHERE target_type = 'tahunan' AND branch = 'Banua';

INSERT INTO marketing_targets (account_name, target_type, target_value, branch) VALUES
  -- Shopee
  ('BANUA MITRA LESTARI Shopee', 'tahunan', 1700000000, 'Banua'),
  ('Thesunan57 Shopee', 'tahunan', 350000000, 'Banua'),
  ('FashionGarden Shopee', 'tahunan', 150000000, 'Banua'),
  ('thesunankonveksi Shopee', 'tahunan', 110000000, 'Banua'),
  ('57uniform Shopee', 'tahunan', 96000000, 'Banua'),
  ('Otomotifuniform Shopee', 'tahunan', 40000000, 'Banua'),
  ('Tansskoolkit Shopee', 'tahunan', 20000000, 'Banua'),
  ('Texasuniform Shopee', 'tahunan', 36000000, 'Banua'),
  ('MasLanang Shopee', 'tahunan', 10000000, 'Banua'),

  -- Tiktok
  ('BANUA MITRA LESTARI Tiktok', 'tahunan', 365000000, 'Banua'),
  ('Banuauniform Tiktok', 'tahunan', 68000000, 'Banua'),
  ('Texasuniform Tiktok', 'tahunan', 76000000, 'Banua'),
  ('Thesunan57 Tiktok', 'tahunan', 8000000, 'Banua'),
  ('MasLanang Tiktok', 'tahunan', 38000000, 'Banua')
ON DUPLICATE KEY UPDATE target_value = VALUES(target_value);
