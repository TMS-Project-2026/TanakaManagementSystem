import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, ShoppingBag, Package, FileText, Upload, Gift,
  TrendingUp, Users, DollarSign, Calendar, Search, Loader2,
  CheckCircle, AlertTriangle, ArrowRight, X, Download, Send, UserCircle, Plus, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const MarketingOnlineBanua = () => {
  // Add CSS to hide number spinners
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const { tab, subtab } = useParams();
  const activeTab = tab || 'dashboard';
  const reportSubTab = subtab || 'harian';
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Data States
  const [dashboardData, setDashboardData] = useState({
    revenueToday: 0,
    ordersToday: 0,
    monthlySummary: {
      totalRevenue: 0,
      totalProfit: 0,
      totalHpp: 0,
      totalQty: 0,
      totalPotongan: 0
    },
    topProducts: [],
    salesChart: []
  });
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [promoStock, setPromoStock] = useState([]);
  const [reports, setReports] = useState({ harian: [], bulanan: [] });
  
  // Import & Manual State
  const [importPreview, setImportPreview] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Report Filtering States
  const [filterDate1, setFilterDate1] = useState(new Date().toISOString().split('T')[0]);
  const [filterDate2, setFilterDate2] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  
  const [reportComparisonData, setReportComparisonData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualOrder, setManualOrder] = useState({
    customer_name: '', akun_toko: '', product_name: '', qty: '', price_unit: '',
    potongan_shopee: '', hpp_aktual: '', order_date: new Date().toISOString().split('T')[0],
    address: '', status: 'Pesanan Selesai'
  });


  // Formatting utils
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // API Calls
  const filteredOrders = orders.filter(o => 
    (o.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.akun_toko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      // We fetch ALL orders for the branch to process them based on the selected dates
      // In a real production app, we would send the date filters to the backend
      const res = await axios.get('http://localhost:3000/api/marketing-online-banua/orders', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const allOrders = res.data;
      
      // Process Data based on reportSubTab
      const groupedByAccount = {};
      
      if (reportSubTab === 'harian') {
        const dailyData = [];
        const accounts = [...new Set(allOrders.map(o => o.akun_toko || 'Unknown'))];
        
        // Generate list of dates in range
        const start = new Date(filterDate2); // We use date2 as start and date1 as end for range
        const end = new Date(filterDate1);
        const dateList = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateList.push(new Date(d).toISOString().split('T')[0]);
        }
        
        dateList.reverse().forEach(date => {
          accounts.forEach(acc => {
            const dayRevenue = allOrders
              .filter(o => (o.akun_toko || 'Unknown') === acc && o.order_date.split('T')[0] === date)
              .reduce((sum, o) => sum + (parseFloat(o.total_price || 0) - parseFloat(o.potongan_shopee || 0)), 0);
            
            // For achievement, we need previous day's revenue for this account
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - 1);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            const prevRevenue = allOrders
              .filter(o => (o.akun_toko || 'Unknown') === acc && o.order_date.split('T')[0] === prevDateStr)
              .reduce((sum, o) => sum + (parseFloat(o.total_price || 0) - parseFloat(o.potongan_shopee || 0)), 0);
              
            if (dayRevenue > 0 || prevRevenue > 0) {
              dailyData.push({
                account: acc,
                date: date,
                revenue: dayRevenue,
                prevRevenue: prevRevenue,
                achievement: prevRevenue > 0 ? (dayRevenue / prevRevenue) * 100 : (dayRevenue > 0 ? 100 : 0)
              });
            }
          });
        });
        setReportComparisonData(dailyData);
      } else {
        // Bulanan comparison (stays as requested before: comparison of two months)
        const groupedByAccount = {};
        allOrders.forEach(order => {
          const acc = order.akun_toko || 'Unknown';
          if (!groupedByAccount[acc]) groupedByAccount[acc] = { date1: 0, date2: 0 };
          const orderDate = order.order_date.split('T')[0];
          const revenue = parseFloat(order.total_price || 0) - parseFloat(order.potongan_shopee || 0);
          const monthYear = orderDate.substring(0, 7);
          if (monthYear === filterDate1.substring(0, 7)) groupedByAccount[acc].date1 += revenue;
          if (monthYear === filterDate2.substring(0, 7)) groupedByAccount[acc].date2 += revenue;
        });
        const finalReport = Object.keys(groupedByAccount).map(acc => ({
          account: acc,
          val1: groupedByAccount[acc].date1,
          val2: groupedByAccount[acc].date2,
          achievement: groupedByAccount[acc].date2 > 0 ? (groupedByAccount[acc].date1 / groupedByAccount[acc].date2) * 100 : (groupedByAccount[acc].date1 > 0 ? 100 : 0)
        })).sort((a, b) => b.val1 - a.val1);
        setReportComparisonData(finalReport);
      }
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

  const fetchPromo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-banua/promo', { headers: { Authorization: `Bearer ${token}` } });
      setPromoStock(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'inventory') fetchInventory();
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'promo') fetchPromo();
  }, [activeTab, reportSubTab, filterDate1, filterDate2]);


  // Handle Excel Import
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert("File Excel kosong!");
        return;
      }

      // Map Shopee fields to DB fields
      const mappedData = jsonData.map(row => {
        const getField = (possibleNames) => {
          const key = Object.keys(row).find(k => 
            possibleNames.some(p => k.toLowerCase().trim() === p.toLowerCase().trim()) ||
            possibleNames.some(p => k.toLowerCase().includes(p.toLowerCase()))
          );
          return key ? row[key] : '';
        };

        // Helper to convert Excel date number to YYYY-MM-DD
        const excelDateToJS = (serial) => {
          if (typeof serial !== 'number') return serial;
          const utc_days  = Math.floor(serial - 25569);
          const utc_value = utc_days * 86400;
          const date_info = new Date(utc_value * 1000);
          return date_info.toISOString().split('T')[0];
        };

        let rawTanggal = getField(['tanggal', 'waktu', 'date', 'order time', 'waktu pesanan dibuat', 'order creation date', 'waktu pesanan']);
        let tanggal = typeof rawTanggal === 'number' ? excelDateToJS(rawTanggal) : rawTanggal;

        if (!tanggal) tanggal = new Date().toISOString().split('T')[0];
        if (typeof tanggal === 'string' && (tanggal.includes('/') || tanggal.includes('-'))) {
            // Clean up timestamp if present
            const datePart = tanggal.split(' ')[0];
            const separator = datePart.includes('/') ? '/' : '-';
            const parts = datePart.split(separator);
            if (parts.length === 3) {
              // Handle DD/MM/YYYY or YYYY-MM-DD
              if (parts[0].length === 4) tanggal = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              else if (parts[2].length === 4) tanggal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }

        const qty = parseInt(getField(['qty', 'jumlah', 'quantity', 'kuantitas', 'jumlah produk yang dipesan', 'jumlah produk'])) || 1;
        const priceUnit = parseFloat(getField(['price', 'harga satuan', 'unit price', 'harga awal', 'deal price', 'harga asli'])) || 0;
        const totalPrice = parseFloat(getField(['total price', 'total harga', 'subtotal', 'total bayar', 'total pembayaran', 'total real', 'total penghasilan'])) || (qty * priceUnit);
        const hppUnit = parseFloat(getField(['hpp', 'cost', 'modal', 'hpp satuan', 'cost unit'])) || 0;
        const totalHpp = parseFloat(getField(['total hpp', 'total cost', 'total modal'])) || (qty * hppUnit);
        const discount = parseFloat(getField(['potongan shopee', 'diskon shopee', 'shopee discount', 'diskon dari shopee', 'voucher shopee', 'potongan'])) || 0;
        const profit = parseFloat(getField(['profit', 'laba', 'keuntungan'])) || (totalPrice - totalHpp - discount);

        return {
          customer_name: getField(['nama', 'pembeli', 'username', 'customer', 'username pembeli', 'nama customer']) || 'Anonim',
          akun_toko: getField(['akun', 'toko', 'shop', 'account', 'username penjual', 'akun toko']) || '-',
          product_name: getField(['produk', 'barang', 'product', 'nama produk', 'product name', 'nama barang']) || 'Produk Tidak Diketahui',
          qty: qty,
          price_unit: priceUnit,
          total_price: totalPrice,
          potongan_shopee: discount,
          hpp_aktual: hppUnit,
          total_hpp_aktual: totalHpp,
          profit: profit,
          order_date: tanggal,
          address: getField(['alamat', 'address', 'kota', 'alamat pengiriman', 'shipping address']) || '-',
          status: getField(['status', 'order status', 'status pesanan']) || 'Pesanan Selesai'
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

  const handleExportExcel = () => {
    if (orders.length === 0) {
      alert("Tidak ada data untuk dieksport.");
      return;
    }
    const exportData = orders.map(o => ({
      'Tanggal': formatDate(o.order_date),
      'Akun Toko': o.akun_toko,
      'Customer': o.customer_name,
      'Produk': o.product_name,
      'Qty': o.qty,
      'Harga Satuan': o.price_unit,
      'Total Harga': o.total_price,
      'Potongan Shopee': o.potongan_shopee,
      'HPP Satuan': o.hpp_aktual,
      'Profit': o.profit,
      'Alamat': o.address,
      'Status': o.status
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders Marketplace");
    XLSX.writeFile(wb, `Orders_Marketplace_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOrderFromStock = (item) => {
    setManualOrder({
      customer_name: '', 
      akun_toko: '', 
      product_name: item.product_name, 
      qty: 1, 
      price_unit: '',
      potongan_shopee: '', 
      hpp_aktual: '', 
      order_date: new Date().toISOString().split('T')[0],
      address: '', 
      status: 'Pesanan Selesai'
    });
    setShowManualModal(true);
  };

  const handleSaveManual = async () => {
    const total_price = manualOrder.qty * manualOrder.price_unit;
    const total_hpp = manualOrder.qty * manualOrder.hpp_aktual;
    const profit = total_price - total_hpp - manualOrder.potongan_shopee;
    
    const finalOrder = { 
      ...manualOrder, 
      total_price, 
      total_hpp_aktual: total_hpp, 
      profit 
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/marketing-online-banua/import', [finalOrder], {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Pesanan manual berhasil disimpan!");
      setShowManualModal(false);
      setManualOrder({
        customer_name: '', akun_toko: '', product_name: '', qty: '', price_unit: '',
        potongan_shopee: '', hpp_aktual: '', order_date: new Date().toISOString().split('T')[0],
        address: '', status: 'Pesanan Selesai'
      });
      if (activeTab === 'dashboard') fetchDashboard();
      else if (activeTab === 'orders') fetchOrders();
    } catch (err) {
      alert("Gagal menyimpan pesanan: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR SEARCH (As per screenshot) */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-10 sticky top-0 z-30 justify-between shrink-0">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari data marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-red-50 focus:bg-white focus:border-red-200 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
              <div className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setShowProfile(!showProfile)}>
                <UserCircle className="text-gray-400" size={24} />
              </div>
              <ChevronDown size={14} className="text-gray-400" />
              {showProfile && (
                <div className="absolute right-10 top-16 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 bg-red-50/50">
                    <p className="text-sm font-black text-gray-900">Admin</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Marketing Online</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-10 py-10 bg-[#f8fafc]">
            {/* Dynamic Header Module Title */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  {activeTab === 'dashboard' && 'Dashboard Online'}
                  {activeTab === 'orders' && 'Order Marketplace'}
                  {activeTab === 'inventory' && 'Stok Inventori'}
                  {activeTab === 'reports' && (reportSubTab === 'bulanan' ? 'Laporan Bulanan Online' : 'Laporan Harian Online')}
                  {activeTab === 'promo' && 'Promo Online'}
                </h1>
                <p className="text-gray-500 mt-2 text-sm font-medium">
                  {activeTab === 'dashboard' && 'Ringkasan performa penjualan marketplace'}
                  {activeTab === 'orders' && 'Manajemen data transaksi dan pesanan pelanggan online'}
                  {activeTab === 'inventory' && 'Pantau ketersediaan stok produk untuk marketplace'}
                  {activeTab === 'reports' && 'Analisis perbandingan pendapatan harian dan bulanan'}
                  {activeTab === 'promo' && 'Daftar produk mengendap untuk program cuci gudang'}
                </p>
              </div>

              {/* Action Buttons (As per screenshot colors) */}
              {activeTab === 'orders' && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                  >
                    <Download size={18} /> Eksport Excel
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-[#059669] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                  >
                    <Upload size={18} /> Import Shopee
                  </button>
                  <button 
                    onClick={() => {
                      setManualOrder({
                        customer_name: '', akun_toko: '', product_name: '', qty: '', price_unit: '',
                        potongan_shopee: '', hpp_aktual: '', order_date: new Date().toISOString().split('T')[0],
                        address: '', status: 'Pesanan Selesai'
                      });
                      setShowManualModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#990000] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-red-100"
                  >
                    <Plus size={18} /> Tambah Manual
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                </div>
              )}
            </div>

          {/* TAB: DASHBOARD (As per User Screenshot) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Summary Cards Grid (3 Columns) - Compact Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Revenue (Bulan Ini)', value: formatRupiah(dashboardData.monthlySummary.totalRevenue), bg: 'bg-red-100', text: 'text-gray-900' },
                  { title: 'Total Profit', value: formatRupiah(dashboardData.monthlySummary.totalProfit), bg: 'bg-[#ff3b3b]', text: 'text-white' },
                  { title: 'Total HPP', value: formatRupiah(dashboardData.monthlySummary.totalHpp), bg: 'bg-red-100', text: 'text-gray-900' },
                  { title: 'Qty Terjual', value: `${dashboardData.monthlySummary.totalQty || 0} Pcs`, bg: 'bg-red-100', text: 'text-gray-900' },
                  { title: 'Potongan Shopee', value: formatRupiah(dashboardData.monthlySummary.totalPotongan), bg: 'bg-red-100', text: 'text-gray-900' },
                  { title: 'Order Hari Ini', value: `${dashboardData.ordersToday} Pesanan`, bg: 'bg-[#ff4d4d]', text: 'text-white' }
                ].map((card, index) => (
                  <div key={index} className={`${card.bg} p-6 rounded-[2rem] shadow-sm flex flex-col justify-center min-h-[120px] transition-transform hover:scale-[1.01]`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${card.text === 'text-white' ? 'text-white/80' : 'text-red-900/60'}`}>{card.title}</p>
                    <h3 className={`text-2xl font-black ${card.text}`}>{card.value}</h3>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Trend - Line Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="text-[#990000]" size={22} /> Tren Penjualan (30 Hari Terakhir)
                    </h3>
                  </div>
                  <div className="h-80 w-full">
                    {dashboardData.salesChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.salesChart}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="order_date" 
                            tickFormatter={formatDate} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#64748b' }} 
                            dy={10} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(val) => `Rp ${val / 1000}k`} 
                            tick={{ fontSize: 12, fill: '#64748b' }} 
                          />
                          <RechartsTooltip 
                            formatter={(value) => formatRupiah(value)}
                            labelFormatter={(label) => formatDate(label)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            name="Revenue"
                            stroke="#990000" 
                            strokeWidth={4} 
                            dot={{ r: 4, fill: '#990000', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 6 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-medium">Belum ada data penjualan 30 hari terakhir</div>
                    )}
                  </div>
                </div>

                {/* Top Products vs Sales - Bar Chart (1/3 width) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Package className="text-orange-500" size={22} /> Top Produk vs Sales
                  </h3>
                  <div className="h-80 w-full">
                    {dashboardData.topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dashboardData.topProducts} layout="vertical" margin={{ left: -20 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="product_name" 
                            type="category" 
                            tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                            width={100}
                            axisLine={false}
                            tickLine={false}
                          />
                          <RechartsTooltip 
                            formatter={(value, name) => [name === 'total_sales' ? formatRupiah(value) : value, name === 'total_sales' ? 'Sales' : 'Qty']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="total_qty" name="Qty Terjual" fill="#990000" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-medium text-center">Belum ada data produk terlaris</div>
                    )}
                  </div>
                  
                  {/* Small List for extra detail */}
                  <div className="mt-4 space-y-2 overflow-y-auto max-h-40 pr-2 custom-scrollbar">
                    {dashboardData.topProducts.slice(0, 5).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="font-bold text-gray-700 truncate w-24" title={p.product_name}>{p.product_name}</span>
                        <div className="text-right">
                          <span className="font-black text-[#990000]">{p.total_qty} Qty</span>
                          <span className="block text-[9px] text-gray-400 font-bold">{formatRupiah(p.total_sales)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

           {/* TAB: ORDERS (Styled as per Screenshot) */}
           {activeTab === 'orders' && (
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900 border-b border-gray-800 text-white uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6 text-[10px] font-black">Tanggal</th>
                      <th className="py-4 px-6 text-[10px] font-black">Akun</th>
                      <th className="py-4 px-6 text-[10px] font-black">Produk</th>
                      <th className="py-4 px-6 text-[10px] font-black text-center">Qty</th>
                      <th className="py-4 px-6 text-[10px] font-black text-right">Price</th>
                      <th className="py-4 px-6 text-[10px] font-black text-right">Total Price</th>
                      <th className="py-4 px-6 text-[10px] font-black text-right text-red-400">Potongan</th>
                      <th className="py-4 px-6 text-[10px] font-black text-right">HPP Satuan</th>
                      <th className="py-4 px-6 text-[10px] font-black text-right">Total HPP</th>
                      <th className="py-4 px-6 text-[10px] font-black text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan="10" className="text-center py-24"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan="10" className="text-center py-24 text-gray-400 font-bold italic">Belum ada data order online.</td></tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="py-4 px-6 font-medium text-gray-900">{formatDate(order.order_date)}</td>
                          <td className="py-4 px-6">
                             <div className="text-[10px] font-black text-gray-900 uppercase leading-tight max-w-[100px]">{order.akun_toko}</div>
                          </td>
                          <td className="py-4 px-6 font-black text-gray-900">{order.product_name}</td>
                          <td className="py-4 px-6 text-center font-black text-red-600 text-lg">{order.qty}</td>
                          <td className="py-4 px-6 text-right font-medium text-gray-900">{formatRupiah(order.price_unit)}</td>
                          <td className="py-4 px-6 text-right font-black text-gray-900">{formatRupiah(order.total_price)}</td>
                          <td className="py-4 px-6 text-right font-bold text-red-600">-{formatRupiah(order.potongan_shopee)}</td>
                          <td className="py-4 px-6 text-right font-black text-gray-900">{formatRupiah(order.hpp_aktual)}</td>
                          <td className="py-4 px-6 text-right font-black text-gray-900">{formatRupiah(order.total_hpp_aktual)}</td>
                          <td className="py-4 px-6">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleAjukanFinance(order.id)} title="Ajukan ke Finance" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Send size={14} /></button>
                            </div>
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
                  <thead className="bg-gray-900 border-b border-gray-800 text-xs text-white uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-4 px-6">Nama Produk</th>
                      <th className="py-4 px-6 text-center">Stok Tersedia</th>
                      <th className="py-4 px-6 text-center">Status Stok</th>
                      <th className="py-4 px-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr>
                    ) : inventory.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-10 text-gray-500">Belum ada data inventori online.</td></tr>
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
                          <td className="py-4 px-6 text-center">
                            <button 
                              onClick={() => handleOrderFromStock(item)}
                              disabled={item.stock_qty <= 0}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto ${
                                item.stock_qty > 0 
                                  ? 'bg-red-800 text-white hover:bg-red-900 shadow-sm' 
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <ShoppingBag size={14} /> Pesan Sekarang
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Date Filters */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    {reportSubTab === 'harian' ? 'Sampai Tanggal' : 'Bulan Berjalan'}
                  </label>
                  <input 
                    type={reportSubTab === 'harian' ? 'date' : 'month'} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" 
                    value={reportSubTab === 'harian' ? filterDate1 : filterDate1.substring(0, 7)}
                    onChange={e => setFilterDate1(reportSubTab === 'harian' ? e.target.value : e.target.value + "-01")}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    {reportSubTab === 'harian' ? 'Dari Tanggal' : 'Bulan Lalu'}
                  </label>
                  <input 
                    type={reportSubTab === 'harian' ? 'date' : 'month'} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100" 
                    value={reportSubTab === 'harian' ? filterDate2 : filterDate2.substring(0, 7)}
                    onChange={e => setFilterDate2(reportSubTab === 'harian' ? e.target.value : e.target.value + "-01")}
                  />
                </div>
                <button 
                  onClick={fetchReports}
                  className="bg-[#990000] text-white px-8 py-3 rounded-xl font-bold hover:bg-red-800 transition-all shadow-lg shadow-red-100"
                >
                  Proses Laporan
                </button>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">No</th>
                        <th className="py-4 px-6 text-left text-xs font-black uppercase tracking-widest border border-gray-800">Nama Akun</th>
                        <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800 bg-gray-800/50">
                          {reportSubTab === 'harian' ? 'Tanggal' : 'Bulan'}
                        </th>
                        <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                        <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {reportComparisonData.length > 0 ? (
                        reportSubTab === 'harian' ? (
                          reportComparisonData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-6 text-center font-bold text-gray-400 border-b border-gray-100">{idx + 1}</td>
                              <td className="py-4 px-6 font-black text-gray-900 border-b border-gray-100">{row.account}</td>
                              <td className="py-4 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">{formatDate(row.date)}</td>
                              <td className="py-4 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.revenue)}</td>
                              <td className="py-4 px-6 text-center border-b border-gray-100">
                                <span className={`text-sm font-black ${row.achievement >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                  {row.achievement.toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          reportComparisonData.map((row, idx) => (
                            <React.Fragment key={idx}>
                              <tr className="hover:bg-blue-50/30 transition-colors">
                                <td rowSpan={2} className="py-6 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                <td rowSpan={2} className="py-6 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                                <td className="py-3 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                  {new Date(filterDate1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.val1)}</td>
                                <td rowSpan={2} className="py-6 px-6 text-center border-x border-b border-gray-100">
                                  <span className={`text-xl font-black ${row.achievement >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                    {row.achievement.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                              <tr className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-3 px-6 text-center font-bold bg-gray-50 text-gray-500 border-b border-gray-100">
                                  {new Date(filterDate2).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </td>
                                <td className="py-3 px-6 text-right font-bold text-gray-400 border-b border-gray-100">{formatRupiah(row.val2)}</td>
                              </tr>
                            </React.Fragment>
                          ))
                        )
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data untuk periode terpilih</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-900 text-white font-black uppercase text-xs">
                        <td colSpan={3} className="py-5 px-6 text-right">Total Pendapatan (Periode Berjalan)</td>
                        <td className="py-5 px-6 text-right text-emerald-400 text-lg">
                          {formatRupiah(reportComparisonData.reduce((acc, curr) => acc + (reportSubTab === 'harian' ? curr.revenue : curr.val1), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Perbandingan Performa Akun</h3>
                    <p className="text-sm text-gray-500 mt-1">Visualisasi pendapatan antara dua periode terpilih</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-[10px] font-bold uppercase text-gray-400">Periode Utama</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <span className="text-[10px] font-bold uppercase text-gray-400">Pembanding</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="account" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(val) => `Rp ${val / 1000000}jt`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        formatter={(val) => formatRupiah(val)}
                      />
                      <Bar dataKey={reportSubTab === 'harian' ? 'revenue' : 'val1'} fill="#3b82f6" radius={[6, 6, 0, 0]} name="Periode Utama" barSize={30} />
                      <Bar dataKey={reportSubTab === 'harian' ? 'prevRevenue' : 'val2'} fill="#e2e8f0" radius={[6, 6, 0, 0]} name="Pembanding" barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROMO ONLINE (Table Style) */}
          {activeTab === 'promo' && (
            <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900 border-b border-gray-800 text-white uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6 text-[10px] font-black">Nama Produk</th>
                      <th className="py-4 px-6 text-[10px] font-black">Kategori</th>
                      <th className="py-4 px-6 text-[10px] font-black text-center">Sejak Tanggal</th>
                      <th className="py-4 px-6 text-[10px] font-black text-center">Stok Mengendap</th>
                      <th className="py-4 px-6 text-[10px] font-black text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan="5" className="text-center py-24"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr>
                    ) : promoStock.filter(item => {
                        if (!item.last_sold_date) return true;
                        const diff = new Date() - new Date(item.last_sold_date);
                        return diff / (1000 * 60 * 60 * 24) >= 60;
                      }).length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-24 text-gray-400 font-bold italic">Tidak ada produk yang mengendap (&gt; 60 hari).</td></tr>
                    ) : (
                      promoStock.filter(item => {
                        if (!item.last_sold_date) return true;
                        const diff = new Date() - new Date(item.last_sold_date);
                        return diff / (1000 * 60 * 60 * 24) >= 60;
                      }).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 font-black text-gray-900">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                                 <Package size={14} />
                               </div>
                               {item.product_name}
                             </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-gray-500 uppercase text-[10px] tracking-widest">{item.kategori || '-'}</td>
                          <td className="py-4 px-6 text-center font-bold text-gray-600">{item.last_sold_date ? formatDate(item.last_sold_date) : 'Stok Lama'}</td>
                          <td className="py-4 px-6 text-center font-black text-red-600 text-lg">{item.stock_qty}</td>
                          <td className="py-4 px-6 text-center">
                            <button 
                              onClick={() => handleOrderFromStock(item)}
                              className="px-4 py-2 bg-red-800 text-white rounded-xl text-[10px] font-black hover:bg-red-900 transition-all active:scale-95 shadow-lg shadow-red-100 flex items-center gap-2 mx-auto"
                            >
                              <Gift size={14} /> Buat Promo
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                  <thead className="bg-gray-900 text-white text-[9px] uppercase tracking-widest font-bold sticky top-0">
                    <tr>
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Akun</th>
                      <th className="py-4 px-6">Produk</th>
                      <th className="py-4 px-6">Qty</th>
                      <th className="py-4 px-6">Total Harga</th>
                      <th className="py-4 px-6">Potongan</th>
                      <th className="py-4 px-6">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] divide-y divide-gray-100">
                    {importPreview.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-6 whitespace-nowrap">{row.order_date}</td>
                        <td className="py-3 px-6 text-gray-500">{row.akun_toko}</td>
                        <td className="py-3 px-6 font-bold">{row.product_name}</td>
                        <td className="py-3 px-6 font-black text-[#990000]">{row.qty}</td>
                        <td className="py-3 px-6 font-semibold">{formatRupiah(row.total_price)}</td>
                        <td className="py-3 px-6 text-red-500 font-medium">{formatRupiah(row.potongan_shopee)}</td>
                        <td className="py-3 px-6 font-bold text-emerald-600">{formatRupiah(row.profit)}</td>
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

      {/* MANUAL ORDER MODAL */}
      <ManualOrderModal
        show={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSave={handleSaveManual}
        order={manualOrder}
        setOrder={setManualOrder}
        loading={loading}
        formatRupiah={formatRupiah}
      />

    </div>
  );
};

// Sub-component for Manual Order Modal
const ManualOrderModal = ({ show, onClose, onSave, order, setOrder, loading, formatRupiah }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900">Tambah Pesanan Manual</h2>
            <p className="text-sm text-gray-500 mt-1">Input data order marketplace secara manual.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-xl shadow-sm hover:shadow transition-all">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal Pesanan</label>
              <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.order_date} onChange={e => setOrder({...order, order_date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Akun Toko</label>
              <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.akun_toko} onChange={e => setOrder({...order, akun_toko: e.target.value})} placeholder="Contoh: Shopee_Tanaka" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Produk</label>
            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.product_name} onChange={e => setOrder({...order, product_name: e.target.value})} placeholder="Masukkan nama barang lengkap" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qty</label>
              <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-bold text-[#990000]" value={order.qty} onChange={e => setOrder({...order, qty: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (Unit)</label>
              <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.price_unit} onChange={e => setOrder({...order, price_unit: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">HPP Satuan</label>
              <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.hpp_aktual} onChange={e => setOrder({...order, hpp_aktual: e.target.value})} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Potongan</label>
              <input type="number" className="w-full p-3 bg-red-50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-bold text-red-600" value={order.potongan_shopee} onChange={e => setOrder({...order, potongan_shopee: e.target.value})} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Price (Calculated)</span>
              <span className="block text-lg font-black text-gray-900">{formatRupiah(order.qty * order.price_unit)}</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Total HPP (Calculated)</span>
              <span className="block text-lg font-black text-gray-900">{formatRupiah(order.qty * order.hpp_aktual)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status Pesanan</label>
            <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-bold text-emerald-600" value={order.status} onChange={e => setOrder({...order, status: e.target.value})}>
              <option value="Pesanan Selesai">Pesanan Selesai</option>
              <option value="Menunggu Finance">Menunggu Finance</option>
              <option value="Batal">Batal</option>
            </select>
          </div>

          <div className="p-6 bg-emerald-600 rounded-3xl shadow-lg shadow-emerald-100 animate-in slide-in-from-top-2">
             <div className="flex justify-between items-center text-white">
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Estimasi Keuntungan (Profit)</p>
                 <h3 className="text-2xl font-black">{formatRupiah((order.qty * order.price_unit) - (order.qty * order.hpp_aktual) - order.potongan_shopee)}</h3>
               </div>
               <TrendingUp size={32} className="opacity-40" />
             </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">Batal</button>
          <button onClick={onSave} disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-red-800 hover:bg-red-900 shadow-sm transition-all flex items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
            Simpan Pesanan
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketingOnlineBanua;
