import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import {
  Search, Plus, X, Trash2, Loader2, ShoppingBag, TrendingUp, DollarSign, UserCircle
} from 'lucide-react';

const SalesOnline = () => {
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

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/sales-online', {
        params: { startDate, endDate }
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
      const res = await axios.get('http://localhost:3000/api/produk');
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

  const handleSimpan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/sales-online', formData);
      setShowAddModal(false);
      // Reset form
      setFormData({
        ...formData,
        tanggal: todayDate,
        nama_produk: '', qty: 1, harga_satuan: '', potongan_marketplace: '', hpp_satuan: '', catatan: ''
      });
      fetchSales();
    } catch (err) {
      alert("Gagal menyimpan data: " + (err.response?.data?.message || err.message));
    }
  };

  const handleHapus = async (id) => {
    if (window.confirm("Yakin ingin menghapus data penjualan ini?")) {
      try {
        await axios.delete(`http://localhost:3000/api/sales-online/${id}`);
        fetchSales();
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
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
                    <p className="text-sm font-black text-gray-900">Admin</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Marketing & Sales</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col px-4 sm:px-10 pb-10 overflow-hidden">
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
                    <th className="py-4 px-6 text-right">Total Harga</th>
                    <th className="py-4 px-6 text-right">Potongan</th>
                    <th className="py-4 px-6 text-right text-green-400">Profit Bersih</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#990000] mx-auto" /></td></tr>
                  ) : filteredSales.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-20 text-gray-500 font-bold">Belum ada data penjualan online yang cocok.</td></tr>
                  ) : (
                    filteredSales.map((item) => (
                      <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="py-4 px-6">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-4 px-6 font-semibold text-gray-900">{item.akun_toko}</td>
                        <td className="py-4 px-6 font-medium text-gray-800">{item.nama_produk}</td>
                        <td className="py-4 px-6 text-center font-bold text-[#990000]">{item.qty}</td>
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
                      <input type="date" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                        value={formData.tanggal} onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                      />
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

                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nama Produk (Pilih atau Ketik)</label>
                    <input 
                      list="produk-list"
                      type="text" 
                      required 
                      placeholder="Cth: Wearpack Toyota" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.nama_produk} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const selectedProduct = products.find(p => p.nama_barang === val);
                        if (selectedProduct) {
                          setFormData({
                            ...formData,
                            nama_produk: val,
                            hpp_satuan: selectedProduct.harga_beli || '',
                            harga_satuan: selectedProduct.harga_jual || ''
                          });
                        } else {
                          setFormData({ ...formData, nama_produk: val });
                        }
                      }}
                    />
                    <datalist id="produk-list">
                      {products.map((p) => (
                        <option key={p.id_produk} value={p.nama_barang} />
                      ))}
                    </datalist>
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
                      <label className="text-xs font-semibold text-gray-600 mb-1.5 block">HPP Satuan (Modal)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-orange-500 text-sm font-semibold">Rp</span>
                        <input type="number" required placeholder="80525" className="w-full p-3 pl-10 bg-orange-50 border border-orange-100 rounded-xl text-sm font-semibold text-orange-700 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                          value={formData.hpp_satuan} onChange={(e) => setFormData({ ...formData, hpp_satuan: e.target.value })}
                        />
                      </div>
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