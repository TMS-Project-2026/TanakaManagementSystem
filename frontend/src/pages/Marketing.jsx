import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Search, Calendar, UserCircle, Plus,
  X, Trash2, Loader2, LogOut, CheckCircle2, Package, Clock, DollarSign
} from 'lucide-react';

const Marketing = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // State untuk Filter Tanggal
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    nama_customer: '',
    produk: '',
    qty: 1,
    jenis_pembayaran: 'Lunas',
    nominal_dp: '',
    tanggal_masuk: '',
    deadline_final: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/marketing', {
        params: { startDate, endDate }
      });
      setLeads(res.data);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [startDate, endDate]);

  const handleSimpan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/marketing', formData);
      setShowAddModal(false);
      setFormData({
        nama_customer: '', produk: '', qty: 1,
        jenis_pembayaran: 'Lunas', nominal_dp: '',
        tanggal_masuk: '', deadline_final: ''
      });
      fetchLeads();
    } catch (err) {
      alert("Gagal menambah data pesanan. Cek koneksi backend atau struktur database.");
    }
  };

  const handleUpdateStatus = async (id, statusBaru) => {
    try {
      await axios.put(`http://localhost:3000/api/marketing/${id}`, { status: statusBaru });
      fetchLeads();
    } catch (err) {
      alert("Gagal mengupdate status.");
    }
  };

  const handleHapus = async (id) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        await axios.delete(`http://localhost:3000/api/marketing/${id}`);
        fetchLeads();
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const filteredOrders = leads.filter((order) =>
    order.nama_customer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-16 md:pt-0">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama customer..."
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

        {/* CONTENT */}
        <div className="px-4 sm:px-10 pb-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                  <Package className="text-[#990000]" size={20} />
                </div>
                Data Order Offline
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Kelola seluruh transaksi masuk secara profesional</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">


              <button
                onClick={() => setShowAddModal(true)}
                className="bg-[#990000] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#7a0000] hover:shadow-md transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <Plus size={18} className="text-white" /> Buat Pesanan
              </button>
            </div>
          </div>

          {/* TABEL PROFESIONAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Produk & Qty</th>
                    <th className="py-4 px-6">Pembayaran</th>
                    <th className="py-4 px-6">Tgl Masuk</th>
                    <th className="py-4 px-6">Deadline</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="6" className="text-center py-12"><Loader2 className="animate-spin mx-auto text-[#990000]" size={32} /></td></tr>
                  ) : filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{order.nama_customer}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800">{order.produk}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Quantity: <span className="font-semibold text-[#990000]">{order.qty} pcs</span></div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${order.jenis_pembayaran === 'DP' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-100 text-gray-600'}`}>
                          {order.jenis_pembayaran}
                        </span>
                        {order.jenis_pembayaran === 'DP' && (
                          <div className="text-xs text-gray-600 font-semibold mt-1.5 flex items-center gap-1">
                            Rp {Number(order.nominal_dp).toLocaleString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          {order.tanggal_masuk ? new Date(order.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-[#990000] font-semibold">
                          <Clock size={14} />
                          {order.deadline_final ? new Date(order.deadline_final).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleUpdateStatus(order.id, 'Selesai')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Tandai Selesai">
                            <CheckCircle2 size={18} />
                          </button>
                          <button onClick={() => handleHapus(order.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MODAL TAMBAH (PROFESSIONAL SAAS THEME) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200 border border-gray-100 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Input Pesanan Baru</h2>
                  <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk mencatat transaksi.</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-xl transition-colors" onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSimpan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Nama Customer</label>
                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all" value={formData.nama_customer} onChange={(e) => setFormData({ ...formData, nama_customer: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Produk</label>
                    <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all" value={formData.produk} onChange={(e) => setFormData({ ...formData, produk: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Quantity</label>
                    <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all" value={formData.qty} onChange={(e) => setFormData({ ...formData, qty: e.target.value })} required />
                  </div>
                  <div className={formData.jenis_pembayaran === 'DP' ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Jenis Pembayaran</label>
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all cursor-pointer" value={formData.jenis_pembayaran} onChange={(e) => setFormData({ ...formData, jenis_pembayaran: e.target.value })}>
                      <option value="DP">DP</option>
                      <option value="Non DP">Non DP</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                  {formData.jenis_pembayaran === 'DP' && (
                    <div>
                      <label className="text-xs font-bold text-[#990000] mb-1.5 block">Nominal DP</label>
                      <input type="number" className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-[#990000] focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all" value={formData.nominal_dp} onChange={(e) => setFormData({ ...formData, nominal_dp: e.target.value })} required />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Tgl Masuk</label>
                    <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all" value={formData.tanggal_masuk} onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Deadline Akhir</label>
                    <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all" value={formData.deadline_final} onChange={(e) => setFormData({ ...formData, deadline_final: e.target.value })} required />
                  </div>
                </div>
                <div className="pt-5 mt-2 border-t border-gray-100">
                  <button type="submit" className="w-full bg-[#990000] text-white py-3.5 rounded-xl font-bold tracking-wide shadow-sm hover:bg-[#7a0000] transition-colors">
                    SIMPAN DATA PESANAN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketing;