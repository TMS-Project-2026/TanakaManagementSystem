import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Users, FileText, ShoppingBag, Plus, Edit, Trash2, Send, X, Search, UserCircle, ChevronDown, Gift,
  Loader2, Download, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Package, Eye, Upload, DollarSign
} from 'lucide-react';
import { submitQuotationToFinance, uploadQuotationFiles } from '../api/quotationApi';
import { getStok, createPermintaanStok } from '../api/gudangApi';
import * as XLSX from 'xlsx';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, BarChart, Bar, Legend
} from 'recharts';

const calculateTopProducts = (ordersList) => {
  if (!Array.isArray(ordersList)) return [];
  const productMap = {};
  ordersList.forEach(o => {
    const productName = o.produk || '-';
    const qty = parseInt(o.qty) || 0;
    const totalRevenue = parseFloat(o.grand_total) || (qty * (parseFloat(o.harga) || 0));
    
    if (!productMap[productName]) {
      productMap[productName] = {
        name: productName,
        qty: 0,
        revenue: 0
      };
    }
    productMap[productName].qty += qty;
    productMap[productName].revenue += totalRevenue;
  });
  
  return Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
};

const formatRangeMTD = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const monthName = d.toLocaleDateString('id-ID', { month: 'long' });
  const year = d.getFullYear();
  return `1 - ${day} ${monthName} ${year}`;
};

