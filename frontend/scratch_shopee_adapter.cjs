const XLSX = require('./node_modules/xlsx');
const path = require('path');

const HPP_DATABASE = {
  "Mekanik Honda 1 Set": 184900,
  "SET SERAGAM MEKANIK + Topi / Apron": 167900,
  "Mekanik Honda": 150900,
  "Baju Honda": 81934,
  "Celana Honda": 71000,
  "FLP Merah": 84043,
  "FLP Putih": 84043,
  "FLP Merah Cewek": 84043,
  "FLP Putih Cewek": 84043,
  "FLP Merah cewek LP": 89043,
  "FLP Putih Cewek LP": 89043,
  "Kepala Bengkel Honda": 80525,
  "Wearpack Yamaha": 146500,
  "Yamaha SA": 80525,
  "Indomaret": 82443,
  "Indomaret Cewek": 82443,
  "Alfamart": 82443,
  "Alfamart Cewek": 82443,
  "Mekanik Wulling": 77243,
  "Baju Wulling": 80943,
  "Celana Wulling": 71000,
  "Sales Wulling": 80943,
  "Mekanik Honda Mobil": 143500,
  "Baju Honda Mobil": 80000,
  "Celana Honda Mobil": 70000,
  "Wearpack Honda Mobil": 147500,
  "Wearpack Mitsubishi": 151000,
  "Sales Mitsubishi": 79043,
  "Mitsubishi Formen": 83043,
  "Wearpack Toyota": 146500,
  "Wearpack Daihatsu": 146500,
  "Wearpack Suzuki": 146500,
  "Wearpack Isuzu": 146500,
  "Wearpack Mazda": 146500,
  "Polo Security": 75000,
  "Polo Merah Honda": 75000,
  "Topi Honda Mobil": 17500,
  "Topi Merah Honda": 15000,
  "Topi": 17500,
  "Apron": 17500,
  "SPBU Merah": 145000,
  "Baju SPBU Merah": 80000,
  "Celana SPBU Merah": 70000,
  "Topi SPBU Merah": 17500,
  "SPBU Biru": 145000,
  "Baju SPBU Biru": 80000,
  "Celana SPBU Biru": 70000,
  "Topi SPBU Biru": 17500,
  "SPBU Hijau": 145000,
  "Baju SPBU Hijau": 80000,
  "Celana SPBU Hijau": 70000,
  "Topi SPBU Hijau": 17500,
  "SPBU Hitam": 145000,
  "Baju SPBU Hitam": 80000,
  "Celana SPBU Hitam": 70000,
  "Topi SPBU Hitam": 17500,
  "Sales Fuso": 78443,
  "Satpam PDL": 141000,
  "Satpam Safari": 150000,
  "Baju Satpam PDL": 75243,
  "Celana Satpam PDL": 64600,
  "Baju Satpam Safari": 85243,
  "Celana Satpam Safari": 64600,
  "Batik TK Biru": 42000,
  "Batik TK Hijau": 42000,
  "Seragam SD Cewek": 85274,
  "Baju SD Lengan Panjang": 37113,
  "Rok SD": 48161,
  "Seragam SD Cowok": 77396,
  "Baju SD Lengan Pendek": 29235,
  "Celana SD": 48161,
  "Topi SD": 5000,
  "Dasi SD": 4000,
  "Seragam Pramuka SD Cewek": 85274,
  "Baju Pramuka SD Lengan Panjang": 37113,
  "Rok Pramuka SD": 48161,
  "Seragam Pramuka SD Cowok": 77396,
  "Baju Pramuka SD Lengan Pendek": 29235,
  "Celana Pramuka SD": 48161,
  "Topi Pramuka SD": 5000,
  "Seragam SMP Cewek": 94574,
  "Baju SMP Lengan Panjang": 42013,
  "Rok SMP": 52561,
  "Topi SMP": 5000,
  "Dasi SMP": 4000,
  "Seragam Pramuka SMP Cewek": 94574,
  "Dasi SMA": 4000,
  "Baju SD Banjarmasin": 20000,
  "Sales Toyota": 80943
};

