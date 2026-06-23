-- =============================================
-- CHART OF ACCOUNTS (COA) - TANAKA MANAGEMENT SYSTEM
-- =============================================
-- Clear existing & re-seed
DELETE FROM accounts;
ALTER TABLE accounts AUTO_INCREMENT = 1;

INSERT INTO accounts (account_code, account_name, category, normal_balance, branch, status) VALUES

-- ========== 1-1000 ASET LANCAR ==========
('1-1000', 'ASET LANCAR (CURRENT ASSETS)', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1100', 'Kas di Bank (Cash in Bank)', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1110', 'Kas di Bank - BRI BANUA', 'Current Assets', 'Debit', 'Banua', 'Active'),
('1-1120', 'Kas di Bank - BRI TANAKA', 'Current Assets', 'Debit', 'Tanaka', 'Active'),
('1-1130', 'Kas di Bank - BCA BANUA', 'Current Assets', 'Debit', 'Banua', 'Active'),
('1-1200', 'Kas Kecil (Petty Cash)', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1300', 'Piutang Usaha', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1400', 'Piutang Dagang', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1500', 'Persediaan Barang Jadi', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1600', 'Persediaan Barang Setengah Jadi (On Process)', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1700', 'Persediaan Bahan Baku', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('1-1800', 'Perlengkapan Kantor', 'Current Assets', 'Debit', 'All Branches', 'Active'),

-- ========== 1-2000 ASET TETAP ==========
('1-2000', 'ASET TETAP (FIXED ASSETS)', 'Fixed Assets', 'Debit', 'All Branches', 'Active'),
('1-2100', 'Peralatan Kantor', 'Fixed Assets', 'Debit', 'All Branches', 'Active'),
('1-2200', 'Peralatan Mesin', 'Fixed Assets', 'Debit', 'All Branches', 'Active'),
('1-2300', 'Kendaraan', 'Fixed Assets', 'Debit', 'All Branches', 'Active'),
('1-2400', 'Gedung', 'Fixed Assets', 'Debit', 'All Branches', 'Active'),
('1-2500', 'Tanah', 'Fixed Assets', 'Debit', 'All Branches', 'Active'),
('1-2600', 'Akumulasi Penyusutan Peralatan Kantor', 'Fixed Assets', 'Credit', 'All Branches', 'Active'),
('1-2700', 'Akumulasi Penyusutan Peralatan Mesin', 'Fixed Assets', 'Credit', 'All Branches', 'Active'),
('1-2800', 'Akumulasi Penyusutan Kendaraan', 'Fixed Assets', 'Credit', 'All Branches', 'Active'),
('1-2900', 'Akumulasi Penyusutan Gedung', 'Fixed Assets', 'Credit', 'All Branches', 'Active'),

-- ========== 2-1000 KEWAJIBAN ==========
('2-1000', 'KEWAJIBAN (LIABILITIES)', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('2-1100', 'Hutang Usaha', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('2-1200', 'Hutang Vendor & Mitra', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('2-1300', 'Hutang Gaji & Insentif', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('2-1400', 'Hutang Bank', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('2-1500', 'Hutang Deviden', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('2-1600', 'Prive Pemilik', 'Liabilities', 'Debit', 'All Branches', 'Active'),

-- ========== 3-1000 MODAL ==========
('3-1000', 'MODAL (EKUITAS)', 'Equity', 'Credit', 'All Branches', 'Active'),
('3-1100', 'Modal Disetor', 'Equity', 'Credit', 'All Branches', 'Active'),
('3-1200', 'Laba Ditahan', 'Equity', 'Credit', 'All Branches', 'Active'),

-- ========== 4-1000 PENDAPATAN ==========
('4-1000', 'PENDAPATAN / PENJUALAN (REVENUE)', 'Revenue', 'Credit', 'All Branches', 'Active'),
('4-1100', 'Penjualan Offline', 'Revenue', 'Credit', 'All Branches', 'Active'),
('4-1200', 'Penjualan Marketplace', 'Revenue', 'Credit', 'All Branches', 'Active'),
('4-1300', 'Penjualan Dibayar Dimuka (Down Payment)', 'Revenue', 'Credit', 'All Branches', 'Active'),
('4-1400', 'Retur Penjualan Offline', 'Revenue', 'Debit', 'All Branches', 'Active'),
('4-1500', 'Retur Penjualan Marketplace', 'Revenue', 'Debit', 'All Branches', 'Active'),

-- ========== 5-1000 HPP ==========
('5-1000', 'HARGA POKOK PENJUALAN (COST OF PROJECT)', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),
('5-1100', 'HPP - Pemakaian Bahan Baku Kain dan Aksesoris', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),
('5-1200', 'HPP - Biaya Tenaga Kerja Langsung (Jahit dan Bordir)', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),
('5-1300', 'HPP - Biaya Perawatan Mesin', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),
('5-1400', 'HPP - Biaya Utilitas Pabrik', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),
('5-1500', 'HPP - Biaya Sewa Pabrik', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),

-- ========== 6-1000 BIAYA ==========
('6-1000', 'BIAYA-BIAYA (EXPENSES)', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1100', 'Beban Listrik dan Air', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1200', 'Beban Utilitas', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1300', 'Beban Kuota & Internet', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1400', 'Beban Gaji dan Insentif', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1500', 'Beban Kesejahteraan Karyawan', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1600', 'Beban Marketing', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1700', 'Beban Perjalanan Dinas', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1800', 'Beban Sewa Gedung Kantor', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1900', 'Beban Administrasi dan Umum', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-2000', 'Beban Reparasi dan Pemeliharaan Aset Kantor', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-2100', 'Beban Penyusutan Peralatan Kantor', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-2200', 'Beban Penyusutan Mesin Produksi', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-2300', 'Beban Penyusutan Kendaraan', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-2400', 'Beban Penyusutan Gedung', 'Expenses', 'Debit', 'All Branches', 'Active');
