import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Users, FileText, ShoppingBag, Plus, Edit, Trash2, Send, X, Search, UserCircle, ChevronDown, Gift,
  Loader2, Download, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Package, Eye, Upload
} from 'lucide-react';
import { submitQuotationToFinance, uploadQuotationFiles } from '../api/quotationApi';
import * as XLSX from 'xlsx';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

export default function MarketingOfflineBanua() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const currentTab = pathParts[2] || 'dashboard';
  const currentSubTab = pathParts[3] || 'harian';
  const activeTab = currentTab;

  const [loading, setLoading] = useState(false);

  // States
  const [dashboardData, setDashboardData] = useState({
    daily: [],
    monthly: [],
    tahunan: [],
    summary: {},
    comparisons: {
      revenue_today: 0,
      revenue_yesterday: 0,
      revenue_this_month: 0,
      revenue_last_month: 0,
      revenue_this_year: 0
    }
  });
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [promoStock, setPromoStock] = useState([]);
  const [reportSubTab, setReportSubTab] = useState(currentSubTab);

  useEffect(() => {
    if (pathParts[3]) setReportSubTab(pathParts[3]);
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  
  // Quotation specific states
  const [uploadQuotationModal, setUploadQuotationModal] = useState(null);
  const [quoFiles, setQuoFiles] = useState([]);

  // Forms
  const [customerForm, setCustomerForm] = useState({ id: null, nama_customer: '', no_hp: '', alamat: '', catatan: '' });
  const [quotationForm, setQuotationForm] = useState({ id: null, customer_name: '', product_name: '', qty: 1, price: 0, note: '' });
  const [orderForm, setOrderForm] = useState({
    id: null,
    customer: '',
    produk: '',
    qty: 1,
    harga: 0,
    payment_type: 'DP',
    status_produksi: 'Beli Kain',
    lokasi_proses: 'Internal',
    entry_date: '',
    deadline: '',
    status: 'New Order',
    catatan: ''
  });
  
  // Date Range States
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]); // Awal bulan
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Hari ini

  // Fetchers
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/marketing-offline/reports?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setDashboardData(prev => ({
        daily: res.data.harian || [],
        monthly: res.data.bulanan || [],
        tahunan: res.data.tahunan || [],
        summary: res.data.summary || {},
        comparisons: { ...prev.comparisons, ...(res.data.comparisons || {}) }
      }));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/marketing-offline/customers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCustomers(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/marketing-offline/quotations?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQuotations(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/marketing-offline/orders?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setOrders(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/marketing-offline/inventory?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setInventory(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPromo = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/marketing-offline/promo', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setPromoStock(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'reports') fetchDashboard();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'quotations') fetchQuotations();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'promo') fetchPromo();
  }, [activeTab, startDate, endDate]);

  // Handlers Customer
  const saveCustomer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (customerForm.id) {
        await axios.put(`http://localhost:3000/api/marketing-offline/customers/${customerForm.id}`, customerForm, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/api/marketing-offline/customers', customerForm, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/marketing-offline/customers/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchCustomers();
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Handlers Quotation
  const saveQuotation = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...quotationForm,
        total: quotationForm.qty * quotationForm.price
      };

      if (quotationForm.id) {
        await axios.put(`http://localhost:3000/api/marketing-offline/quotations/${quotationForm.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/api/marketing-offline/quotations', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowQuotationModal(false);
      fetchQuotations();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteQuotation = async (id) => {
    if (!window.confirm("Delete this quotation?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/marketing-offline/quotations/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchQuotations();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const submitQuotation = async (o) => {
    if (o.payment_type === 'DP' && (!o.quotation_files || o.quotation_files === '[]' || o.quotation_files === '')) {
      alert("Untuk skema DP, Anda WAJIB mengupload dokumen (Quotation TTD & Bukti Transfer) terlebih dahulu sebelum submit ke Finance!");
      return;
    }
    if (!window.confirm(o.payment_type === 'Fullpayment' ? "Bypass upload dokumen. Submit ke Finance untuk cetak Invoice Lunas?" : "Submit quotation dan bukti DP ke Finance untuk approval?")) return;
    try {
      await submitQuotationToFinance(o.quotation_id);
      alert("Quotation submitted to Finance successfully!");
      fetchOrders();
    } catch (err) { alert('Failed to submit: ' + (err.response?.data?.message || err.message)); }
  };

  const handleUploadQuotation = async () => {
    if (!quoFiles.length || !uploadQuotationModal) return;
    try {
      await uploadQuotationFiles(uploadQuotationModal, quoFiles);
      alert("File quotation berhasil diupload!"); 
      setUploadQuotationModal(null); 
      setQuoFiles([]); 
      fetchOrders();
    } catch (err) { alert("Gagal upload file quotation"); }
  };

  // Handlers Order
  const saveOrder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...orderForm,
        total_price: orderForm.qty * orderForm.harga
      };

      if (orderForm.id) {
        await axios.put(`http://localhost:3000/api/marketing-offline/orders/${orderForm.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/api/marketing-offline/orders', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowOrderModal(false);
      fetchOrders();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/marketing-offline/orders/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchOrders();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const submitOrder = async (id) => {
    if (!window.confirm("Submit to Finance for approval?")) return;
    try {
      await axios.post(`http://localhost:3000/api/marketing-offline/orders/${id}/submit`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert("Submitted to Finance successfully!");
      fetchOrders();
    } catch (err) { alert('Failed to submit: ' + (err.response?.data?.message || err.message)); }
  };

  const handleOrderFromStock = (item) => {
    navigate('/marketing-offline/create-order', { 
      state: { 
        orderData: { 
          customer: '',
          items: [{ 
            rincian: item.product_name, 
            qty: 1, 
            harga_satuan: 0, 
            satuan: 'Pcs' 
          }],
          status: 'New Order'
        } 
      } 
    });
  };

  const handleExportExcel = () => {
    let dataToExport = [];
    let fileName = "";

    if (activeTab === 'reports') {
      const rawData = reportSubTab === 'tahunan' ? dashboardData.tahunan : 
                      reportSubTab === 'bulanan' ? dashboardData.monthly : 
                      reportSubTab === 'berjalan' ? (dashboardData.daily || []).filter(d => {
                        const dateStr = d.tanggal ? (d.tanggal instanceof Date ? d.tanggal.toISOString() : String(d.tanggal)) : '';
                        return dateStr.startsWith(new Date().toISOString().substring(0, 7));
                      }) : dashboardData.daily;
      
      dataToExport = rawData.map(r => ({
        'Periode': r.tahun || r.bulan || (r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID') : '-'),
        'Pendapatan': r.pendapatan,
        'Jumlah Order': r.jumlah_quotation,
        'Status': 'Success'
      }));
      fileName = `Report_Offline_${reportSubTab}_${new Date().toISOString().split('T')[0]}`;
    } else {
      dataToExport = orders.map(o => ({
        Customer: o.customer,
        Product: o.produk,
        Qty: o.qty,
        'Unit Price': o.harga,
        'Total Price': o.grand_total || (o.qty * o.harga),
        'Payment Type': o.payment_type,
        'Entry Date': o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID') : '-',
        Deadline: o.deadline ? new Date(o.deadline).toLocaleDateString('id-ID') : '-',
        'Status Produksi': o.status_produksi,
        Lokasi: o.lokasi_proses,
        Catatan: o.catatan,
        Status: o.status
      }));
      fileName = `Orders_Offline_Banua_${new Date().toISOString().split('T')[0]}`;
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'reports' ? "Reports" : "Orders");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  const getPercentageDiff = (current, previous) => {
    if (!previous || previous === 0) return { text: '+100%', isUp: true };
    const diff = ((current - previous) / previous) * 100;
    return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`, isUp: diff >= 0 };
  };

  const dayToDay = getPercentageDiff(dashboardData?.comparisons?.revenue_today, dashboardData?.comparisons?.revenue_yesterday);
  const monthToMonth = getPercentageDiff(dashboardData?.comparisons?.revenue_this_month, dashboardData?.comparisons?.revenue_last_month);
  const yearToYearMonth = getPercentageDiff(dashboardData?.comparisons?.revenue_this_month, dashboardData?.comparisons?.revenue_thismonth_lastyear);

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR SEARCH */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-10 sticky top-0 z-30 justify-between shrink-0">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari data marketing offline..."
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
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Marketing Offline</p>
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
                  {activeTab === 'dashboard' && 'Dashboard Offline'}
                  {activeTab === 'customers' && 'Database Pelanggan'}
                  {activeTab === 'quotations' && 'Quotation Management'}
                  {activeTab === 'orders' && 'Offline Order'}
                  {activeTab === 'inventory' && 'Stok Inventori Banua'}
                  {activeTab === 'reports' && 'Reports & Analytics'}
                  {activeTab === 'promo' && 'Promo Offline'}
                </h1>
                <p className="text-gray-500 mt-2 text-sm font-medium capitalize">
                  Current Section: {activeTab.replace('-', ' ')}
                </p>
              </div>

              {/* Action Buttons for Orders & Reports */}
              {(activeTab === 'orders' || activeTab === 'reports') && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                  >
                    <Download size={18} /> Eksport Excel
                  </button>
                  {activeTab === 'orders' && (
                    <button 
                      onClick={() => navigate('/marketing-offline/create-order')}
                      className="flex items-center gap-2 bg-[#990000] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-red-100"
                    >
                      <Plus size={18} /> Add Order
                    </button>
                  )}
                </div>
              )}

              {/* Date Filter (Used in Dashboard & Reports) */}
              {(activeTab === 'dashboard' || activeTab === 'reports') && (
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-slate-700" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-slate-700" />
                  </div>
                </div>
              )}
            </div>

          <div className="flex flex-col gap-6">
            <div className="w-full">

              {/* === TAB DASHBOARD === */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { title: 'Total Customers', value: dashboardData.summary.total_customers || 0, icon: <Users />, bg: 'bg-red-50', text: 'text-gray-900', color: 'text-[#990000]' },
                      { title: 'Revenue Range', value: formatRupiah(dashboardData.summary.range_revenue), icon: <TrendingUp />, bg: 'bg-emerald-50', text: 'text-gray-900', color: 'text-emerald-600' },
                      { title: 'Total Orders', value: `${dashboardData.summary.total_orders || 0} Orders`, icon: <ShoppingBag />, bg: 'bg-blue-50', text: 'text-gray-900', color: 'text-blue-600' },
                      { title: 'Pending Quotations', value: dashboardData.summary.pending_quotations || 0, icon: <FileText />, bg: 'bg-purple-50', text: 'text-gray-900', color: 'text-purple-600' }
                    ].map((card, index) => (
                      <div key={index} className={`${card.bg} p-6 rounded-[2rem] shadow-sm flex flex-col justify-center min-h-[140px] transition-transform hover:scale-[1.02] border border-white/50`}>
                        <div className={`mb-3 p-2 w-10 h-10 rounded-xl flex items-center justify-center ${card.bg.replace('50', '100')} ${card.color}`}>
                          {React.cloneElement(card.icon, { size: 20 })}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{card.title}</p>
                        <h3 className="text-xl font-black text-gray-900">{card.value}</h3>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                       <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                          <Activity className="text-[#990000]" size={24} /> Daily Revenue Trend
                       </h3>
                       <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData?.daily || []}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#990000" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#990000" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `Rp${value / 1000000}M`} />
                              <RechartsTooltip cursor={{ stroke: '#990000', strokeWidth: 2 }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                              <Area type="monotone" dataKey="pendapatan" stroke="#990000" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100">
                        <h3 className="text-xl font-black text-gray-900 mb-8">Monthly Overview</h3>
                        <div className="space-y-4 overflow-y-auto max-h-80 pr-2 custom-scrollbar">
                           {(dashboardData?.monthly || []).map((m, i) => (
                             <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-[#990000] transition-all cursor-default">
                                <div>
                                  <p className="text-xs font-black text-gray-400 uppercase group-hover:text-white/60">{m.bulan}</p>
                                  <p className="text-sm font-black text-gray-900 group-hover:text-white">{formatRupiah(m.pendapatan)}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] font-black px-2 py-1 bg-white text-[#990000] rounded-lg shadow-sm">{m.jumlah_quotation} Orders</span>
                                </div>
                             </div>
                           ))}
                        </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB REPORTS & ANALYTICS === */}
              {activeTab === 'reports' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {/* Report Sub-Tabs */}
                  <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 self-start w-fit">
                    {['harian', 'bulanan', 'tahunan', 'berjalan'].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => {
                          setReportSubTab(sub);
                          navigate(`/marketing-offline/reports/${sub}`);
                        }}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportSubTab === sub ? 'bg-[#990000] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 transition-all hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Today's Revenue</p>
                      <h3 className="text-2xl font-black text-gray-900">{formatRupiah(dashboardData?.comparisons?.revenue_today)}</h3>
                      <div className={`flex items-center gap-1 text-[10px] font-black mt-3 ${dayToDay.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                        {dayToDay.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {dayToDay.text} vs Yesterday
                      </div>
                    </div>
                    <div className="bg-[#990000] p-8 rounded-[2rem] shadow-xl shadow-red-200/50 border border-red-800 transition-all hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-2">Month-to-Date</p>
                      <h3 className="text-2xl font-black text-white">{formatRupiah(dashboardData?.comparisons?.revenue_this_month)}</h3>
                      <div className="flex items-center gap-1 text-[10px] font-black mt-3 text-white/80">
                        {monthToMonth.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {monthToMonth.text} vs Last Month
                      </div>
                    </div>
                    <div className="bg-gray-900 p-8 rounded-[2rem] shadow-xl shadow-gray-900/20 border border-gray-800 transition-all hover:scale-[1.02]">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">vs Same Month LY</p>
                      <h3 className="text-2xl font-black text-white">{formatRupiah(dashboardData?.comparisons?.revenue_this_month)}</h3>
                      <div className={`flex items-center gap-1 text-[10px] font-black mt-3 ${yearToYearMonth.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {yearToYearMonth.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {yearToYearMonth.text} vs {new Date().getFullYear() - 1}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Table based on Sub-Tab */}
                  <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="text-xl font-black text-gray-900 capitalize">Detail Laporan {reportSubTab}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                          <tr>
                            <th className="py-5 px-8">No</th>
                            <th className="py-5 px-8">{reportSubTab === 'tahunan' ? 'Tahun' : reportSubTab === 'bulanan' ? 'Bulan' : 'Tanggal'}</th>
                            <th className="py-5 px-8 text-right">Pendapatan</th>
                            <th className="py-5 px-8 text-center">Jumlah Orders</th>
                            <th className="py-5 px-8 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50 font-bold">
                          {loading ? (
                             <tr><td colSpan="5" className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr>
                          ) : (
                            (reportSubTab === 'tahunan' ? dashboardData.tahunan : 
                             reportSubTab === 'bulanan' ? dashboardData.monthly : 
                             reportSubTab === 'berjalan' ? (dashboardData.daily || []).filter(d => {
                               const dateStr = d.tanggal ? (d.tanggal instanceof Date ? d.tanggal.toISOString() : String(d.tanggal)) : '';
                               return dateStr.startsWith(new Date().toISOString().substring(0, 7));
                             }) : 
                             dashboardData.daily).map((row, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-8 text-gray-400 font-medium">{idx + 1}</td>
                                <td className="py-4 px-8 text-gray-900">
                                  {row.tahun || row.bulan || (row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-')}
                                </td>
                                <td className="py-4 px-8 text-right text-[#990000] font-black">{formatRupiah(row.pendapatan)}</td>
                                <td className="py-4 px-8 text-center text-gray-600">{row.jumlah_quotation}</td>
                                <td className="py-4 px-8 text-center">
                                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">Verified</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB CUSTOMERS === */}
              {activeTab === 'customers' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Customer List</h2>
                    <button onClick={() => { setCustomerForm({ id: null, nama_customer: '', no_hp: '', alamat: '', catatan: '' }); setShowCustomerModal(true); }} className="bg-[#990000] hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
                      <Plus size={18} /> Add Customer
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                        <tr><th className="py-4 px-6">Name</th><th className="py-4 px-6">Phone</th><th className="py-4 px-6">Address</th><th className="py-4 px-6">Notes</th><th className="py-4 px-6 text-center">Action</th></tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {loading ? <tr><td colSpan="5" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr> : customers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-4 px-6 font-bold text-slate-900">{c.nama_customer}</td>
                            <td className="py-4 px-6">{c.no_hp}</td>
                            <td className="py-4 px-6 text-slate-500">{c.alamat}</td>
                            <td className="py-4 px-6 text-slate-500 italic">{c.catatan}</td>
                            <td className="py-4 px-6 flex justify-center gap-2">
                              <button onClick={() => { setCustomerForm(c); setShowCustomerModal(true); }} className="p-2 text-slate-400 hover:text-[#990000] bg-white border border-slate-200 rounded-lg shadow-sm"><Edit size={16} /></button>
                              <button onClick={() => deleteCustomer(c.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg shadow-sm"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                        {customers.length === 0 && !loading && <tr><td colSpan="5" className="text-center py-10 text-slate-500">No customers found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB QUOTATIONS === */}
              {activeTab === 'quotations' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Quotation Management</h2>
                    <button onClick={() => { setQuotationForm({ id: null, customer_name: '', product_name: '', qty: 1, price: 0, note: '' }); setShowQuotationModal(true); }} className="bg-[#990000] hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors">
                      <Plus size={18} /> Create Quotation
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                        <tr><th className="py-4 px-6">Customer</th><th className="py-4 px-6">Product</th><th className="py-4 px-6">Qty & Price</th><th className="py-4 px-6 text-right">Total Amount</th><th className="py-4 px-6 text-center">Status</th><th className="py-4 px-6 text-center">Action</th></tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {loading ? <tr><td colSpan="6" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr> : quotations.map(q => (
                          <tr key={q.id} className="hover:bg-slate-50">
                            <td className="py-4 px-6 font-bold text-slate-900">{q.customer_name}</td>
                            <td className="py-4 px-6">{q.product_name}</td>
                            <td className="py-4 px-6">{q.qty} x {formatRupiah(q.price)}</td>
                            <td className="py-4 px-6 text-right font-black text-[#990000]">{formatRupiah(q.qty * q.price)}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : q.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{q.status}</span>
                            </td>
                            <td className="py-4 px-6 flex justify-center gap-2">
                              <button onClick={() => { setPreviewQuotation(q); setShowPreviewModal(true); }} title="Print PDF" className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm"><FileText size={16} /></button>
                              {q.status === 'draft' && (
                                <>
                                  <button onClick={() => submitQuotation(q.id)} title="Submit to Finance" className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm"><Send size={16} /></button>
                                  <button onClick={() => { setQuotationForm(q); setShowQuotationModal(true); }} className="p-2 text-slate-400 hover:text-[#990000] bg-white border border-slate-200 rounded-lg shadow-sm"><Edit size={16} /></button>
                                  <button onClick={() => deleteQuotation(q.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg shadow-sm"><Trash2 size={16} /></button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                        {quotations.length === 0 && !loading && <tr><td colSpan="6" className="text-center py-10 text-slate-500">No quotations found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* === TAB ORDERS === */}
              {activeTab === 'orders' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Offline Order</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-4 px-6">Customer</th>
                          <th className="py-4 px-6">Product</th>
                          <th className="py-4 px-6 text-center">QTY</th>
                          <th className="py-4 px-6 text-right">Unit Price</th>
                          <th className="py-4 px-6 text-right">Total Price</th>
                          <th className="py-4 px-6 text-center">Payment</th>
                          <th className="py-4 px-6">Entry Date</th>
                          <th className="py-4 px-6">Deadline</th>
                          <th className="py-4 px-6">Status Produksi</th>
                          <th className="py-4 px-6">Lokasi</th>
                          <th className="py-4 px-6">Catatan</th>
                          <th className="py-4 px-6 text-center">Status</th>
                          <th className="py-4 px-6 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {loading ? <tr><td colSpan="12" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr> : orders.map(o => (
                          <tr key={o.id} className={`hover:bg-slate-50 ${o.sisa_hari < 5 ? "bg-red-50" : ""}`}>

                            <td className="py-4 px-6 font-bold text-slate-900">{o.customer}</td>
                            <td className="py-4 px-6">{o.produk}</td>
                            <td className="py-4 px-6 text-center font-bold">{o.qty}</td>
                            <td className="py-4 px-6 text-right font-medium">{formatRupiah(o.harga)}</td>
                            <td className="py-4 px-6 text-right font-black text-[#990000]">{formatRupiah(o.grand_total || (o.qty * o.harga))}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.payment_type === 'Fullpayment' ? 'bg-emerald-100 text-emerald-700' :
                                  o.payment_type === 'DP' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {o.payment_type}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-slate-600">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                            <td className="py-4 px-6 whitespace-nowrap text-red-600 font-semibold">{o.deadline ? new Date(o.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status_produksi === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                {o.status_produksi}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-500">{o.lokasi_proses}</td>
                            <td className="py-4 px-6 text-xs text-slate-400 italic max-w-[150px] truncate" title={o.catatan}>{o.catatan || '-'}</td>
                            <td className="py-4 px-6 text-center">
                              <span title={o.status === 'Rejected' ? `Alasan Penolakan: ${o.quotation_alasan_penolakan || 'Tidak ada alasan'}` : o.status} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.status === 'Invoice Created' || o.status === 'Diproses Produksi' ? 'bg-emerald-100 text-emerald-700' : o.status === 'Pending Finance' ? 'bg-amber-100 text-amber-700' : o.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{o.status}</span>
                            </td>
                            <td className="py-4 px-6 flex flex-wrap justify-center gap-2">
                              {/* --- Order Actions --- */}
                              {(!o.quotation_id && (o.status === 'New Order' || o.status === 'Pending' || o.status === 'Rejected')) && (
                                <button onClick={() => submitOrder(o.id)} title="Submit Order to Finance" className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm"><Send size={16} /></button>
                              )}
                              <button onClick={() => navigate('/marketing-offline/create-order', { state: { orderData: { ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items } } })} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm" title="Edit Order & Quotation"><Edit size={16} /></button>
                              <button onClick={() => deleteOrder(o.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg shadow-sm" title="Delete Order"><Trash2 size={16} /></button>
                              
                              {/* --- Quotation Actions --- */}
                              {o.quotation_id && (
                                <>
                                  <div className="w-full h-px bg-slate-100 my-1 hidden md:block"></div>
                                  <button onClick={() => navigate(`/quotation/preview/${o.quotation_id}`)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-indigo-100 rounded-lg shadow-sm bg-indigo-50/30" title="View Quotation"><Eye size={16} /></button>
                                  <button onClick={() => setUploadQuotationModal(o.quotation_id)} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-emerald-100 rounded-lg shadow-sm bg-emerald-50/30" title="Upload Dokumen Quotation"><Upload size={16} /></button>
                                  {o.quotation_status !== 'Submitted' && o.quotation_status !== 'Invoice Created' && o.quotation_status !== 'approved' && o.quotation_status !== 'Diproses Produksi' && (
                                    <button onClick={() => submitQuotation(o)} className="p-2 text-slate-400 hover:text-orange-600 bg-white border border-orange-100 rounded-lg shadow-sm bg-orange-50/30" title="Submit Quotation ke Finance"><Send size={16} /></button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && !loading && <tr><td colSpan="12" className="text-center py-10 text-slate-500">No orders found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}


              {/* === TAB INVENTORY === */}
              {activeTab === 'inventory' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-gray-900">Stock Inventory</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                      <Package size={14} /> Live Warehouse Data
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                        <tr>
                          <th className="py-5 px-8">Product Name</th>
                          <th className="py-5 px-8 text-center">Stock Qty</th>
                          <th className="py-5 px-8 text-center">Status</th>
                          <th className="py-5 px-8 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-50 font-bold">
                        {loading ? (
                          <tr><td colSpan="4" className="text-center py-20"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr>
                        ) : inventory.length === 0 ? (
                          <tr><td colSpan="4" className="text-center py-20 text-gray-400 italic">Belum ada data inventori.</td></tr>
                        ) : (
                          inventory.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="py-4 px-8 font-black text-gray-900 flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-red-50 transition-colors">
                                  <Package className="text-gray-400 group-hover:text-[#990000]" size={20} />
                                </div>
                                {item.product_name}
                              </td>
                              <td className="py-4 px-8 text-center font-black text-xl text-[#990000]">{item.stock_qty}</td>
                              <td className="py-4 px-8 text-center">
                                {item.stock_qty > item.minimum_stok ? (
                                  <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Available</span>
                                ) : item.stock_qty > 0 ? (
                                  <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Low Stock</span>
                                ) : (
                                  <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Out of Stock</span>
                                )}
                              </td>
                              <td className="py-4 px-8 text-center">
                                <button 
                                  onClick={() => handleOrderFromStock(item)}
                                  disabled={item.stock_qty <= 0}
                                  className={`flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-lg ${item.stock_qty > 0 ? 'bg-[#990000] text-white hover:bg-red-800 shadow-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
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

              {/* === TAB PROMO === */}
              {activeTab === 'promo' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <div className="bg-[#990000] p-8 rounded-[2.5rem] shadow-xl shadow-red-200/50 border border-red-800 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-black mb-2 flex items-center gap-3"><Gift size={32} /> Promo Cuci Gudang</h2>
                        <p className="text-red-100 font-medium">Daftar produk mengendap (tidak terjual dalam 60 hari terakhir). Segera buat program promo untuk menghabiskan stok!</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[150px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100">Total Produk</p>
                        <p className="text-3xl font-black">{promoStock.length}</p>
                      </div>
                   </div>

                   <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                            <tr>
                              <th className="py-5 px-8">Nama Produk</th>
                              <th className="py-5 px-8 text-center">Stok Mengendap</th>
                              <th className="py-5 px-8 text-center">Status</th>
                              <th className="py-5 px-8 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-gray-50 font-bold">
                            {loading ? (
                              <tr><td colSpan="4" className="text-center py-20"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr>
                            ) : promoStock.length === 0 ? (
                              <tr><td colSpan="4" className="text-center py-20 text-gray-400 italic font-medium">Tidak ada produk mengendap saat ini.</td></tr>
                            ) : (
                              promoStock.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                  <td className="py-4 px-8 font-black text-gray-900">{item.product_name}</td>
                                  <td className="py-4 px-8 text-center font-black text-xl text-orange-600">{item.stock_qty}</td>
                                  <td className="py-4 px-8 text-center">
                                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Stok Lama</span>
                                  </td>
                                  <td className="py-4 px-8 text-center">
                                    <button 
                                      onClick={() => handleOrderFromStock(item)}
                                      className="flex items-center gap-2 mx-auto bg-orange-50 text-orange-600 px-6 py-2.5 rounded-xl text-xs font-black hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-orange-100 border border-orange-100"
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
                </div>
              )}

              {/* === MODAL CUSTOMER === */}
              {showCustomerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">{customerForm.id ? 'Edit Customer' : 'Add Customer'}</h3>
                      <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={saveCustomer} className="p-6 space-y-4">
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Customer Name</label><input required type="text" value={customerForm.nama_customer} onChange={e => setCustomerForm({ ...customerForm, nama_customer: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#990000] outline-none" /></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label><input required type="text" value={customerForm.no_hp} onChange={e => setCustomerForm({ ...customerForm, no_hp: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#990000] outline-none" /></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Address</label><textarea value={customerForm.alamat} onChange={e => setCustomerForm({ ...customerForm, alamat: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#990000] outline-none" rows="2"></textarea></div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Notes (Optional)</label><input type="text" value={customerForm.catatan} onChange={e => setCustomerForm({ ...customerForm, catatan: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#990000] outline-none" /></div>
                      <button type="submit" className="w-full py-3 bg-[#990000] hover:bg-red-800 text-white font-bold rounded-xl transition-colors mt-4">Save Customer</button>
                    </form>
                  </div>
                </div>
              )}

              {/* === MODAL QUOTATION === */}
              {showQuotationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">{quotationForm.id ? 'Edit Quotation' : 'Create Quotation'}</h3>
                      <button onClick={() => setShowQuotationModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <form onSubmit={saveQuotation} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Customer</label>
                        <select required value={quotationForm.customer_name} onChange={e => setQuotationForm({ ...quotationForm, customer_name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none">
                          <option value="">Select Customer...</option>
                          {customers.map(c => <option key={c.id} value={c.nama_customer}>{c.nama_customer}</option>)}
                        </select>
                      </div>
                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label><input required type="text" value={quotationForm.product_name} onChange={e => setQuotationForm({ ...quotationForm, product_name: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4"><label className="block text-sm font-bold text-slate-700 mb-1">Qty</label><input required type="number" min="1" value={quotationForm.qty} onChange={e => setQuotationForm({ ...quotationForm, qty: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
                        <div className="col-span-8"><label className="block text-sm font-bold text-slate-700 mb-1">Unit Price</label><input required type="number" value={quotationForm.price} onChange={e => setQuotationForm({ ...quotationForm, price: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">Total Amount</span>
                        <span className="font-black text-[#990000] text-lg">{formatRupiah(quotationForm.qty * quotationForm.price)}</span>
                      </div>

                      <div><label className="block text-sm font-bold text-slate-700 mb-1">Notes (Optional)</label><input type="text" value={quotationForm.note} onChange={e => setQuotationForm({ ...quotationForm, note: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none" /></div>
                      <button type="submit" className="w-full py-3 bg-[#990000] hover:bg-red-800 text-white font-bold rounded-xl transition-colors mt-4">Save Quotation</button>
                    </form>
                  </div>
                </div>
              )}

              {/* === MODAL ORDER MANUAL === */}
              {showOrderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">{orderForm.id ? 'Edit Order' : 'Add New Order'}</h3>
                      <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <form onSubmit={saveOrder} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Customer Name</label>
                        <input required type="text" value={orderForm.customer} onChange={e => setOrderForm({ ...orderForm, customer: e.target.value })} placeholder="Contoh: PT Akansa" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
                        <input required type="text" value={orderForm.produk} onChange={e => setOrderForm({ ...orderForm, produk: e.target.value })} placeholder="e.g. Kemeja PDL" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" />
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-3">
                          <label className="block text-sm font-bold text-slate-700 mb-1">QTY</label>
                          <input required type="number" min="1" value={orderForm.qty} onChange={e => setOrderForm({ ...orderForm, qty: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-sm font-bold text-slate-700 mb-1">Unit Price</label>
                          <input required type="number" min="0" value={orderForm.harga} onChange={e => setOrderForm({ ...orderForm, harga: parseInt(e.target.value) || 0 })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" />
                        </div>
                        <div className="col-span-5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center mt-6">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Total Price (Auto)</span>
                          <span className="font-black text-[#990000]">{formatRupiah(orderForm.qty * orderForm.harga)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Payment Type</label>
                          <select required value={orderForm.payment_type} onChange={e => setOrderForm({ ...orderForm, payment_type: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]">
                            <option value="DP">DP (Down Payment)</option>
                            <option value="Fullpayment">Fullpayment</option>
                            <option value="Non DP">Non DP</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Lokasi Proses</label>
                          <select required value={orderForm.lokasi_proses} onChange={e => setOrderForm({ ...orderForm, lokasi_proses: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]">
                            <option value="Internal">Internal</option>
                            <option value="Eksternal">Eksternal</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Status Produksi</label>
                        <select required value={orderForm.status_produksi} onChange={e => setOrderForm({ ...orderForm, status_produksi: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]">
                          <option>Beli Kain</option>
                          <option>Proses Potong</option>
                          <option>Proses Jahit</option>
                          <option>Finishing</option>
                          <option>Selesai</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Entry Date</label>
                          <input required type="date" value={orderForm.entry_date} onChange={e => setOrderForm({ ...orderForm, entry_date: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Production Deadline</label>
                          <input required type="date" value={orderForm.deadline} onChange={e => setOrderForm({ ...orderForm, deadline: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Catatan (Optional)</label>
                        <textarea value={orderForm.catatan} onChange={e => setOrderForm({ ...orderForm, catatan: e.target.value })} placeholder="Tambahkan instruksi khusus..." className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]" rows="2"></textarea>
                      </div>

                      <button type="submit" className="w-full py-3 bg-[#990000] hover:bg-red-800 text-white font-bold rounded-xl transition-colors mt-4 shadow-md">Save Order</button>
                    </form>
                  </div>
                </div>
              )}

              {/* === MODAL PREVIEW QUOTATION (PRINT) === */}
              {showPreviewModal && previewQuotation && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:block">
                  <div className="bg-white shadow-2xl w-full max-w-[21cm] min-h-[29.7cm] my-8 relative print:m-0 print:shadow-none">

                    {/* Header Actions (Not Printed) */}
                    <div className="absolute -top-16 right-0 flex gap-2 print:hidden">
                      <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg">
                        Print PDF
                      </button>
                      <button onClick={() => setShowPreviewModal(false)} className="bg-white text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 shadow-lg">
                        Close
                      </button>
                    </div>

                    {/* Kertas A4 Content */}
                    <div className="p-12 text-slate-800 font-sans">
                      <div className="flex justify-between items-start border-b-2 border-[#990000] pb-6 mb-8">
                        <div>
                          <h1 className="text-4xl font-black text-[#990000] tracking-tighter">TANAKA</h1>
                          <p className="text-sm text-slate-500 font-medium mt-1">PT. TANAKA NUSANTARA</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-xs">Jl. Contoh Alamat No. 123, Kota Banua, Indonesia<br />Telp: (021) 123-4567 | Email: info@tanaka.com</p>
                        </div>
                        <div className="text-right">
                          <h2 className="text-3xl font-black text-slate-800 mb-2">QUOTATION</h2>
                          <p className="text-sm font-bold text-slate-600">No: <span className="font-medium">QT-{previewQuotation.id.toString().padStart(5, '0')}</span></p>
                          <p className="text-sm font-bold text-slate-600">Date: <span className="font-medium">{previewQuotation.created_at ? new Date(previewQuotation.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span></p>
                        </div>
                      </div>

                      <div className="mb-10">
                        <p className="text-sm text-slate-500 font-bold mb-1">To:</p>
                        <h3 className="text-xl font-black text-slate-800">{previewQuotation.customer_name}</h3>
                        <p className="text-sm text-slate-600 mt-1">Banua Branch</p>
                      </div>

                      <table className="w-full text-left border-collapse mb-8">
                        <thead>
                          <tr className="bg-[#990000] text-white">
                            <th className="py-3 px-4 font-bold">Product Description</th>
                            <th className="py-3 px-4 font-bold text-center w-24">Qty</th>
                            <th className="py-3 px-4 font-bold text-right w-40">Unit Price</th>
                            <th className="py-3 px-4 font-bold text-right w-48">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 border-b-2 border-slate-200">
                          <tr>
                            <td className="py-4 px-4 text-slate-800 font-medium">{previewQuotation.product_name}</td>
                            <td className="py-4 px-4 text-center">{previewQuotation.qty}</td>
                            <td className="py-4 px-4 text-right">{formatRupiah(previewQuotation.price)}</td>
                            <td className="py-4 px-4 text-right font-black">{formatRupiah(previewQuotation.qty * previewQuotation.price)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="flex justify-between items-start">
                        <div className="w-1/2">
                          {previewQuotation.note && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</p>
                              <p className="text-sm text-slate-700 italic">{previewQuotation.note}</p>
                            </div>
                          )}
                        </div>
                        <div className="w-1/3">
                          <div className="flex justify-between items-center py-2 border-b border-slate-200">
                            <span className="font-bold text-slate-600">Subtotal</span>
                            <span className="font-medium text-slate-800">{formatRupiah(previewQuotation.qty * previewQuotation.price)}</span>
                          </div>
                          <div className="flex justify-between items-center py-3">
                            <span className="text-lg font-black text-[#990000]">GRAND TOTAL</span>
                            <span className="text-xl font-black text-[#990000]">{formatRupiah(previewQuotation.qty * previewQuotation.price)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-20 pt-8 border-t border-slate-200 flex justify-end">
                        <div className="text-center w-48">
                          <p className="text-sm text-slate-500 mb-20">Best Regards,</p>
                          <p className="font-bold text-slate-800 border-b border-slate-800 pb-1">Tanaka Marketing</p>
                          <p className="text-xs text-slate-500 mt-1">Banua Branch</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
      {/* Upload Quotation Modal */}
      {uploadQuotationModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={() => setUploadQuotationModal(null)}>
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-black text-gray-800 mb-2">Upload Dokumen Quotation</h3>
                  <p className="text-sm text-gray-500 mb-4">Upload file TTD Quotation, bukti DP, atau dokumen lainnya.</p>
                  <input type="file" multiple onChange={(e) => setQuoFiles(prev => [...prev, ...Array.from(e.target.files)])} className="w-full p-2 border border-gray-200 rounded-lg mb-4 bg-gray-50" />
                  {quoFiles.length > 0 && (
                      <div className="mb-4 space-y-2 max-h-32 overflow-y-auto pr-2">
                          {quoFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-100 shadow-sm">
                                  <span className="text-xs text-gray-700 font-medium truncate flex-1 mr-2">{file.name}</span>
                                  <button type="button" onClick={() => setQuoFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                      <X size={14} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
                  <div className="flex gap-3 justify-end">
                      <button onClick={() => { setUploadQuotationModal(null); setQuoFiles([]); }} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold">Batal</button>
                      <button onClick={handleUploadQuotation} disabled={!quoFiles.length} className="px-6 py-2 bg-[#990000] text-white font-bold rounded-xl shadow-lg hover:bg-red-800 disabled:opacity-50 transition-colors">Upload</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}