export default function MarketingOfflineBanua({ embedded = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const currentTab = embedded ? 'dashboard' : (pathParts[2] || 'dashboard');
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
  const [reportComparisonData, setReportComparisonData] = useState([]);
  const [filterDate1, setFilterDate1] = useState(new Date().toISOString().split('T')[0]);
  const [filterDate2, setFilterDate2] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]; });
  const [filterDateEnd, setFilterDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [filterDateEnd2, setFilterDateEnd2] = useState(() => {
    const d = new Date(); d.setDate(0); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [monthlyFrom, setMonthlyFrom] = useState(() => { const d = new Date(); return `${d.getFullYear()}-01`; });
  const [monthlyTo, setMonthlyTo] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const [berjalanMonthMain, setBerjalanMonthMain] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const [berjalanMonthCmp, setBerjalanMonthCmp] = useState(() => {
    const d = new Date(); const m = d.getMonth() === 0 ? 12 : d.getMonth(); const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
    return `${y}-${String(m).padStart(2, '0')}`;
  });
  const [targetHarian] = useState(2400000);
  const [targetBulanan] = useState(70000000);
  const [targetTahunan] = useState(840000000);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [tooltipProduk, setTooltipProduk] = useState(null);

  // Request Stok States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItemForRequest, setSelectedItemForRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    ukuran: '',
    jumlah: 1,
    nama_pengambil: JSON.parse(localStorage.getItem('user'))?.name || '',
    divisi: 'Marketing Offline Banua',
    keterangan: ''
  });

  useEffect(() => {
    if (pathParts[3]) setReportSubTab(pathParts[3]);
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);
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
      const resOrders = await axios.get('http://localhost:3000/api/marketing-offline/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const totalQty = (resOrders.data || []).reduce((sum, o) => sum + (parseInt(o.qty) || 0), 0);
      setDashboardData(prev => ({
        daily: res.data.harian || [],
        monthly: res.data.bulanan || [],
        tahunan: res.data.tahunan || [],
        summary: {
          ...(res.data.summary || {}),
          total_qty: totalQty
        },
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
      const res = await getStok();
      const rawData = (res.data?.data || res.data || []);
      // Grouping identik dengan Stok Gudang: per Brand + Nama Barang + Cabang
      const sizesArray = ['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL','All Size'];
      const grouped = {};
      rawData.forEach(item => {
        const brand  = (item.nama_brand || '').trim().toLowerCase();
        const nama   = (item.nama_barang || item.product_name || '').trim().toLowerCase();
        const cabang = (item.cabang_id || '').trim().toLowerCase();
        const key = `${brand}|${nama}|${cabang}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: item.id,
            nama_brand: item.nama_brand || '-',
            nama_barang: item.nama_barang || item.product_name || '-',
            kategori: item.kategori || '-',
            cabang_id: item.cabang_id || '-',
            kode_rak: item.kode_rak || '-',
            total_stok: 0,
            minimum_stok: item.minimum_stok || 5,
            sizes: sizesArray.reduce((obj, sz) => { obj[sz] = { qty: 0, id: null }; return obj; }, {})
          };
        }
        grouped[key].total_stok += Number(item.jumlah) || 0;
        if (item.ukuran && grouped[key].sizes[item.ukuran] !== undefined) {
          grouped[key].sizes[item.ukuran].qty += Number(item.jumlah) || 0;
          if (!grouped[key].sizes[item.ukuran].id) grouped[key].sizes[item.ukuran].id = item.id;
        }
        if (item.minimum_stok && item.minimum_stok > grouped[key].minimum_stok) {
          grouped[key].minimum_stok = item.minimum_stok;
        }
      });
      setInventory(Object.values(grouped));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchPromo = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/marketing-offline/promo', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setPromoStock(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const getCategoryForItem = (itemName) => {
        if (!itemName) return 'Lain-lain';
        const name = itemName.toLowerCase().trim();
        if (name.includes('wearpack')) return 'Wearpack';
        if (name.includes('seragam')) return 'Seragam';
        if (name.includes('jaket')) return 'Jaket';
        if (name.includes('jas')) return 'Jas';
        if (name.includes('celana')) return 'Celana';
        if (name.includes('kaos')) return 'Kaos';
        if (name.includes('kemeja')) return 'Kemeja';
        if (name.includes('baju')) return 'Baju';
        if (name.includes('sepatu')) return 'Sepatu';
        if (name.includes('topi')) return 'Topi';
        if (name.includes('dasi')) return 'Dasi';
        if (name.includes('sarung tangan')) return 'Sarung Tangan';
        if (name.includes('ikat pinggang')) return 'Ikat Pinggang';
        const firstWord = itemName.trim().split(' ')[0];
        return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() : 'Lain-lain';
      };
      
      const getOrderItemsWithCategory = (order) => {
        let parsedItems = [];
        try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { parsedItems = []; }
        if (parsedItems.length === 0) {
          parsedItems = [{ rincian: order.produk || 'Produk Tidak Diketahui', qty: parseInt(order.qty) || 1, harga_satuan: parseFloat(order.harga) || 0, total: parseFloat(order.grand_total) || 0 }];
        }
        return parsedItems.map(item => {
          const itemName = item.rincian || item.nama_barang || 'Produk Tidak Diketahui';
          const category = getCategoryForItem(itemName);
          const qty = parseInt(item.qty) || 0;
          const total = parseFloat(item.total) || (qty * (parseFloat(item.harga_satuan) || 0));
          return { category, qty, total };
        });
      };

      const res = await axios.get('http://localhost:3000/api/marketing-offline/orders', { headers: { Authorization: `Bearer ${token}` } });
      let allOrders = res.data || [];
 
      const globalAccounts = new Set();
      allOrders.forEach(o => { 
        if (o.customer) globalAccounts.add(o.customer); 
      });
      const accounts = [...globalAccounts];

      if (reportSubTab === 'harian') {
        const dailyData = [];
        const getDailyRevenue = (orders, customerName, targetDateStr) => {
          if (!targetDateStr) return 0;
          const targetDate = new Date(targetDateStr);
          return orders.reduce((sum, o) => {
              const od = new Date(o.created_at || o.order_date);
              if (o.customer === customerName && od.getFullYear() === targetDate.getFullYear() && od.getMonth() === targetDate.getMonth() && od.getDate() === targetDate.getDate()) {
                  return sum + getOrderItemsWithCategory(o).reduce((s, i) => s + i.total, 0);
              }
              return sum;
          }, 0);
        };
        accounts.forEach(cat => {
          const rev = getDailyRevenue(allOrders, cat, filterDate1);
          const target = targetHarian;
          const ach = target > 0 ? (rev / target) * 100 : 0;
          if (rev > 0) dailyData.push({ account: cat, revenue: rev, target: target, achievement: ach });
        });
        dailyData.sort((a, b) => b.revenue - a.revenue);
        setReportComparisonData(dailyData);
      } else if (reportSubTab === 'berjalan') {
        const dailyData = [];
        const getRangeRevenue = (orders, customerName, sd, ed) => {
          if (!sd || !ed) return 0;
          const startDate = new Date(sd); startDate.setHours(0,0,0,0);
          const endDate = new Date(ed); endDate.setHours(23,59,59,999);
          return orders.reduce((sum, o) => {
              const od = new Date(o.created_at || o.order_date);
              if (o.customer === customerName && od >= startDate && od <= endDate) {
                  return sum + getOrderItemsWithCategory(o).reduce((s, i) => s + i.total, 0);
              }
              return sum;
          }, 0);
        };
        const getMonthsDiff = (d1, d2) => {
          const start = new Date(d1); const end = new Date(d2);
          let months = (end.getFullYear() - start.getFullYear()) * 12; months -= start.getMonth(); months += end.getMonth();
          return months <= 0 ? 1 : months + 1;
        };
        accounts.forEach(acc => {
          const mtd1Revenue = getRangeRevenue(allOrders, acc, filterDate1, filterDateEnd);
          const target = targetBulanan * getMonthsDiff(filterDate1, filterDateEnd);
          const achievement = target > 0 ? (mtd1Revenue / target) * 100 : 0;
          if (mtd1Revenue > 0) dailyData.push({ account: acc, date1: filterDate1, date1End: filterDateEnd, revenue: mtd1Revenue, target: target, achievement: achievement });
        });
        setReportComparisonData(dailyData);
      } else if (reportSubTab === 'berjalan-monthly') {
        const [startYear, startMonth] = berjalanMonthMain.split('-').map(Number);
        const [endYear, endMonth] = berjalanMonthCmp.split('-').map(Number);
        const startCurrent = new Date(startYear, startMonth - 1, 1);
        const endCurrent = new Date(endYear, endMonth, 0, 23, 59, 59, 999);
        const startPrevYear = new Date(startYear - 1, startMonth - 1, 1);
        const endPrevYear = new Date(endYear - 1, endMonth, 0, 23, 59, 59, 999);
        const finalReport = [];
        accounts.forEach(acc => {
          let currentRev = 0, prevYearRev = 0;
          allOrders.forEach(order => {
             if (order.customer !== acc) return;
             const od = new Date(order.created_at || order.order_date);
             const revenue = getOrderItemsWithCategory(order).reduce((s, i) => s + i.total, 0);
             if (od >= startCurrent && od <= endCurrent) currentRev += revenue;
             if (od >= startPrevYear && od <= endPrevYear) prevYearRev += revenue;
          });
          if (currentRev > 0) {
            finalReport.push({
              account: acc, currentRevenue: currentRev, dateCurrent: startCurrent.toISOString(), dateCurrentEnd: endCurrent.toISOString(),
              comparisons: [
                { id: 'target', title: 'Target', compareValue: 0 }, 
                { id: 'prev_year', title: 'Tahun Lalu', compareValue: prevYearRev, dateCompare: startPrevYear.toISOString(), dateCompareEnd: endPrevYear.toISOString() }
              ]
            });
          }
        });
        finalReport.sort((a, b) => b.currentRevenue - a.currentRevenue);
        setReportComparisonData(finalReport);
      } else if (reportSubTab === 'tahunan' || reportSubTab === 'berjalan-tahunan') {
        const today = new Date(); const limitMonth = today.getMonth(); const limitDay = today.getDate();
        const yearlyData = [];
        if (reportSubTab === 'berjalan-tahunan') {
          let startYear = new Date(filterDate1).getFullYear(); let endYear = new Date(filterDate2).getFullYear();
          if (startYear > endYear) { const t = startYear; startYear = endYear; endYear = t; }
          const rangeLength = endYear - startYear + 1; const startPrevYear = startYear - rangeLength; const endPrevYear = endYear - rangeLength;
          const getRangeYtd = (orders, customerName, sY, eY) => orders.reduce((sum, o) => {
              const od = new Date(o.created_at || o.order_date); const orderYear = od.getFullYear();
              if (o.customer === customerName && orderYear >= sY && orderYear <= eY && (od.getMonth() < limitMonth || (od.getMonth() === limitMonth && od.getDate() <= limitDay))) {
                 return sum + getOrderItemsWithCategory(o).reduce((s, i) => s + i.total, 0);
              }
              return sum;
          }, 0);
          accounts.forEach(acc => {
            const v1 = getRangeYtd(allOrders, acc, startYear, endYear); const v2 = getRangeYtd(allOrders, acc, startPrevYear, endPrevYear);
            if (v1 > 0) {
              yearlyData.push({
                account: acc, currentRevenue: v1, dateCurrent: `${startYear}`, dateCurrentEnd: `${endYear}`,
                comparisons: [ { id: 'target', title: 'Target', compareValue: 0 }, { id: 'prev_year', title: 'Tahun Lalu', compareValue: v2, dateCompare: `${startPrevYear}`, dateCompareEnd: `${endPrevYear}` } ]
              });
            }
          });
        } else {
          const y1 = new Date(filterDate1).getFullYear(); const y2 = y1 - 1;
          const getYearlyYtd = (orders, customerName, yearNum) => orders.reduce((sum, o) => {
              const od = new Date(o.created_at || o.order_date);
              if (o.customer === customerName && od.getFullYear() === yearNum && (od.getMonth() < limitMonth || (od.getMonth() === limitMonth && od.getDate() <= limitDay))) {
                 return sum + getOrderItemsWithCategory(o).reduce((s, i) => s + i.total, 0);
              }
              return sum;
          }, 0);
          accounts.forEach(acc => {
            const v1 = getYearlyYtd(allOrders, acc, y1); const v2 = getYearlyYtd(allOrders, acc, y2);
            if (v1 > 0) {
              yearlyData.push({
                account: acc, currentRevenue: v1, dateCurrent: `${y1}`,
                comparisons: [ { id: 'target', title: 'Target', compareValue: 0 }, { id: 'prev_year', title: 'Tahun Sebelumnya', compareValue: v2, dateCompare: `${y2}` } ]
              });
            }
          });
        }
        yearlyData.sort((a, b) => b.currentRevenue - a.currentRevenue);
        setReportComparisonData(yearlyData);
      } else if (reportSubTab === 'bulanan-monthly') {
        const [mainYear, mainMonth] = monthlyTo.split('-').map(Number);
        const getMonthRev = (orders, customerName, year, month) => orders.reduce((sum, o) => {
              const od = new Date(o.created_at || o.order_date);
              if (o.customer === customerName && od.getFullYear() === year && (od.getMonth() + 1) === month) {
                 return sum + getOrderItemsWithCategory(o).reduce((s, i) => s + i.total, 0);
              }
              return sum;
        }, 0);
        const monthlyResult = [];
        accounts.forEach(acc => {
          const v1 = getMonthRev(allOrders, acc, mainYear, mainMonth);
          if (v1 > 0) monthlyResult.push({ account: acc, date1: monthlyTo, val1: v1, revenue: v1 });
        });
        monthlyResult.sort((a, b) => b.val1 - a.val1);
        setReportComparisonData(monthlyResult);
      } else if (reportSubTab === 'bulanan') {
        const startCurrent = new Date(filterDate1); startCurrent.setHours(0, 0, 0, 0);
        const endCurrent = new Date(filterDateEnd); endCurrent.setHours(23, 59, 59, 999);

        const startPrevMonth = new Date(startCurrent); startPrevMonth.setMonth(startPrevMonth.getMonth() - 1);
        if (startPrevMonth.getDate() !== startCurrent.getDate()) startPrevMonth.setDate(0);
        const endPrevMonth = new Date(endCurrent); endPrevMonth.setMonth(endPrevMonth.getMonth() - 1);
        if (endPrevMonth.getDate() !== endCurrent.getDate()) endPrevMonth.setDate(0);

        const startPrevYear = new Date(startCurrent); startPrevYear.setFullYear(startPrevYear.getFullYear() - 1);
        if (startPrevYear.getDate() !== startCurrent.getDate()) startPrevYear.setDate(0);
        const endPrevYear = new Date(endCurrent); endPrevYear.setFullYear(endPrevYear.getFullYear() - 1);
        if (endPrevYear.getDate() !== endCurrent.getDate()) endPrevYear.setDate(0);

        const finalReport = [];
        accounts.forEach(acc => {
          let currentRev = 0, prevMonthRev = 0, prevYearRev = 0;
          allOrders.forEach(order => {
            if (order.customer !== acc) return;
            const od = new Date(order.created_at || order.order_date);
            const revenue = getOrderItemsWithCategory(order).reduce((s, i) => s + i.total, 0);
            if (od >= startCurrent && od <= endCurrent) currentRev += revenue;
            if (od >= startPrevMonth && od <= endPrevMonth) prevMonthRev += revenue;
            if (od >= startPrevYear && od <= endPrevYear) prevYearRev += revenue;
          });
          if (currentRev > 0) {
            finalReport.push({
              account: acc, currentRevenue: currentRev, dateCurrent: startCurrent.toISOString(), dateCurrentEnd: endCurrent.toISOString(),
              comparisons: [
                { id: 'target', title: 'Target', compareValue: 0 },
                { id: 'prev_month', title: 'Bulan Sebelumnya', compareValue: prevMonthRev, dateCompare: startPrevMonth.toISOString(), dateCompareEnd: endPrevMonth.toISOString() },
                { id: 'prev_year', title: 'Tahun Lalu', compareValue: prevYearRev, dateCompare: startPrevYear.toISOString(), dateCompareEnd: endPrevYear.toISOString() }
              ]
            });
          }
        });
        finalReport.sort((a, b) => b.currentRevenue - a.currentRevenue);
        setReportComparisonData(finalReport);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleRequestStokSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.ukuran) return alert('Silakan pilih ukuran terlebih dahulu!');
    if (!selectedItemForRequest.sizes[requestForm.ukuran]?.id) return alert('ID Stok untuk ukuran ini tidak ditemukan!');
    
    try {
        await createPermintaanStok({
            stok_id: selectedItemForRequest.sizes[requestForm.ukuran].id,
            jumlah: requestForm.jumlah,
            nama_pengambil: requestForm.nama_pengambil,
            divisi: requestForm.divisi,
            keterangan: requestForm.keterangan
        });
        alert('Permintaan stok berhasil diajukan dan menunggu approval Gudang.');
        setShowRequestModal(false);
        setRequestForm(prev => ({ ...prev, ukuran: '', jumlah: 1, keterangan: '' }));
    } catch (err) {
        alert(err.response?.data?.message || 'Terjadi kesalahan saat mengajukan permintaan.');
    }
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

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
      fetchOrders();
    }
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'customers') fetchCustomers();
    if (activeTab === 'quotations') fetchQuotations();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'promo') fetchPromo();
  }, [activeTab, startDate, endDate, reportSubTab, filterDate1, filterDate2, filterDateEnd, filterDateEnd2, monthlyFrom, monthlyTo, berjalanMonthMain, berjalanMonthCmp]);

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

  const handleExportExcel = () => {
    let dataToExport = [];
    let fileName = "";

    if (activeTab === 'reports') {
      dataToExport = (reportComparisonData || []).map(r => ({
        'Instansi': r.account || '-',
        'Pendapatan': r.revenue || r.currentRevenue || r.val1 || 0,
        'Target': r.target || (reportSubTab === 'tahunan' || reportSubTab === 'berjalan-tahunan' ? targetTahunan : targetBulanan),
        'Pencapaian (%)': (r.achievement || ((r.revenue || r.currentRevenue || r.val1 || 0) / (r.target || (reportSubTab === 'tahunan' || reportSubTab === 'berjalan-tahunan' ? targetTahunan : targetBulanan) || 1) * 100)).toFixed(2) + '%'
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

  const filteredCustomers = customers.filter(c =>
    (c.nama_customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.no_hp || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.alamat || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuotations = quotations.filter(q =>
    (q.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.note || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    (o.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.produk || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.status_produksi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.payment_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.status || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInventory = inventory.filter(item =>
    (item.nama_brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.nama_barang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.kode_rak || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.kategori || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.cabang_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPromoStock = promoStock.filter(item =>
    (item.nama_brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.cabang_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
      {!embedded && <Sidebar />}
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR SEARCH & PROFILE */}
        <header className={`h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-10 sticky top-0 z-30 shrink-0 ${activeTab === 'dashboard' ? 'justify-end' : 'justify-between'}`}>
          {activeTab !== 'dashboard' && (
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Cari data ${activeTab === 'customers' ? 'pelanggan' : activeTab === 'quotations' ? 'quotation' : activeTab === 'orders' ? 'order' : activeTab === 'inventory' ? 'stok' : 'marketing offline'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-red-50 focus:bg-white focus:border-red-200 transition-all shadow-inner"
              />
            </div>
          )}
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
        <div className="flex-1 overflow-y-auto px-6 pb-6 bg-[#f3f4f6] pt-6">
          <div className={activeTab === 'dashboard' ? '' : 'bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100'}>
            {/* Dynamic Header Module Title */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                  {activeTab === 'dashboard' && (
                    <>
                      <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                        <Activity className="text-[#990000]" size={20} />
                      </div>
                      Dashboard Offline
                    </>
                  )}
                  {activeTab === 'customers' && (
                    <>
                      <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg shadow-sm">
                        <Users className="text-blue-600" size={20} />
                      </div>
                      Database Pelanggan
                    </>
                  )}
                  {activeTab === 'quotations' && (
                    <>
                      <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg shadow-sm">
                        <FileText className="text-amber-600" size={20} />
                      </div>
                      Quotation Management
                    </>
                  )}
                  {activeTab === 'orders' && (
                    <>
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg shadow-sm">
                        <ShoppingBag className="text-emerald-600" size={20} />
                      </div>
                      Offline Order
                    </>
                  )}
                  {activeTab === 'inventory' && (
                    <>
                      <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg shadow-sm">
                        <Package className="text-indigo-600" size={20} />
                      </div>
                      Stok Inventori Banua
                    </>
                  )}
                  {activeTab === 'reports' && (
                    <>
                      <div className="bg-violet-50 border border-violet-100 p-2 rounded-lg shadow-sm">
                        <TrendingUp className="text-violet-600" size={20} />
                      </div>
                      {reportSubTab === 'tahunan' ? 'Laporan Tahunan Offline' : reportSubTab === 'berjalan-tahunan' ? 'Laporan Tahun Berjalan Offline' : reportSubTab === 'bulanan-monthly' ? 'Laporan Bulanan Offline' : reportSubTab === 'berjalan-monthly' ? 'Laporan Bulan Berjalan Offline' : reportSubTab === 'bulanan' ? 'Laporan Harian Berjalan Offline' : reportSubTab === 'berjalan' ? 'Laporan Bulan Berjalan Offline' : 'Laporan Harian Offline'}
                    </>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {activeTab === 'dashboard' && 'Kelola rangkuman data penjualan offline cabang Banua secara ringkas.'}
                  {activeTab === 'customers' && 'Daftar seluruh data pelanggan terdaftar untuk mempermudah relasi pemasaran.'}
                  {activeTab === 'quotations' && 'Buat dan pantau penawaran harga (Quotation) untuk calon pelanggan.'}
                  {activeTab === 'orders' && 'Catat order baru dan pantau riwayat penjualan offline secara lengkap.'}
                  {activeTab === 'inventory' && 'Pantau ketersediaan stok fisik barang siap jual di cabang Banua.'}
                  {activeTab === 'reports' && 'Analisis performa penjualan offline berdasarkan grafik pencapaian.'}
                  {activeTab === 'promo' && 'Daftar produk promo mengendap untuk mendorong aktivitas penjualan.'}
                </p>
              </div>

            {/* Action Buttons for Orders only */}
            {activeTab === 'orders' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                >
                  <Download size={18} /> Eksport Excel
                </button>
                <button
                  onClick={() => navigate('/marketing-offline/create-order')}
                  className="flex items-center gap-2 bg-[#990000] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  <Plus size={18} /> Add Order
                </button>
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
                      { title: 'Revenue (Bulan Ini)', value: formatRupiah(dashboardData.summary.range_revenue), icon: <DollarSign size={16} className="text-white" /> },
                      { title: 'Transaction', value: `${dashboardData.summary.total_orders || 0} Orders`, icon: <ShoppingBag size={16} className="text-white" /> },
                      { title: 'Total Customer', value: `${dashboardData.summary.total_customers || 0} Customers`, icon: <Users size={16} className="text-white" /> },
                      { title: 'Qty Terjual', value: `${dashboardData.summary.total_qty || 0} Pcs`, icon: <Package size={16} className="text-white" /> }
                    ].map((card, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-1 hover:shadow-md min-h-[110px]"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-[30px] h-[30px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                            {card.icon}
                          </div>
                          <p className="text-[12px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title || card.label}</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight truncate">{card.value}</h3>
                        {card.sub && <p className="text-[11px] mt-1 font-medium text-gray-400 truncate">{card.sub}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sales Trend - Line Chart (2/3 width) */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <TrendingUp className="text-[#990000]" size={22} /> Tren Penjualan (30 Hari Terakhir)
                        </h3>
                      </div>
                      <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dashboardData?.daily || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                              dataKey="tanggal"
                              tickFormatter={(tickVal) => {
                                if (!tickVal) return '';
                                const date = new Date(tickVal);
                                if (isNaN(date.getTime())) return tickVal;
                                return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                              }}
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
                              labelFormatter={(label) => {
                                if (!label) return '';
                                const date = new Date(label);
                                if (isNaN(date.getTime())) return label;
                                return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
                              }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="pendapatan"
                              name="Revenue"
                              stroke="#990000"
                              strokeWidth={4}
                              dot={{ r: 4, fill: '#990000', strokeWidth: 2, stroke: '#fff' }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                          <Package className="text-orange-500" size={22} /> Top 5 Produk
                        </h3>
                        {orders.length > 0 ? (
                          <div className="space-y-3">
                            {(() => {
                              const topProducts = calculateTopProducts(orders);
                              const maxQty = topProducts[0]?.qty || 1;
                              
                              return topProducts.map((p, idx) => {
                                const pct = Math.round((p.qty / maxQty) * 100);
                                const rankColors = ['#990000', '#c0392b', '#e74c3c', '#e67e22', '#f39c12'];
                                const badgeBg = ['bg-red-900', 'bg-red-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500'];
                                return (
                                  <div key={idx} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`${badgeBg[idx]} text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0`}>
                                        {idx + 1}
                                      </span>
                                      {/* Nama produk — klik untuk lihat nama lengkap */}
                                      <div className="relative flex-1 min-w-0">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTooltipProduk(tooltipProduk === idx ? null : idx);
                                          }}
                                          className="text-xs font-bold text-gray-800 truncate w-full text-left hover:text-[#990000] transition-colors cursor-pointer"
                                          title="Klik untuk lihat nama lengkap"
                                          type="button"
                                        >
                                          {p.name}
                                        </button>
                                        {/* Popup nama lengkap */}
                                        {tooltipProduk === idx && (
                                          <div
                                            className="absolute left-0 top-full mt-1 z-50 bg-gray-950 text-white text-[11px] font-semibold px-3 py-2 rounded-xl shadow-2xl max-w-[220px] leading-snug"
                                            style={{ animation: 'fadeInDown 0.15s ease' }}
                                          >
                                            <span className="text-orange-300 font-black text-[9px] uppercase tracking-wider block mb-0.5">Nama Produk</span>
                                            {p.name}
                                            {/* Panah atas */}
                                            <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-950 rotate-45 rounded-sm" />
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-xs font-black text-[#990000] shrink-0">{p.qty} Qty</span>
                                    </div>
                                    <div className="flex items-center gap-2 pl-7">
                                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="h-2 rounded-full transition-all duration-700"
                                          style={{ width: `${pct}%`, backgroundColor: rankColors[idx] }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-semibold shrink-0 w-20 text-right">
                                        {formatRupiah(p.revenue)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 font-medium py-10">Belum ada data produk terjual</div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* === TAB REPORTS & ANALYTICS === */}
              {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {(() => {
                    try {
                    const getDaysDiff = (d1, d2) => {
                        const start = new Date(d1);
                        const end = new Date(d2);
                        return Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
                    };
                    const getMonthsDiff = (d1, d2) => {
                        const start = new Date(d1); const end = new Date(d2);
                        let months = (end.getFullYear() - start.getFullYear()) * 12; months -= start.getMonth(); months += end.getMonth();
                        return months <= 0 ? 1 : months + 1;
                    };
                    const derivedHarianBerjalanTarget = getDaysDiff(filterDate1, filterDateEnd) * targetHarian;
                    const filteredReportComparisonData = reportComparisonData || [];
                    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);

                    return (
                        <>
{/* Date Filters */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-6 items-end">
                {reportSubTab === 'tahunan' ? (
                  <>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periode Tahun (YTD)</label>
                      <select
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={new Date(filterDate1).getFullYear()}
                        onChange={e => {
                          const year = e.target.value;
                          const currentMonthDay = new Date().toISOString().substring(4, 10);
                          setFilterDate1(`${year}${currentMonthDay}`);
                        }}
                      >
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let y = currentYear + 1; y >= 2020; y--) years.push(y);
                          return years.map(y => <option key={y} value={y}>{y}</option>);
                        })()}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        <span className="font-bold text-gray-700">{formatRupiah(targetTahunan)}</span>
                      </div>
                    </div>
                  </>
                ) : reportSubTab === 'berjalan-tahunan' ? (
                  <>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dari Tahun (YTD)</label>
                      <select
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={new Date(filterDate1).getFullYear()}
                        onChange={e => {
                          const year = e.target.value;
                          const currentMonthDay = new Date(filterDate1).toISOString().substring(4, 10);
                          setFilterDate1(`${year}${currentMonthDay}`);
                        }}
                      >
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let y = currentYear + 1; y >= 2020; y--) years.push(y);
                          return years.map(y => <option key={y} value={y}>{y}</option>);
                        })()}
                      </select>
                    </div>
                    <div className="flex items-end pb-3 text-gray-400 font-black text-lg select-none">—</div>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sampai Tahun (YTD)</label>
                      <select
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={new Date(filterDate2).getFullYear()}
                        onChange={e => {
                          const year = e.target.value;
                          const currentMonthDay = new Date(filterDate2).toISOString().substring(4, 10);
                          setFilterDate2(`${year}${currentMonthDay}`);
                        }}
                      >
                        {(() => {
                          const currentYear = new Date().getFullYear();
                          const years = [];
                          for (let y = currentYear + 1; y >= 2020; y--) years.push(y);
                          return years.map(y => <option key={y} value={y}>{y}</option>);
                        })()}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        {formatRupiah(targetTahunan * (Math.abs(new Date(filterDate2).getFullYear() - new Date(filterDate1).getFullYear()) + 1))}
                      </div>
                    </div>
                  </>
                ) : reportSubTab === 'harian' ? (
                  <>
                    <div className="flex-1 min-w-[200px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pilih Tanggal</label>
                      <input
                        type="date"
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={filterDate1}
                        onChange={e => setFilterDate1(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        {formatRupiah(targetHarian)}
                      </div>
                    </div>
                  </>
                ) : reportSubTab === 'berjalan' ? (
                  <>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periode Bulan</label>
                      <div className="flex items-center space-x-2">
                        <input type="date" className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium" value={filterDate1} onChange={e => setFilterDate1(e.target.value)} />
                        <span className="text-gray-400 font-black">—</span>
                        <input type="date" className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        {formatRupiah(targetBulanan * getMonthsDiff(filterDate1, filterDateEnd))}
                      </div>
                    </div>
                  </>
                ) : reportSubTab === 'bulanan-monthly' ? (
                  // Laporan Bulanan: pilih 1 bulan saja
                  <>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periode Bulan</label>
                      <input
                        type="month"
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={monthlyTo}
                        onChange={e => setMonthlyTo(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        {formatRupiah(targetBulanan)}
                      </div>
                    </div>
                  </>
                ) : reportSubTab === 'berjalan-monthly' ? (
                  // Laporan Bulan Berjalan: rentang bulan
                  <>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dari Bulan</label>
                      <input
                        type="month"
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={berjalanMonthMain}
                        onChange={e => setBerjalanMonthMain(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end pb-3 text-gray-400 font-black text-lg select-none">—</div>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sampai Bulan</label>
                      <input
                        type="month"
                        className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium"
                        value={berjalanMonthCmp}
                        onChange={e => setBerjalanMonthCmp(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        {formatRupiah(targetBulanan * getMonthsDiff(`${berjalanMonthMain}-01`, `${berjalanMonthCmp}-01`))}
                      </div>
                    </div>
                  </>
                ) : (
                  // Laporan Harian Berjalan: rentang tanggal + target
                  <>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dari Tanggal</label>
                      <input
                        type="date"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100"
                        value={filterDate1}
                        onChange={e => setFilterDate1(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end pb-3 text-gray-400 font-black text-lg select-none">—</div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sampai Tanggal</label>
                      <input
                        type="date"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-100"
                        value={filterDateEnd}
                        onChange={e => setFilterDateEnd(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-bold">
                        {formatRupiah(derivedHarianBerjalanTarget)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">No</th>
                        <th className="py-4 px-6 text-left text-xs font-black uppercase tracking-widest border border-gray-800">Instansi</th>
                        {reportSubTab === 'harian' && (
                          <>
                            <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan Hari Ini</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Target Harian</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                          </>
                        )}
                        {(reportSubTab === 'bulanan' || reportSubTab === 'berjalan-monthly' || reportSubTab === 'berjalan-tahunan') && (
                          <>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800 bg-gray-800/50 min-w-[220px]">{reportSubTab === 'berjalan-tahunan' ? 'Periode Tahun (YTD)' : 'Periode'}</th>
                            <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                          </>
                        )}
                        {reportSubTab === 'tahunan' && (
                          <>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800 bg-gray-800/50 min-w-[220px]">Periode Tahun (YTD)</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Target</th>
                            <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                          </>
                        )}
                        {reportSubTab === 'bulanan-monthly' && (
                          <>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800 bg-gray-800/50 min-w-[200px]">Periode Bulan</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Target</th>
                            <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                          </>
                        )}
                        {reportSubTab === 'berjalan' && (
                          <>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800 bg-gray-800/50 min-w-[220px]">
                              Rentang Tanggal (Berjalan)
                            </th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Target</th>
                            <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                            <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredReportComparisonData.length > 0 ? (
                        reportSubTab === 'bulanan-monthly' ? (
                          filteredReportComparisonData.map((row, idx) => {
                            const t = targetBulanan || 0;
                            const ach = t > 0 ? (row.val1 / t) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-4 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                <td className="py-4 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                                <td className="py-4 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                  {new Date(row.date1 + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-gray-700 border-b border-gray-100">
                                  {formatRupiah(t)}
                                </td>
                                <td className="py-4 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.val1)}</td>
                                <td className="py-4 px-6 text-center border-x border-b border-gray-100">
                                  <span className={`text-xl font-black ${ach >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                    {ach.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : reportSubTab === 'harian' ? (
                          filteredReportComparisonData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                              <td className="py-4 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                              <td className="py-4 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.revenue)}</td>
                              <td className="py-4 px-6 text-center border-b border-gray-100">
                                <span className="font-bold text-gray-700">{formatRupiah(row.target)}</span>
                              </td>
                              <td className="py-4 px-6 text-center border-x border-b border-gray-100">
                                <span className={`text-xl font-black ${(row.achievement || 0) >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                  {Number(row.achievement || 0).toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : reportSubTab === 'berjalan' ? (
                          filteredReportComparisonData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                              <td className="py-4 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                              <td className="py-4 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                {new Date(row.date1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} – {new Date(row.date1End).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-4 px-6 text-center font-bold text-gray-700 border-b border-gray-100">{formatRupiah(row.target)}</td>
                              <td className="py-4 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.revenue)}</td>
                              <td className="py-4 px-6 text-center border-x border-b border-gray-100">
                                <span className={`text-xl font-black ${row.achievement >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                  {row.achievement?.toFixed(2)}%
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : reportSubTab === 'tahunan' ? (
                          filteredReportComparisonData.map((row, idx) => {
                            const t = targetTahunan || 0;
                            const ach = t > 0 ? (row.currentRevenue / t) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-4 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                <td className="py-4 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                                <td className="py-4 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                  {row.dateCurrent ? `Tahun ${row.dateCurrent}` : 'Tahun Ini'}
                                </td>
                                <td className="py-4 px-6 text-center font-bold text-gray-700 border-b border-gray-100">
                                  {formatRupiah(t)}
                                </td>
                                <td className="py-4 px-6 text-right font-black text-blue-700 border-b border-gray-100">
                                  {formatRupiah(row.currentRevenue)}
                                </td>
                                <td className="py-4 px-6 text-center border-x border-b border-gray-100">
                                  <span className={`text-xl font-black ${ach >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                    {ach.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (reportSubTab === 'bulanan' || reportSubTab === 'berjalan-monthly' || reportSubTab === 'berjalan-tahunan') ? (
                          filteredReportComparisonData.map((accRow, idx) => {
                            let comparisons = [
                              { 
                                titleCompare: 'Target',
                                valueCompare: reportSubTab === 'berjalan-tahunan' 
                                  ? targetTahunan * (Math.abs(new Date(filterDate2).getFullYear() - new Date(filterDate1).getFullYear()) + 1)
                                  : (reportSubTab === 'bulanan' 
                                    ? targetHarian * getDaysDiff(filterDate1, filterDateEnd) 
                                    : (reportSubTab === 'berjalan-monthly' 
                                      ? targetBulanan * getMonthsDiff(`${berjalanMonthMain}-01`, `${berjalanMonthCmp}-01`) 
                                      : targetBulanan)),
                                dateCompare1: null,
                                dateCompare2: null

                              }
                            ];

                            if (reportSubTab === 'berjalan-tahunan' || reportSubTab === 'berjalan-monthly') {
                              comparisons.push({ 
                                titleCompare: 'Tahun Lalu',
                                valueCompare: accRow.comparisons?.find(c => c.id === 'prev_year')?.compareValue || 0,
                                dateCompare1: accRow.comparisons?.find(c => c.id === 'prev_year')?.dateCompare,
                                dateCompare2: accRow.comparisons?.find(c => c.id === 'prev_year')?.dateCompareEnd
                              });
                            } else {
                              comparisons.push({ 
                                titleCompare: 'Bulan Sebelumnya',
                                valueCompare: accRow.comparisons?.find(c => c.id === 'prev_month')?.compareValue || 0,
                                dateCompare1: accRow.comparisons?.find(c => c.id === 'prev_month')?.dateCompare,
                                dateCompare2: accRow.comparisons?.find(c => c.id === 'prev_month')?.dateCompareEnd
                              });
                            }

                            if (reportSubTab !== 'berjalan-tahunan' && reportSubTab !== 'berjalan-monthly') {
                              comparisons.push({ 
                                titleCompare: reportSubTab === 'tahunan' ? 'Tahun Sebelumnya' : 'Tahun Lalu',
                                valueCompare: accRow.comparisons?.find(c => c.id === 'prev_year')?.compareValue || 0,
                                dateCompare1: accRow.comparisons?.find(c => c.id === 'prev_year')?.dateCompare,
                                dateCompare2: accRow.comparisons?.find(c => c.id === 'prev_year')?.dateCompareEnd
                              });
                            }
                            return (
                              <React.Fragment key={idx}>
                                {comparisons.map((comp, compIdx) => {
                                  const ach = comp.valueCompare > 0 ? (accRow.currentRevenue / comp.valueCompare) * 100 : (accRow.currentRevenue > 0 ? 100 : 0);
                                  return (
                                    <React.Fragment key={`${idx}-${compIdx}`}>
                                      <tr className="hover:bg-blue-50/30 transition-colors border-t border-gray-100">
                                        {compIdx === 0 && (
                                          <>
                                            <td rowSpan={comparisons.length * 2} className="py-6 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                            <td rowSpan={comparisons.length * 2} className="py-6 px-6 font-black text-gray-900 border-x border-b border-gray-100">{accRow.account}</td>
                                          </>
                                        )}
                                        <td className="py-3 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                          {accRow.dateCurrent ? (
                                            reportSubTab === 'berjalan-tahunan'
                                              ? `Tahun ${accRow.dateCurrent} – ${accRow.dateCurrentEnd} (YTD)`
                                              : (reportSubTab === 'tahunan'
                                                ? `Tahun ${accRow.dateCurrent} (YTD)`
                                                : (reportSubTab === 'berjalan-monthly' 
                                                    ? `${new Date(accRow.dateCurrent).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} – ${new Date(accRow.dateCurrentEnd).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                                                    : (accRow.dateCurrentEnd ? `${new Date(accRow.dateCurrent).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(accRow.dateCurrentEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Bulan Ini')))
                                          ) : (reportSubTab === 'berjalan-tahunan' ? 'Tahun Ini' : 'Bulan Ini')}
                                        </td>
                                        <td className="py-3 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(accRow.currentRevenue)}</td>
                                        <td rowSpan={2} className="py-6 px-6 text-center border-x border-b border-gray-100">
                                          <span className={`text-xl font-black ${ach >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                            {ach.toFixed(2)}%
                                          </span>
                                        </td>
                                      </tr>
                                      <tr className="hover:bg-blue-50/30 transition-colors">
                                        <td className="py-3 px-6 text-center font-bold bg-violet-50 text-violet-700 border-b border-gray-100">
                                            {comp.dateCompare1 ? (
                                              <>
                                                <span className="text-[10px] uppercase tracking-wider opacity-60 block mb-0.5">{comp.titleCompare}</span>
                                                {reportSubTab === 'berjalan-tahunan'
                                                  ? `↩ Tahun ${comp.dateCompare1} – ${comp.dateCompare2} (YTD)`
                                                  : (reportSubTab === 'tahunan'
                                                    ? `↩ Tahun ${comp.dateCompare1} (YTD)`
                                                    : (reportSubTab === 'berjalan-monthly'
                                                        ? `↩ ${new Date(comp.dateCompare1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                                                        : (comp.dateCompare2 ? `↩ ${new Date(comp.dateCompare1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(comp.dateCompare2).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : `↩ ${comp.titleCompare}`)))}
                                              </>
                                          ) : (
                                            `↩ ${comp.titleCompare}`
                                          )}
                                        </td>
                                        <td className="py-3 px-6 text-right font-bold text-gray-400 border-b border-gray-100">{formatRupiah(comp.valueCompare)}</td>
                                      </tr>
                                    </React.Fragment>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })
                        ) : null
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data untuk periode terpilih atau cocok.</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      {(reportSubTab === 'bulanan' || reportSubTab === 'berjalan-monthly' || reportSubTab === 'berjalan-tahunan') ? (
                        <tr className="bg-gray-900 text-white font-black uppercase text-xs">
                          <td colSpan={3} className="py-5 px-6 text-right tracking-widest text-gray-300">Total Keseluruhan ({reportSubTab === 'berjalan-tahunan' ? 'Tahun Ini' : 'Bulan Ini'})</td>
                          <td className="py-5 px-6 text-right text-emerald-400 text-lg">
                            {formatRupiah(filteredReportComparisonData.reduce((acc, curr) => acc + curr.currentRevenue, 0))}
                          </td>
                          <td className="py-5 px-6 text-center">
                            {(() => {
                              const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + curr.currentRevenue, 0);
                              const totalTarget = reportSubTab === 'berjalan-tahunan' 
                                ? targetTahunan * (Math.abs(new Date(filterDate2).getFullYear() - new Date(filterDate1).getFullYear()) + 1) 
                                : (reportSubTab === 'berjalan-monthly' 
                                  ? targetBulanan * getMonthsDiff(`${berjalanMonthMain}-01`, `${berjalanMonthCmp}-01`) 
                                  : (reportSubTab === 'bulanan' ? derivedHarianBerjalanTarget : filteredReportComparisonData.reduce((acc, curr) => {
                                      const t = reportSubTab === 'tahunan' ? targetTahunan : targetBulanan;
                                      return acc + t;
                                    }, 0)));
                              const pct = totalTarget > 0 ? (totalRev / totalTarget) * 100 : (totalRev > 0 ? 100 : 0);
                              return (
                                <div>
                                  <span className={`text-lg font-black ${pct >= 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {pct.toFixed(2)}%
                                  </span>
                                  <span className="text-[10px] text-gray-400 block mt-1 font-semibold uppercase tracking-wider">(vs Total Target)</span>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ) : (
                        <tr className="bg-gray-900 text-white font-black uppercase text-xs">
                          <td colSpan={reportSubTab === 'harian' ? 2 : 3} className="py-5 px-6 text-right">{reportSubTab === 'bulanan-monthly' || reportSubTab === 'tahunan' ? 'Total Keseluruhan' : 'Total Pendapatan (Periode Berjalan)'}</td>
                          
                          {(reportSubTab === 'bulanan-monthly' || reportSubTab === 'tahunan') && (
                            <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                              {formatRupiah(reportSubTab === 'tahunan' ? targetTahunan : targetBulanan)}
                            </td>
                          )}

                          <td className="py-5 px-6 text-right text-emerald-400 text-lg">
                            {formatRupiah(filteredReportComparisonData.reduce((acc, curr) => acc + (reportSubTab === 'harian' ? curr.revenue : curr.val1 || curr.currentRevenue || curr.revenue), 0))}
                          </td>
                          {reportSubTab === 'harian' ? (
                            <>
                              <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                                {formatRupiah(targetHarian)}
                              </td>
                              <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                                {(() => {
                                  const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
                                  const pct = targetHarian > 0 ? (totalRev / targetHarian) * 100 : 0;
                                  return `${pct.toFixed(2)}%`;
                                })()}
                              </td>
                            </>
                          ) : (
                            <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                              {(() => {
                                  const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + (curr.val1 || curr.currentRevenue || curr.revenue), 0);
                                  if (reportSubTab === 'bulanan-monthly') {
                                    const pct = targetBulanan > 0 ? (totalRev / targetBulanan) * 100 : 0;
                                    return `${pct.toFixed(2)}%`;
                                  } else if (reportSubTab === 'tahunan') {
                                    const pct = targetTahunan > 0 ? (totalRev / targetTahunan) * 100 : 0;
                                    return `${pct.toFixed(2)}%`;
                                  } else {
                                    const totalPrev = filteredReportComparisonData.reduce((acc, curr) => acc + (curr.val2 || curr.prevRevenue), 0);
                                    const pct = totalPrev > 0 ? (totalRev / totalPrev) * 100 : (totalRev > 0 ? 100 : 0);
                                    return `${pct.toFixed(2)}%`;
                                  }
                                })()}
                            </td>
                          )}
                        </tr>
                      )}
                      {reportSubTab === 'berjalan' && (
                        <tr className="bg-gray-800 text-white font-black uppercase text-xs">
                          <td colSpan={3} className="py-4 px-6 text-right text-gray-300">Target Keseluruhan (MTD)</td>
                          <td className="py-4 px-6 text-right border-l border-gray-700">
                            <span className="text-emerald-400 font-bold text-lg">
                              {(() => {
                                const totalTarget = targetBulanan * getMonthsDiff(filterDate1, filterDateEnd);
                                return formatRupiah(totalTarget);
                              })()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center text-blue-400 text-lg font-black border-l border-gray-700">
                            {(() => {
                                const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + curr.revenue, 0);
                                const totalTarget = targetBulanan * getMonthsDiff(filterDate1, filterDateEnd);
                                const pct = totalTarget > 0 ? (totalRev / totalTarget) * 100 : 0;
                                return `${pct.toFixed(2)}%`;
                            })()} <span className="text-xs text-gray-400 block mt-1">(Ach. Target)</span>
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">
                      {reportSubTab === 'harian' ? 'Pencapaian Target Instansi' : 'Perbandingan Performa Instansi'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {reportSubTab === 'harian' ? 'Visualisasi pendapatan harian terhadap target' : 'Visualisasi pendapatan antara dua periode terpilih'}
                    </p>
                  </div>
                  {(reportSubTab !== 'bulanan' && reportSubTab !== 'bulanan-monthly') && (
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          {reportSubTab === 'harian' ? 'Pendapatan Hari Ini' : 'Periode Utama'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${reportSubTab === 'harian' ? 'bg-emerald-500' : 'bg-gray-300'} rounded-full`}></div>
                        <span className="text-[10px] font-bold uppercase text-gray-400">
                          {reportSubTab === 'harian' ? 'Target Harian' : 'Pembanding'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={
                      (reportSubTab === 'bulanan' || reportSubTab === 'berjalan-monthly' || reportSubTab === 'tahunan') ? filteredReportComparisonData.map(acc => ({
                        account: acc.account,
                        revenue: acc.currentRevenue,
                        target: reportSubTab === 'tahunan' ? targetTahunan : targetBulanan,
                        prevMonth: reportSubTab === 'tahunan' ? 0 : (acc.comparisons?.find(c => c.id === 'prev_month')?.compareValue || 0),
                        prevYear: acc.comparisons?.find(c => c.id === 'prev_year')?.compareValue || 0
                      })) :
                      reportSubTab === 'berjalan' ? filteredReportComparisonData.map(row => ({
                        account: row.account,
                        revenue: row.revenue,
                        target: row.target
                      })) :
                      filteredReportComparisonData
                    }>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="account"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
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
                      <Legend />
                      <Bar dataKey={reportSubTab === 'harian' ? 'revenue' : (reportSubTab === 'berjalan' ? 'revenue' : ((reportSubTab === 'bulanan' || reportSubTab === 'berjalan-monthly' || reportSubTab === 'tahunan') ? 'revenue' : 'revenue'))} fill="#3b82f6" radius={[6, 6, 0, 0]} name={reportSubTab === 'bulanan-monthly' ? 'Pendapatan Bulan' : 'Periode Utama'} barSize={20} />
                      
                      {(reportSubTab === 'bulanan' || reportSubTab === 'berjalan-monthly' || reportSubTab === 'tahunan') ? (
                        <>
                          <Bar dataKey="target" fill="#94a3b8" radius={[6, 6, 0, 0]} name="Target" barSize={20} />
                          {reportSubTab !== 'tahunan' && <Bar dataKey="prevMonth" fill="#10b981" radius={[6, 6, 0, 0]} name="Bulan Sebelumnya" barSize={20} />}
                          <Bar dataKey="prevYear" fill="#f59e0b" radius={[6, 6, 0, 0]} name={reportSubTab === 'tahunan' ? 'Tahun Sebelumnya' : 'Tahun Lalu'} barSize={20} />
                        </>
                      ) : reportSubTab === 'bulanan-monthly' ? (
                        <>
                          <Bar dataKey="target" fill="#94a3b8" radius={[6, 6, 0, 0]} name="Target" barSize={20} />
                        </>
                      ) : reportSubTab === 'berjalan' ? (
                        <>
                          <Bar dataKey="target" fill="#10b981" radius={[6, 6, 0, 0]} name="Target (MTD)" barSize={20} />
                        </>
                      ) : reportSubTab !== 'bulanan-monthly' ? (
                        <Bar dataKey={reportSubTab === 'harian' ? 'target' : 'val2'} fill={reportSubTab === 'harian' ? '#10b981' : '#e2e8f0'} radius={[6, 6, 0, 0]} name="Pembanding" barSize={20} />
                      ) : null}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
                        </>
                    );
                    } catch (err) {
                        return <div className="p-10 bg-red-100 text-red-700 font-bold rounded-xl border border-red-300">RUNTIME ERROR: {err.message}</div>;
                    }
                })()}
            </div>
          )}

             {/* === TAB CUSTOMERS === */}
{activeTab === 'customers' && (
  <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
    {/* Padded div dihapus untuk menghilangkan jarak di atas header tabel */}
    
    <div className="overflow-x-auto">
      {/* Tambahkan rounded-t-[2.5rem] dan overflow-hidden agar tabel menyatu dengan kontainer */}
      <table className="w-full text-left border-collapse rounded-t-[2.5rem] overflow-hidden">
        <thead className="bg-gray-900 text-white">
          <tr>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest rounded-tl-[2.5rem]">Nama</th>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">No. HP</th>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Alamat</th>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Catatan</th>
            <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-center rounded-tr-[2.5rem]">Aksi</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-50">
          {loading ? <tr><td colSpan="5" className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr> : filteredCustomers.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-6 font-black text-gray-900">{c.nama_customer}</td>
              <td className="py-4 px-6 font-medium text-gray-600">{c.no_hp}</td>
              <td className="py-4 px-6 text-gray-500 text-xs">{c.alamat}</td>
              <td className="py-4 px-6 text-gray-400 italic text-xs">{c.catatan || '-'}</td>
              <td className="py-4 px-6">
                <div className="flex justify-center gap-2">
                  <button onClick={() => { setCustomerForm(c); setShowCustomerModal(true); }} className="p-2 text-gray-400 hover:text-[#990000] bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:border-red-200"><Edit size={15} /></button>
                  <button onClick={() => deleteCustomer(c.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:border-red-200"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
          {filteredCustomers.length === 0 && !loading && <tr><td colSpan="5" className="text-center py-20 text-gray-400 font-bold italic">Belum ada data pelanggan yang cocok.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
)}
              {/* === TAB QUOTATIONS === */}
              {activeTab === 'quotations' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">Manajemen Quotation</h2>
                      <p className="text-xs text-gray-400 mt-1 font-medium">Buat dan kelola penawaran harga ke pelanggan</p>
                    </div>
                    <button onClick={() => { setQuotationForm({ id: null, customer_name: '', product_name: '', qty: 1, price: 0, note: '' }); setShowQuotationModal(true); }} className="flex items-center gap-2 bg-[#990000] text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-red-800 transition-all active:scale-95 shadow-lg shadow-red-100">
                      <Plus size={16} /> Buat Quotation
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-900 text-white">
                        <tr>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Customer</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Produk</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest">Qty & Harga</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                          <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-50">
                        {loading ? <tr><td colSpan="6" className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr> : filteredQuotations.map(q => (
                          <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6 font-black text-gray-900">{q.customer_name}</td>
                            <td className="py-4 px-6 font-medium text-gray-600">{q.product_name}</td>
                            <td className="py-4 px-6 text-gray-500 text-xs">{q.qty} x {formatRupiah(q.price)}</td>
                            <td className="py-4 px-6 text-right font-black text-[#990000]">{formatRupiah(q.qty * q.price)}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${q.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : q.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-gray-100 text-gray-500'}`}>{q.status}</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex justify-center gap-2">
                                <button onClick={() => { setPreviewQuotation(q); setShowPreviewModal(true); }} title="Lihat PDF" className="p-2 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-all"><FileText size={15} /></button>
                                {q.status === 'draft' && (
                                  <>
                                    <button onClick={() => submitQuotation(q.id)} title="Submit ke Finance" className="p-2 text-gray-400 hover:text-emerald-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-all"><Send size={15} /></button>
                                    <button onClick={() => { setQuotationForm(q); setShowQuotationModal(true); }} className="p-2 text-gray-400 hover:text-[#990000] bg-white border border-gray-200 rounded-xl shadow-sm transition-all"><Edit size={15} /></button>
                                    <button onClick={() => deleteQuotation(q.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-xl shadow-sm transition-all"><Trash2 size={15} /></button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredQuotations.length === 0 && !loading && <tr><td colSpan="6" className="text-center py-20 text-gray-400 font-bold italic">Belum ada data quotation yang cocok.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
             {/* === TAB ORDERS === */}
{activeTab === 'orders' && (
  <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
    {/* Div p-8 dihapus/dikosongkan agar tidak menciptakan jarak putih di atas */}
    
    <div className="overflow-x-auto">
      {/* rounded-t-[2.5rem] disini memaksa tabel hitam mengikuti lengkungan container */}
      <table className="w-full text-left border-collapse rounded-t-[2.5rem] overflow-hidden">
        <thead className="bg-gray-900 text-white">
          <tr>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Instansi</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Produk</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-center">QTY</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-right">Harga Satuan</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-right">Total</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-center">Payment</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Tgl Masuk</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Deadline</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Status Produksi</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Lokasi</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Catatan</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan="13" className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr>
          ) : filteredOrders.map(o => (
            <tr key={o.id} className={`hover:bg-gray-50 transition-colors ${o.sisa_hari < 5 ? 'bg-red-50/50' : ''}`}>
              <td className="py-4 px-6 font-bold text-slate-900">{o.customer}</td>
              <td
                className={`py-4 px-6 font-bold text-slate-900 cursor-pointer select-none transition-all ${expandedProduct === o.id ? 'max-w-none whitespace-normal text-[#990000]' : 'max-w-[180px] truncate hover:text-[#990000]'}`}
                onClick={() => setExpandedProduct(expandedProduct === o.id ? null : o.id)}
                title={expandedProduct === o.id ? 'Klik untuk tutup' : 'Klik untuk lihat nama lengkap'}
              >
                {o.produk || '-'}
              </td>
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
              <td className="py-4 px-5">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ${
                  o.status_produksi === 'Selesai'           ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  o.status_produksi === 'Beli Kain'         ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                  o.status_produksi === 'Potong'            ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                  o.status_produksi === 'Jahit'             ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                  o.status_produksi === 'Quality Control'   ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                  o.status_produksi === 'Packing'           ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                              'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {o.status_produksi || '-'}
                </span>
              </td>
              <td className="py-4 px-6 text-xs text-slate-500">{o.lokasi_proses}</td>
              <td className="py-4 px-6 text-xs text-slate-400 italic max-w-[150px] truncate" title={o.catatan}>{o.catatan || '-'}</td>
              <td className="py-4 px-5 text-center">
                <span
                  title={o.status === 'Rejected' ? `Alasan: ${o.quotation_alasan_penolakan || 'Tidak ada alasan'}` : o.status}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${
                    o.status === 'Invoice Created'     ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    o.status === 'Diproses Produksi'   ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                    o.status === 'Pending Finance'     ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    o.status === 'New Order'           ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                    o.status === 'Rejected'            ? 'bg-red-50 text-red-700 border border-red-100' :
                                                         'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {o.status}
                </span>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  {(!o.quotation_id && (o.status === 'New Order' || o.status === 'Pending' || o.status === 'Rejected')) && (
                    <button onClick={() => submitOrder(o.id)} title="Submit Order ke Finance" className="p-1.5 text-gray-400 hover:text-emerald-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all"><Send size={14} /></button>
                  )}
                  <button onClick={() => navigate('/marketing-offline/create-order', { state: { orderData: { ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items } } })} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all" title="Edit Order"><Edit size={14} /></button>
                  <button onClick={() => deleteOrder(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all" title="Hapus Order"><Trash2 size={14} /></button>
                  {o.quotation_id && (
                    <>
                      <button onClick={() => navigate(`/quotation/preview/${o.quotation_id}`)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all" title="Lihat Quotation"><Eye size={14} /></button>
                      <button onClick={() => setUploadQuotationModal(o.quotation_id)} className="p-1.5 text-gray-400 hover:text-emerald-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all" title="Upload Dokumen"><Upload size={14} /></button>
                      {o.quotation_status !== 'Submitted' && o.quotation_status !== 'Invoice Created' && o.quotation_status !== 'approved' && o.quotation_status !== 'Diproses Produksi' && (
                        <button onClick={() => submitQuotation(o)} className="p-1.5 text-gray-400 hover:text-orange-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all" title="Submit Quotation ke Finance"><Send size={14} /></button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {filteredOrders.length === 0 && !loading && <tr><td colSpan="13" className="text-center py-10 text-slate-500 font-bold italic">Belum ada order yang cocok.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
)}
              {/* === TAB INVENTORY === */}
{activeTab === 'inventory' && (() => {
  const sizesArray = ['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL','All Size'];
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold">Brand</th>
              <th className="p-4 font-semibold">Nama Barang</th>
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">Cabang</th>
              {sizesArray.map(size => (
                <th key={size} className="p-4 font-semibold text-center w-20">{size}</th>
              ))}
              <th className="p-4 font-semibold text-center w-28">Total Stok</th>
              <th className="p-4 font-semibold text-center w-32">Min. Stok</th>
              <th className="p-4 font-semibold">Rak</th>
              <th className="p-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7 + sizesArray.length} className="p-10 text-center"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr>
            ) : filteredInventory.length === 0 ? (
              <tr><td colSpan={7 + sizesArray.length} className="p-10 text-center text-gray-400 font-bold italic">Stok barang tidak ditemukan.</td></tr>
            ) : (
              filteredInventory.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                  <td className="p-4 font-medium text-gray-600">{item.nama_brand}</td>
                  <td className="p-4 font-bold text-gray-800">{item.nama_barang}</td>
                  <td className="p-4"><span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.kategori === 'Utama' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>{item.kategori}</span></td>
                  <td className="p-4">{item.cabang_id}</td>
                  {sizesArray.map(size => {
                    const qty = item.sizes[size]?.qty || 0;
                    return <td key={size} className="p-4 text-center border-x border-gray-100 font-extrabold text-gray-800">{qty > 0 ? qty : <span className="text-gray-300 font-normal">-</span>}</td>
                  })}
                  <td className="p-4 text-center font-extrabold text-red-600 text-base">{item.total_stok}</td>
                  <td className="p-4 text-center"><span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">{item.minimum_stok}</span></td>
                  <td className="p-4 font-semibold text-gray-600">{item.kode_rak}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => { setSelectedItemForRequest(item); setShowRequestModal(true); }} disabled={item.total_stok <= 0} className={`px-4 py-1.5 rounded-lg text-[11px] font-black w-full flex items-center justify-center gap-1 ${item.total_stok > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}><Package size={12} /> Ambil Stok</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {showRequestModal && selectedItemForRequest && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Package className="text-blue-600" size={20} /> Request Ambil Stok
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-md shadow-sm">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-sm font-semibold text-blue-900">Barang: <span className="font-black">{selectedItemForRequest.nama_barang}</span></p>
                <p className="text-xs font-medium text-blue-700 mt-1">Total Stok Tersedia: {selectedItemForRequest.total_stok}</p>
              </div>
              <form onSubmit={handleRequestStokSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Ukuran *</label>
                  <select required value={requestForm.ukuran} onChange={(e) => setRequestForm({ ...requestForm, ukuran: e.target.value })} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border">
                    <option value="">-- Pilih Ukuran --</option>
                    {Object.entries(selectedItemForRequest.sizes).map(([sz, data]) => {
                      if (data.qty > 0) {
                        return <option key={sz} value={sz}>{sz} (Tersedia: {data.qty})</option>;
                      }
                      return null;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Jumlah (Qty) *</label>
                  <input type="number" min="1" max={requestForm.ukuran ? selectedItemForRequest.sizes[requestForm.ukuran]?.qty : 1} required value={requestForm.jumlah} onChange={(e) => setRequestForm({ ...requestForm, jumlah: e.target.value })} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nama Pengambil *</label>
                  <input type="text" required value={requestForm.nama_pengambil} onChange={(e) => setRequestForm({ ...requestForm, nama_pengambil: e.target.value })} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Keperluan / Keterangan</label>
                  <textarea rows="2" value={requestForm.keterangan} onChange={(e) => setRequestForm({ ...requestForm, keterangan: e.target.value })} placeholder="Cth: Untuk sampel / diberikan ke instansi" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"></textarea>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowRequestModal(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">Batal</button>
                  <button type="submit" className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                    <Send size={16} /> Konfirmasi Ambil Stok
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
})()}
              {/* === TAB PROMO === */}
              {activeTab === 'promo' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

                  {/* Info Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-black text-amber-800">Barang Mengendap ≥ 2 Bulan</p>
                      <p className="text-xs text-amber-600 mt-0.5 font-medium">
                        Daftar stok cabang Banua yang belum terjual ≥ 60 hari. Klik "Buat Promo" untuk langsung ke tab Inventori dan buat pesanan promo.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900 border-b border-gray-800 text-white uppercase tracking-wider">
                          <tr>
                            <th className="py-4 px-5 text-[10px] font-black">Brand</th>
                            <th className="py-4 px-5 text-[10px] font-black">Nama Produk</th>
                            <th className="py-4 px-5 text-[10px] font-black">Kategori</th>
                            <th className="py-4 px-5 text-[10px] font-black text-center">Ukuran</th>
                            <th className="py-4 px-5 text-[10px] font-black text-center">Cabang</th>
                            <th className="py-4 px-5 text-[10px] font-black text-center">Masuk Stok</th>
                            <th className="py-4 px-5 text-[10px] font-black text-center">Mengendap</th>
                            <th className="py-4 px-5 text-[10px] font-black text-center">Stok</th>
                            <th className="py-4 px-5 text-[10px] font-black text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                          {loading ? (
                            <tr><td colSpan="9" className="text-center py-24">
                              <Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" />
                              <p className="text-gray-400 text-sm mt-2">Memuat data stok mengendap...</p>
                            </td></tr>
                          ) : filteredPromoStock.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-24 text-gray-400 font-bold italic">
                              Tidak ada produk promo yang cocok.
                            </td></tr>
                          ) : (
                            filteredPromoStock.map((item, idx) => {
                              const hari = parseInt(item.hari_mengendap) || 0;
                              const bulan = Math.floor(hari / 30);
                              const badgeClass = hari >= 180
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : hari >= 90
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200';
                              const badgeLabel = hari >= 180 ? `${bulan} bln ⚠️` : hari >= 90 ? `${bulan} bln 🔶` : `${bulan} bln`;
                              const tglMasuk = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                              return (
                                <tr key={`${item.id}-${idx}`} className="hover:bg-amber-50/30 transition-colors">
                                  <td className="py-3.5 px-5 font-bold text-gray-500 text-xs uppercase tracking-wide">{item.nama_brand || '-'}</td>
                                  <td className="py-3.5 px-5 font-black text-gray-900">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                                        <Package size={13} />
                                      </div>
                                      {item.product_name}
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.kategori === 'Utama' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>{item.kategori || '-'}</span>
                                  </td>
                                  <td className="py-3.5 px-5 text-center font-bold text-gray-600 text-xs">{item.ukuran || '-'}</td>
                                  <td className="py-3.5 px-5 text-center font-medium text-gray-500 text-xs">{item.cabang_id || '-'}</td>
                                  <td className="py-3.5 px-5 text-center font-bold text-gray-500 text-xs">{tglMasuk}</td>
                                  <td className="py-3.5 px-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-black ${badgeClass}`}>{badgeLabel}</span>
                                  </td>
                                  <td className="py-3.5 px-5 text-center font-black text-red-600 text-base">{item.stock_qty} Pcs</td>
                                  <td className="py-3.5 px-5 text-center">
                                    <button
                                      onClick={() => navigate(`/marketing-offline/inventory?q=${encodeURIComponent(item.product_name)}`)}
                                      className="px-3 py-1.5 bg-[#990000] text-white rounded-xl text-[10px] font-black hover:bg-red-900 transition-all active:scale-95 shadow-lg shadow-red-100 flex items-center gap-1.5 mx-auto"
                                    >
                                      <Gift size={13} /> Buat Promo
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
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