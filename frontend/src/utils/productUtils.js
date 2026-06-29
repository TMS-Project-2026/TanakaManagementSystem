export const getBrand = (prod) => {
  if (prod.kode) {
    const k = prod.kode.toUpperCase();
    if (k.startsWith('HMM')) return 'PRODUK HONDA MOBIL';
    if (k.startsWith('HM')) return 'PRODUK HONDA MOTOR';
    if (k.startsWith('YM')) return 'PRODUK YAMAHA MOTOR';
    if (k.startsWith('MHM')) return 'PRODUK MITSUBISHI MOBIL';
    if (k.startsWith('TM')) return 'PRODUK TOYOTA MOBIL';
    if (k.startsWith('SM')) return 'PRODUK SUZUKI MOBIL';
    if (k.startsWith('IM')) return 'PRODUK ISUZU MOBIL';
    if (k.startsWith('HYM')) return 'PRODUK HYUNDAI MOBIL';
    if (k.startsWith('WM')) return 'PRODUK WULING MOBIL';
    if (k.startsWith('MM')) return 'PRODUK MAZDA MOBIL';
    if (k.startsWith('AM')) return 'PRODUK ALFAMART';
    if (k.startsWith('IDM')) return 'PRODUK INDOMARET';
    if (k.startsWith('SP')) return 'PRODUK SATPAM';
    if (k.startsWith('SRS')) return 'PRODUK SERAGAM RUMAH SAKIT';
    if (k.startsWith('PTA')) return 'PRODUK PERTAMINA';
  }

  const name = (prod.nama_produk || '').toUpperCase();
  if (name.includes('YAMAHA')) return 'PRODUK YAMAHA MOTOR';
  if (name.includes('HONDA MOBIL')) return 'PRODUK HONDA MOBIL';
  if (name.includes('FLP') || name.includes('MEKANIK HONDA') || (name.includes('HONDA') && !name.includes('MOBIL'))) return 'PRODUK HONDA MOTOR';
  if (name.includes('MITSUBISHI')) return 'PRODUK MITSUBISHI MOBIL';
  if (name.includes('TOYOTA')) return 'PRODUK TOYOTA MOBIL';
  if (name.includes('SUZUKI')) return 'PRODUK SUZUKI MOBIL';
  if (name.includes('ISUZU')) return 'PRODUK ISUZU MOBIL';
  if (name.includes('HYUNDAI')) return 'PRODUK HYUNDAI MOBIL';
  if (name.includes('WULING')) return 'PRODUK WULING MOBIL';
  if (name.includes('MAZDA')) return 'PRODUK MAZDA MOBIL';
  if (name.includes('ALFAMART')) return 'PRODUK ALFAMART';
  if (name.includes('INDOMARET')) return 'PRODUK INDOMARET';
  if (name.includes('SATPAM') || name.includes('SAFARI HITAM') || name.includes('SAFARI KUNING') || name.includes('PDL KUNING')) return 'PRODUK SATPAM';
  if (name.includes('SRS') || name.includes('RUMAH SAKIT') || name.includes('OKK')) return 'PRODUK SERAGAM RUMAH SAKIT';
  if (name.includes('PERTAMINA')) return 'PRODUK PERTAMINA';
  return 'Lainnya';
};

const BRAND_ORDER = [
  'PRODUK HONDA MOTOR',
  'PRODUK YAMAHA MOTOR',
  'PRODUK HONDA MOBIL',
  'PRODUK MITSUBISHI MOBIL',
  'PRODUK TOYOTA MOBIL',
  'PRODUK SUZUKI MOBIL',
  'PRODUK ISUZU MOBIL',
  'PRODUK HYUNDAI MOBIL',
  'PRODUK WULING MOBIL',
  'PRODUK MAZDA MOBIL',
  'PRODUK ALFAMART',
  'PRODUK INDOMARET',
  'PRODUK SATPAM',
  'PRODUK SERAGAM RUMAH SAKIT',
  'PRODUK PERTAMINA',
  'Lainnya',
];

const BRAND_PREFIX = {
  'PRODUK HONDA MOTOR':          'HM',
  'PRODUK YAMAHA MOTOR':         'YM',
  'PRODUK HONDA MOBIL':          'HMM',
  'PRODUK MITSUBISHI MOBIL':     'MHM',
  'PRODUK TOYOTA MOBIL':         'TM',
  'PRODUK SUZUKI MOBIL':         'SM',
  'PRODUK ISUZU MOBIL':          'IM',
  'PRODUK HYUNDAI MOBIL':        'HYM',
  'PRODUK WULING MOBIL':         'WM',
  'PRODUK MAZDA MOBIL':          'MM',
  'PRODUK ALFAMART':             'AM',
  'PRODUK INDOMARET':            'IDM',
  'PRODUK SATPAM':               'SP',
  'PRODUK SERAGAM RUMAH SAKIT':  'SRS',
  'PRODUK PERTAMINA':            'PTA',
  'Lainnya':                     'PRD',
};

export const assignDisplayKode = (products) => {
  const grouped = {};
  BRAND_ORDER.forEach(b => { grouped[b] = []; });
  
  products.forEach(prod => {
    const brand = getBrand(prod);
    if (!grouped[brand]) grouped[brand] = [];
    grouped[brand].push(prod);
  });
  
  BRAND_ORDER.forEach(brand => {
    if (grouped[brand]) {
      grouped[brand].forEach((prod, idx) => {
        const prefix = BRAND_PREFIX[brand] || 'PRD';
        const autoKode = `${prefix}${String(idx + 1).padStart(3, '0')}`;
        prod.displayKode = prod.kode || autoKode;
      });
    }
  });
  
  Object.keys(grouped).forEach(brand => {
    if (!BRAND_ORDER.includes(brand)) {
      grouped[brand].forEach((prod, idx) => {
        const prefix = BRAND_PREFIX[brand] || 'PRD';
        const autoKode = `${prefix}${String(idx + 1).padStart(3, '0')}`;
        prod.displayKode = prod.kode || autoKode;
      });
    }
  });
  
  return products;
};
