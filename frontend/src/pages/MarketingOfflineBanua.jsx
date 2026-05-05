import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Users, FileText, ShoppingBag, Plus, Edit, Trash2, Send, X,
  Loader2, Download, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Package
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

export default function MarketingOfflineBanua() {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const currentTab = pathParts[2] || 'dashboard';
  const activeTab = currentTab;

  const [loading, setLoading] = useState(false);

  // States
  const [dashboardData, setDashboardData] = useState({
    daily: [],
    monthly: [],
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

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);

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
    entry_date: '',
    deadline: '',
    status: 'New Order'
  });

  // Fetchers
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/marketing-offline/reports', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setDashboardData({
        daily: res.data.harian.reverse(),
        monthly: res.data.bulanan.reverse(),
        summary: res.data.summary,
        comparisons: res.data.comparisons
      });
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
      const res = await axios.get('http://localhost:3000/api/marketing-offline/quotations', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQuotations(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/marketing-offline/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setOrders(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/marketing-offline/inventory', { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      setInventory(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'reports') fetchDashboard();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'quotations') fetchQuotations();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'inventory') fetchInventory();
  }, [activeTab]);

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

  const submitQuotation = async (id) => {
    if (!window.confirm("Submit to Finance for approval?")) return;
    try {
      await axios.post(`http://localhost:3000/api/marketing-offline/quotations/${id}/submit`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert("Submitted to Finance successfully!");
      fetchQuotations();
    } catch (err) { alert('Failed to submit: ' + (err.response?.data?.message || err.message)); }
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

  const handleExportExcel = () => {
    const dataToExport = orders.map(o => ({
      Customer: o.customer,
      Product: o.produk,
      Qty: o.qty,
      'Unit Price': o.harga,
      'Total Price': o.qty * o.harga,
      'Payment Type': o.payment_type,
      'Entry Date': o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID') : '-',
      Deadline: o.deadline ? new Date(o.deadline).toLocaleDateString('id-ID') : '-',
      Status: o.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `Orders_Offline_Banua_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

  const getPercentageDiff = (current, previous) => {
    if (!previous || previous === 0) return { text: '+100%', isUp: true };
    const diff = ((current - previous) / previous) * 100;
    return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`, isUp: diff >= 0 };
  };

  const dayToDay = getPercentageDiff(dashboardData.comparisons.revenue_today, dashboardData.comparisons.revenue_yesterday);
  const monthToMonth = getPercentageDiff(dashboardData.comparisons.revenue_this_month, dashboardData.comparisons.revenue_last_month);
  const yearToYearMonth = getPercentageDiff(dashboardData.comparisons.revenue_this_month, dashboardData.comparisons.revenue_thismonth_lastyear);

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto text-slate-800">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Offline Marketing - Banua</h1>
            <p className="text-slate-500 mt-1 capitalize">Current Section: {activeTab.replace('-', ' ')}</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="w-full">

              {/* === TAB DASHBOARD === */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-50 text-[#990000] rounded-2xl flex items-center justify-center"><Users size={24} /></div>
                      <div><p className="text-sm font-bold text-slate-500">Total Customers</p><p className="text-2xl font-black">{dashboardData.summary.total_customers || 0}</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
                      <div><p className="text-sm font-bold text-slate-500">Pending Quotations</p><p className="text-2xl font-black">{dashboardData.summary.pending_quotations || 0}</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                      <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><ShoppingBag size={24} /></div>
                      <div><p className="text-sm font-bold text-slate-500">Total Orders</p><p className="text-2xl font-black">{dashboardData.summary.total_orders || 0}</p></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-center gap-3">
                    <Activity size={20} className="text-blue-600" />
                    <p className="font-medium text-sm">Untuk melihat laporan detail keuangan dan perbandingan omset, silakan buka menu <b>Reports & Analytics</b> di Sidebar.</p>
                  </div>
                </div>
              )}

              {/* === TAB REPORTS & ANALYTICS === */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                      <Activity className="text-[#990000]" /> Financial Reports & Analytics
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-6 border border-slate-100 bg-slate-50 rounded-2xl">
                        <p className="text-sm font-bold text-slate-500 mb-1">Today's Revenue</p>
                        <p className="text-2xl font-black text-slate-800">{formatRupiah(dashboardData.comparisons.revenue_today)}</p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${dayToDay.isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                          {dayToDay.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {dayToDay.text} vs Yesterday
                        </div>
                      </div>
                      <div className="p-6 border border-slate-100 bg-[#990000] text-white rounded-2xl shadow-md">
                        <p className="text-sm font-bold text-red-200 mb-1">Month-to-Date (Bulan Berjalan)</p>
                        <p className="text-2xl font-black">{formatRupiah(dashboardData.comparisons.revenue_this_month)}</p>
                        <div className="flex items-center gap-1 text-xs font-bold mt-2 text-red-100">
                          {monthToMonth.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {monthToMonth.text} vs Last Month
                        </div>
                      </div>
                      <div className="p-6 border border-slate-100 bg-slate-800 text-white rounded-2xl shadow-md">
                        <p className="text-sm font-bold text-slate-400 mb-1">vs Same Month Last Year</p>
                        <p className="text-2xl font-black text-white">{formatRupiah(dashboardData.comparisons.revenue_this_month)}</p>
                        <div className={`flex items-center gap-1 text-xs font-bold mt-2 ${yearToYearMonth.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {yearToYearMonth.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {yearToYearMonth.text} vs {new Date().getFullYear() - 1}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 border border-slate-200 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Monthly Revenue (Laporan Bulanan)</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-400 font-bold uppercase border-b border-slate-100">
                              <tr><th className="py-2">Month</th><th className="py-2 text-right">Revenue</th><th className="py-2 text-center">Orders</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {dashboardData.monthly.map((m, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="py-3 font-medium">{m.bulan}</td>
                                  <td className="py-3 text-right font-bold text-[#990000]">{formatRupiah(m.pendapatan)}</td>
                                  <td className="py-3 text-center text-slate-500">{m.jumlah_quotation}</td>
                                </tr>
                              ))}
                              {dashboardData.monthly.length === 0 && <tr><td colSpan="3" className="py-4 text-center text-slate-400">No data available</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-5 border border-slate-200 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Daily Revenue Trend</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dashboardData.daily}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#990000" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#990000" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                              <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(value) => `Rp${value / 1000000}M`} />
                              <RechartsTooltip cursor={{ stroke: '#990000', strokeWidth: 2, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                              <Area type="monotone" dataKey="pendapatan" stroke="#990000" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
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
                    <h2 className="text-xl font-bold text-slate-800">Offline Orders (Banua)</h2>
                    <div className="flex gap-2">
                      <button onClick={handleExportExcel} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Download size={18} /> Export Excel
                      </button>
                      <button onClick={() => {
                        setOrderForm({
                          id: null,
                          customer: '',
                          produk: '',
                          qty: 1,
                          harga: 0,
                          payment_type: 'DP',
                          entry_date: new Date().toISOString().split('T')[0],
                          deadline: '',
                          status: 'New Order'
                        });
                        setShowOrderModal(true);
                      }} className="bg-[#990000] hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus size={18} />Add Order
                      </button>
                    </div>
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
                          <th className="py-4 px-6 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {loading ? <tr><td colSpan="9" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr> : orders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50">
                            <td className="py-4 px-6 font-bold text-slate-900">{o.customer}</td>
                            <td className="py-4 px-6">{o.produk}</td>
                            <td className="py-4 px-6 text-center font-bold">{o.qty}</td>
                            <td className="py-4 px-6 text-right font-medium">{formatRupiah(o.harga)}</td>
                            <td className="py-4 px-6 text-right font-black text-[#990000]">{formatRupiah(o.qty * o.harga)}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${o.payment_type === 'Fullpayment' ? 'bg-emerald-100 text-emerald-700' :
                                  o.payment_type === 'DP' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                {o.payment_type}
                              </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap text-slate-600">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                            <td className="py-4 px-6 whitespace-nowrap text-red-600 font-semibold">{o.deadline ? new Date(o.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                            <td className="py-4 px-6 flex justify-center gap-2">
                              <button onClick={() => {
                                setOrderForm({
                                  ...o,
                                  entry_date: o.created_at ? new Date(o.entry_date).toISOString().split('T')[0] : '',
                                  deadline: o.deadline ? new Date(o.deadline).toISOString().split('T')[0] : ''
                                }); setShowOrderModal(true);
                              }} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg shadow-sm" title="Edit"><Edit size={16} /></button>
                              <button onClick={() => deleteOrder(o.id)} className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg shadow-sm" title="Delete"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && !loading && <tr><td colSpan="9" className="text-center py-10 text-slate-500">No orders found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}


              {/* === TAB INVENTORY === */}
              {activeTab === 'inventory' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Stock Inventory (Banua Branch)</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Package size={16} /> Connected to Warehouse
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="py-4 px-6">Product Name</th>
                          <th className="py-4 px-6 text-center">Stock Qty</th>
                          <th className="py-4 px-6 text-center">Min. Stock</th>
                          <th className="py-4 px-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {loading ? <tr><td colSpan="4" className="text-center py-10"><Loader2 className="animate-spin text-[#990000] mx-auto" /></td></tr> : inventory.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="py-4 px-6 font-bold text-slate-900">{item.product_name}</td>
                            <td className="py-4 px-6 text-center font-black">{item.stock_qty}</td>
                            <td className="py-4 px-6 text-center text-slate-500">{item.minimum_stok}</td>
                            <td className="py-4 px-6 text-center">
                              {item.stock_qty <= item.minimum_stok ? (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 flex items-center gap-1 justify-center">
                                  <AlertTriangle size={12} /> Low Stock
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1 justify-center">
                                  <CheckCircle size={12} /> Available
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {inventory.length === 0 && !loading && <tr><td colSpan="4" className="text-center py-10 text-slate-500">No inventory data found for Banua branch.</td></tr>}
                      </tbody>
                    </table>
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">Customer</label>
                        <select required value={orderForm.customer} onChange={e => setOrderForm({ ...orderForm, customer: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]">
                          <option value="">Select Customer...</option>
                          {customers.map(c => <option key={c.id} value={c.nama_customer}>{c.nama_customer}</option>)}
                        </select>
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

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Payment Type</label>
                        <select required value={orderForm.payment_type} onChange={e => setOrderForm({ ...orderForm, payment_type: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#990000]">
                          <option value="DP">DP (Down Payment)</option>
                          <option value="Fullpayment">Fullpayment</option>
                          <option value="Non DP">Non DP</option>
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
                          <p className="text-sm font-bold text-slate-600">Date: <span className="font-medium">{new Date(previewQuotation.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
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
      </div>
    </div>
  );
}