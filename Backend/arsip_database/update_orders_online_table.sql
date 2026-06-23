-- Step 1: Add new columns to marketing_orders_online table to align with Excel target structure
ALTER TABLE marketing_orders_online
ADD COLUMN hpp DECIMAL(12,2) DEFAULT 0.00 AFTER hpp_aktual,
ADD COLUMN actual_satuan DECIMAL(12,2) DEFAULT 0.00 AFTER total_hpp_aktual,
ADD COLUMN actual DECIMAL(12,2) DEFAULT 0.00 AFTER actual_satuan,
ADD COLUMN catatan TEXT DEFAULT NULL AFTER status;

-- Step 2: Compute and backfill values for existing records
UPDATE marketing_orders_online
SET 
  hpp = qty * hpp_aktual,
  actual = total_price - potongan_shopee,
  actual_satuan = CASE WHEN qty > 0 THEN (total_price - potongan_shopee) / qty ELSE 0 END,
  profit = (total_price - potongan_shopee) - (qty * hpp_aktual);
