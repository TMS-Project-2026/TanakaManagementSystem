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
    nama_produk: '',
    nama: '',
    kategori: 'Lainnya',
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
      nama_produk: prod.nama_produk || '',
      nama: prod.nama || '',
      kategori: prod.kategori || 'Lainnya',
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

        // Parse data starting from row index where NAMA is found, or assume row 3/4 based on the image format
        // The image has a complex header. Let's do a simple mapping by looking for rows with actual data.
        // Or better yet, expect a flat CSV/Excel format for import or try to map columns based on index if format is strict.
        // Let's do a robust parsing: find the row containing 'NAMA' or 'nama' in the first cell, and map following rows.
        
        let headerRowIdx = -1;
        for (let i = 0; i < data.length; i++) {
          if (data[i][0] && typeof data[i][0] === 'string' && data[i][0].toUpperCase().includes('NAMA')) {
            headerRowIdx = i;
            break;
          }
        }

        let startRow = headerRowIdx > -1 ? headerRowIdx + 2 : 1; // Skip the multi-line header

        const payload = [];
        let lastKategori = '';

        for (let i = startRow; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 5) continue;

          // Handle merged cells in NAMA column (if cell is empty, use previous NAMA)
          let nama_produk = row[0] ? String(row[0]).trim() : lastKategori;
          if (row[0]) lastKategori = nama_produk;

          if (!nama_produk) continue;

          // Parse currency strings like "Rp88.799,46" -> 88799.46
          const parseRupiah = (val) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            const clean = val.replace(/Rp/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
            return Number(clean) || 0;
          };

          let bahan = row[1] ? String(row[1]).trim() : '';
          let variasi = row[2] ? String(row[2]).trim() : '';
          let fullNama = [nama_produk, bahan, variasi].filter(Boolean).join(' ');

          payload.push({
            nama_produk: fullNama,
            hpp_satuan: parseRupiah(row[3]),
            harga_direktur: parseRupiah(row[4]),
            harga_gm: parseRupiah(row[5]),
            harga_manager: parseRupiah(row[6]),
            harga_spv: parseRupiah(row[7]),
            harga_jual: parseRupiah(row[8]),
            keterangan: row[9] ? String(row[9]).trim() : ''
          });
        }

        if (payload.length > 0) {
          const res = await api.post('/produk/import', payload);
          alert(res.data.message || 'Import berhasil!');
          fetchProducts();
        } else {
          alert('Tidak ada data produk yang valid untuk diimport.');
        }
      } catch (error) {
        console.error('Error importing file', error);
        alert('Gagal import file: ' + error.message);
      } finally {
        setLoading(false);
        e.target.value = ''; // Reset file input
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredProducts = products.filter(p => 
    p.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bahan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategory = (prod) => {
    if (prod.kategori && prod.kategori !== 'Lainnya') return prod.kategori;
    const name = (prod.nama_produk || '').toLowerCase();
    
    if (name.includes('mekanik') || name.includes('wearpack') || name.includes('flp') || name.includes('sales')) return 'Seragam Mekanik';
    if (name.includes('sekolah') || name.includes('sd') || name.includes('smp') || name.includes('sma') || name.includes('pramuka')) return 'Seragam Sekolah';
    if (name.includes('pdh')) return 'PDH';
    if (name.includes('pdl')) return 'PDL';
    if (name.includes('korsa')) return 'Korsa';
    if (name.includes('jas') || name.includes('almamater')) return 'Jas';
    if (name.includes('spg') || name.includes('sppg')) return 'Seragam SPG';
    if (name.includes('topi') || name.includes('dasi') || name.includes('kaos kaki') || name.includes('sabuk') || name.includes('bet') || name.includes('lokasi')) return 'Aksesoris';
    if (name.includes('kerja') || name.includes('kemeja') || name.includes('wangky')) return 'Seragam Kerja';
    
    return 'Lainnya';
  };

  const categoryOrder = [
    'Seragam Mekanik',
    'Seragam Sekolah',
    'Seragam Kerja',
    'PDH',
    'PDL',
    'Korsa',
    'Jas',
    'Seragam SPG',
    'Aksesoris',
    'Lainnya'
  ];

  const groupedProducts = {};
  categoryOrder.forEach(cat => groupedProducts[cat] = []);
  
  filteredProducts.forEach(prod => {
    const cat = getCategory(prod);
    if (!groupedProducts[cat]) groupedProducts[cat] = [];
    groupedProducts[cat].push(prod);
  });

  const categoriesToRender = categoryOrder.filter(cat => groupedProducts[cat] && groupedProducts[cat].length > 0);

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
                    <p className="text-sm font-black text-gray-900">Admin</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Finance</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                Pricelist Harga
              </h1>
              <p className="text-gray-500 font-medium mt-1 text-sm">Kelola data harga produk untuk direktur, manager, spv, dan harga jual.</p>
            </div>
            <div className="flex items-center gap-3">
              {canCrud && (
                <>
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
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${loading ? 'bg-gray-400 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                      Import Excel
                    </label>
                  </div>
                </>
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

          {/* Total Info */}
          <div className="mb-6 flex justify-end">
            <div className="text-sm text-gray-500 font-medium flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
               <Package size={16}/> Total: <span className="font-bold text-gray-900">{filteredProducts.length} Produk</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead className="bg-gray-900 text-white uppercase text-[11px] tracking-wider font-bold text-center">
                <tr>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">KODE PRODUK</th>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">JENIS PRODUK</th>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">NAMA PRODUK (Lengkap)</th>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">NAMA ORDER <span className="text-yellow-300">(tampil di order)</span></th>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">HPP</th>
                  <th colSpan="4" className="p-2 border border-gray-700 align-middle">MARGIN</th>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">HARGA JUAL</th>
                  <th rowSpan="2" className="p-3 border border-gray-700 align-middle">KETERANGAN</th>
                  {canCrud && <th rowSpan="2" className="p-3 border border-gray-700 align-middle">AKSI</th>}
                </tr>
                <tr>
                  <th className="p-2 border border-gray-700 align-middle">DIREKTUR</th>
                  <th className="p-2 border border-gray-700 align-middle">GENERAL MANEGER</th>
                  <th className="p-2 border border-gray-700 align-middle">SALES MANEGER</th>
                  <th className="p-2 border border-gray-700 align-middle">SALES SPV</th>
                </tr>
              </thead>
              <tbody>
                {categoriesToRender.map(cat => (
                  <React.Fragment key={cat}>
                    <tr>
                      <td colSpan="14" className="p-3 font-black text-[#990000] border border-gray-400 bg-red-50 text-left text-sm">
                        {cat.toUpperCase()} ({groupedProducts[cat].length})
                      </td>
                    </tr>
                    {groupedProducts[cat].map((prod, index) => (
                      <tr key={prod.id} className="hover:bg-red-50/50 transition-colors">
                        <td className="p-3 font-bold text-gray-800 border border-gray-400 text-center">PRD-{prod.id}</td>
                        <td className="p-3 font-medium text-gray-800 border border-gray-400 text-center">{prod.kategori || 'Lainnya'}</td>
                        <td className="p-3 font-bold text-gray-800 border border-gray-400">{prod.nama_produk}</td>
                        <td className="p-3 border border-gray-400">
                          {prod.nama
                            ? <span className="font-semibold text-[#990000]">{prod.nama}</span>
                            : <span className="text-gray-300 italic text-xs">-</span>
                          }
                        </td>
                        <td className="p-3 text-right text-gray-800 font-medium border border-gray-400">{formatRupiah(prod.hpp_satuan)}</td>
                        <td className="p-3 text-right text-gray-700 font-medium border border-gray-400">{formatRupiah(prod.harga_direktur)}</td>
                        <td className="p-3 text-right text-gray-700 font-medium border border-gray-400">{formatRupiah(prod.harga_gm)}</td>
                        <td className="p-3 text-right text-gray-700 font-medium border border-gray-400">{formatRupiah(prod.harga_manager)}</td>
                        <td className="p-3 text-right text-gray-700 font-medium border border-gray-400">{formatRupiah(prod.harga_spv)}</td>
                        <td className="p-3 text-right font-black text-gray-900 border border-gray-400 bg-gray-50">{formatRupiah(prod.harga_jual)}</td>
                        <td className="p-3 text-gray-600 text-xs max-w-[150px] truncate border border-gray-400">{prod.keterangan || '-'}</td>
                        {canCrud && (
                          <td className="p-2 text-center border border-gray-400">
                            <div className="flex justify-center gap-1.5">
                              <button onClick={() => openEditModal(prod)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded transition-colors"><Edit size={14}/></button>
                              <button onClick={() => handleDelete(prod.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded transition-colors"><Trash2 size={14}/></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan="14" className="p-8 text-center text-gray-500 font-medium">Belum ada data pricelist.</td>
                    </tr>
                  )}
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
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk Lengkap * <span className="text-gray-400 font-normal">(digunakan untuk pencarian)</span></label>
                  <input type="text" name="nama_produk" value={form.nama_produk} onChange={handleInputChange} required className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 outline-none text-sm" placeholder="Contoh: KEMEJA UNIONE PENDEK" />
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
