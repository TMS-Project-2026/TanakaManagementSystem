import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import {
  Search, Calendar, UserCircle, Plus,
  X, Trash2, Loader2, Edit2, Package, Clock, Download, Upload, Send
} from 'lucide-react';

const Marketing = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = (user.role || '').toLowerCase();
  const initialViewMode = userRole === 'marketing_online' ? 'online' : 'offline';
  
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [offlineLeads, setOfflineLeads] = useState([]);
  const [onlineLeads, setOnlineLeads] = useState([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    nama_customer: '',
    produk: '',
    qty: 1,
    harga_awal: '',
    diskon: '',
    harga_potongan: '',
    jenis_pembayaran: 'Lunas',
    nominal_dp: '',
    tanggal_masuk: new Date().toISOString().split('T')[0],
    deadline_final: '',
    catatan: ''
  });

  const [editingStatusId, setEditingStatusId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const statusOptions = ['Pending', 'Follow Up', 'Negosiasi', 'Deal', 'Batal'];

  const fileInputRef = useRef(null);

  // FIX 1: formatRupiah sekarang dipakai konsisten di seluruh komponen
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  const handleExportExcel = () => {
    const dataLeads = viewMode === 'online' ? onlineLeads : offlineLeads;
    if (dataLeads.length === 0) {
      alert("Tidak ada data untuk di-export!");
      return;
    }
    const dataForExport = dataLeads.map(item => ({
      'Nama Customer': item.nama_customer,
      'Produk': item.produk,
      'Qty': item.qty,
      'Harga Awal': item.harga_awal,
      'Diskon': item.diskon,
      'Harga Potongan': item.harga_potongan,
      'Pembayaran': item.jenis_pembayaran,
      'Nominal DP': item.nominal_dp,
      'Tgl Masuk': item.tanggal_masuk ? new Date(item.tanggal_masuk).toLocaleDateString('id-ID') : '',
      'Deadline': item.deadline_final ? new Date(item.deadline_final).toLocaleDateString('id-ID') : '',
      'Status': item.status,
      'Catatan': item.catatan || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 15 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 25 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, viewMode === 'online' ? 'Order Online' : 'Order Offline');
    XLSX.writeFile(workbook, `Order_${viewMode === 'online' ? 'Online' : 'Offline'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        alert("File Excel kosong!");
        return;
      }

      const token = localStorage.getItem('token');

      // FIX 2: Perbaikan konversi serial date Excel dengan koreksi timezone
      const parseDate = (val) => {
        if (!val) return '';
        if (typeof val === 'number') {
          // Koreksi timezone offset agar tidak geser 1 hari
          const utcMs = Math.round((val - 25569) * 86400 * 1000);
          const date = new Date(utcMs);
          const offset = date.getTimezoneOffset() * 60 * 1000;
          const localDate = new Date(utcMs + offset);
          return localDate.toISOString().split('T')[0];
        }
        if (typeof val === 'string') {
          const parts = val.split(/[-/]/);
          if (parts.length === 3 && parts[0].length <= 2) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          const d = new Date(val);
          if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
        }
        return '';
      };

      for (const row of jsonData) {
        const payload = {
          nama_customer: row['Nama Customer'] || row['nama_customer'] || 'Tanpa Nama',
          produk: row['Produk'] || row['produk'] || 'Tanpa Produk',
          qty: parseInt(row['Qty'] || row['qty']) || 1,
          harga_awal: parseFloat(row['Harga Awal'] || row['harga_awal']) || null,
          diskon: parseFloat(row['Diskon'] || row['diskon']) || 0,
          harga_potongan: parseFloat(row['Harga Potongan'] || row['harga_potongan']) || null,
          jenis_pembayaran: row['Pembayaran'] || row['jenis_pembayaran'] || 'Lunas',
          nominal_dp: parseFloat(row['Nominal DP'] || row['nominal_dp']) || 0,
          tanggal_masuk: parseDate(row['Tgl Masuk'] || row['tanggal_masuk']) || new Date().toISOString().split('T')[0],
          deadline_final: parseDate(row['Deadline'] || row['deadline_final']) || null,
          status: row['Status'] || row['status'] || 'Pending',
          catatan: row['Catatan'] || row['catatan'] || '',
          type: viewMode
        };
        await axios.post('http://localhost:3000/api/marketing', payload, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      alert(`Berhasil import ${jsonData.length} data!`);
      fetchLeads(viewMode);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Error import:", err);
      alert("Gagal import data: " + (err.response?.data?.message || err.message));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // FIX 3: Kirim type='offline' juga ke API agar filter backend konsisten
  const fetchLeads = async (mode = viewMode) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = { startDate, endDate, type: mode };
      const res = await axios.get('http://localhost:3000/api/marketing', {
        params,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (mode === 'online') setOnlineLeads(res.data);
      else setOfflineLeads(res.data);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(viewMode);
  }, [startDate, endDate, viewMode]);

  const handleSimpan = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData, type: viewMode };
      await axios.post('http://localhost:3000/api/marketing', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({
        nama_customer: '', produk: '', qty: 1,
        harga_awal: '', diskon: '', harga_potongan: '',
        jenis_pembayaran: 'Lunas', nominal_dp: '',
        tanggal_masuk: new Date().toISOString().split('T')[0],
        deadline_final: '', catatan: ''
      });
      fetchLeads(viewMode);
    } catch (err) {
      console.error("Error:", err);
      alert("Gagal menambah data pesanan: " + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateStatus = async (id, statusBaru) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/marketing/${id}`, { status: statusBaru }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchLeads(viewMode);
    } catch (err) {
      alert("Gagal mengupdate status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleHapus = async (id) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/api/marketing/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchLeads(viewMode);
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const handleAjukanFinance = async (id) => {
    if (window.confirm("Yakin ingin mengajukan pesanan ini ke Finance?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:3000/api/marketing/${id}/ajukan-finance`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Pesanan berhasil diajukan ke Finance.");
        fetchLeads(viewMode);
      } catch (err) {
        alert("Gagal mengajukan ke Finance: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // FIX 5: Handler tutup modal edit status juga reset newStatus
  const handleCloseEditModal = () => {
    setEditingStatusId(null);
    setNewStatus('');
  };

  const leads = viewMode === 'online' ? onlineLeads : offlineLeads;
  const filteredOrders = leads.filter((order) =>
    order.nama_customer?.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Cari nama customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Tab toggle only visible if not strictly restricted to one mode */}
            {!['marketing_online', 'marketing_offline'].includes(userRole) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('offline')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'offline' ? 'bg-[#990000] text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  Offline
                </button>
                <button
                  onClick={() => setViewMode('online')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${viewMode === 'online' ? 'bg-[#990000] text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  Online
                </button>
              </div>
            )}

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
              <div
                className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100"
                onClick={() => setShowProfile(!showProfile)}
              >
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

        {/* CONTENT */}
        <div className="flex-1 flex flex-col px-4 sm:px-10 pb-10 overflow-hidden">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                    <Package className="text-[#990000]" size={20} />
                  </div>
                  {viewMode === 'online' ? 'Data Order Online' : 'Data Order Offline'}
                </h2>
                <p className="text-sm text-gray-500 mt-2 font-medium">Kelola seluruh transaksi masuk secara profesional</p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#990000] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#7a0000] hover:shadow-md transition-all active:scale-95 whitespace-nowrap w-full sm:w-auto"
                >
                  <Plus size={18} /> Buat Pesanan
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

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </div>
            </div>

            {/* TABEL */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
              <div className="overflow-y-auto overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6">Produk</th>
                      <th className="py-4 px-6 text-center">Qty</th>
                      <th className="py-4 px-6">Pembayaran</th>
                      <th className="py-4 px-6 text-right">Harga Awal</th>
                      <th className="py-4 px-6 text-right">Diskon</th>
                      <th className="py-4 px-6 text-right">Hrg Sth Diskon</th>
                      <th className="py-4 px-6">Tgl Masuk</th>
                      <th className="py-4 px-6">Deadline</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {/* FIX 7: colSpan diperbaiki dari 9 menjadi 11 sesuai jumlah kolom */}
                    {loading ? (
                      <tr>
                        <td colSpan="11" className="text-center py-12">
                          <Loader2 className="animate-spin mx-auto text-[#990000]" size={32} />
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="text-center py-12 text-gray-400 text-sm">
                          Tidak ada data ditemukan.
                        </td>
                      </tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{order.nama_customer}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-800">{order.produk}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="font-semibold text-[#990000]">{order.qty} pcs</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${order.jenis_pembayaran === 'DP' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-100 text-gray-600'}`}>
                            {order.jenis_pembayaran}
                          </span>
                          {order.jenis_pembayaran === 'DP' && (
                            <div className="text-xs text-gray-600 font-semibold mt-1.5">
                              {/* FIX 8: Gunakan formatRupiah yang sudah didefinisikan */}
                              {formatRupiah(order.nominal_dp)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {order.harga_awal ? formatRupiah(order.harga_awal) : '-'}
                        </td>
                        <td className="py-4 px-6 text-right text-red-600 font-semibold">
                          {order.diskon && Number(order.diskon) > 0 ? `- ${formatRupiah(order.diskon)}` : '-'}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-gray-900">
                          {order.harga_potongan ? formatRupiah(order.harga_potongan) : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar size={14} className="text-gray-400" />
                            {order.tanggal_masuk
                              ? new Date(order.tanggal_masuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-[#990000] font-semibold">
                            <Clock size={14} />
                            {order.deadline_final
                              ? new Date(order.deadline_final).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '-'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider inline-block ${order.status === 'Pending' ? 'bg-gray-100 text-gray-700' :
                            order.status === 'Follow Up' ? 'bg-blue-50 text-blue-700' :
                              order.status === 'Negosiasi' ? 'bg-yellow-50 text-yellow-700' :
                                order.status === 'Deal' ? 'bg-green-50 text-green-700' :
                                  order.status === 'Batal' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center gap-2">
                            {order.status === 'Deal' && (
                              <button
                                onClick={() => handleAjukanFinance(order.id)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ajukan ke Finance"
                              >
                                <Send size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => { setEditingStatusId(order.id); setNewStatus(order.status || 'Pending'); }}
                              className="p-1.5 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-lg transition-colors"
                              title="Edit Status"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleHapus(order.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
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
        </div>

        {/* MODAL TAMBAH */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200 border border-gray-100 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Input Pesanan Baru</h2>
                  <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk mencatat transaksi.</p>
                </div>
                <button
                  className="p-2 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-xl transition-colors"
                  onClick={() => setShowAddModal(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSimpan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Nama Customer</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.nama_customer}
                      onChange={(e) => setFormData({ ...formData, nama_customer: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Produk</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.produk}
                      onChange={(e) => setFormData({ ...formData, produk: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.qty}
                      onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Harga Awal (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-semibold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                        value={formData.harga_awal}
                        onChange={(e) => setFormData({ ...formData, harga_awal: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#990000] mb-1.5 block">Diskon (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-red-500 text-sm font-semibold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-3 pl-10 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-[#990000] focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                        value={formData.diskon}
                        onChange={(e) => {
                          const diskonVal = parseFloat(e.target.value) || 0;
                          const hargaAwal = parseFloat(formData.harga_awal) || 0;
                          const newPotongan = hargaAwal - diskonVal;
                          setFormData({
                            ...formData,
                            diskon: e.target.value,
                            // FIX 9: Gunakan parseFloat agar kalkulasi harga potongan akurat
                            harga_potongan: newPotongan > 0 ? newPotongan : ''
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Harga Setelah Diskon (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-gray-400 text-sm font-semibold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                        value={formData.harga_potongan}
                        onChange={(e) => setFormData({ ...formData, harga_potongan: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className={formData.jenis_pembayaran === 'DP' ? 'col-span-1' : 'col-span-1 sm:col-span-2'}>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Jenis Pembayaran</label>
                    <select
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all cursor-pointer"
                      value={formData.jenis_pembayaran}
                      onChange={(e) => setFormData({ ...formData, jenis_pembayaran: e.target.value })}
                    >
                      <option value="DP">DP</option>
                      <option value="Non DP">Non DP</option>
                      <option value="Lunas">Lunas</option>
                    </select>
                  </div>
                  {formData.jenis_pembayaran === 'DP' && (
                    <div>
                      <label className="text-xs font-bold text-[#990000] mb-1.5 block">Nominal DP</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-red-500 text-sm font-semibold">Rp</span>
                        <input
                          type="number"
                          min="0"
                          className="w-full p-3 pl-10 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-[#990000] focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                          value={formData.nominal_dp}
                          onChange={(e) => setFormData({ ...formData, nominal_dp: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Tgl Masuk</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.tanggal_masuk}
                      onChange={(e) => setFormData({ ...formData, tanggal_masuk: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Deadline Akhir</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.deadline_final}
                      onChange={(e) => setFormData({ ...formData, deadline_final: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-xs font-bold text-gray-900 mb-1.5 block">Catatan</label>
                    <textarea
                      rows={3}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all resize-none"
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      placeholder="Tambahkan catatan (opsional)..."
                    />
                  </div>
                </div>
                <div className="pt-5 mt-2 border-t border-gray-100">
                  <button
                    type="submit"
                    className="w-full bg-[#990000] text-white py-3.5 rounded-xl font-bold tracking-wide shadow-sm hover:bg-[#7a0000] transition-colors"
                  >
                    SIMPAN DATA PESANAN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT STATUS */}
        {editingStatusId && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200 border border-gray-100">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Ubah Status Pesanan</h2>
                  <p className="text-xs text-gray-500 mt-1">Pilih status baru untuk pesanan ini.</p>
                </div>
                {/* FIX 10: Tombol X sekarang reset newStatus juga */}
                <button
                  className="p-2 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-xl transition-colors"
                  onClick={handleCloseEditModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      handleUpdateStatus(editingStatusId, status);
                      handleCloseEditModal();
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 font-semibold transition-all ${newStatus === status
                      ? 'border-[#990000] bg-red-50 text-[#990000]'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{status}</span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newStatus === status ? 'border-[#990000] bg-[#990000]' : 'border-gray-300'
                        }`}>
                        {newStatus === status && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketing;