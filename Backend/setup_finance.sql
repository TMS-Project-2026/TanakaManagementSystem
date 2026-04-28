CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_code VARCHAR(50) NOT NULL UNIQUE,
  account_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  normal_balance ENUM('Debit', 'Credit') NOT NULL,
  branch VARCHAR(50) NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS journals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL UNIQUE,
  branch VARCHAR(50) NOT NULL,
  transaction_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL,
  from_account VARCHAR(100) NOT NULL,
  to_account VARCHAR(100) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  description TEXT,
  unit VARCHAR(20),
  qty INT DEFAULT 1,
  unit_price DECIMAL(15, 2) DEFAULT 0,
  amount DECIMAL(15, 2) NOT NULL,
  debit DECIMAL(15, 2) NOT NULL,
  credit DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert Default Account Data
INSERT IGNORE INTO accounts (account_code, account_name, category, normal_balance, branch, status) VALUES 
('1-1110', 'Cash in Bank - BRI Banua', 'Current Assets', 'Debit', 'Banua', 'Active'),
('1-1120', 'Cash in Bank - BRI Tanaka', 'Current Assets', 'Debit', 'Tanaka', 'Active'),
('1-1130', 'Cash in Bank - BCA Banua', 'Current Assets', 'Debit', 'Banua', 'Active'),
('1-1300', 'Accounts Receivable', 'Current Assets', 'Debit', 'All Branches', 'Active'),
('2-1100', 'Accounts Payable', 'Liabilities', 'Credit', 'All Branches', 'Active'),
('3-1100', 'Paid-in Capital', 'Equity', 'Credit', 'All Branches', 'Active'),
('4-1100', 'Offline Sales', 'Revenue', 'Credit', 'All Branches', 'Active'),
('4-1200', 'Marketplace Sales', 'Revenue', 'Credit', 'All Branches', 'Active'),
('5-1100', 'Raw Material COGS', 'Cost of Goods Sold', 'Debit', 'All Branches', 'Active'),
('6-1100', 'Electricity Expense', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1400', 'Salary Expense', 'Expenses', 'Debit', 'All Branches', 'Active'),
('6-1600', 'Marketing Expense', 'Expenses', 'Debit', 'All Branches', 'Active');
