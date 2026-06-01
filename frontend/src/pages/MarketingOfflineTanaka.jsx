import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  Users, FileText, ShoppingBag, Plus, Edit, Trash2, Send, X, Search, UserCircle, ChevronDown, Gift,
  Loader2, Download, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Package, Eye, Upload
} from 'lucide-react';
import { submitQuotationToFinance, uploadQuotationFiles } from '../api/quotationApi';
import { getStok } from '../api/gudangApi';
import * as XLSX from 'xlsx';
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line
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

export default function MarketingOfflineTanaka({ embedded = false }) {
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
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [tooltipProduk, setTooltipProduk] = useState(null);

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
      const res = await axios.get(`http://localhost:3000/api/marketing-offline-tanaka/reports?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const resOrders = await axios.get('http://localhost:3000/api/marketing-offline-tanaka/orders', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
      const res = await axios.get('http://localhost:3000/api/marketing-offline-tanaka/customers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCustomers(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/marketing-offline-tanaka/quotations?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQuotations(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3000/api/marketing-offline-tanaka/orders?start=${startDate}&end=${endDate}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setOrders(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };


  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await getStok('Tanaka');
      const rawData = (res.data?.data || res.data || []);
      // Grouping identik dengan Stok Gudang: per Brand + Nama Barang + Cabang
      const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL', 'All Size'];
      const grouped = {};
      rawData.forEach(item => {
        const brand = (item.nama_brand || '').trim().toLowerCase();
        const nama = (item.nama_barang || item.product_name || '').trim().toLowerCase();
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
            sizes: Object.fromEntries(sizesArray.map(s => [s, 0]))
          };
        }
        grouped[key].total_stok += Number(item.jumlah) || 0;
        if (item.ukuran && grouped[key].sizes[item.ukuran] !== undefined) {
          grouped[key].sizes[item.ukuran] += Number(item.jumlah) || 0;
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
      const res = await axios.get('http://localhost:3000/api/marketing-offline-tanaka/promo', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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

        // Fallback: ambil kata pertama dari nama produk
        const firstWord = itemName.trim().split(' ')[0];
        return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase() : 'Lain-lain';
      };

      const getOrderItemsWithCategory = (order) => {
        let parsedItems = [];
        try {
          parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch (e) {
          parsedItems = [];
        }
        if (parsedItems.length === 0) {
          parsedItems = [{
            rincian: order.produk || 'Produk Tidak Diketahui',
            qty: parseInt(order.qty) || 1,
            harga_satuan: parseFloat(order.harga) || 0,
            total: parseFloat(order.grand_total) || 0
          }];
        }
        return parsedItems.map(item => {
          const itemName = item.rincian || item.nama_barang || 'Produk Tidak Diketahui';
          const category = getCategoryForItem(itemName);
          const qty = parseInt(item.qty) || 0;
          const total = parseFloat(item.total) || (qty * (parseFloat(item.harga_satuan) || 0));
          return { category, qty, total };
        });
      };

      const res = await axios.get('http://localhost:3000/api/marketing-offline-tanaka/orders', { headers: { Authorization: `Bearer ${token}` } });
      const allOrders = res.data || [];

      if (reportSubTab === 'harian') {
        const getRangeCategory = (orders, category, startDate, endDate) => {
          if (!startDate || !endDate) return 0;
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          let totalRevenue = 0;
          orders.forEach(o => {
            const od = new Date(o.created_at);
            if (od >= start && od <= end) {
              const mappedItems = getOrderItemsWithCategory(o);
              mappedItems.forEach(item => {
                if (item.category === category) {
                  totalRevenue += item.total;
                }
              });
            }
          });
          return totalRevenue;
        };

        const allCategories = new Set();
        allOrders.forEach(o => {
          const mappedItems = getOrderItemsWithCategory(o);
          mappedItems.forEach(item => allCategories.add(item.category));
        });
        const categoriesList = [...allCategories];

        const data = categoriesList.map(cat => {
          const rev1 = getRangeCategory(allOrders, cat, filterDate1, filterDate2);
          return { account: cat, date1: filterDate1, date2: filterDate2, revenue: rev1, prevRevenue: 0, achievement: 0 };
        }).filter(r => r.revenue > 0);
        setReportComparisonData(data);
      } else if (reportSubTab === 'tahunan') {
        const today = new Date();
        const limitMonth = today.getMonth();
        const limitDay = today.getDate();

        const getYearlyYtdCategory = (orders, category, yearStr) => {
          const y = parseInt(yearStr);
          let totalRevenue = 0;
          orders.forEach(o => {
            const od = new Date(o.created_at);
            if (od.getFullYear() === y && (od.getMonth() < limitMonth || (od.getMonth() === limitMonth && od.getDate() <= limitDay))) {
              const mappedItems = getOrderItemsWithCategory(o);
              mappedItems.forEach(item => {
                if (item.category === category) {
                  totalRevenue += item.total;
                }
              });
            }
          });
          return totalRevenue;
        };

        const y1 = filterDate1.substring(0, 4);
        const y2 = filterDate2.substring(0, 4);
        const limitDayStr = String(limitDay).padStart(2, '0');
        const limitMonthStr = String(limitMonth + 1).padStart(2, '0');
        const formattedDate1 = `${y1}-${limitMonthStr}-${limitDayStr}`;
        const formattedDate2 = `${y2}-${limitMonthStr}-${limitDayStr}`;

        const allCategories = new Set();
        allOrders.forEach(o => {
          const mappedItems = getOrderItemsWithCategory(o);
          mappedItems.forEach(item => allCategories.add(item.category));
        });
        const categoriesList = [...allCategories];

        const data = categoriesList.map(cat => {
          const v1 = getYearlyYtdCategory(allOrders, cat, y1);
          const v2 = getYearlyYtdCategory(allOrders, cat, y2);
          const ach = v2 > 0 ? (v1 / v2) * 100 : (v1 > 0 ? 100 : 0);
          return {
            account: cat,
            date1: formattedDate1,
            date2: formattedDate2,
            val1: v1,
            val2: v2,
            revenue: v1,
            prevRevenue: v2,
            achievement: ach
          };
        }).filter(r => r.val1 > 0 || r.val2 > 0);
        setReportComparisonData(data);
      } else {
        const today = new Date();
        const limitDay = today.getDate();

        const getMonthlyMtdCategory = (orders, category, monthStr) => {
          const [y, m] = monthStr.split('-').map(Number);

          let totalRevenue = 0;
          orders.forEach(o => {
            const od = new Date(o.created_at);
            if (od.getFullYear() === y && od.getMonth() + 1 === m && od.getDate() <= limitDay) {
              const mappedItems = getOrderItemsWithCategory(o);
              mappedItems.forEach(item => {
                if (item.category === category) {
                  totalRevenue += item.total;
                }
              });
            }
          });
          return totalRevenue;
        };

        const m1 = filterDate1.substring(0, 7);
        const m2 = filterDate2.substring(0, 7);
        const limitDayStr = String(limitDay).padStart(2, '0');
        const formattedDate1 = `${m1}-${limitDayStr}`;
        const formattedDate2 = `${m2}-${limitDayStr}`;

        const allCategories = new Set();
        allOrders.forEach(o => {
          const mappedItems = getOrderItemsWithCategory(o);
          mappedItems.forEach(item => allCategories.add(item.category));
        });
        const categoriesList = [...allCategories];

        const data = categoriesList.map(cat => {
          const v1 = getMonthlyMtdCategory(allOrders, cat, m1);
          const v2 = getMonthlyMtdCategory(allOrders, cat, m2);
          const ach = v2 > 0 ? (v1 / v2) * 100 : (v1 > 0 ? 100 : 0);
          return {
            account: cat,
            date1: formattedDate1,
            date2: formattedDate2,
            val1: v1,
            val2: v2,
            revenue: v1,
            prevRevenue: v2,
            achievement: ach
          };
        }).filter(r => r.val1 > 0 || r.val2 > 0);
        setReportComparisonData(data);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
  }, [activeTab, startDate, endDate, reportSubTab, filterDate1, filterDate2]);

  // Handlers Customer
  const saveCustomer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (customerForm.id) {
        await axios.put(`http://localhost:3000/api/marketing-offline-tanaka/customers/${customerForm.id}`, customerForm, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/api/marketing-offline-tanaka/customers', customerForm, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/marketing-offline-tanaka/customers/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
        await axios.put(`http://localhost:3000/api/marketing-offline-tanaka/quotations/${quotationForm.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/api/marketing-offline-tanaka/quotations', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowQuotationModal(false);
      fetchQuotations();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteQuotation = async (id) => {
    if (!window.confirm("Delete this quotation?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/marketing-offline-tanaka/quotations/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
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
        await axios.put(`http://localhost:3000/api/marketing-offline-tanaka/orders/${orderForm.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:3000/api/marketing-offline-tanaka/orders', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowOrderModal(false);
      fetchOrders();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/marketing-offline-tanaka/orders/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchOrders();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const submitOrder = async (id) => {
    if (!window.confirm("Submit to Finance for approval?")) return;
    try {
      await axios.post(`http://localhost:3000/api/marketing-offline-tanaka/orders/${id}/submit`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert("Submitted to Finance successfully!");
      fetchOrders();
    } catch (err) { alert('Failed to submit: ' + (err.response?.data?.message || err.message)); }
  };

  const handleOrderFromStock = (item) => {
    navigate('/marketing-offline-tanaka/create-order', {
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
                      Stok Inventori Tanaka
                    </>
                  )}
                  {activeTab === 'reports' && (
                    <>
                      <div className="bg-violet-50 border border-violet-100 p-2 rounded-lg shadow-sm">
                        <TrendingUp className="text-violet-600" size={20} />
                      </div>
                      {reportSubTab === 'harian' ? 'Laporan Harian' : reportSubTab === 'bulanan' ? 'Laporan Bulanan' : reportSubTab === 'tahunan' ? 'Laporan Tahunan' : 'Laporan Bulan Berjalan'}
                    </>
                  )}
                  {activeTab === 'promo' && (
                    <>
                      <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg shadow-sm">
                        <Gift className="text-rose-600" size={20} />
                      </div>
                      Promo Offline
                    </>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {activeTab === 'dashboard' && 'Kelola rangkuman data penjualan offline cabang Tanaka secara ringkas.'}
                  {activeTab === 'customers' && 'Daftar seluruh data pelanggan terdaftar untuk mempermudah relasi pemasaran.'}
                  {activeTab === 'quotations' && 'Buat dan pantau penawaran harga (Quotation) untuk calon pelanggan.'}
                  {activeTab === 'orders' && 'Catat order baru dan pantau riwayat penjualan offline secara lengkap.'}
                  {activeTab === 'inventory' && 'Pantau ketersediaan stok fisik barang siap jual di cabang Tanaka.'}
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
                    onClick={() => navigate('/marketing-offline-tanaka/create-order')}
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
                        { title: 'Revenue (Bulan Ini)', value: formatRupiah(dashboardData.summary.range_revenue), bg: 'bg-red-100', text: 'text-gray-900' },
                        { title: 'Transaction', value: `${dashboardData.summary.total_orders || 0} Orders`, bg: 'bg-[#ff3b3b]', text: 'text-white' },
                        { title: 'Total Customer', value: `${dashboardData.summary.total_customers || 0} Customers`, bg: 'bg-red-100', text: 'text-gray-900' },
                        { title: 'Qty Terjual', value: `${dashboardData.summary.total_qty || 0} Pcs`, bg: 'bg-[#ff4d4d]', text: 'text-white' }
                      ].map((card, index) => (
                        <div
                          key={index}
                          className={`${card.bg} p-6 rounded-[2rem] shadow-sm flex flex-col justify-center min-h-[120px]`}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${card.text === 'text-white' ? 'text-white/80' : 'text-red-900/60'}`}>{card.title}</p>
                          <h3 className={`text-2xl font-black ${card.text}`}>{card.value}</h3>
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
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">


                    {/* Filter Dua Periode */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-6 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          {reportSubTab === 'harian' ? 'Dari Tanggal' : reportSubTab === 'tahunan' ? 'Tahun Berjalan' : 'Bulan Berjalan'}
                        </label>
                        {reportSubTab === 'tahunan' ? (
                          <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100"
                            value={filterDate1.substring(0, 4)}
                            onChange={e => setFilterDate1(e.target.value + '-01-01')}
                          >
                            {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={reportSubTab === 'harian' ? 'date' : 'month'}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100"
                            value={reportSubTab === 'harian' ? filterDate1 : filterDate1.substring(0, 7)}
                            onChange={e => setFilterDate1(reportSubTab === 'harian' ? e.target.value : e.target.value + '-01')}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          {reportSubTab === 'harian' ? 'Sampai Tanggal' : reportSubTab === 'tahunan' ? 'Tahun Lalu' : 'Bulan Lalu'}
                        </label>
                        {reportSubTab === 'tahunan' ? (
                          <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100"
                            value={filterDate2.substring(0, 4)}
                            onChange={e => setFilterDate2(e.target.value + '-01-01')}
                          >
                            {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={reportSubTab === 'harian' ? 'date' : 'month'}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100"
                            value={reportSubTab === 'harian' ? filterDate2 : filterDate2.substring(0, 7)}
                            onChange={e => setFilterDate2(reportSubTab === 'harian' ? e.target.value : e.target.value + '-01')}
                          />
                        )}
                      </div>
                    </div>

                    {/* Tabel Perbandingan */}
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-900 text-white">
                              <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">No</th>
                              <th className="py-4 px-6 text-left text-xs font-black uppercase tracking-widest border border-gray-800">Kategori Produk</th>
                              <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800 bg-gray-800/50">
                                Rentang Periode ({reportSubTab === 'tahunan' ? 'YTD' : reportSubTab === 'bulanan' ? 'MTD' : 'RANGE'})
                              </th>
                              <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                              {reportSubTab !== 'harian' && (
                                <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {loading ? (
                              <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-[#990000] mx-auto" /></td></tr>
                            ) : reportComparisonData.length === 0 ? (
                              <tr><td colSpan={5} className="py-20 text-center text-gray-400 font-medium italic">Tidak ada data untuk periode terpilih</td></tr>
                            ) : reportSubTab === 'harian' ? (
                              reportComparisonData.map((row, idx) => (
                                <React.Fragment key={idx}>
                                  <tr className="hover:bg-blue-50/30 transition-colors">
                                    <td rowSpan={2} className="py-6 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                    <td rowSpan={2} className="py-6 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                                    <td className="py-3 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                      {row.date1} s/d {row.date2}
                                    </td>
                                    <td className="py-3 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.revenue)}</td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30 transition-colors bg-gray-50/50">
                                    <td colSpan={2} className="py-3 px-6 text-center italic text-xs text-gray-500 border-b border-gray-100">
                                      -
                                    </td>
                                  </tr>
                                </React.Fragment>
                              ))
                            ) : (
                              reportComparisonData.map((row, idx) => (
                                <React.Fragment key={idx}>
                                  <tr className="hover:bg-blue-50/30 transition-colors">
                                    <td rowSpan={2} className="py-6 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                    <td rowSpan={2} className="py-6 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                                    <td className="py-3 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                      {reportSubTab === 'tahunan' ? new Date(row.date1).getFullYear() : new Date(row.date1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="py-3 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.val1)}</td>
                                    <td rowSpan={2} className="py-6 px-6 text-center border-x border-b border-gray-100">
                                      <span className={`text-xl font-black ${row.achievement >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                        {row.achievement.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-3 px-6 text-center font-bold bg-gray-50 text-gray-500 border-b border-gray-100">
                                      {reportSubTab === 'tahunan' ? new Date(row.date2).getFullYear() + ' (Lalu)' : new Date(row.date2).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + ' (Lalu)'}
                                    </td>
                                    <td className="py-3 px-6 text-right font-bold text-gray-400 border-b border-gray-100">{formatRupiah(row.val2)}</td>
                                  </tr>
                                </React.Fragment>
                              ))
                            )}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-900 text-white font-black uppercase text-xs">
                              <td colSpan={3} className="py-5 px-6 text-right">Total Pendapatan (Periode Berjalan)</td>
                              <td className="py-5 px-6 text-right text-emerald-400 text-lg">
                                {formatRupiah(reportComparisonData.reduce((acc, r) => acc + (reportSubTab === 'harian' ? r.revenue : r.val1), 0))}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
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
                            <th className="py-4 px-5 text-[10px] font-black uppercase tracking-widest">Customer</th>
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
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap ${o.status_produksi === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    o.status_produksi === 'Beli Kain' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                      o.status_produksi === 'Potong' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                        o.status_produksi === 'Jahit' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                          o.status_produksi === 'Quality Control' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                                            o.status_produksi === 'Packing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
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
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${o.status === 'Invoice Created' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                      o.status === 'Diproses Produksi' ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' :
                                        o.status === 'Pending Finance' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                          o.status === 'New Order' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                            o.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
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
                                  <button onClick={() => navigate('/marketing-offline-tanaka/create-order', { state: { orderData: { ...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items } } })} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all" title="Edit Order"><Edit size={14} /></button>
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
                  const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL', 'All Size'];
                  return (
                    // 1. Pastikan kontainer utama punya radius
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          {/* 2. Gunakan THEAD dengan warna, tanpa perlu rounded di dalam th */}
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
                            {/* ... isi data sama persis seperti sebelumnya ... */}
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
                                  {sizesArray.map(size => <td key={size} className="p-4 text-center border-x border-gray-100 font-extrabold text-gray-800">{item.sizes?.[size] || '-'}</td>)}
                                  <td className="p-4 text-center font-extrabold text-red-600 text-base">{item.total_stok} Pcs</td>
                                  <td className="p-4 text-center"><span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">{item.minimum_stok} Pcs</span></td>
                                  <td className="p-4 font-semibold text-gray-600">{item.kode_rak}</td>
                                  <td className="p-4 text-center">
                                    <button onClick={() => handleOrderFromStock({ product_name: item.nama_barang, stock_qty: item.total_stok })} disabled={item.total_stok <= 0} className={`px-4 py-2 rounded-lg text-xs font-black ${item.total_stok > 0 ? 'bg-[#990000] text-white' : 'bg-gray-100 text-gray-400'}`}>Pesan</button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
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
                          Daftar stok cabang Tanaka yang belum terjual ≥ 60 hari. Klik "Buat Promo" untuk langsung ke tab Inventori dan buat pesanan promo.
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
                                        onClick={() => navigate(`/marketing-offline-tanaka/inventory?q=${encodeURIComponent(item.product_name)}`)}
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
                          <p className="text-sm text-slate-600 mt-1">Tanaka Branch</p>
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
                            <p className="text-xs text-slate-500 mt-1">Tanaka Branch</p>
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