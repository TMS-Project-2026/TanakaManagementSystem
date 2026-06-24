import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import {
  Search, Plus, X, Trash2, Loader2, ShoppingBag, TrendingUp, DollarSign, UserCircle, Download, Upload
} from 'lucide-react';

const SalesOnline = () => {
  // Fungsi untuk format tanggal dari YYYY-MM-DD ke DD/MM/YYYY
  const formatDateInput = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Fungsi untuk konversi DD/MM/YYYY ke YYYY-MM-DD (lebih lenient)
  const parseDateInput = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    let [day, month, year] = parts;
    
    // Validate input
    day = parseInt(day);
    month = parseInt(month);
    year = parseInt(year);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
    if (day < 1 || day > 31 || month < 1 || month > 12) return '';
    
    // Jika tahun hanya 2 digit, anggap 20XX
    if (year < 100) year += 2000;
    
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  // State untuk Filter Tanggal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const todayDate = new Date().toISOString().split('T')[0];

  // State untuk form input (Sesuai kolom Excel)
  const [formData, setFormData] = useState({
    tanggal: todayDate,
    akun_toko: 'BANUA MITRA LESTARI',
    nama_produk: '',
    qty: 1,
    harga_satuan: '',
    potongan_marketplace: '',
    hpp_satuan: '',
    catatan: ''
  });

  const [products, setProducts] = useState([]);

  // State untuk dropdown produk dan rekomendasi
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');

  // State untuk format tanggal manual (DD/MM/YYYY)
  const [manualDate, setManualDate] = useState(formatDateInput(todayDate));

  // Ref untuk file input import
  const fileInputRef = useRef(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/sales-online', {
        params: { startDate, endDate },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSales(res.data);
    } catch (err) {
      console.error("Gagal ambil data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/produk', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Gagal ambil produk", err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Init manualDate saat modal dibuka
  useEffect(() => {
    if (showAddModal) {
      setManualDate(formatDateInput(formData.tanggal));
    }
  }, [showAddModal]);

  // Fungsi untuk filter produk berdasarkan input
  const handleProductSearch = (value) => {
    setProductSearch(value);
    if (value.trim()) {
      const filtered = products.filter(p =>
        p.nama_produk.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowProductDropdown(filtered.length > 0);
    } else {
      setFilteredProducts([]);
      setShowProductDropdown(false);
    }
  };

  // Fungsi untuk pilih produk dari dropdown
  const handleSelectProduct = (product) => {
    setFormData({
      ...formData,
      nama_produk: product.nama_produk,
      hpp_satuan: product.hpp_satuan || ''
    });
    setProductSearch(product.nama_produk);
    setShowProductDropdown(false);
  };

  // Fungsi untuk update tanggal dari date picker
  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setFormData({ ...formData, tanggal: dateValue });
    if (dateValue) {
      setManualDate(formatDateInput(dateValue));
    } else {
      setManualDate('');
    }
  };

  // Fungsi untuk update tanggal dari input manual
  const handleManualDateInput = (e) => {
    const value = e.target.value;
    setManualDate(value);
    
    if (value === '') {
      // Jika input kosong, set ke hari ini
      setFormData({ ...formData, tanggal: todayDate });
    } else {
      const parsed = parseDateInput(value);
      if (parsed) {
        setFormData({ ...formData, tanggal: parsed });
      }
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/sales-online', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setShowAddModal(false);
      // Reset form
      setFormData({
        ...formData,
        tanggal: todayDate,
        nama_produk: '', qty: 1, harga_satuan: '', potongan_marketplace: '', hpp_satuan: '', catatan: ''
      });
      setProductSearch('');
      setManualDate(formatDateInput(todayDate));
      setShowProductDropdown(false);
      fetchSales();
    } catch (err) {
      alert("Gagal menyimpan data: " + (err.response?.data?.message || err.message));
    }
  };

  const handleHapus = async (id) => {
    if (window.confirm("Yakin ingin menghapus data penjualan ini?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/api/sales-online/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchSales();
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Fungsi Export Data ke Excel
  const handleExportExcel = () => {
    if (sales.length === 0) {
      alert("Tidak ada data untuk di-export!");
      return;
    }

    const dataForExport = sales.map(item => ({
      'Tanggal': new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'Akun Toko': item.akun_toko,
      'Produk': item.nama_produk,
      'Qty': item.qty,
      'Harga Satuan': item.harga_satuan,
      'Total Harga': item.total_harga,
      'Potongan Marketplace': item.potongan_marketplace,
      'Profit Bersih': item.profit,
      'Catatan': item.catatan || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    worksheet['!cols'] = [
      { wch: 15 }, // Tanggal
      { wch: 20 }, // Akun Toko
      { wch: 25 }, // Produk
      { wch: 8 },  // Qty
      { wch: 15 }, // Harga Satuan
      { wch: 15 }, // Total Harga
      { wch: 18 }, // Potongan Marketplace
      { wch: 15 }, // Profit Bersih
      { wch: 25 }  // Catatan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Online');
    XLSX.writeFile(workbook, `Sales_Online_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Fungsi Import Data dari Excel
  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("File Excel kosong!");
        return;
      }

      // Transform data dari Excel ke format yang sesuai dengan backend
      const importedData = jsonData.map(row => {
        // Parse tanggal dari berbagai format
        let tanggal = '';
        if (row['Tanggal']) {
          const dateStr = row['Tanggal'].toString();
          // Jika sudah dalam format YYYY-MM-DD
          if (dateStr.includes('-')) {
            tanggal = dateStr;
          } else {
            // Parse dari format DD/MM/YYYY atau format lain
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              tanggal = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
        }

        return {
          tanggal: tanggal || new Date().toISOString().split('T')[0],
          akun_toko: row['Akun Toko'] || 'BANUA MITRA LESTARI',
          nama_produk: row['Produk'] || '',
          qty: parseInt(row['Qty']) || 1,
          harga_satuan: parseFloat(row['Harga Satuan']) || 0,
          potongan_marketplace: parseFloat(row['Potongan Marketplace']) || 0,
          hpp_satuan: 0,
          catatan: row['Catatan'] || ''
        };
      });

      // Validasi data minimal
      const validData = importedData.filter(row => row.nama_produk && row.harga_satuan > 0);
      if (validData.length === 0) {
        alert("Tidak ada data valid untuk di-import. Pastikan kolom 'Produk' dan 'Harga Satuan' terisi!");
        return;
      }

      // Import data ke database
      const token = localStorage.getItem('token');
      let successCount = 0;
      let errorCount = 0;

      for (const data of validData) {
        try {
          await axios.post('http://localhost:3000/api/sales-online', data, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          successCount++;
        } catch (error) {
          console.error(`Gagal import data: ${data.nama_produk}`, error);
          errorCount++;
        }
      }

      alert(`Import selesai!\n✓ Berhasil: ${successCount} data\n✗ Gagal: ${errorCount} data`);
      fetchSales();
    } catch (err) {
      console.error("Gagal baca file Excel", err);
      alert("Gagal membaca file Excel. Pastikan format file benar!");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredSales = sales.filter((item) =>
    item.nama_produk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.akun_toko?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari produk atau nama toko..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">

          <NotificationBell />
            {/* FILTER TANGGAL (Pindahan) */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-gray-400 px-3 pt-0.5 uppercase tracking-wider leading-none">Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-black text-gray-700 bg-transparent outline-none cursor-pointer px-3 leading-none pb-0.5"
                />
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-gray-400 px-3 pt-0.5 uppercase tracking-wider leading-none">Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-black text-gray-700 bg-transparent outline-none cursor-pointer px-3 leading-none pb-0.5"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="ml-1 text-[10px] bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold hover:bg-red-100 transition-colors mr-0.5"
                >
                  Reset
                </button>
              )}
            </div>
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

        <div className="flex-1 flex flex-col px-4 sm:px-10 pb-10 overflow-hidden">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                  <ShoppingBag className="text-[#990000]" size={20} />
                </div>
                Data Sales Marketplace
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Input data penjualan Shopee, TikTok, dll untuk dihitung profitnya otomatis</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#990000] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#7a0000] hover:shadow-md transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <Plus size={18} className="text-white" /> Input Penjualan
              </button>

              <button
                onClick={handleExportExcel}
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-green-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <Download size={18} /> Export Excel
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <Upload size={18} /> Import Excel
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </div>
          </div>

          {/* TABEL DATA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-6">Tanggal</th>
                    <th className="py-4 px-6">Akun Toko</th>
                    <th className="py-4 px-6">Produk</th>
                    <th className="py-4 px-6 text-center">Qty</th>
                    <th className="py-4 px-6 text-right">Harga Satuan</th>
                    <th className="py-4 px-6 text-right">Total Harga</th>
                    <th className="py-4 px-6 text-right">Potongan</th>
                    <th className="py-4 px-6 text-right text-green-400">Profit Bersih</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="9" className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#990000] mx-auto" /></td></tr>
                  ) : filteredSales.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-20 text-gray-500 font-bold">Belum ada data penjualan online yang cocok.</td></tr>
                  ) : (
                    filteredSales.map((item) => (
                      <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="py-4 px-6">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-4 px-6 font-semibold text-gray-900">{item.akun_toko}</td>
                        <td className="py-4 px-6 font-medium text-gray-800">{item.nama_produk}</td>
                        <td className="py-4 px-6 text-center font-bold text-[#990000]">{item.qty}</td>
                        <td className="py-4 px-6 text-right font-medium">{formatRupiah(item.harga_satuan)}</td>
                        <td className="py-4 px-6 text-right font-medium">{formatRupiah(item.total_harga)}</td>
                        <td className="py-4 px-6 text-right text-red-500 font-medium">{formatRupiah(item.potongan_marketplace)}</td>
                        <td className="py-4 px-6 text-right font-bold text-green-600 bg-green-50/30">{formatRupiah(item.profit)}</td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => handleHapus(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>

          {/* MODAL INPUT DATA EXCEL */}
          {showAddModal && (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Input Data Sales Marketplace</h2>
                    <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk mencatat penjualan online.</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSimpan} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tanggal</label>
                      <div className="flex gap-2 flex-col sm:flex-row">
                        {/* Input Manual DD/MM/YYYY */}
                        <div className="flex-1">
                          <input 
                            type="text" 
                            placeholder="27/04/2026"
                            value={manualDate}
                            onChange={handleManualDateInput}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Ketik format DD/MM/YYYY</p>
                        </div>
                        {/* Date Picker */}
                        <div className="flex-1">
                          <input 
                            type="date" 
                            value={formData.tanggal}
                            onChange={handleDateChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all cursor-pointer"
                          />
                          <p className="text-[10px] text-gray-400 mt-1">Atau pilih dari kalender</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Akun Toko</label>
                      <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all cursor-pointer"
                        value={formData.akun_toko} onChange={(e) => setFormData({ ...formData, akun_toko: e.target.value })}>
                        <option value="BANUA MITRA LESTARI">BANUA MITRA LESTARI</option>
                        <option value="THESUNANS7">THESUNANS7</option>
                        <option value="TEXASUNIFORM">TEXASUNIFORM</option>
                        <option value="FASHIONGARDEN">FASHIONGARDEN</option>
                        <option value="TIKTOK BML">TIKTOK BML</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nama Produk (Pilih atau Ketik)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Cth: Wearpack Toyota" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={productSearch}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      onFocus={() => productSearch && setShowProductDropdown(true)}
                    />
                    
                    {/* Dropdown Rekomendasi Produk */}
                    {showProductDropdown && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className="px-4 py-2.5 hover:bg-red-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm font-semibold text-gray-900"
                          >
                            {product.nama_produk}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Qty</label>
                      <input type="number" required min="1" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                        value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Harga Jual Satuan (Price)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-semibold">Rp</span>
                        <input type="number" required placeholder="145000" className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                          value={formData.harga_satuan} onChange={(e) => setFormData({ ...formData, harga_satuan: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#990000] mb-1.5 block">Potongan Marketplace</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-red-500 text-sm font-semibold">Rp</span>
                        <input type="number" required placeholder="29844" className="w-full p-3 pl-10 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-[#990000] focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                          value={formData.potongan_marketplace} onChange={(e) => setFormData({ ...formData, potongan_marketplace: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">HPP Satuan (Modal) - Otomatis</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-orange-500 text-sm font-semibold">Rp</span>
                        <input 
                          type="number" 
                          placeholder="0" 
                          readOnly
                          className="w-full p-3 pl-10 bg-orange-50 border border-orange-100 rounded-xl text-sm font-semibold text-orange-700 outline-none cursor-not-allowed"
                          value={formData.hpp_satuan} 
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">*Terisi otomatis dari database saat memilih produk</p>
                    </div>
                  </div>

                  <div className="pt-5 mt-2 border-t border-gray-100">
                    <button type="submit" className="w-full bg-[#990000] text-white py-3.5 rounded-xl font-bold tracking-wide shadow-sm hover:bg-[#7a0000] transition-colors">
                      SIMPAN PENJUALAN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default SalesOnline;