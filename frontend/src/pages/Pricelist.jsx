import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, Search, Package, DollarSign, Loader2, UploadCloud, Download, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka || 0);
};

const getBrand = (prod) => {
  if (prod.kode) {
    const k = prod.kode.toUpperCase();
    if (k.startsWith('HMM')) return 'PRODUK HONDA MOBIL';
    if (k.startsWith('HM')) return 'PRODUK HONDA MOTOR';
    if (k.startsWith('YM')) return 'PRODUK YAMAHA MOTOR';
    if (k.startsWith('MHM')) return 'PRODUK MITSUBISHI MOBIL';
    if (k.startsWith('TM')) return 'PRODUK TOYOTA MOBIL';
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
  if (name.includes('HYUNDAI')) return 'PRODUK HYUNDAI MOBIL';
  if (name.includes('WULING')) return 'PRODUK WULING MOBIL';
  if (name.includes('MAZDA')) return 'PRODUK MAZDA MOBIL';
  if (name.includes('ALFAMART')) return 'PRODUK ALFAMART';
  if (name.includes('INDOMARET')) return 'PRODUK INDOMARET';
  if (name.includes('SATPAM') || name.includes('SAFARI HITAM') || name.includes('SAFARI KUNING') || name.includes('PDL KUNING')) return 'PRODUK SATPAM';
  if (name.includes('SRS') || name.includes('RUMAH SAKIT') || name.includes('OKK')) return 'PRODUK SERAGAM RUMAH SAKIT';
  if (name.includes('PERTAMINA')) return 'PRODUK PERTAMINA';
  return 'PRODUK LAINNYA';
};

// Daftar jenis yang valid sesuai juklak
const VALID_JENIS = ['PDH', 'PDL', 'WEARPACK', 'CELANA', 'TOPI', 'APRON', 'FULL SET',
  'POLO', 'KEMEJA', 'SERAGAM RS', 'SERAGAM', 'ROMPI', 'JAKET', 'DASI', 'KORSA'];

const getJenis = (prod) => {
  // Jika kategori sudah berupa jenis yang valid (dari import baru), langsung pakai
  if (prod.kategori && VALID_JENIS.includes(prod.kategori.toUpperCase().trim())) {
    return prod.kategori.toUpperCase().trim();
  }
  const name = (prod.nama_produk || '').toUpperCase();
  if (name.includes('WEARPACK'))                                      return 'WEARPACK';
  if (name.includes('BAJU CELANA') || name.includes('FULL SET'))     return 'FULL SET';
  if (name.includes('CELANA') && !name.includes('BAJU'))             return 'CELANA';
  if (name.includes('TOPI'))                                          return 'TOPI';
  if (name.includes('APRON'))                                         return 'APRON';
  if (name.includes('ROMPI'))                                         return 'ROMPI';
  if (name.includes('JAKET'))                                         return 'JAKET';
  if (name.includes('DASI'))                                          return 'DASI';
  if (name.includes('PDL'))                                           return 'PDL';
  if (name.includes('POLO'))                                          return 'POLO';
  if (name.includes('KEMEJA'))                                        return 'KEMEJA';
  if (name.includes('KORSA'))                                         return 'KORSA';
  if (name.includes('SRS') || name.includes('RUMAH SAKIT'))          return 'SERAGAM RS';
  // Default: sebagian besar seragam uniform adalah jenis PDH
  return 'PDH';
};

const BRAND_ORDER = [
  'PRODUK HONDA MOTOR',
  'PRODUK YAMAHA MOTOR',
  'PRODUK HONDA MOBIL',
  'PRODUK MITSUBISHI MOBIL',
  'PRODUK TOYOTA MOBIL',
  'PRODUK HYUNDAI MOBIL',
  'PRODUK WULING MOBIL',
  'PRODUK MAZDA MOBIL',
  'PRODUK ALFAMART',
  'PRODUK INDOMARET',
  'PRODUK SATPAM',
  'PRODUK SERAGAM RUMAH SAKIT',
  'PRODUK PERTAMINA',
];

const BRAND_COLORS = {
  'PRODUK HONDA MOTOR':          'bg-gray-900',
  'PRODUK YAMAHA MOTOR':         'bg-[#990000]',
  'PRODUK HONDA MOBIL':          'bg-gray-900',
  'PRODUK MITSUBISHI MOBIL':     'bg-[#990000]',
  'PRODUK TOYOTA MOBIL':         'bg-gray-900',
  'PRODUK HYUNDAI MOBIL':        'bg-[#990000]',
  'PRODUK WULING MOBIL':         'bg-gray-900',
  'PRODUK MAZDA MOBIL':          'bg-[#990000]',
  'PRODUK ALFAMART':             'bg-gray-900',
  'PRODUK INDOMARET':            'bg-[#990000]',
  'PRODUK SATPAM':               'bg-gray-900',
  'PRODUK SERAGAM RUMAH SAKIT':  'bg-[#990000]',
  'PRODUK PERTAMINA':            'bg-gray-900',
  'PRODUK LAINNYA':              'bg-[#990000]',
};

// Prefix kode sesuai juklak: HM=Honda Motor, YM=Yamaha, HMM=Honda Mobil, dst.
const BRAND_PREFIX = {
  'PRODUK HONDA MOTOR':          'HM',
  'PRODUK YAMAHA MOTOR':         'YM',
  'PRODUK HONDA MOBIL':          'HMM',
  'PRODUK MITSUBISHI MOBIL':     'MHM',
  'PRODUK TOYOTA MOBIL':         'TM',
  'PRODUK HYUNDAI MOBIL':        'HYM',
  'PRODUK WULING MOBIL':         'WM',
  'PRODUK MAZDA MOBIL':          'MM',
  'PRODUK ALFAMART':             'AM',
  'PRODUK INDOMARET':            'IM',
  'PRODUK SATPAM':               'SP',
  'PRODUK SERAGAM RUMAH SAKIT':  'SRS',
  'PRODUK PERTAMINA':            'PT',
  'PRODUK LAINNYA':              'PRD',
};

const Pricelist = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // Periksa role user yang login
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = user.role || '';
  const canCrud = ['finance', 'owner', 'admin'].includes(userRole.toLowerCase());

  const initialForm = {
    kode: '',
    nama_produk: '',
    nama: '',
    kategori: 'Lainnya',
    bahan: '',
    variasi: '',
    hpp_satuan: 0,
    margin: '',
    harga_jual: 0,
    keterangan: '',
    harga_direktur: 0,
    harga_gm: 0,
    harga_manager: 0,
    harga_spv: 0
  };

  const [form, setForm] = useState(initialForm);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/produk');
      if (res.data.status === 'success') {
        setProducts(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await api.put(`/produk/${currentId}`, form);
        alert('Produk berhasil diperbarui');
      } else {
        await api.post('/produk', form);
        alert('Produk berhasil ditambahkan');
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product', error);
      alert('Gagal menyimpan produk: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditing(false);
    setCurrentId(null);
    setShowModal(true);
  };

  const openEditModal = (prod) => {
    setForm({
      kode: prod.kode || '',
      nama_produk: prod.nama_produk || '',
      nama: prod.nama || '',
      kategori: prod.kategori || 'Lainnya',
      bahan: prod.bahan || '',
      variasi: prod.variasi || '',
      hpp_satuan: prod.hpp_satuan || 0,
      margin: prod.margin || '',
      harga_jual: prod.harga_jual || 0,
      keterangan: prod.keterangan || '',
      harga_direktur: prod.harga_direktur || 0,
      harga_gm: prod.harga_gm || 0,
      harga_manager: prod.harga_manager || 0,
      harga_spv: prod.harga_spv || 0
    });
    setIsEditing(true);
    setCurrentId(prod.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      try {
        await api.delete(`/produk/${id}`);
        alert('Produk berhasil dihapus');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product', error);
        alert('Gagal menghapus produk');
      }
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.text("Pricelist Produk", 14, 15);
    
    const tableData = filteredProducts.map((p) => [
      p.nama_produk || '-',
      formatRupiah(p.harga_jual)
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Nama Produk', 'Harga Jual']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [153, 0, 0] },
      styles: { fontSize: 10 }
    });

    doc.save("Pricelist_Produk.pdf");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Cari baris header: baris yang kolom pertamanya berisi 'KODE'
        let headerRowIdx = -1;
        for (let i = 0; i < data.length; i++) {
          const cell = data[i][0];
          if (cell && typeof cell === 'string' && cell.toUpperCase().trim() === 'KODE') {
            headerRowIdx = i;
            break;
          }
        }
        // Kalau tidak ketemu 'KODE', cari baris yang ada kode produk (misal HM001)
        let startRow = headerRowIdx > -1 ? headerRowIdx + 1 : 1;

        // Parse currency: "Rp128.800" -> 128800
        const parseRupiah = (val) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          const clean = String(val).replace(/Rp/gi, '').replace(/\./g, '').replace(/,/g, '.').trim();
          return Number(clean) || 0;
        };

        const payload = [];
        // Struktur kolom juklak harga uniform:
        // col0: KODE | col1: JENIS/KATEGORI | col2: NAMA PRODUK | col3: BAHAN | col4: VARIASI
        // col5: SALES MANAGER(10%) | col6: SALES SPV(15%) | col7: HARGA JUAL OFFLINE
        // col8: HARGA JUAL ONLINE | col9: HPP | col10: POT.SHOPEE | col11: MARGIN | col12: PROFIT MARGIN

        for (let i = startRow; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 3) continue;

          const kode = row[0] ? String(row[0]).trim() : '';
          const kategori = row[1] ? String(row[1]).trim() : '';
          const nama_produk = row[2] ? String(row[2]).trim() : '';
          const bahan = row[3] ? String(row[3]).trim() : '';
          const variasi = row[4] ? String(row[4]).trim() : '';

          // Skip baris section header (tidak ada kode atau nama produk)
          if (!nama_produk && !kode) continue;
          // Skip baris total/sub-header
          if (String(nama_produk).toUpperCase().includes('TOTAL') || 
              String(kode).toUpperCase().includes('KODE')) continue;

          payload.push({
            kode: kode || null,
            nama_produk: nama_produk || kode,
            kategori: kategori || 'Lainnya',
            bahan: bahan,
            variasi: variasi,
            harga_manager: parseRupiah(row[5]),   // SALES MANAGER 10%
            harga_spv:     parseRupiah(row[6]),   // SALES SPV 15%
            harga_jual:    parseRupiah(row[7]),   // HARGA JUAL OFFLINE
            harga_direktur:parseRupiah(row[8]),   // HARGA JUAL ONLINE
            hpp_satuan:    parseRupiah(row[9]),   // HPP
            harga_gm:      parseRupiah(row[10]),  // POT.SHOPEE
            margin:        row[11] ? String(row[11]).trim() : '',  // MARGIN
            keterangan:    row[12] ? String(row[12]).trim() : '',  // PROFIT MARGIN / catatan
          });
        }

        if (payload.length > 0) {
          const res = await api.post('/produk/import', payload);
          alert(res.data.message || 'Import berhasil!');
          fetchProducts();
        } else {
          alert('Tidak ada data produk yang valid untuk diimport. Pastikan format Excel sesuai juklak (KODE di kolom A).');
        }
      } catch (error) {
        console.error('Error importing file', error);
        alert('Gagal import file: ' + error.message);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const nm = (p.nama_produk || p.nama || '').toLowerCase();
    const bh = (p.bahan || '').toLowerCase();
    const jn = (getJenis(p) || '').toLowerCase();
    const kd = (p.kode || '').toLowerCase();
    
    return nm.includes(q) || bh.includes(q) || jn.includes(q) || kd.includes(q);
  });

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama produk atau bahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">

          <NotificationBell />
            <div className="relative">
              <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
              </div>
              
              {showProfile && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 bg-red-50/50">
                    <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Pricelist Harga</h1>
                <p className="text-gray-500 font-medium mt-1 text-sm">Kelola juklak harga produk berdasarkan kategori dokumen.</p>
              </div>
            </div>

            {/* ===================== SECTION: JUKLAK HARGA UNIFORM ===================== */}
            <h2 className="text-2xl font-black text-[#990000] mb-4 mt-4 uppercase tracking-widest">JUKLAK HARGA UNIFORM</h2>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                  <div className="text-sm text-gray-500 font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                    <Package size={16}/> Total: <span className="font-bold text-gray-900">{filteredProducts.length} Produk</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {canCrud && (
                      <div>
                        <input
                          type="file"
                          id="importExcel"
                          accept=".xlsx, .xls, .csv"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <label
                          htmlFor="importExcel"
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
                            loading ? 'bg-gray-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {loading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                          Import Excel
                        </label>
                      </div>
                    )}
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm"
                    >
                      <Download size={20} />
                      Download
                    </button>
                    {canCrud && (
                      <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-[#990000] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-800 transition-all shadow-sm"
                      >
                        <Plus size={20} />
                        Tambah Produk
                      </button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap border-collapse">

                    <tbody>
                      {(() => {
                        // Group by brand section
                        const grouped = {};
                        BRAND_ORDER.forEach(b => { grouped[b] = []; });
                        filteredProducts.forEach(prod => {
                          const brand = getBrand(prod);
                          if (!grouped[brand]) grouped[brand] = [];
                          grouped[brand].push(prod);
                        });
                        const toRender = BRAND_ORDER.filter(b => grouped[b].length > 0);
                        const totalCols = canCrud ? 9 : 8;

                        if (toRender.length === 0) {
                          return (
                            <tr>
                              <td colSpan={totalCols} className="p-8 text-center text-gray-500 font-medium">Belum ada data pricelist uniform.</td>
                            </tr>
                          );
                        }

                        return toRender.map(brand => (
                          <React.Fragment key={brand}>
                            {/* Brand Section Header (Red) */}
                            <tr>
                              <td colSpan={totalCols} className="bg-[#990000] text-white font-black text-sm uppercase px-4 py-3 tracking-widest border border-gray-600 text-left">
                                {brand}
                              </td>
                            </tr>
                            {/* Column Headers (Black) */}
                            <tr className="bg-gray-900 text-white uppercase text-[11px] tracking-wider font-bold text-center">
                              <th rowSpan="2" className="p-3 border border-gray-700 align-middle min-w-[80px]">KODE</th>
                              <th rowSpan="2" className="p-3 border border-gray-700 align-middle min-w-[120px]">JENIS / KATEGORI PRODUK</th>
                              <th rowSpan="2" className="p-3 border border-gray-700 align-middle min-w-[200px]">NAMA PRODUK</th>
                              <th rowSpan="2" className="p-3 border border-gray-700 align-middle min-w-[90px]">BAHAN</th>
                              <th rowSpan="2" className="p-3 border border-gray-700 align-middle min-w-[80px]">VARIASI</th>
                              <th className="p-2 border border-gray-700 align-middle">
                                <span className="text-yellow-300">10%</span>
                              </th>
                              <th className="p-2 border border-gray-700 align-middle">
                                <span className="text-yellow-300">15%</span>
                              </th>
                              <th rowSpan="2" className="p-3 border border-gray-700 align-middle min-w-[130px]">HARGA JUAL OFFLINE</th>
                              {canCrud && <th rowSpan="2" className="p-3 border border-gray-700 align-middle">AKSI</th>}
                            </tr>
                            <tr className="bg-gray-900 text-white uppercase text-[11px] tracking-wider font-bold text-center">
                              <th className="p-2 border border-gray-700 align-middle min-w-[120px]">SALES MANAGER</th>
                              <th className="p-2 border border-gray-700 align-middle min-w-[110px]">SALES SPV</th>
                            </tr>
                            {grouped[brand].map((prod, idx) => {
                              const prefix = BRAND_PREFIX[brand] || 'PRD';
                              const autoKode = `${prefix}${String(idx + 1).padStart(3, '0')}`;
                              const displayKode = prod.kode || autoKode;
                              return (
                                <tr key={prod.id} className="hover:bg-red-50/50 transition-colors">
                                  <td className="p-2.5 font-bold text-gray-800 border border-gray-300 text-center text-xs">{displayKode}</td>
                                  <td className="p-2.5 text-center border border-gray-300 text-xs font-semibold text-gray-700">{getJenis(prod)}</td>
                                  <td className="p-2.5 font-bold text-gray-900 border border-gray-300">{prod.nama_produk}</td>
                                  <td className="p-2.5 text-center border border-gray-300 text-xs text-gray-600">{prod.bahan || 'UNIONE'}</td>
                                  <td className="p-2.5 text-center border border-gray-300 text-xs text-gray-500">{prod.variasi || '-'}</td>
                                  <td className="p-2.5 text-right border border-gray-300 text-xs font-medium text-gray-700">{formatRupiah(prod.harga_manager)}</td>
                                  <td className="p-2.5 text-right border border-gray-300 text-xs font-medium text-gray-700">{formatRupiah(prod.harga_spv)}</td>
                                  <td className="p-2.5 text-right border border-gray-300 text-xs font-bold text-gray-900 bg-gray-50">{formatRupiah(prod.harga_jual)}</td>
                                  {canCrud && (
                                    <td className="p-2 text-center border border-gray-300">
                                      <div className="flex justify-center gap-1.5">
                                        <button onClick={() => openEditModal(prod)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded transition-colors"><Edit size={13}/></button>
                                        <button onClick={() => handleDelete(prod.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded transition-colors"><Trash2 size={13}/></button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

          </div>
        </div>
      </main>

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="text-[#990000]" />
                {isEditing ? 'Edit Pricelist Produk' : 'Tambah Pricelist Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><Trash2 size={20} className="hidden" /> X</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-3">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">INFORMASI DASAR</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kode Produk <span className="text-gray-400 font-normal">(sesuai juklak, misal: HM001)</span></label>
                  <input type="text" name="kode" value={form.kode || ''} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold uppercase tracking-widest" placeholder="HM001" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk Lengkap * <span className="text-gray-400 font-normal">(digunakan untuk pencarian)</span></label>
                  <input type="text" name="nama_produk" value={form.nama_produk} onChange={handleInputChange} required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" placeholder="Contoh: FLP MERAH COWOK" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Order <span className="text-[#990000]">(tampil di deskripsi order)</span></label>
                  <input 
                    type="text" 
                    name="nama" 
                    list="nama-options"
                    value={form.nama || ''} 
                    onChange={handleInputChange} 
                    className="w-full p-2.5 bg-gray-50 border border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-200 outline-none text-sm font-semibold uppercase" 
                    placeholder="Pilih atau Ketik Manual..." 
                  />
                  <datalist id="nama-options">
                    <option value="SERAGAM" />
                    <option value="KEMEJA" />
                    <option value="CELANA" />
                    <option value="TOPI" />
                    <option value="WEARPACK" />
                    <option value="JAKET" />
                    <option value="ROMPI" />
                    <option value="ALMAMATER" />
                    <option value="PDH" />
                    <option value="POLO" />
                    <option value="KAOS" />
                  </datalist>
                  <p className="text-[10px] text-gray-400 mt-1">Pilih dari daftar untuk konsistensi, atau ketik manual jika tidak ada.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Produk</label>
                  <select name="kategori" value={form.kategori} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm">
                    <option value="Lainnya">Lainnya</option>
                    <option value="Seragam Mekanik">Seragam Mekanik</option>
                    <option value="Seragam Sekolah">Seragam Sekolah</option>
                    <option value="Seragam Kerja">Seragam Kerja</option>
                    <option value="PDH">PDH</option>
                    <option value="PDL">PDL</option>
                    <option value="Korsa">Korsa</option>
                    <option value="Jas">Jas</option>
                    <option value="Seragam SPG">Seragam SPG</option>
                    <option value="Aksesoris">Aksesoris</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Keterangan</label>
                  <textarea name="keterangan" value={form.keterangan} onChange={handleInputChange} rows={1} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm resize-none" placeholder="Catatan tambahan..."></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-3">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">HARGA DASAR</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">HPP (Modal) *</label>
                  <input type="number" name="hpp_satuan" value={form.hpp_satuan} onChange={handleInputChange} required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Margin (%) atau Rp</label>
                  <input type="text" name="margin" value={form.margin} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" placeholder="Contoh: 30% atau 15000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Jual Normal *</label>
                  <input type="number" name="harga_jual" value={form.harga_jual} onChange={handleInputChange} required className="w-full p-2.5 bg-gray-50 border border-red-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm font-bold text-[#990000]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-4">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2 mb-3">BATAS HARGA APPROVAL</h3>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Direktur</label>
                  <input type="number" name="harga_direktur" value={form.harga_direktur} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga General Manager</label>
                  <input type="number" name="harga_gm" value={form.harga_gm} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Sales Manager</label>
                  <input type="number" name="harga_manager" value={form.harga_manager} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Harga Sales SPV</label>
                  <input type="number" name="harga_spv" value={form.harga_spv} onChange={handleInputChange} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#990000] hover:bg-red-800 transition-colors flex items-center gap-2">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pricelist;
