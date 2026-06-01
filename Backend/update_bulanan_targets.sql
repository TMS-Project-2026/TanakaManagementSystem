DELETE FROM marketing_targets WHERE target_type = 'bulanan' AND branch = 'Banua';

INSERT INTO marketing_targets (account_name, target_type, target_value, branch) VALUES
  -- Shopee
  ('BanuaMitraLestari', 'bulanan', 140000000, 'Banua'),
  ('BANUA MITRA LESTARI', 'bulanan', 140000000, 'Banua'),
  ('Thesunan57', 'bulanan', 30000000, 'Banua'),
  ('TheSunan57', 'bulanan', 30000000, 'Banua'),
  ('FashionGarden', 'bulanan', 12000000, 'Banua'),
  ('thesunankonveksi', 'bulanan', 10000000, 'Banua'),
  ('57uniform', 'bulanan', 8000000, 'Banua'),
  ('Otomotifuniform', 'bulanan', 4000000, 'Banua'),
  ('Tansskoolkit', 'bulanan', 2000000, 'Banua'),
  ('Texasuniform', 'bulanan', 3000000, 'Banua'),
  ('MasLanang', 'bulanan', 1000000, 'Banua'),
  ('mas lanang', 'bulanan', 1000000, 'Banua'),

  -- Tiktok
  ('Tiktok BML', 'bulanan', 30000000, 'Banua'),
  ('Tiktok BanuaMitraLestari', 'bulanan', 30000000, 'Banua'),
  ('Tiktok banua mita lestari', 'bulanan', 30000000, 'Banua'),
  ('Banuauniform', 'bulanan', 6000000, 'Banua'),
  ('Tiktok Banuauniform', 'bulanan', 6000000, 'Banua'),
  ('Tiktok Texasuniform', 'bulanan', 7000000, 'Banua'),
  ('Tiktok thesunan57', 'bulanan', 600000, 'Banua'),
  ('Tiktok MasLanang', 'bulanan', 3500000, 'Banua'),
  ('Tiktok mas lanang', 'bulanan', 3500000, 'Banua')
ON DUPLICATE KEY UPDATE target_value = VALUES(target_value);
