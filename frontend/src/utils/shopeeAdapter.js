/**
 * Data Adapter Utility untuk konversi otomatis data mentah Shopee ke format sistem Marketplace
 * lengkap dengan Mesin Fuzzy Matching HPP Otomatis untuk 89 produk Anda.
 */

// DATABASE HPP RESMI PT BANUA MITRA LESTARI (Sesuai Data Anda)
export const HPP_DATABASE = {
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

/**
 * Mesin Pencocokan Cerdas Fuzzy-Lookup HPP
 * @param {string} productName - Nama produk Shopee yang panjang/berisi spam keyword
 * @returns {number} - Nilai HPP satuan yang paling cocok
 */
export function findHpp(productName) {
  if (!productName) return 0;
  
  const target = productName.toLowerCase();
  
  let bestMatchKey = null;
  let maxScore = -1;
  
  // Deteksi karakteristik utama produk Shopee
  const isCelana = target.startsWith('celana') || target.includes('celana ');
  const isBaju = target.startsWith('baju') || target.startsWith('kaos') || target.startsWith('polo') || target.includes('baju ') || target.includes('seragam ');
  const isSet = target.includes('set ') || target.includes(' 1 set') || target.includes('seragam spbu operator');

  for (const key of Object.keys(HPP_DATABASE)) {
    const lowerKey = key.toLowerCase();
    let score = 0;

    // A. Substring Match Exact (Sangat Spesifik)
    if (target.includes(lowerKey)) {
      score += 15;
    }

    // B. Word-based matching (Memeriksa keberadaan kata)
    const keyWords = lowerKey.replace(/[+\/()]/g, ' ').split(/\s+/).filter(w => w.length > 1);
    let matchedWordsCount = 0;
    
    keyWords.forEach(word => {
      if (target.includes(word)) {
        matchedWordsCount++;
      }
    });

    if (matchedWordsCount > 0) {
      score += matchedWordsCount * 2; // +2 poin per kata yang cocok
      if (matchedWordsCount === keyWords.length) {
        score += 8; // Bonus besar jika semua kata di HPP key ada di judul Shopee
      }
    }

    // C. Penyelarasan Kategori (Celana vs Baju vs Set) untuk akurasi optimal
    const keyIsCelana = lowerKey.includes('celana') || lowerKey.includes('rok');
    const keyIsBaju = lowerKey.includes('baju') || lowerKey.includes('polo') || lowerKey.includes('flp');
    const keyIsSet = lowerKey.includes('set') || lowerKey.includes('wearpack') || lowerKey.includes('satpam pdl') || lowerKey.includes('satpam safari');

    if (isCelana && keyIsCelana) score += 10;
    if (isBaju && keyIsBaju) score += 10;
    if (isSet && keyIsSet) score += 15;
    
    // Penalti jika tipe produk bertolak belakang (misal produk Shopee "Celana" tapi HPP key mengandung "Baju")
    if (isCelana && keyIsBaju && !keyIsCelana) score -= 12;
    if (isBaju && keyIsCelana && !keyIsBaju) score -= 12;

    // Simpan kecocokan terbaik
    if (score > maxScore && matchedWordsCount > 0) {
      maxScore = score;
      bestMatchKey = key;
    }
  }

  // Jika skor kelayakan di atas batas minimum, kembalikan HPP
  if (bestMatchKey && maxScore >= 3) {
    return HPP_DATABASE[bestMatchKey];
  }

  return 0; // Default jika tidak ada yang cocok
}

export const cleanString = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const parseNum = (val) => {
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

export const parseShopeeDate = (rawDate) => {
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

/**
 * Fungsi Data Adapter Utama Terintegrasi Fuzzy Lookup HPP Otomatis
 * 
 * @param {Array<Object>} jsonData - Data baris Excel hasil pembacaan SheetJS
 * @returns {Array<Object>} - Data terkonversi yang kompatibel 100% dengan UI lama & sistem baru
 */
export function shopeeDataAdapter(jsonData) {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    return [];
  }

  // 1. AUTO-DETECT FORMAT
  const sampleRowKeys = Object.keys(jsonData[0]).map(k => k.trim().toLowerCase());
  const isShopeeFormat = sampleRowKeys.includes('no. pesanan');

  if (!isShopeeFormat) {
    console.log("ℹ️ [Adapter] Format Shopee tidak terdeteksi. Mengembalikan data asli.");
    return jsonData;
  }

  console.log("🚀 [Adapter] Format Shopee (No. Pesanan) Terdeteksi! Menjalankan konversi matematika presisi & lookup HPP...");

  // 2. MAPPING DATA MENTAH
  const mappedRows = jsonData.map(row => {
    const noPesanan = cleanString(row['No. Pesanan']);
    const username = cleanString(row['Username (Pembeli)']);
    const penerima = cleanString(row['Nama Penerima']);
    const customerName = username || penerima || 'Anonim';

    const namaProduk = cleanString(row['Nama Produk']);
    const namaVariasi = cleanString(row['Nama Variasi']);
    const itemDescription = namaVariasi ? `${namaProduk} - ${namaVariasi}` : namaProduk;

    const qty = parseInt(row['Jumlah']) || 1;
    
    // Ambil harga satuan per item (Utamakan Harga Setelah Diskon, fallback ke Harga Awal)
    const priceUnit = parseNum(row['Harga Setelah Diskon']) || parseNum(row['Harga Awal']) || 0;
    
    // total_price itu ketika beli 2 berati dikali 2 (Aturan 1)
    const totalPrice = qty * priceUnit;

    // potongan_shopee itu dari vocer ditanggung shopee (Aturan 2)
    const discount = parseNum(row['Voucher Ditanggung Shopee']) || 0;

    // actual = total_price - potongan_shopee (Aturan 3)
    const actual = totalPrice - discount;
    
    // actual_satuan = actual / qty (Aturan 4)
    const actualSatuan = qty > 0 ? actual / qty : 0;
    
    // Cari HPP secara cerdas dari database 89 produk Anda!
    const hppAktual = findHpp(itemDescription);
    const totalHppAktual = qty * hppAktual;

    // profit = actual - totalHppAktual (Aturan 5)
    const profit = actual - totalHppAktual;

    const address = cleanString(row['Alamat Pengiriman']) || cleanString(row['Kota/Kabupaten']) || '-';
    const status = cleanString(row['Status Pesanan']) || 'Pesanan Selesai';
    const rawDateStr = parseShopeeDate(row['Waktu Pembayaran Dilakukan'] || row['Waktu Pesanan Dibuat']);
    const catatan = cleanString(row['Catatan dari Pembeli']) || cleanString(row['Catatan']) || '';

    return {
      // ==== KUNCI KUSTOM BARU (Permintaan Anda) ====
      id_order: noPesanan,
      tanggal: rawDateStr,
      customer_name: customerName,
      item_description: itemDescription,
      qty: qty,
      total_harga: totalPrice,
      input_by: "Admin_Marketplace",

      // ==== KUNCI SISTEM LAMA (Database & UI Komponen) ====
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
      catatan: catatan,

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

  // 3. HANDLE MULTI-ITEM (GABUNG ORDER)
  const groupedOrdersMap = new Map();

  for (const row of mappedRows) {
    const orderId = row.id_order;
    
    if (!groupedOrdersMap.has(orderId)) {
      groupedOrdersMap.set(orderId, {
        // Skema Kustom Baru
        id_order: orderId,
        tanggal: row.tanggal,
        customer_name: row.customer_name,
        item_description: row.item_description,
        qty: row.qty,
        total_harga: row.total_harga,
        input_by: row.input_by,

        // Skema Sistem Lama (Database-Compatible)
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
      
      // Gabungkan deskripsi item
      existingOrder.item_description = cleanString(`${existingOrder.item_description} + ${row.item_description}`);
      existingOrder.product_name = existingOrder.item_description; // Selaraskan sistem lama

      // Jumlahkan qty
      existingOrder.qty += row.qty;
      
      // Jumlahkan potongan shopee (voucher ditanggung shopee)
      existingOrder.potongan_shopee += row.potongan_shopee;

      // Jumlahkan total_price
      existingOrder.total_price += row.total_price;
      existingOrder.total_harga = existingOrder.total_price; // Selaraskan skema kustom

      // Jumlahkan total HPP
      existingOrder.total_hpp_aktual += row.total_hpp_aktual;
      existingOrder.hpp_aktual = existingOrder.qty > 0 ? existingOrder.total_hpp_aktual / existingOrder.qty : 0;

      // Hitung ulang actual, actual_satuan, price_unit, dan profit
      existingOrder.actual = existingOrder.total_price - existingOrder.potongan_shopee;
      existingOrder.actual_satuan = existingOrder.qty > 0 ? existingOrder.actual / existingOrder.qty : 0;
      existingOrder.price_unit = existingOrder.qty > 0 ? existingOrder.total_price / existingOrder.qty : 0;
      existingOrder.profit = existingOrder.actual - existingOrder.total_hpp_aktual;

      // Masukkan item ke array
      existingOrder.items.push(row._rawItem);
    }
  }

  return Array.from(groupedOrdersMap.values());
}
