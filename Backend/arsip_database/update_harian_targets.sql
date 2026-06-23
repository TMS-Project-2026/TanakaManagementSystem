DELETE FROM marketing_targets WHERE target_type = 'harian' AND branch = 'Banua';

INSERT INTO marketing_targets (account_name, target_type, target_value, branch) VALUES
  -- Shopee
  ('BanuaMitraLestari', 'harian', 5000000, 'Banua'),
  ('BANUA MITRA LESTARI', 'harian', 5000000, 'Banua'), -- In case case-sensitive matches DB
  ('Thesunan57', 'harian', 1000000, 'Banua'),
  ('TheSunan57', 'harian', 1000000, 'Banua'), -- DB
  ('FashionGarden', 'harian', 400000, 'Banua'),
  ('thesunankonveksi', 'harian', 300000, 'Banua'),
  ('57uniform', 'harian', 250000, 'Banua'),
  ('Otomotifuniform', 'harian', 120000, 'Banua'),
  ('Tansskoolkit', 'harian', 70000, 'Banua'),
  ('Texasuniform', 'harian', 100000, 'Banua'),
  ('MasLanang', 'harian', 30000, 'Banua'),
  ('mas lanang', 'harian', 30000, 'Banua'),

  -- Tiktok
  ('Tiktok BML', 'harian', 1000000, 'Banua'),
  ('Tiktok BanuaMitraLestari', 'harian', 1000000, 'Banua'),
  ('Tiktok banua mita lestari', 'harian', 1000000, 'Banua'),
  ('Banuauniform', 'harian', 200000, 'Banua'),
  ('Tiktok Banuauniform', 'harian', 200000, 'Banua'),
  ('Tiktok Texasuniform', 'harian', 250000, 'Banua'),
  ('Tiktok thesunan57', 'harian', 30000, 'Banua'),
  ('Tiktok MasLanang', 'harian', 120000, 'Banua'),
  ('Tiktok mas lanang', 'harian', 120000, 'Banua')
ON DUPLICATE KEY UPDATE target_value = VALUES(target_value);
