import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, ShoppingBag, Package, FileText, Upload,
  TrendingUp, Users, DollarSign, Calendar, Search, Loader2,
  CheckCircle, AlertTriangle, ArrowRight, X, Download, Send
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const MarketingOnlineBanua = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Data States
  const [dashboardData, setDashboardData] = useState({
    revenueToday: 0, ordersToday: 0, topProducts: [], salesChart: []
  });
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reports, setReports] = useState({ harian: [], bulanan: [] });
  
  // Import State
  const [importPreview, setImportPreview] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Formatting utils
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // API Calls
  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-banua/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-banua/orders', { headers: { Authorization: `Bearer ${token}` } });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-banua/inventory', { headers: { Authorization: `Bearer ${token}` } });
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-banua/reports', { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAjukanFinance = async (id) => {
    if (window.confirm("Yakin ingin mengajukan pesanan online ini ke Finance?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://localhost:3000/api/marketing-online-banua/orders/${id}/ajukan-finance`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Pesanan berhasil diajukan ke Finance.");
        fetchOrders(); // Refresh data
      } catch (err) {
        alert("Gagal mengajukan ke Finance: " + (err.response?.data?.message || err.message));
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'inventory') fetchInventory();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  // Handle Excel Import
  const handleFileUpload = async (event) => {
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

      // Map Shopee fields to DB fields
      const mappedData = jsonData.map(row => {
        // Try to find the keys ignoring case/spaces
        const getField = (possibleNames) => {
          const key = Object.keys(row).find(k => possibleNames.some(p => k.toLowerCase().includes(p)));
          return key ? row[key] : '';
        };

        let tanggal = getField(['tanggal', 'waktu', 'date']);
        if (!tanggal) tanggal = new Date().toISOString().split('T')[0];
        // Ensure format YYYY-MM-DD
        if (typeof tanggal === 'string' && tanggal.includes('/')) {
            const parts = tanggal.split(' ')[0].split('/');
            if (parts.length === 3) tanggal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        return {
          customer_name: getField(['nama', 'pembeli', 'username', 'customer']) || 'Anonim',
          product_name: getField(['produk', 'barang', 'product']) || 'Produk Tidak Diketahui',
          qty: parseInt(getField(['qty', 'jumlah', 'kuantitas'])) || 1,
          total_price: parseFloat(getField(['harga', 'total', 'price', 'bayar'])) || 0,
          order_date: tanggal,
          address: getField(['alamat', 'address', 'kota']) || '-',
          status: getField(['status']) || 'Pesanan Selesai'
        };
      });

      setImportPreview(mappedData);
      setShowImportModal(true);
    } catch (err) {
      alert("Gagal membaca file Excel. Pastikan format benar.");
      console.error(err);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveImport = async () => {
    if (importPreview.length === 0) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/marketing-online-banua/import', importPreview, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Berhasil mengimport ${importPreview.length} data order!`);
      setShowImportModal(false);
      setImportPreview([]);
      if (activeTab === 'dashboard') fetchDashboard();
      else if (activeTab === 'orders') fetchOrders();
    } catch (err) {
      alert("Gagal menyimpan import data: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace Banua</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Dashboard eksklusif untuk operasional online cabang Banua</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm hover:bg-emerald-700 hover:shadow-md transition-all"
            >
              <Upload size={18} /> Import Shopee
            </button>
            <input type="file" ref={fileInputRef} accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </div>
        </header>

        {/* Tabs Nav */}
        <div className="px-8 pt-6 border-b border-gray-200 bg-white">
          <div className="flex gap-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'orders', label: 'Order Marketplace', icon: ShoppingBag },
              { id: 'inventory', label: 'Stock Inventory', icon: Package },
              { id: 'reports', label: 'Laporan', icon: FileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-bold flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-[#990000] text-[#990000]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl">
                    <DollarSign size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Revenue Hari Ini</p>
                    <h3 className="text-2xl font-black text-gray-900">{formatRupiah(dashboardData.revenueToday)}</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-2xl">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Order Hari Ini</p>
                    <h3 className="text-2xl font-black text-gray-900">{dashboardData.ordersToday} Pesanan</h3>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                  <div className="bg-purple-50 text-purple-600 p-4 rounded-2xl">
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Produk Terlaris</p>
                    <h3 className="text-lg font-black text-gray-900 truncate w-48" title={dashboardData.topProducts[0]?.product_name}>
                      {dashboardData.topProducts[0]?.product_name || 'Belum ada data'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Charts & Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-[#990000]" size={20} /> Tren Penjualan (7 Hari Terakhir)
                  </h3>
                  <div className="h-80 w-full">
                    {dashboardData.salesChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.salesChart}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="order_date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Rp ${val / 1000}k`} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <RechartsTooltip 
                            formatter={(value) => formatRupiah(value)}
                            labelFormatter={(label) => formatDate(label)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#990000" strokeWidth={3} dot={{ r: 4, fill: '#990000', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-medium">Belum ada data penjualan 7 hari terakhir</div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Package className="text-orange-500" size={20} /> Top 5 Produk
                  </h3>
                  <div className="space-y-4">
                    {dashboardData.topProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                            #{idx + 1}
                          </div>
                          <p className="font-semibold text-gray-800 truncate w-32" title={p.product_name}>{p.product_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-gray-900">{p.total_qty}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Terjual</p>
                        </div>
                      </div>
                    ))}
                    {dashboardData.topProducts.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-4">Belum ada data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Nama Customer</th>
                      <th className="py-4 px-6">Produk</th>
                      <th className="py-4 px-6 text-center">Qty</th>
                      <th className="py-4 px-6 text-right">Harga (Rp)</th>
                      <th className="py-4 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-10 text-gray-500">Belum ada data order online.</td></tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-medium">{formatDate(order.order_date)}</td>
                          <td className="py-4 px-6 font-bold text-gray-900">{order.customer_name}</td>
                          <td className="py-4 px-6">{order.product_name}</td>
                          <td className="py-4 px-6 text-center font-bold text-[#990000]">{order.qty}</td>
                          <td className="py-4 px-6 text-right font-medium">{formatRupiah(order.total_price)}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap inline-block mb-2">
                              {order.status}
                            </span>
                            {/* Tombol Ajukan ke Finance */}
                            {order.status !== 'Menunggu Finance' && order.status !== 'Invoice Created' && (
                              <button
                                onClick={() => handleAjukanFinance(order.id)}
                                className="block mx-auto mt-1 p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded-lg transition-colors border border-blue-200 shadow-sm flex items-center justify-center w-8 h-8"
                                title="Ajukan ke Finance"
                              >
                                <Send size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-4 px-6">Nama Produk</th>
                      <th className="py-4 px-6 text-center">Stok Tersedia</th>
                      <th className="py-4 px-6 text-center">Status Stok</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="3" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr>
                    ) : inventory.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-10 text-gray-500">Belum ada data inventori online.</td></tr>
                    ) : (
                      inventory.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                              <Package className="text-gray-400" size={18} />
                            </div>
                            {item.product_name}
                          </td>
                          <td className="py-4 px-6 text-center font-black text-lg">{item.stock_qty}</td>
                          <td className="py-4 px-6 text-center">
                            {item.stock_qty > 10 ? (
                              <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">Aman</span>
                            ) : item.stock_qty > 0 ? (
                              <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">Menipis</span>
                            ) : (
                              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Habis</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Laporan Harian */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Calendar size={18} className="text-blue-500" /> Laporan Harian (30 Hari)
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-bold sticky top-0">
                        <tr>
                          <th className="py-3 px-5">Tanggal</th>
                          <th className="py-3 px-5 text-center">Orders</th>
                          <th className="py-3 px-5 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100">
                        {reports.harian.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 px-5 font-medium">{formatDate(row.date)}</td>
                            <td className="py-3 px-5 text-center font-bold text-gray-700">{row.orders}</td>
                            <td className="py-3 px-5 text-right font-semibold text-emerald-600">{formatRupiah(row.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Laporan Bulanan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Calendar size={18} className="text-[#990000]" /> Laporan Bulanan (12 Bulan)
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-bold sticky top-0">
                        <tr>
                          <th className="py-3 px-5">Bulan</th>
                          <th className="py-3 px-5 text-center">Orders</th>
                          <th className="py-3 px-5 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100">
                        {reports.bulanan.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 px-5 font-medium">{row.month}</td>
                            <td className="py-3 px-5 text-center font-bold text-gray-700">{row.orders}</td>
                            <td className="py-3 px-5 text-right font-semibold text-emerald-600">{formatRupiah(row.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>

      {/* IMPORT MODAL PREVIEW */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Preview Data Import</h2>
                <p className="text-sm text-gray-500 mt-1">Ditemukan {importPreview.length} baris data dari file Excel Shopee.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm hover:shadow transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900 text-white text-[10px] uppercase tracking-widest font-bold sticky top-0">
                    <tr>
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6">Produk</th>
                      <th className="py-4 px-6">Qty</th>
                      <th className="py-4 px-6">Total Harga</th>
                      <th className="py-4 px-6">Alamat</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gray-100">
                    {importPreview.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-6 whitespace-nowrap">{row.order_date}</td>
                        <td className="py-3 px-6 font-bold">{row.customer_name}</td>
                        <td className="py-3 px-6">{row.product_name}</td>
                        <td className="py-3 px-6 font-black text-[#990000]">{row.qty}</td>
                        <td className="py-3 px-6 font-semibold">{formatRupiah(row.total_price)}</td>
                        <td className="py-3 px-6 text-gray-500 truncate max-w-[200px]" title={row.address}>{row.address}</td>
                      </tr>
                    ))}
                    {importPreview.length > 50 && (
                      <tr>
                        <td colSpan="6" className="py-4 text-center text-gray-500 font-medium bg-gray-50">
                          ... dan {importPreview.length - 50} baris lainnya
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveImport}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#990000] hover:bg-[#7a0000] shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Simpan ke Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MarketingOnlineBanua;