function findHpp(productName) {
  if (!productName) return 0;
  
  const target = productName.toLowerCase();
  
  let bestMatchKey = null;
  let maxScore = -1;
  
  const isCelana = target.startsWith('celana') || target.includes('celana ');
  const isBaju = target.startsWith('baju') || target.startsWith('kaos') || target.startsWith('polo') || target.includes('baju ') || target.includes('seragam ');
  const isSet = target.includes('set ') || target.includes(' 1 set') || target.includes('seragam spbu operator');

  for (const key of Object.keys(HPP_DATABASE)) {
    const lowerKey = key.toLowerCase();
    let score = 0;

    if (target.includes(lowerKey)) {
      score += 15;
    }

    const keyWords = lowerKey.replace(/[+\/()]/g, ' ').split(/\s+/).filter(w => w.length > 1);
    let matchedWordsCount = 0;
    
    keyWords.forEach(word => {
      if (target.includes(word)) {
        matchedWordsCount++;
      }
    });

    if (matchedWordsCount > 0) {
      score += matchedWordsCount * 2;
      if (matchedWordsCount === keyWords.length) {
        score += 8;
      }
    }

    const keyIsCelana = lowerKey.includes('celana') || lowerKey.includes('rok');
    const keyIsBaju = lowerKey.includes('baju') || lowerKey.includes('polo') || lowerKey.includes('flp');
    const keyIsSet = lowerKey.includes('set') || lowerKey.includes('wearpack') || lowerKey.includes('satpam pdl') || lowerKey.includes('satpam safari');

    if (isCelana && keyIsCelana) score += 10;
    if (isBaju && keyIsBaju) score += 10;
    if (isSet && keyIsSet) score += 15;
    
    if (isCelana && keyIsBaju && !keyIsCelana) score -= 12;
    if (isBaju && keyIsCelana && !keyIsBaju) score -= 12;

    if (score > maxScore && matchedWordsCount > 0) {
      maxScore = score;
      bestMatchKey = key;
    }
  }

  if (bestMatchKey && maxScore >= 3) {
    return HPP_DATABASE[bestMatchKey];
  }

  return 0;
}

function shopeeDataAdapter(jsonData) {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return [];
  }

  const sampleRowKeys = Object.keys(jsonData[0]).map(k => k.trim().toLowerCase());
  const isShopeeFormat = sampleRowKeys.includes('no. pesanan');

  if (!isShopeeFormat) {
    console.log("ℹ️ [Adapter] Format Shopee tidak terdeteksi. Mengembalikan data asli.");
    return jsonData;
  }

  console.log("🚀 [Adapter] Format Shopee Terdeteksi! Memulai penyelarasan matematika & fuzzy lookup HPP...");

  const cleanString = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const parseNum = (val) => {
    if (val === undefined || val === null || val === '' || val === '-') return 0;
    if (typeof val === 'number') return val;
    let cleaned = String(val).trim();
    if (cleaned.includes('.') && cleaned.includes(',')) {
      if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(/,/g, '.');
      }
    } else if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
    cleaned = cleaned.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const parseShopeeDate = (rawDate) => {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    if (typeof rawDate === 'number') {
      const utc_days  = Math.floor(rawDate - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    }
    const strDate = String(rawDate).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(strDate)) {
      return strDate.split(' ')[0];
    }
    const parts = strDate.split(' ')[0].split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    const d = new Date(strDate);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const mappedRows = jsonData.map(row => {
    const noPesanan = cleanString(row['No. Pesanan']);
    const username = cleanString(row['Username (Pembeli)']);
    const penerima = cleanString(row['Nama Penerima']);
    const customerName = username || penerima || 'Anonim';

    const namaProduk = cleanString(row['Nama Produk']);
    const namaVariasi = cleanString(row['Nama Variasi']);
    const itemDescription = namaVariasi ? `${namaProduk} - ${namaVariasi}` : namaProduk;

    const qty = parseInt(row['Jumlah']) || 1;
    const priceUnit = parseNum(row['Harga Setelah Diskon']) || parseNum(row['Harga Awal']) || 0;
    
    const totalPrice = qty * priceUnit;
    const discount = parseNum(row['Voucher Ditanggung Shopee']) || 0;

    const actual = totalPrice - discount;
    const actualSatuan = qty > 0 ? actual / qty : 0;
    
    const hppAktual = findHpp(itemDescription);
    const totalHppAktual = qty * hppAktual;
    const profit = actual - totalHppAktual;

    const address = cleanString(row['Alamat Pengiriman']) || cleanString(row['Kota/Kabupaten']) || '-';
    const status = cleanString(row['Status Pesanan']) || 'Pesanan Selesai';
    const rawDateStr = parseShopeeDate(row['Waktu Pesanan Dibuat']);

    return {
      id_order: noPesanan,
      tanggal: rawDateStr,
      customer_name: customerName,
      item_description: itemDescription,
      qty: qty,
      total_harga: totalPrice,
      input_by: "Admin_Marketplace",

      order_date: rawDateStr,
      product_name: itemDescription,
      price_unit: priceUnit,
      total_price: totalPrice,
      potongan_shopee: discount,
      hpp_aktual: hppAktual,
      total_hpp_aktual: totalHppAktual,
      actual: actual,
      actual_satuan: actualSatuan,
      profit: profit,
      address: address,
      status: status,
      akun_toko: cleanString(row['Akun Toko']) || 'BANUA MITRA LESTARI',
      catatan: `[No. Pesanan: ${noPesanan}] [Input By: Admin_Marketplace]`,

      _rawItem: {
        product_name: namaProduk,
        variant_name: namaVariasi,
        price_unit: priceUnit,
        total_price: totalPrice,
        discount_shopee: discount,
        qty: qty,
        hpp_unit: hppAktual,
        total_hpp: totalHppAktual
      }
    };
  });

  const groupedOrdersMap = new Map();

  for (const row of mappedRows) {
    const orderId = row.id_order;
    
    if (!groupedOrdersMap.has(orderId)) {
      groupedOrdersMap.set(orderId, {
        id_order: orderId,
        tanggal: row.tanggal,
        customer_name: row.customer_name,
        item_description: row.item_description,
        qty: row.qty,
        total_harga: row.total_harga,
        input_by: row.input_by,

        order_date: row.order_date,
        product_name: row.product_name,
        price_unit: row.price_unit,
        total_price: row.total_price,
        potongan_shopee: row.potongan_shopee,
        hpp_aktual: row.hpp_aktual,
        total_hpp_aktual: row.total_hpp_aktual,
        actual: row.actual,
        actual_satuan: row.actual_satuan,
        profit: row.profit,
        address: row.address,
        status: row.status,
        akun_toko: row.akun_toko,
        catatan: row.catatan,
        
        items: [row._rawItem]
      });
    } else {
      const existingOrder = groupedOrdersMap.get(orderId);
      
      existingOrder.item_description = cleanString(`${existingOrder.item_description} + ${row.item_description}`);
      existingOrder.product_name = existingOrder.item_description;

      existingOrder.qty += row.qty;
      existingOrder.potongan_shopee += row.potongan_shopee;
      existingOrder.total_price += row.total_price;
      existingOrder.total_harga = existingOrder.total_price;

      existingOrder.total_hpp_aktual += row.total_hpp_aktual;
      existingOrder.hpp_aktual = existingOrder.qty > 0 ? existingOrder.total_hpp_aktual / existingOrder.qty : 0;

      existingOrder.actual = existingOrder.total_price - existingOrder.potongan_shopee;
      existingOrder.actual_satuan = existingOrder.qty > 0 ? existingOrder.actual / existingOrder.qty : 0;
      existingOrder.price_unit = existingOrder.qty > 0 ? existingOrder.total_price / existingOrder.qty : 0;
      existingOrder.profit = existingOrder.actual - existingOrder.total_hpp_aktual;

      existingOrder.items.push(row._rawItem);
    }
  }

  return Array.from(groupedOrdersMap.values());
}

const testFile = "C:\\Users\\uumi0\\Downloads\\data mentah 1 akun shopee.xlsx";

try {
  console.log("📂 Membaca File Pengujian:", testFile);
  const workbook = XLSX.readFile(testFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i] || [];
    if (row.map(s => String(s).toLowerCase()).includes('no. pesanan')) {
      headerRowIndex = i;
      break;
    }
  }

  const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });
  const result = shopeeDataAdapter(jsonData);

  console.log(`\n✅ BERHASIL SINKRONISASI HPP & ATURAN MATEMATIKA BARU!`);
  console.log(`📊 Total pesanan setelah dikelompokkan: ${result.length}`);

  const multiItemOrders = result.filter(o => o.items.length > 1);
  if (multiItemOrders.length > 0) {
    console.log("\n🔍 SAMPEL PESANAN MULTI-ITEM KEUANGAN LENGKAP (FUZZY HPP MATCHING):");
    console.log(JSON.stringify(multiItemOrders[0], null, 2));
  }

} catch (err) {
  console.error("❌ Kesalahan saat membaca file:", err.message);
}
