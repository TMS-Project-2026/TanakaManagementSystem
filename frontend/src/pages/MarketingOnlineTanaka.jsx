import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import { shopeeDataAdapter } from '../utils/shopeeAdapter';
import { getStok, createPermintaanStok } from '../api/gudangApi';
import {
  LayoutDashboard, ShoppingBag, Package, FileText, Upload, Download, Gift,
  TrendingUp, Users, DollarSign, Calendar, Search, Loader2,
  CheckCircle, AlertTriangle, ArrowRight, X, Send, UserCircle, Plus, ChevronDown, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const MarketingOnlineTanaka = ({ embedded = false, forcedTab = null }) => {
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
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = forcedTab || (embedded ? 'dashboard' : (tab || 'dashboard'));
  const reportSubTab = subtab || 'harian';
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';

  // Ambil pre-fill search dari query param ?q=... (dipakai saat redirect dari Promo)
  const searchParams = new URLSearchParams(location.search);
  const promoHighlight = searchParams.get('q') || '';

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
    salesChart: [],
    topToko: []
  });
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [flatInventory, setFlatInventory] = useState([]);
  const [barangKeluarHariIni, setBarangKeluarHariIni] = useState([]);
  const [stokGudang, setStokGudang] = useState([]);
  const [stokSearch, setStokSearch] = useState(promoHighlight);
  const [promoStock, setPromoStock] = useState([]);
  const [reports, setReports] = useState({ harian: [], bulanan: [] });
  const [dbProducts, setDbProducts] = useState([]);
  const [pricelistOnlineData, setPricelistOnlineData] = useState([]);
  // Import & Manual State
  const [importPreview, setImportPreview] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Report Filtering States
  const [filterDate1, setFilterDate1] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [filterDate2, setFilterDate2] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  // filterDateEnd: tanggal akhir rentang untuk laporan bulanan
  const [filterDateEnd, setFilterDateEnd] = useState(new Date().toISOString().split('T')[0]);
  const [filterDateEnd2, setFilterDateEnd2] = useState(() => {
    const d = new Date();
    d.setDate(0); // last day of previous month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Filter untuk Laporan Bulanan (bulanan-monthly): pilih dari bulan s.d. bulan
  const [monthlyFrom, setMonthlyFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01`;
  });
  const [monthlyTo, setMonthlyTo] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter untuk Laporan Bulan Berjalan (berjalan-monthly): 2 bulan pembanding
  const [berjalanMonthMain, setBerjalanMonthMain] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [berjalanMonthCmp, setBerjalanMonthCmp] = useState(() => {
    const d = new Date();
    const m = d.getMonth() === 0 ? 12 : d.getMonth();
    const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
    return `${y}-${String(m).padStart(2, '0')}`;
  });

  const [reportComparisonData, setReportComparisonData] = useState([]);
  const [monthsRange, setMonthsRange] = useState([]);
  const [dailyTargets, setDailyTargets] = useState({});
  const [bulananTargets, setBulananTargets] = useState({});
  const [tahunanTargets, setTahunanTargets] = useState({});
  const [globalMonthlyTarget, setGlobalMonthlyTarget] = useState(0);
  const [globalYearlyTarget, setGlobalYearlyTarget] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tooltipProduk, setTooltipProduk] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [manualOrder, setManualOrder] = useState({
    customer_name: '', akun_toko: '', kode_produk: '', product_name: '', qty: '', price_unit: '',
    potongan_shopee: '', hpp_aktual: '', order_date: new Date().toISOString().split('T')[0],
    address: '', status: 'Pesanan Selesai'
  });
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItemForRequest, setSelectedItemForRequest] = useState(null);
  const [requestForm, setRequestForm] = useState({
    ukuran: '',
    jumlah: 1,
    nama_pengambil: JSON.parse(localStorage.getItem('user'))?.name || '',
    divisi: 'Marketing Online',
    keterangan: ''
  });

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


  // Formatting utils
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
  };
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatExcelNumber = (angka) => {
    if (angka === undefined || angka === null || isNaN(angka)) return '0';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(angka));
  };
  const formatIndoLongDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatMtdRange = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const monthLong = date.toLocaleDateString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    return `1 ${monthLong} - ${day} ${monthLong} ${year}`;
  };

  // API Calls
  const filteredOrders = orders.filter(o =>
    (o.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.akun_toko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPromoStock = promoStock.filter(item =>
    (item.nama_brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.cabang_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReportComparisonData = reportComparisonData.filter(item =>
    (item.account || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const derivedMonthlyTarget = filteredReportComparisonData.reduce((acc, curr) => acc + (bulananTargets[curr.account] || 0), 0);
  const derivedYearlyTarget = filteredReportComparisonData.reduce((acc, curr) => acc + (tahunanTargets[curr.account] || 0), 0);

  const getDaysDiff = (d1, d2) => {
    const start = new Date(d1);
    const end = new Date(d2);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const getMonthsDiff = (d1, d2) => {
    const start = new Date(d1);
    const end = new Date(d2);
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();
    return months <= 0 ? 1 : months + 1;
  };

  const derivedHarianBerjalanTarget = getDaysDiff(filterDate1, filterDateEnd) * Math.round(34310000 / 30);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-tanaka/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const normalizeAkun = (akun) => {
    let val = (akun || 'Unknown').trim().toUpperCase();
    if (val.includes('MITAR')) val = val.replace('MITAR', 'MITRA');
    return val;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-tanaka/orders', { headers: { Authorization: `Bearer ${token}` } });
      const normalizedData = res.data.map(o => ({
        ...o,
        akun_toko: normalizeAkun(o.akun_toko)
      }));
      setOrders(normalizedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [resStok, resOnline, resOffline] = await Promise.all([
        getStok(),
        api.get('/pricelist-online'),
        api.get('/produk')
      ]);
      
      const rawData = resStok.data?.data || resStok.data || [];
      setFlatInventory(rawData);
      const onlinePricelist = resOnline.data?.data || resOnline.data || [];
      const offlinePricelist = resOffline.data?.data || resOffline.data || [];
      const combinedPricelist = [...onlinePricelist, ...offlinePricelist];
      
      const sizesArray = ['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL','All Size'];
      const grouped = {};
      
      rawData.forEach(item => {
        const kode   = (item.kode_produk || '').trim().toLowerCase();
        const nama   = (item.nama_barang || item.product_name || '').trim().toLowerCase();
        const cabang = (item.cabang_id || '').trim().toLowerCase();
        const key = `${kode}|${nama}|${cabang}`;
        if (!grouped[key]) {
          grouped[key] = {
            id: item.id,
            kode_produk: item.kode_produk || '-',
            nama_brand: item.nama_brand || '-',
            nama_barang: item.nama_barang || item.product_name || '-',
            bahan: item.bahan || '-',
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
      
      const groupedList = Object.values(grouped);
      
      combinedPricelist.forEach(p => {
        const pKode = (p.kode || '').toLowerCase().trim();
        const pNama = (p.nama_produk || '').toLowerCase().trim();
        
        const exists = groupedList.some(s => 
          (pKode && (s.kode_produk || '').toLowerCase().trim() === pKode) ||
          (pNama && (s.nama_barang || '').toLowerCase().trim() === pNama)
        );
        
        if (!exists) {
          groupedList.push({
            id: `temp-${p.kode || p.nama_produk}`,
            kode_produk: p.kode || '-',
            nama_brand: p.grup_produk || '-',
            nama_barang: p.nama_produk,
            bahan: p.bahan || '-',
            kategori: p.jenis || p.kategori || '-',
            cabang_id: 'Global',
            kode_rak: '-',
            total_stok: 0,
            minimum_stok: 5,
            sizes: sizesArray.reduce((obj, sz) => { obj[sz] = { qty: 0, id: null }; return obj; }, {})
          });
        }
      });
      
      const finalInventory = groupedList.map(item => {
        const itemKode = item.kode_produk?.toUpperCase().trim();
        const itemNama = item.nama_barang?.toLowerCase().trim();
        
        const match = combinedPricelist.find(p => 
          (itemKode && p.kode?.toUpperCase().trim() === itemKode) ||
          (itemNama && p.nama_produk?.toLowerCase().trim() === itemNama)
        );
        
        return {
          ...item,
          kode_produk: match ? match.kode : item.kode_produk,
          kategori: match ? (match.jenis || match.kategori) : item.kategori,
          nama_barang: match ? match.nama_produk : item.nama_barang,
          bahan: match ? (match.bahan || '-') : item.bahan
        };
      });
      
      setInventory(finalInventory);
      
      const token = localStorage.getItem('token');
      const resBK = await axios.get('http://localhost:3000/api/barang-keluar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resBK.data.status === 'success') {
        const todayStr = getLocalDateString(new Date());
        const todayOut = resBK.data.data.filter(item => getLocalDateString(item.tanggal) === todayStr);
        setBarangKeluarHariIni(todayOut);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showManualModal && inventory.length === 0) {
      fetchInventory();
    }
  }, [showManualModal]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // We fetch ALL orders for the branch to process them based on the selected dates
      // In a real production app, we would send the date filters to the backend
      const res = await axios.get('http://localhost:3000/api/marketing-online-tanaka/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allOrders = res.data.map(o => ({
        ...o,
        akun_toko: normalizeAkun(o.akun_toko)
      }));
      const globalAccounts = [...new Set(allOrders.map(o => o.akun_toko))];

      // Process Data based on reportSubTab
      const groupedByAccount = {};

      if (reportSubTab === 'harian') {
        const dailyData = [];
        const accounts = globalAccounts;

        const getDailyRevenue = (orders, account, targetDateStr) => {
          if (!targetDateStr) return 0;
          const targetDate = new Date(targetDateStr);
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth();
          const targetDay = targetDate.getDate();

          return orders
            .filter(o => {
              const orderAcc = o.akun_toko || 'Unknown';
              if (orderAcc !== account) return false;
              
              const orderDate = new Date(o.order_date);
              return orderDate.getFullYear() === targetYear &&
                     orderDate.getMonth() === targetMonth &&
                     orderDate.getDate() === targetDay;
            })
            .reduce((sum, o) => {
              const total_price = parseFloat(o.total_price) || 0;
              return sum + total_price;
            }, 0);
        };

        accounts.forEach(acc => {
          const rev = getDailyRevenue(allOrders, acc, filterDate1);
          const target = dailyTargets[acc] || 2000000;
          const ach = target > 0 ? (rev / target) * 100 : 0;

          if (rev > 0 || target > 0) {
            dailyData.push({
              account: acc,
              revenue: rev,
              target: target,
              achievement: ach
            });
          }
        });

        dailyData.sort((a, b) => b.revenue - a.revenue);
        setReportComparisonData(dailyData);
      } else if (reportSubTab === 'berjalan') {
        const dailyData = [];
        const accounts = globalAccounts;

        // Helper to sum revenue within arbitrary date range
        const getRangeRevenue = (orders, account, startDateStr, endDateStr) => {
          if (!startDateStr || !endDateStr) return 0;
          const startDate = new Date(startDateStr);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(endDateStr);
          endDate.setHours(23, 59, 59, 999);

          return orders
            .filter(o => {
              const orderAcc = o.akun_toko || 'Unknown';
              if (orderAcc !== account) return false;
              
              const orderDate = new Date(o.order_date);
              return orderDate >= startDate && orderDate <= endDate;
            })
            .reduce((sum, o) => {
              const total_price = parseFloat(o.total_price) || 0;
              return sum + total_price;
            }, 0);
        };

        accounts.forEach(acc => {
          const mtd1Revenue = getRangeRevenue(allOrders, acc, filterDate1, filterDateEnd);
          const target = (bulananTargets[acc] || 0) * getMonthsDiff(filterDate1, filterDateEnd);
          const achievement = target > 0 ? (mtd1Revenue / target) * 100 : 0;
          if (mtd1Revenue > 0) {
            dailyData.push({
              account: acc,
              date1: filterDate1,
              date1End: filterDateEnd,
              revenue: mtd1Revenue,
              target: target,
              achievement: achievement
            });
          }
        });

      } else if (reportSubTab === 'berjalan-monthly') {
        // Laporan Bulan Berjalan: rentang bulan
        const [startYear, startMonth] = berjalanMonthMain.split('-').map(Number);
        const [endYear, endMonth] = berjalanMonthCmp.split('-').map(Number);
        
        const startCurrent = new Date(startYear, startMonth - 1, 1);
        const endCurrent = new Date(endYear, endMonth, 0, 23, 59, 59, 999);

        // Untuk rentang yang sama pada tahun lalu
        const startPrevYear = new Date(startYear - 1, startMonth - 1, 1);
        const endPrevYear = new Date(endYear - 1, endMonth, 0, 23, 59, 59, 999);

        const accounts = globalAccounts;
        const finalReport = [];

        accounts.forEach(acc => {
          let currentRev = 0;
          let prevYearRev = 0;

          allOrders.forEach(order => {
            if ((order.akun_toko || 'Unknown') !== acc) return;
            const orderDate = new Date(order.order_date);
            const revenue = parseFloat(order.total_price || 0);

            if (orderDate >= startCurrent && orderDate <= endCurrent) currentRev += revenue;
            if (orderDate >= startPrevYear && orderDate <= endPrevYear) prevYearRev += revenue;
          });

          if (currentRev > 0 || prevYearRev > 0) {
            finalReport.push({
              account: acc,
              currentRevenue: currentRev,
              dateCurrent: startCurrent.toISOString(),
              dateCurrentEnd: endCurrent.toISOString(),
              comparisons: [
                { id: 'target', title: 'Target', compareValue: 0 }, 
                { 
                  id: 'prev_year', title: 'Tahun Lalu', compareValue: prevYearRev, 
                  dateCompare: startPrevYear.toISOString(), 
                  dateCompareEnd: endPrevYear.toISOString() 
                }
              ]
            });
          }
        });

        finalReport.sort((a, b) => b.currentRevenue - a.currentRevenue);
        setReportComparisonData(finalReport);
      } else if (reportSubTab === 'tahunan' || reportSubTab === 'berjalan-tahunan') {
        const today = new Date();
        const limitMonth = today.getMonth(); // 0-11
        const limitDay = today.getDate();

        const accounts = globalAccounts;
        const yearlyData = [];

        if (reportSubTab === 'berjalan-tahunan') {
          let startYear = new Date(filterDate1).getFullYear();
          let endYear = new Date(filterDate2).getFullYear();
          if (startYear > endYear) {
            const temp = startYear;
            startYear = endYear;
            endYear = temp;
          }

          const rangeLength = endYear - startYear + 1;
          const startPrevYear = startYear - rangeLength;
          const endPrevYear = endYear - rangeLength;

          const getRangeYtdOnlineRevenue = (orders, account, sY, eY) => {
            return orders
              .filter(o => {
                const orderAcc = o.akun_toko || 'Unknown';
                if (orderAcc !== account) return false;
                
                const od = new Date(o.order_date);
                const orderYear = od.getFullYear();
                if (orderYear < sY || orderYear > eY) return false;

                return od.getMonth() < limitMonth || (od.getMonth() === limitMonth && od.getDate() <= limitDay);
              })
              .reduce((sum, o) => {
                const total_price = parseFloat(o.total_price) || 0;
                return sum + total_price;
              }, 0);
          };

          accounts.forEach(acc => {
            const v1 = getRangeYtdOnlineRevenue(allOrders, acc, startYear, endYear);
            const v2 = getRangeYtdOnlineRevenue(allOrders, acc, startPrevYear, endPrevYear);

            if (v1 > 0 || v2 > 0) {
              yearlyData.push({
                account: acc,
                currentRevenue: v1,
                dateCurrent: `${startYear}`,
                dateCurrentEnd: `${endYear}`,
                comparisons: [
                  { id: 'target', title: 'Target', compareValue: 0 },
                  { 
                    id: 'prev_year', title: 'Tahun Lalu', compareValue: v2, 
                    dateCompare: `${startPrevYear}`,
                    dateCompareEnd: `${endPrevYear}`
                  }
                ]
              });
            }
          });
        } else {
          // Laporan Tahunan
          const y1 = new Date(filterDate1).getFullYear();
          const y2 = y1 - 1; // Always previous year for comparison

          const getYearlyYtdOnlineRevenue = (orders, account, yearNum) => {
            return orders
              .filter(o => {
                const orderAcc = o.akun_toko || 'Unknown';
                if (orderAcc !== account) return false;
                
                const od = new Date(o.order_date);
                if (od.getFullYear() !== yearNum) return false;

                // YTD: up to current month & day of that year
                return od.getMonth() < limitMonth || (od.getMonth() === limitMonth && od.getDate() <= limitDay);
              })
              .reduce((sum, o) => {
                const total_price = parseFloat(o.total_price) || 0;
                const potongan_shopee = parseFloat(o.potongan_shopee) || 0;
                return sum + (total_price - potongan_shopee);
              }, 0);
          };

          accounts.forEach(acc => {
            const v1 = getYearlyYtdOnlineRevenue(allOrders, acc, y1);
            const v2 = getYearlyYtdOnlineRevenue(allOrders, acc, y2);

            if (v1 > 0 || v2 > 0) {
              yearlyData.push({
                account: acc,
                currentRevenue: v1,
                dateCurrent: `${y1}`,
                comparisons: [
                  { id: 'target', title: 'Target', compareValue: 0 },
                  { 
                    id: 'prev_year', title: 'Tahun Sebelumnya', compareValue: v2, 
                    dateCompare: `${y2}`
                  }
                ]
              });
            }
          });
        }

        yearlyData.sort((a, b) => b.currentRevenue - a.currentRevenue);
        setReportComparisonData(yearlyData);
      } else if (reportSubTab === 'bulanan-monthly') {
        // Laporan Bulanan: 1 bulan saja
        const [mainYear, mainMonth] = monthlyTo.split('-').map(Number);

        const getMonthRev = (orders, acc, year, month) =>
          orders
            .filter(o => {
              if ((o.akun_toko || 'Unknown') !== acc) return false;
              const od = new Date(o.order_date);
              return od.getFullYear() === year && (od.getMonth() + 1) === month;
            })
            .reduce((sum, o) => sum + (parseFloat(o.total_price) || 0) - (parseFloat(o.potongan_shopee) || 0), 0);

        const accounts = [...new Set([
          ...globalAccounts,
          ...Object.keys(bulananTargets)
        ])];
        const monthlyResult = [];

        accounts.forEach(acc => {
          const v1 = getMonthRev(allOrders, acc, mainYear, mainMonth);
          if (v1 > 0 || (bulananTargets[acc] && bulananTargets[acc] > 0)) {
            monthlyResult.push({
              account: acc,
              date1: monthlyTo,
              val1: v1,
              revenue: v1
            });
          }
        });

        monthlyResult.sort((a, b) => b.val1 - a.val1);
        setReportComparisonData(monthlyResult);
      } else {
        // Laporan Bulanan: rentang tanggal (filterDate1 s.d. filterDateEnd)
        // Pembanding: Target, Bulan Sebelumnya, dan Tahun Sebelumnya
        const startCurrent = new Date(filterDate1);
        startCurrent.setHours(0, 0, 0, 0);
        const endCurrent = new Date(filterDateEnd);
        endCurrent.setHours(23, 59, 59, 999);

        // Bulan sebelumnya
        const startPrevMonth = new Date(startCurrent);
        startPrevMonth.setMonth(startPrevMonth.getMonth() - 1);
        if (startPrevMonth.getDate() !== startCurrent.getDate()) startPrevMonth.setDate(0);

        const endPrevMonth = new Date(endCurrent);
        endPrevMonth.setMonth(endPrevMonth.getMonth() - 1);
        if (endPrevMonth.getDate() !== endCurrent.getDate()) endPrevMonth.setDate(0);

        // Tahun lalu
        const startPrevYear = new Date(startCurrent);
        startPrevYear.setFullYear(startPrevYear.getFullYear() - 1);
        if (startPrevYear.getDate() !== startCurrent.getDate()) startPrevYear.setDate(0);

        const endPrevYear = new Date(endCurrent);
        endPrevYear.setFullYear(endPrevYear.getFullYear() - 1);
        if (endPrevYear.getDate() !== endCurrent.getDate()) endPrevYear.setDate(0);

        const accounts = globalAccounts;
        const finalReport = [];

        accounts.forEach(acc => {
          let currentRev = 0;
          let prevMonthRev = 0;
          let prevYearRev = 0;

          allOrders.forEach(order => {
            if ((order.akun_toko || 'Unknown') !== acc) return;
            const orderDate = new Date(order.order_date);
            const revenue = parseFloat(order.total_price || 0) - parseFloat(order.potongan_shopee || 0);

            if (orderDate >= startCurrent && orderDate <= endCurrent) currentRev += revenue;
            if (orderDate >= startPrevMonth && orderDate <= endPrevMonth) prevMonthRev += revenue;
            if (orderDate >= startPrevYear && orderDate <= endPrevYear) prevYearRev += revenue;
          });

          if (currentRev > 0 || prevMonthRev > 0 || prevYearRev > 0) {
            finalReport.push({
              account: acc,
              currentRevenue: currentRev,
              dateCurrent: filterDate1,
              dateCurrentEnd: filterDateEnd,
              comparisons: [
                { id: 'target', title: 'Target', compareValue: 0 }, // dynamically uses globalMonthlyTarget in render
                { 
                  id: 'prev_month', title: 'Bulan Sebelumnya', compareValue: prevMonthRev, 
                  dateCompare: new Date(startPrevMonth.getTime() - startPrevMonth.getTimezoneOffset() * 60000).toISOString().split('T')[0], 
                  dateCompareEnd: new Date(endPrevMonth.getTime() - endPrevMonth.getTimezoneOffset() * 60000).toISOString().split('T')[0] 
                },
                { 
                  id: 'prev_year', title: 'Tahun Lalu', compareValue: prevYearRev, 
                  dateCompare: new Date(startPrevYear.getTime() - startPrevYear.getTimezoneOffset() * 60000).toISOString().split('T')[0], 
                  dateCompareEnd: new Date(endPrevYear.getTime() - endPrevYear.getTimezoneOffset() * 60000).toISOString().split('T')[0] 
                }
              ]
            });
          }
        });
        
        // Sort by current revenue descending
        finalReport.sort((a, b) => b.currentRevenue - a.currentRevenue);
        
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
        await axios.post(`http://localhost:3000/api/marketing-online-tanaka/orders/${id}/ajukan-finance`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert("Pesanan berhasil diajukan ke Finance.");
        fetchOrders();
      } catch (err) {
        alert("Gagal mengajukan ke Finance: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleOpenEdit = (order) => {
    setEditOrder({
      id: order.id,
      akun_toko: order.akun_toko || '',
      kode_produk: order.kode_produk || '',
      product_name: order.product_name || '',
      qty: order.qty || '',
      price_unit: order.price_unit || '',
      potongan_shopee: order.potongan_shopee || '',
      hpp_aktual: order.hpp_aktual || '',
      order_date: order.order_date ? order.order_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: order.status || 'Pesanan Selesai',
      catatan: order.catatan || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editOrder?.id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/marketing-online-tanaka/orders/${editOrder.id}`, editOrder, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Order berhasil diperbarui!');
      setShowEditModal(false);
      setEditOrder(null);
      fetchOrders();
    } catch (err) {
      alert('Gagal memperbarui: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchPromo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-tanaka/promo', { headers: { Authorization: `Bearer ${token}` } });
      setPromoStock(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDbProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/produk', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDbProducts(res.data);
    } catch (err) {
      console.error("Gagal mengambil daftar produk master:", err);
    }
  };

  const fetchPricelistOnline = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/pricelist-online', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.data) {
        setPricelistOnlineData(res.data.data);
      }
    } catch (err) {
      console.error("Gagal mengambil pricelist online:", err);
    }
  };

  // Fetch marketing targets dari database
  const fetchTargets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/marketing-online-tanaka/targets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const targets = res.data;

      const normalizeTargetKeys = (obj) => {
        if (!obj) return {};
        return Object.keys(obj).reduce((acc, key) => {
          acc[normalizeAkun(key)] = obj[key];
          return acc;
        }, {});
      };

      if (targets.harian && Object.keys(targets.harian).length > 0) {
        setDailyTargets(normalizeTargetKeys(targets.harian));
      }
      if (targets.bulanan && Object.keys(targets.bulanan).length > 0) {
        const normalized = normalizeTargetKeys(targets.bulanan);
        setBulananTargets(normalized);
        const totalBulanan = Object.values(normalized).reduce((sum, v) => sum + v, 0);
        setGlobalMonthlyTarget(totalBulanan);
      }
      if (targets.tahunan && Object.keys(targets.tahunan).length > 0) {
        const normalized = normalizeTargetKeys(targets.tahunan);
        setTahunanTargets(normalized);
        const totalTahunan = Object.values(normalized).reduce((sum, v) => sum + v, 0);
        setGlobalYearlyTarget(totalTahunan);
      }
    } catch (err) {
      console.error('Gagal memuat target:', err);
    }
  };

  useEffect(() => {
    fetchDbProducts();
    fetchPricelistOnline();
    fetchTargets();
  }, []);

  useEffect(() => {
    setSearchQuery('');
    if (activeTab !== 'inventory') {
      setStokSearch('');
    }

    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'orders') {
      fetchOrders();
      fetchDbProducts();
    }
    else if (activeTab === 'inventory') {
      fetchInventory();
      // Sync search dari URL param saat masuk tab inventory dari Promo
      if (promoHighlight) setStokSearch(promoHighlight);
    }
    else if (activeTab === 'reports') fetchReports();
    else if (activeTab === 'promo') fetchPromo();
  }, [activeTab, reportSubTab, filterDate1, filterDate2, filterDateEnd, filterDateEnd2, monthlyFrom, monthlyTo, berjalanMonthMain, berjalanMonthCmp]);


  // Handle Excel Import
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // ========== AUTO-DETECT HEADER ROW ==========
      // Read raw data as 2D array first to find where the actual headers are
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      console.log('ðŸ“Š Raw Excel rows (first 5):', rawRows.slice(0, 5));

      // Known header keywords to detect the header row (Enriched with Indonesian Shopee/marketplace terms)
      const knownHeaders = [
        'date', 'tanggal', 'waktu', 'product', 'produk', 'barang',
        'qty', 'quantity', 'jumlah', 'kuantitas', 'price', 'harga',
        'hpp', 'modal', 'profit', 'laba', 'item code', 'potongan', 'diskon',
        'no. pesanan', 'status pesanan', 'username pembeli', 'alamat', 'kota', 'penerima'
      ];

      let headerRowIndex = 0; // default to first row
      let maxMatches = 0;
      let bestHeaderRowIndex = 0;

      for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
        const rowValues = (rawRows[i] || []).map(v => String(v).toLowerCase().trim());
        const matchCount = rowValues.filter(v => knownHeaders.some(h => v.includes(h))).length;

        if (matchCount > maxMatches) {
          maxMatches = matchCount;
          bestHeaderRowIndex = i;
        }

        if (matchCount >= 3) { // At least 3 known headers found = this is the header row
          headerRowIndex = i;
          console.log(`âœ… Header row detected at row index ${i} with ${matchCount} matches:`, rawRows[i]);
          break;
        }
      }

      // Fallback: If no row had >= 3 matches, but there is a row with some matches (e.g. 1 or 2), use the best matched row
      if (headerRowIndex === 0 && maxMatches > 0 && maxMatches < 3) {
        headerRowIndex = bestHeaderRowIndex;
        console.log(`âš ï¸ Low header matches (${maxMatches}), using best matched row index ${bestHeaderRowIndex}:`, rawRows[bestHeaderRowIndex]);
      }

      // Re-read with correct header row using range option
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });

      console.log('ðŸ“‹ Parsed JSON data count:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('ðŸ”‘ Column headers detected:', Object.keys(jsonData[0]));
        console.log('ðŸ“„ First row data:', jsonData[0]);
      }

      if (jsonData.length === 0) {
        alert("File Excel kosong atau header tidak ditemukan!");
        return;
      }

      // Gunakan Data Adapter modular untuk mendeteksi & mengonversi format Shopee secara otomatis
      const adaptedData = shopeeDataAdapter(jsonData);

      let finalMappedData = [];
      if (adaptedData !== jsonData) {
        // Jika format Shopee terdeteksi, langsung gunakan data hasil adaptasi dual-schema
        finalMappedData = adaptedData;
        console.log('ðŸš€ [UI] Format Shopee terdeteksi & dikonversi secara otomatis!', finalMappedData.length);
      } else {
        // Jika bukan format Shopee, jalankan logika pemetaan (mapping) standard bawaan sistem
        finalMappedData = jsonData.map((row, rowIndex) => {
          // Utility to normalize all spaces, newlines, tabs, and carriage returns
          const cleanStr = (str) => {
            if (!str) return '';
            return String(str)
              .replace(/[\r\n\t]+/g, ' ') // Replace line breaks and tabs with spaces
              .replace(/\s+/g, ' ')       // Normalize multiple consecutive spaces to a single space
              .trim()
              .toLowerCase();
          };

          // Smart field matcher: prioritizes exact match, then includes match
          // Uses excludeKeys to avoid ambiguous substring collisions (e.g. "HPP" matching "HPP ACTUAL")
          const getField = (possibleNames, excludeKeys = []) => {
            const keys = Object.keys(row).filter(k =>
              !excludeKeys.some(ex => cleanStr(k) === cleanStr(ex))
            );

            const cleanPossibleNames = possibleNames.map(p => cleanStr(p));

            // 1. Try exact match first
            const exactKey = keys.find(k =>
              cleanPossibleNames.some(p => cleanStr(k) === p)
            );
            if (exactKey) return row[exactKey];

            // 2. Try includes match
            const includeKey = keys.find(k =>
              cleanPossibleNames.some(p => cleanStr(k).includes(p))
            );
            if (includeKey) return row[includeKey];

            return '';
          };

          // Helper to convert Excel date serial number to YYYY-MM-DD
          const excelDateToJS = (serial) => {
            if (typeof serial !== 'number') return serial;
            const utc_days = Math.floor(serial - 25569);
            const utc_value = utc_days * 86400;
            const date_info = new Date(utc_value * 1000);
            return date_info.toISOString().split('T')[0];
          };

          // Helper to parse "6 May 2026" or "14 May 2026" format
          const parseTextDate = (str) => {
            if (!str || typeof str !== 'string') return null;
            const d = new Date(str);
            if (!isNaN(d.getTime())) {
              return d.toISOString().split('T')[0];
            }
            return null;
          };

          let rawTanggal = getField(['date', 'tanggal', 'waktu', 'order time', 'waktu pesanan dibuat', 'order creation date', 'waktu pesanan']);
          let tanggal = typeof rawTanggal === 'number' ? excelDateToJS(rawTanggal) : rawTanggal;

          if (!tanggal) {
            tanggal = new Date().toISOString().split('T')[0];
          } else if (typeof tanggal === 'string') {
            // Try parsing text date like "6 May 2026" or "14 May 2026"
            const textParsed = parseTextDate(tanggal);
            if (textParsed) {
              tanggal = textParsed;
            } else if (tanggal.includes('/') || tanggal.includes('-')) {
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
          }

          // Parse numeric values - handles both number type and string type with Indonesian/US formatting auto-detection
          const parseNum = (val) => {
            if (val === undefined || val === null || val === '' || val === '-') return 0;
            if (typeof val === 'number') return val;

            let cleaned = String(val).trim();

            // If it contains both dot and comma (e.g., 250.000,50)
            if (cleaned.includes('.') && cleaned.includes(',')) {
              // Check if dot is before comma
              if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
                // Indonesian format: 250.000,50 -> remove dots, replace comma with dot
                cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
              } else {
                // US format: 250,000.50 -> remove commas
                cleaned = cleaned.replace(/,/g, '');
              }
            } else if (cleaned.includes(',')) {
              // Only contains commas (e.g. 250,000 or 12,5)
              // If comma is followed by exactly 3 digits, it's likely a thousand separator
              const parts = cleaned.split(',');
              if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                cleaned = cleaned.replace(/,/g, '');
              } else {
                // Otherwise, it's a decimal comma (Indonesian 12,5 -> 12.5)
                cleaned = cleaned.replace(/,/g, '.');
              }
            } else if (cleaned.includes('.')) {
              // Only contains dots (e.g. 250.000 or 250.5)
              const parts = cleaned.split('.');
              // If dot is followed by exactly 3 digits (or multiple groups of 3), it's a thousand separator
              if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                cleaned = cleaned.replace(/\./g, '');
              }
            }

            // Remove all non-numeric characters except minus sign and decimal point
            cleaned = cleaned.replace(/[^\d.-]/g, '');

            return parseFloat(cleaned) || 0;
          };

          const qty = parseInt(getField(['qty', 'jumlah', 'quantity', 'kuantitas', 'jumlah produk yang dipesan', 'jumlah produk'])) || 1;
          const productNameRaw = getField(['product', 'produk', 'barang', 'nama produk', 'product name', 'nama barang']);
          const kodeProdukVal = getField(['kode', 'kode produk', 'item code', 'product code', 'kode item', 'sku']);

          let finalProductName = productNameRaw || 'Produk Tidak Diketahui';
          let matchedHpp = 0;
          let matchedPrice = 0;
          let matchedPotongan = 0;

          if (kodeProdukVal && pricelistOnlineData && pricelistOnlineData.length > 0) {
            const match = pricelistOnlineData.find(p => p.kode.toLowerCase() === kodeProdukVal.toLowerCase());
            if (match) {
              finalProductName = finalProductName === 'Produk Tidak Diketahui' || !productNameRaw ? match.nama_produk : finalProductName;
              matchedHpp = parseFloat(match.hpp) || 0;
              matchedPrice = parseFloat(match.harga_jual) || 0;
              matchedPotongan = parseFloat(match.pot_shopee) || 0;
            }
          } else if (dbProducts && dbProducts.length > 0 && finalProductName !== 'Produk Tidak Diketahui') {
            const match = dbProducts.find(p => {
              const dbName = (p.nama_produk || '').toLowerCase().trim();
              const excelName = finalProductName.toLowerCase().trim();
              return excelName.includes(dbName) || dbName.includes(excelName);
            });
            if (match) {
              matchedHpp = parseFloat(match.hpp_satuan) || 0;
            }
          }

          const priceUnit = parseNum(getField(['price', 'harga satuan', 'unit price', 'harga awal', 'deal price', 'harga asli', 'harga jualan'], ['total price'])) || matchedPrice;
          const totalPrice = parseNum(getField(['total price', 'total harga', 'subtotal', 'total bayar', 'total pembayaran', 'total real', 'total penghasilan'])) || (qty * priceUnit);

          // HPP fields - use excludeKeys to prevent "HPP" from matching "HPP ACTUAL" or "TOTAL HPP"
          const hppActual = parseNum(getField(['hpp actual', 'hpp aktual', 'hpp_actual', 'hpp_aktual'], ['total hpp', 'total hpp aktual', 'total cost', 'total modal']));
          const hppUnit = parseNum(getField(['hpp', 'hpp satuan', 'cost', 'modal', 'cost unit', 'hpp_satuan'], ['hpp actual', 'hpp aktual', 'hpp_actual', 'hpp_aktual', 'total hpp', 'total hpp aktual'])) || matchedHpp;
          const totalHpp = parseNum(getField(['total hpp', 'total hpp aktual', 'total cost', 'total modal', 'total_hpp']));

          // Use HPP ACTUAL if available, otherwise use HPP
          const finalHppUnit = hppActual || hppUnit;
          const finalTotalHpp = totalHpp || (qty * finalHppUnit);

          const discount = parseNum(getField(['potongan shopee', 'potongan', 'diskon shopee', 'shopee discount', 'diskon dari shopee', 'voucher shopee', 'harga potongan shopee', 'diskon'], ['total'])) || matchedPotongan;
          const satuan = parseNum(getField(['satuan']));

          // Parse actual and actual_satuan fields correctly
          const actual = parseNum(getField(['actual', 'total actual', 'total_actual', 'total real', 'total_real', 'harga real', 'total bersih', 'actual total'], ['hpp actual', 'hpp aktual', 'hpp_actual']));
          const actualSatuan = parseNum(getField(['actual satuan', 'actual_satuan', 'harga actual satuan', 'harga real satuan', 'harga bersih satuan', 'harga_aktual_satuan', 'harga_real_satuan'])) || (qty > 0 ? actual / qty : 0);

          const profit = parseNum(getField(['profit', 'laba', 'keuntungan'])) || (totalPrice - finalTotalHpp - discount);
          const catatan = getField(['catatan', 'note', 'notes', 'keterangan', 'remark']);

          const result = {
            customer_name: getField(['nama', 'pembeli', 'username', 'customer', 'username pembeli', 'nama customer']) || 'Anonim',
            akun_toko: getField(['akun', 'toko', 'shop', 'account', 'username penjual', 'akun toko']) || '-',
            kode_produk: kodeProdukVal || '',
            product_name: finalProductName,
            qty: qty,
            price_unit: priceUnit || satuan || 0,
            total_price: totalPrice,
            potongan_shopee: discount,
            hpp_aktual: finalHppUnit,
            total_hpp_aktual: finalTotalHpp,
            actual: actual || (totalPrice - discount),
            actual_satuan: actualSatuan || (qty > 0 ? (actual || (totalPrice - discount)) / qty : 0),
            profit: profit,
            order_date: tanggal,
            address: getField(['alamat', 'address', 'kota', 'alamat pengiriman', 'shipping address']) || '-',
            status: getField(['status', 'order status', 'status pesanan']) || 'Pesanan Selesai'
          };

          // Debug log first row mapping
          if (rowIndex === 0) {
            console.log('ðŸ”„ First row mapping result:', result);
          }

          return result;
        });
      }

      console.log('âœ… Total mapped rows:', finalMappedData.length);
      setImportPreview(finalMappedData);
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
      await axios.post('http://localhost:3000/api/marketing-online-tanaka/import', importPreview, {
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
    // Validasi field wajib
    const errors = [];
    if (!manualOrder.akun_toko) errors.push('Nama Toko');
    if (!manualOrder.stok_id && !manualOrder.kode_produk) errors.push('Kode Produk');
    if (!manualOrder.qty || parseInt(manualOrder.qty) <= 0) errors.push('Qty');
    if (errors.length > 0) {
      alert(`Field berikut wajib diisi:\nâ€¢ ${errors.join('\nâ€¢ ')}`);
      return;
    }

    const qty = parseInt(manualOrder.qty) || 0;
    const price_unit = parseFloat(manualOrder.price_unit) || 0;
    const hpp_aktual = parseFloat(manualOrder.hpp_aktual) || 0;
    const potongan_shopee = parseFloat(manualOrder.potongan_shopee) || 0;

    const total_price = qty * price_unit;
    const hpp = qty * hpp_aktual;
    const total_hpp_aktual = hpp;
    const actual = total_price - potongan_shopee;
    const actual_satuan = qty > 0 ? actual / qty : 0;
    const profit = actual - hpp;

    const finalOrder = {
      customer_name: manualOrder.customer_name || '-',
      akun_toko: manualOrder.akun_toko || '-',
      kode_produk: manualOrder.kode_produk || null,
      product_name: manualOrder.product_name || '-',
      stok_id: manualOrder.stok_id || null,
      address: manualOrder.address || '-',
      order_date: manualOrder.order_date || new Date().toISOString().split('T')[0],
      status: manualOrder.status || 'Pesanan Selesai',
      catatan: manualOrder.catatan || '',
      qty,
      price_unit,
      hpp_aktual,       // nilai satuan HPP yang diinput user (number)
      potongan_shopee,
      total_price,
      hpp,              // = qty Ã— hpp_aktual
      total_hpp_aktual,
      actual_satuan,
      actual,
      profit
    };

    try {
      setLoading(true);
      await api.post('/marketing-online-tanaka/import', [finalOrder]);
      alert("Pesanan manual berhasil disimpan!");
      setShowManualModal(false);
      setManualOrder({
        customer_name: '', akun_toko: '', kode_produk: '', product_name: '', qty: '', price_unit: '',
        potongan_shopee: '', hpp_aktual: '', order_date: new Date().toISOString().split('T')[0],
        address: '', status: 'Pesanan Selesai', stok_id: null
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
      {!embedded && <Sidebar />}
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR SEARCH & PROFILE */}
        <header className={`h-12 bg-white border-b border-gray-200 flex items-center px-5 sticky top-0 z-30 shrink-0 ${activeTab !== 'dashboard' ? 'justify-between' : 'justify-end'}`}>
          {activeTab !== 'dashboard' && (
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={
                  activeTab === 'orders'
                    ? "Cari data order online..."
                    : activeTab === 'promo'
                    ? "Cari data promo online..."
                    : activeTab === 'inventory'
                    ? "Cari brand, barang, kategori..."
                    : "Cari data..."
                }
                value={activeTab === 'inventory' ? stokSearch : searchQuery}
                onChange={(e) => {
                  if (activeTab === 'inventory') {
                    setStokSearch(e.target.value);
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
                className="w-full pl-10 pr-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs focus:outline-none focus:ring-4 focus:ring-red-50 focus:bg-white focus:border-red-200 transition-all shadow-inner"
              />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setShowProfile(!showProfile)}>
              <UserCircle className="text-gray-400" size={20} />
              <ChevronDown size={12} className="text-gray-400" />
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-150 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 bg-red-50/50">
                    <p className="text-xs font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[9px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 bg-[#f3f4f6] pt-4">
          <div className={activeTab === 'dashboard' ? '' : 'bg-white p-4 min-h-full rounded-xl shadow-sm border border-gray-100'}>
            {/* Dynamic Header Module Title */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
              <div>
                <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                  {activeTab === 'dashboard' && (
                    <>
                      <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                        <LayoutDashboard className="text-[#990000]" size={20} />
                      </div>
                      Dashboard Online
                    </>
                  )}
                  {activeTab === 'orders' && (
                    <>
                      <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg shadow-sm">
                        <ShoppingBag className="text-blue-600" size={20} />
                      </div>
                      Order Marketplace
                    </>
                  )}
                  {activeTab === 'inventory' && (
                    <>
                      <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-lg shadow-sm">
                        <Package className="text-indigo-600" size={20} />
                      </div>
                      Stok Inventori
                    </>
                  )}
                  {activeTab === 'reports' && (
                    <>
                      <div className="bg-violet-50 border border-violet-100 p-2 rounded-lg shadow-sm">
                        <TrendingUp className="text-violet-600" size={20} />
                      </div>
                      {reportSubTab === 'tahunan' ? 'Laporan Tahunan Online' : reportSubTab === 'berjalan-tahunan' ? 'Laporan Tahun Berjalan Online' : reportSubTab === 'bulanan-monthly' ? 'Laporan Bulanan Online' : reportSubTab === 'berjalan-monthly' ? 'Laporan Bulan Berjalan Online' : reportSubTab === 'bulanan' ? 'Laporan Harian Berjalan Online' : reportSubTab === 'berjalan' ? 'Laporan Bulan Berjalan Online' : 'Laporan Harian Online'}
                    </>
                  )}
                  {activeTab === 'promo' && (
                    <>
                      <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg shadow-sm">
                        <Gift className="text-rose-600" size={20} />
                      </div>
                      Promo Online
                    </>
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  {activeTab === 'dashboard' && 'Kelola rangkuman data transaksi dan statistik toko online secara ringkas.'}
                  {activeTab === 'orders' && 'Pantau status pesanan pelanggan dan impor data order dari Excel marketplace.'}
                  {activeTab === 'inventory' && 'Pantau ketersediaan stok fisik barang siap jual secara real-time.'}
                  {activeTab === 'reports' && 'Analisis performa pendapatan cabang antar-periode menggunakan tabel & grafik visual.'}
                  {activeTab === 'promo' && 'Identifikasi produk mengendap lebih dari 60 hari untuk strategi diskon kilat.'}
                </p>
              </div>

            {/* Action Buttons (As per screenshot colors) */}
            {activeTab === 'orders' && (
              <div className="flex items-center gap-3">
                {!userRole.includes('gudang') && (
                  <>
                    <button
                      onClick={handleExportExcel}
                      className="flex items-center gap-2 bg-[#2563eb] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                    >
                      <Upload size={18} /> Eksport Excel
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-[#059669] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                    >
                      <Download size={18} /> Import Shopee
                    </button>
                    <button
                      onClick={() => {
                        setManualOrder({
                          customer_name: '', akun_toko: '', kode_produk: '', product_name: '', qty: '', price_unit: '',
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* TAB: DASHBOARD (As per User Screenshot) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Summary Cards Grid (6 Columns) - Compact Version */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 shrink-0">
                {[
                  { title: 'Revenue (Bulan Ini)', value: formatRupiah(dashboardData.monthlySummary.totalRevenue), icon: <DollarSign size={11} className="text-white" /> },
                  { title: 'Total Profit', value: formatRupiah(dashboardData.monthlySummary.totalProfit), icon: <TrendingUp size={11} className="text-white" /> },
                  { title: 'Total HPP', value: formatRupiah(dashboardData.monthlySummary.totalHpp), icon: <PieChart size={11} className="text-white" /> },
                  { title: 'Qty Terjual', value: `${dashboardData.monthlySummary.totalQty || 0} Pcs`, icon: <Package size={11} className="text-white" /> },
                  { title: 'Potongan Shopee', value: formatRupiah(dashboardData.monthlySummary.totalPotongan), icon: <Gift size={11} className="text-white" /> },
                  { title: 'Order Hari Ini', value: `${dashboardData.ordersToday} Pesanan`, icon: <ShoppingBag size={11} className="text-white" /> }
                ].map((card, index) => (
                  <div key={index} className="bg-white rounded-[12px] p-2.5 shadow-sm border border-gray-100 border-l-[4px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md min-h-[72px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-[20px] h-[20px] rounded-full bg-[#990000] flex items-center justify-center shrink-0 shadow-sm shadow-red-900/20">
                        {card.icon}
                      </div>
                      <p className="text-[9px] font-bold text-gray-500 tracking-wider uppercase truncate">{card.title || card.label}</p>
                    </div>
                    <h3 className="text-base font-black text-gray-900 leading-tight truncate">{card.value}</h3>
                    {card.sub && <p className="text-[8px] mt-0.5 font-medium text-gray-400 truncate">{card.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Sales Trend - Line Chart (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="text-[#990000]" size={14} /> Tren Penjualan (30 Hari Terakhir)
                    </h3>
                  </div>
                  <div className="h-[160px] w-full">
                    {dashboardData.salesChart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.salesChart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="order_date"
                            tickFormatter={formatDate}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#64748b' }}
                            angle={-45}
                            textAnchor="end"
                            height={40}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `Rp ${val / 1000}k`}
                            tick={{ fontSize: 9, fill: '#64748b' }}
                          />
                          <RechartsTooltip
                            formatter={(value) => formatRupiah(value)}
                            labelFormatter={(label) => formatDate(label)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Revenue"
                            stroke="#990000"
                            strokeWidth={2.5}
                            dot={{ r: 2, fill: '#990000', strokeWidth: 1.5, stroke: '#fff' }}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 font-medium">Belum ada data penjualan 30 hari terakhir</div>
                    )}
                  </div>
                </div>

                {/* Top Products vs Sales - Ranking List */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                  <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Package className="text-orange-500" size={14} /> Top 5 Produk
                  </h3>
                  {dashboardData.topProducts.length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                      {dashboardData.topProducts.slice(0, 5).map((p, idx) => {
                        const maxQty = dashboardData.topProducts[0]?.total_qty || 1;
                        const pct = Math.round((p.total_qty / maxQty) * 100);
                        const rankColors = ['#990000', '#c0392b', '#e74c3c', '#e67e22', '#f39c12'];
                        const badgeBg = ['bg-red-900', 'bg-red-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500'];
                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`${badgeBg[idx]} text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shrink-0`}>
                                {idx + 1}
                              </span>
                              {/* Nama produk - klik untuk lihat nama lengkap */}
                              <div className="relative flex-1 min-w-0">
                                <button
                                  onClick={() => setTooltipProduk(tooltipProduk === idx ? null : idx)}
                                  className="text-xs font-bold text-gray-800 truncate w-full text-left hover:text-[#990000] transition-colors cursor-pointer"
                                  title="Klik untuk lihat nama lengkap"
                                >
                                  {p.product_name}
                                </button>
                                {/* Popup nama lengkap */}
                                {tooltipProduk === idx && (
                                  <div
                                    className="absolute left-0 top-full mt-1 z-50 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl max-w-[220px] leading-snug"
                                    style={{ animation: 'fadeInDown 0.15s ease' }}
                                  >
                                    <span className="text-orange-300 font-black text-[10px] uppercase tracking-wider block mb-0.5">Nama Produk</span>
                                    {p.product_name}
                                    {/* Panah atas */}
                                    <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-black text-[#990000] shrink-0">{p.total_qty} Qty</span>
                            </div>
                            <div className="flex items-center gap-2 pl-7">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-2 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, backgroundColor: rankColors[idx] }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400 font-semibold shrink-0 w-20 text-right">
                                {formatRupiah(p.total_sales)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-center text-sm">
                      Belum ada data produk terlaris
                    </div>
                  )}
                </div>
              </div>

              {/* Top Toko - Persentase Kontribusi Revenue */}
              {dashboardData.topToko.length > 0 && (() => {
                const totalRevAll = dashboardData.topToko.reduce((s, t) => s + parseFloat(t.total_revenue || 0), 0);
                const palette = [
                  '#990000','#c0392b','#e74c3c','#e67e22','#f39c12',
                  '#27ae60','#2980b9','#8e44ad','#16a085','#d35400',
                  '#2c3e50','#1abc9c','#e91e63','#ff5722','#607d8b'
                ];
                return (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                        Kontribusi Toko
                      </h3>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        {dashboardData.topToko.length} Toko
                      </span>
                    </div>

                    {/* Stacked 100% bar di atas */}
                    <div className="flex h-6 w-full rounded-xl overflow-hidden mb-4 shadow-inner">
                      {dashboardData.topToko.map((t, i) => {
                        const pct = totalRevAll > 0 ? (parseFloat(t.total_revenue) / totalRevAll) * 100 : 0;
                        return (
                          <div
                            key={i}
                            style={{ width: `${pct}%`, backgroundColor: palette[i % palette.length] }}
                            title={`${t.akun_toko}: ${pct.toFixed(1)}%`}
                            className="transition-all duration-500 cursor-default"
                          />
                        );
                      })}
                    </div>

                    {/* List per toko dengan bar persentase individual */}
                    <div className="space-y-2 mt-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                      {dashboardData.topToko.map((t, i) => {
                        const pct = totalRevAll > 0 ? (parseFloat(t.total_revenue) / totalRevAll) * 100 : 0;
                        const color = palette[i % palette.length];
                        return (
                          <div key={i} className="flex items-center gap-3">
                            {/* Warna dot */}
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            {/* Nama toko */}
                            <span className="text-[11px] font-bold text-gray-700 w-32 shrink-0 truncate" title={t.akun_toko}>
                              {t.akun_toko}
                            </span>
                            {/* Bar */}
                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-3 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                            {/* Persen */}
                            <span className="text-[11px] font-black w-10 text-right shrink-0" style={{ color }}>
                              {pct.toFixed(1)}%
                            </span>
                            {/* Revenue */}
                            <span className="text-[10px] text-gray-400 font-semibold w-24 text-right shrink-0">
                              {formatRupiah(t.total_revenue)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white border border-gray-200 shadow-xl shadow-gray-100 rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-900 text-white border-b border-gray-800 text-xs select-none sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-left min-w-[50px]">
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-left min-w-[150px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>DATE</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-left min-w-[160px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>AKUN</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-left min-w-[100px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>KODE</span>
                          <ChevronDown size={10} className="text-indigo-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-left min-w-[200px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>PRODUCT</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-center min-w-[70px]">
                        <div className="flex items-center justify-center gap-1">
                          <span>QTY</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[110px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>PRICE</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[120px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>TOTAL PRICE</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[130px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>POTONGAN SHOPEE</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[120px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>HPP ACTUAL</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[110px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>HPP</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[120px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>TOTAL HPP</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[130px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>ACTUAL SATUAN</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[120px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>ACTUAL</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-right min-w-[110px]">
                        <div className="flex items-center justify-end gap-1">
                          <span>PROFIT</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold border-r border-gray-800 text-left min-w-[180px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>CATATAN</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-semibold text-center min-w-[80px]">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-800 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan="16" className="text-center py-24 bg-white">
                          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
                          <p className="text-gray-500 font-black text-sm mt-3 uppercase tracking-wider">Memuat lembar data Excel...</p>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="16" className="text-center py-24 bg-white text-gray-400 font-bold italic">
                          Belum ada data order online. Silakan import file Shopee atau tambah manual.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order, idx) => {
                        // Compute mathematical formulas on the fly for absolute consistency
                        const qty = parseInt(order.qty) || 0;
                        const price_unit = parseFloat(order.price_unit) || 0;
                        const hpp_aktual = parseFloat(order.hpp_aktual) || 0;
                        const potongan_shopee = parseFloat(order.potongan_shopee) || 0;

                        const total_price = order.total_price || (qty * price_unit);
                        const hpp = order.hpp || (qty * hpp_aktual);
                        const total_hpp_aktual = order.total_hpp_aktual || hpp;
                        const actual = order.actual || (total_price - potongan_shopee);
                        const actual_satuan = order.actual_satuan || (qty > 0 ? actual / qty : 0);
                        const profit = order.profit || (actual - hpp);

                        return (
                          <tr
                            key={order.id || idx}
                            className={`hover:bg-red-50/30 border-b border-gray-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                          >
                            <td className="py-2.5 px-3 border-r border-gray-100 text-center text-gray-300 text-[10px] select-none font-bold"></td>
                            <td className="py-2.5 px-3 border-r border-gray-100 font-bold text-gray-900 whitespace-nowrap">{formatIndoLongDate(order.order_date)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 font-black text-gray-800 uppercase text-[10px] tracking-wide whitespace-nowrap">{order.akun_toko || '-'}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 whitespace-nowrap">
                              {order.kode_produk ? (
                                <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black px-2 py-0.5 rounded-md tracking-wide">{order.kode_produk}</span>
                              ) : (
                                <span className="text-gray-300 text-[10px]">-</span>
                              )}
                            </td>
                            <td
                              className={`py-2.5 px-3 border-r border-gray-100 font-bold text-gray-900 cursor-pointer select-none transition-all ${expandedProduct === (order.id || idx) ? 'max-w-none whitespace-normal text-[#990000]' : 'max-w-[200px] truncate hover:text-[#990000]'}`}
                              onClick={() => setExpandedProduct(expandedProduct === (order.id || idx) ? null : (order.id || idx))}
                              title={expandedProduct === (order.id || idx) ? 'Klik untuk tutup' : 'Klik untuk lihat nama lengkap'}
                            >{order.product_name}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-center font-black text-red-600 text-sm">{qty}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-medium text-gray-800">{formatExcelNumber(price_unit)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-black text-gray-900">{formatExcelNumber(total_price)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-black text-red-600">{formatExcelNumber(potongan_shopee)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-medium text-gray-800">{formatExcelNumber(hpp_aktual)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-medium text-gray-800">{formatExcelNumber(hpp)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-black text-gray-900">{formatExcelNumber(total_hpp_aktual)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-black text-blue-700">{formatExcelNumber(actual_satuan)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-right font-black text-gray-900">{formatExcelNumber(actual)}</td>
                            <td className={`py-2.5 px-3 border-r border-gray-100 text-right font-black ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatExcelNumber(profit)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 text-gray-600 font-bold max-w-[180px] truncate" title={order.catatan || order.address}>{order.catatan || order.address || '-'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleOpenEdit(order)}
                                className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all hover:scale-105 active:scale-95"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
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
          )}

          {/* TAB: INVENTORY */}
          {activeTab === 'inventory' && (() => {
            const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL', 'All Size'];

            const filteredStok = inventory.filter(item => {
              const q = stokSearch.toLowerCase();
              return (
                item.nama_barang?.toLowerCase().includes(q) ||
                item.kode_produk?.toLowerCase().includes(q) ||
                item.nama_brand?.toLowerCase().includes(q) ||
                item.bahan?.toLowerCase().includes(q) ||
                item.kategori.toLowerCase().includes(q)
              );
            });

            return (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {promoHighlight && stokSearch === promoHighlight && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      ðŸ” Filter dari Promo: <strong>{promoHighlight}</strong>
                    </span>
                    <button
                      onClick={() => { setStokSearch(''); navigate('/marketing-online-tanaka/inventory'); }}
                      className="text-[10px] text-gray-400 hover:text-gray-600 font-bold bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm"
                    >âœ• Hapus</button>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10">
                        <tr>
                          <th className="p-4">Kode</th>
                          <th className="p-4">Jenis</th>
                          <th className="p-4">Nama Produk</th>
                          <th className="p-4">Bahan</th>
                          {sizesArray.map(size => (
                            <th key={size} className="p-4 text-center w-14">{size}</th>
                          ))}
                          <th className="p-4 text-center w-28">Total Stok</th>
                          <th className="p-4 text-center w-28">Min. Stok</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={16} className="text-center py-16">
                            <Loader2 className="animate-spin text-[#990000] mx-auto w-8 h-8" />
                            <p className="text-gray-400 text-sm mt-2 font-medium">Memuat data stok...</p>
                          </td></tr>
                        ) : filteredStok.length === 0 ? (
                          <tr><td colSpan={16} className="text-center py-16 text-gray-400 font-medium">Belum ada data stok barang.</td></tr>
                        ) : (
                          filteredStok.map((item, idx) => (
                            <tr key={idx} className={`border-b border-gray-100 text-sm transition-colors ${
                              promoHighlight && (item.nama_barang.toLowerCase().includes(promoHighlight.toLowerCase()))
                                ? 'bg-amber-50/60 hover:bg-amber-100/60'
                                : 'hover:bg-gray-50'
                            }`}>
                              <td className="p-4 font-bold text-[#990000]">{item.kode_produk}</td>
                              <td className="p-4">
                                <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                  {item.kategori}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-gray-800">
                                <div className="flex flex-col">
                                  <span>{item.nama_barang}</span>
                                  {(() => {
                                    const matchingOut = barangKeluarHariIni.filter(bk => 
                                      bk.nama_barang.toLowerCase().trim() === item.nama_barang.toLowerCase().trim() &&
                                      bk.cabang_id.toLowerCase().trim() === item.cabang_id.toLowerCase().trim()
                                    );
                                    if (matchingOut.length > 0) {
                                      const outDetails = matchingOut.map(bk => `${bk.ukuran}: ${bk.jumlah}`).join(', ');
                                      return (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100 w-max mt-0.5">
                                          <CheckCircle size={10} className="text-green-600" /> Keluar Hari Ini ({outDetails})
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </td>
                              <td className="p-4 text-gray-500">{item.bahan}</td>
                              {sizesArray.map(size => {
                                const qty = item.sizes[size]?.qty || 0;
                                return (
                                  <td key={size} className="p-4 text-center bg-gray-50/10 border-x border-gray-100 font-extrabold text-gray-800">
                                    {qty > 0 ? qty : <span className="text-gray-300 font-normal">-</span>}
                                  </td>
                                );
                              })}
                              <td className="p-4 text-center font-extrabold text-red-600 text-base">{item.total_stok}</td>
                              <td className="p-4 text-center bg-gray-50/10 border-l border-gray-100">
                                <span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                  {item.minimum_stok}
                                </span>
                              </td>
                              

                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

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
                        {formatRupiah(3067000000)}
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
                    <div className="flex items-end pb-3 text-gray-400 font-black text-lg select-none">-</div>
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
                        {formatRupiah(411720000 * (Math.abs(new Date(filterDate2).getFullYear() - new Date(filterDate1).getFullYear()) + 1))}
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
                        {formatRupiah(Math.round(34310000 / 30))}
                      </div>
                    </div>
                  </>
                ) : reportSubTab === 'berjalan' ? (
                  <>
                    <div className="flex-1 min-w-[250px] p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Periode Bulan</label>
                      <div className="flex items-center space-x-2">
                        <input type="date" className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium" value={filterDate1} onChange={e => setFilterDate1(e.target.value)} />
                        <span className="text-gray-400 font-black">-</span>
                        <input type="date" className="w-full p-2 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-[200px] p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <label className="block text-xs font-bold text-emerald-600 uppercase mb-2">Target Pendapatan</label>
                      <div className="w-full py-1 text-emerald-700 font-bold text-lg">
                        {formatRupiah(34310000 * getMonthsDiff(filterDate1, filterDateEnd))}
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
                        {formatRupiah(34310000)}
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
                    <div className="flex items-end pb-3 text-gray-400 font-black text-lg select-none">-</div>
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
                        {formatRupiah(34310000 * getMonthsDiff(`${berjalanMonthMain}-01`, `${berjalanMonthCmp}-01`))}
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
                    <div className="flex items-end pb-3 text-gray-400 font-black text-lg select-none">-</div>
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
                        <th className="py-4 px-6 text-left text-xs font-black uppercase tracking-widest border border-gray-800">Nama Akun</th>
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
                            const t = bulananTargets[row.account] || 0;
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
                                {new Date(row.date1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} â€“ {new Date(row.date1End).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                            const t = tahunanTargets[row.account] || 0;
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
                                  ? (tahunanTargets[accRow.account] || 0) * (Math.abs(new Date(filterDate2).getFullYear() - new Date(filterDate1).getFullYear()) + 1)
                                  : (reportSubTab === 'bulanan' 
                                    ? (dailyTargets[accRow.account] || 2000000) * getDaysDiff(filterDate1, filterDateEnd) 
                                    : (reportSubTab === 'berjalan-monthly' 
                                      ? (bulananTargets[accRow.account] || 0) * getMonthsDiff(`${berjalanMonthMain}-01`, `${berjalanMonthCmp}-01`) 
                                      : (bulananTargets[accRow.account] || 0))),
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
                                              ? `Tahun ${accRow.dateCurrent} â€“ ${accRow.dateCurrentEnd} (YTD)`
                                              : (reportSubTab === 'tahunan'
                                                ? `Tahun ${accRow.dateCurrent} (YTD)`
                                                : (reportSubTab === 'berjalan-monthly' 
                                                    ? `${new Date(accRow.dateCurrent).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} â€“ ${new Date(accRow.dateCurrentEnd).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                                                    : (accRow.dateCurrentEnd ? `${new Date(accRow.dateCurrent).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} â€“ ${new Date(accRow.dateCurrentEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Bulan Ini')))
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
                                                  ? `â†© Tahun ${comp.dateCompare1} â€“ ${comp.dateCompare2} (YTD)`
                                                  : (reportSubTab === 'tahunan'
                                                    ? `â†© Tahun ${comp.dateCompare1} (YTD)`
                                                    : (reportSubTab === 'berjalan-monthly'
                                                        ? `â†© ${new Date(comp.dateCompare1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                                                        : (comp.dateCompare2 ? `â†© ${new Date(comp.dateCompare1).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} â€“ ${new Date(comp.dateCompare2).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : `â†© ${comp.titleCompare}`)))}
                                              </>
                                          ) : (
                                            `â†© ${comp.titleCompare}`
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
                                ? 411720000 * (Math.abs(new Date(filterDate2).getFullYear() - new Date(filterDate1).getFullYear()) + 1) 
                                : (reportSubTab === 'berjalan-monthly' 
                                  ? 34310000 * getMonthsDiff(`${berjalanMonthMain}-01`, `${berjalanMonthCmp}-01`) 
                                  : (reportSubTab === 'bulanan' ? derivedHarianBerjalanTarget : filteredReportComparisonData.reduce((acc, curr) => {
                                      const t = reportSubTab === 'tahunan' ? (tahunanTargets[curr.account] || 0) : (bulananTargets[curr.account] || 0);
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
                              {formatRupiah(reportSubTab === 'tahunan' ? 411720000 : 34310000)}
                            </td>
                          )}

                          <td className="py-5 px-6 text-right text-emerald-400 text-lg">
                            {formatRupiah(filteredReportComparisonData.reduce((acc, curr) => acc + (reportSubTab === 'harian' ? curr.revenue : curr.val1 || curr.currentRevenue || curr.revenue), 0))}
                          </td>
                          {reportSubTab === 'harian' ? (
                            <>
                              <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                                {formatRupiah(8500000)}
                              </td>
                              <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                                {(() => {
                                  const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
                                  const pct = (totalRev / 8500000) * 100;
                                  return `${pct.toFixed(2)}%`;
                                })()}
                              </td>
                            </>
                          ) : (
                            <td className="py-5 px-6 text-center text-emerald-400 text-lg font-black">
                              {(() => {
                                  const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + (curr.val1 || curr.currentRevenue || curr.revenue), 0);
                                  if (reportSubTab === 'bulanan-monthly') {
                                    const pct = (totalRev / 34310000) * 100;
                                    return `${pct.toFixed(2)}%`;
                                  } else if (reportSubTab === 'tahunan') {
                                    const pct = (totalRev / 411720000) * 100;
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
                                const totalTarget = 34310000 * getMonthsDiff(filterDate1, filterDateEnd);
                                return formatRupiah(totalTarget);
                              })()}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center text-blue-400 text-lg font-black border-l border-gray-700">
                            {(() => {
                                const totalRev = filteredReportComparisonData.reduce((acc, curr) => acc + curr.revenue, 0);
                                const totalTarget = 34310000 * getMonthsDiff(filterDate1, filterDateEnd);
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
                      {reportSubTab === 'harian' ? 'Pencapaian Target Akun' : 'Perbandingan Performa Akun'}
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
                        target: reportSubTab === 'tahunan' ? (tahunanTargets[acc.account] || 0) : (bulananTargets[acc.account] || 0),
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
            </div>
          )}

          {/* TAB: PROMO ONLINE */}
          {activeTab === 'promo' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">

              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-black text-amber-800">Barang Mengendap â‰¥ 2 Bulan</p>
                  <p className="text-xs text-amber-600 mt-0.5 font-medium">
                    Daftar ini menampilkan stok cabang Banua yang belum terjual selama â‰¥ 60 hari dan tidak ada transaksi dalam 2 bulan terakhir. Segera buat promo untuk menggerakkan stok ini.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
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
                          // Badge warna berdasarkan lama mengendap
                          const badgeClass = hari >= 180
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : hari >= 90
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200';
                          const badgeLabel = hari >= 180
                            ? `${bulan} bln âš ï¸`
                            : hari >= 90
                              ? `${bulan} bln ðŸ”¶`
                              : `${bulan} bln`;

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
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.kategori === 'Utama' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>
                                  {item.kategori || '-'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-center font-bold text-gray-600 text-xs">{item.ukuran || '-'}</td>
                              <td className="py-3.5 px-5 text-center font-medium text-gray-500 text-xs">{item.cabang_id || '-'}</td>
                              <td className="py-3.5 px-5 text-center font-bold text-gray-500 text-xs">{formatDate(item.created_at)}</td>
                              <td className="py-3.5 px-5 text-center">
                                <span className={`px-3 py-1 rounded-full text-[11px] font-black ${badgeClass}`}>
                                  {badgeLabel}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-center font-black text-red-600 text-base">{item.stock_qty} Pcs</td>
                              <td className="py-3.5 px-5 text-center">
                                <button
                                  onClick={() => {
                                    // Navigate ke tab Stok Inventori dengan filter nama produk
                                    setStokSearch(item.product_name);
                                    navigate(`/marketing-online-tanaka/inventory?q=${encodeURIComponent(item.product_name)}`);
                                  }}
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
        </div>
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
        inventory={flatInventory}
        availableAccounts={[...new Set([...Object.keys(dailyTargets), ...Object.keys(bulananTargets), ...Object.keys(tahunanTargets)])].sort()}
      />

      {/* EDIT ORDER MODAL */}
      {showEditModal && editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-black text-gray-900">Edit Order</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Perbarui data pesanan - semua kalkulasi dihitung ulang otomatis</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditOrder(null); }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* Baris 1: Tanggal & Akun Toko */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal Order</label>
                  <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.order_date} onChange={e => setEditOrder({ ...editOrder, order_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Akun Toko</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.akun_toko} onChange={e => setEditOrder({ ...editOrder, akun_toko: e.target.value })} placeholder="Nama akun toko" />
                </div>
              </div>

              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Produk</label>
                <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                  value={editOrder.product_name} onChange={e => setEditOrder({ ...editOrder, product_name: e.target.value })} placeholder="Nama produk" />
              </div>

              {/* Baris 2: Qty & Harga Satuan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qty</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.qty} onChange={e => setEditOrder({ ...editOrder, qty: e.target.value })} placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Harga Satuan</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.price_unit} onChange={e => setEditOrder({ ...editOrder, price_unit: e.target.value })} placeholder="0" min="0" />
                </div>
              </div>

              {/* Baris 3: HPP Satuan & Potongan Shopee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#990000] uppercase mb-2">âš¡ HPP Satuan</label>
                  <input type="number" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 font-bold text-sm text-[#990000]"
                    value={editOrder.hpp_aktual} onChange={e => setEditOrder({ ...editOrder, hpp_aktual: e.target.value })} placeholder="0" min="0" />
                  <p className="text-[10px] text-gray-400 mt-1">Ubah jika harga bahan baku berubah</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Potongan Shopee</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.potongan_shopee} onChange={e => setEditOrder({ ...editOrder, potongan_shopee: e.target.value })} placeholder="0" min="0" />
                </div>
              </div>

              {/* Preview Kalkulasi Otomatis */}
              {(() => {
                const q   = parseInt(editOrder.qty) || 0;
                const pu  = parseFloat(editOrder.price_unit) || 0;
                const ps  = parseFloat(editOrder.potongan_shopee) || 0;
                const hpp = parseFloat(editOrder.hpp_aktual) || 0;
                const totalHarga   = q * pu;
                const hppTotal     = q * hpp;
                const totalHppAkt  = hppTotal;
                const actual       = totalHarga - ps;
                const profit       = actual - hppTotal;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Harga', val: totalHarga, color: 'text-gray-800' },
                      { label: 'Total HPP', val: totalHppAkt, color: 'text-orange-600' },
                      { label: 'Actual', val: actual, color: 'text-blue-700' },
                      { label: 'HPP (qtyÃ—hpp)', val: hppTotal, color: 'text-gray-600' },
                      { label: 'Profit', val: profit, color: profit >= 0 ? 'text-emerald-700' : 'text-red-600' },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{item.label}</p>
                        <p className={`text-sm font-black ${item.color} mt-0.5`}>{formatRupiah(item.val)}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Status & Catatan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm"
                    value={editOrder.status} onChange={e => setEditOrder({ ...editOrder, status: e.target.value })}>
                    <option value="Pesanan Selesai">Pesanan Selesai</option>
                    <option value="Menunggu Finance">Menunggu Finance</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Catatan</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.catatan} onChange={e => setEditOrder({ ...editOrder, catatan: e.target.value })} placeholder="Catatan tambahan..." />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={() => { setShowEditModal(false); setEditOrder(null); }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveEdit} disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Simpan Perubahan
              </button>
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
        inventory={flatInventory}
        pricelistOnlineData={pricelistOnlineData}
        availableAccounts={[...new Set([...Object.keys(dailyTargets), ...Object.keys(bulananTargets), ...Object.keys(tahunanTargets)])].sort()}
      />

      {/* EDIT ORDER MODAL */}
      {showEditModal && editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
              <div>
                <h2 className="text-xl font-black text-gray-900">Edit Order</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Perbarui data pesanan - semua kalkulasi dihitung ulang otomatis</p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditOrder(null); }} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* Baris 1: Tanggal & Akun Toko */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tanggal Order</label>
                  <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.order_date} onChange={e => setEditOrder({ ...editOrder, order_date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Akun Toko</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.akun_toko} onChange={e => setEditOrder({ ...editOrder, akun_toko: e.target.value })} placeholder="Nama akun toko" />
                </div>
              </div>

              {/* Kode Produk & Nama Produk */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-500 uppercase mb-2">Kode Produk</label>
                  <input type="text" className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold text-sm text-indigo-700 tracking-wide"
                    value={editOrder.kode_produk || ''} onChange={e => setEditOrder({ ...editOrder, kode_produk: e.target.value })} placeholder="Mis: TK-001" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Produk</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.product_name} onChange={e => setEditOrder({ ...editOrder, product_name: e.target.value })} placeholder="Nama produk" />
                </div>
              </div>

              {/* Baris 2: Qty & Harga Satuan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qty</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.qty} onChange={e => setEditOrder({ ...editOrder, qty: e.target.value })} placeholder="0" min="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Harga Satuan</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.price_unit} onChange={e => setEditOrder({ ...editOrder, price_unit: e.target.value })} placeholder="0" min="0" />
                </div>
              </div>

              {/* Baris 3: HPP Satuan & Potongan Shopee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#990000] uppercase mb-2">âš¡ HPP Satuan</label>
                  <input type="number" className="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 font-bold text-sm text-[#990000]"
                    value={editOrder.hpp_aktual} onChange={e => setEditOrder({ ...editOrder, hpp_aktual: e.target.value })} placeholder="0" min="0" />
                  <p className="text-[10px] text-gray-400 mt-1">Ubah jika harga bahan baku berubah</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Potongan Shopee</label>
                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.potongan_shopee} onChange={e => setEditOrder({ ...editOrder, potongan_shopee: e.target.value })} placeholder="0" min="0" />
                </div>
              </div>

              {/* Preview Kalkulasi Otomatis */}
              {(() => {
                const q   = parseInt(editOrder.qty) || 0;
                const pu  = parseFloat(editOrder.price_unit) || 0;
                const ps  = parseFloat(editOrder.potongan_shopee) || 0;
                const hpp = parseFloat(editOrder.hpp_aktual) || 0;
                const totalHarga   = q * pu;
                const hppTotal     = q * hpp;
                const totalHppAkt  = hppTotal + ps;
                const actual       = totalHarga - ps;
                const profit       = actual - hppTotal;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 grid grid-cols-3 gap-3">
                    {[
                      { label: 'Total Harga', val: totalHarga, color: 'text-gray-800' },
                      { label: 'Total HPP', val: totalHppAkt, color: 'text-orange-600' },
                      { label: 'Actual', val: actual, color: 'text-blue-700' },
                      { label: 'HPP (qtyÃ—hpp)', val: hppTotal, color: 'text-gray-600' },
                      { label: 'Profit', val: profit, color: profit >= 0 ? 'text-emerald-700' : 'text-red-600' },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">{item.label}</p>
                        <p className={`text-sm font-black ${item.color} mt-0.5`}>{formatRupiah(item.val)}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Status & Catatan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-bold text-sm"
                    value={editOrder.status} onChange={e => setEditOrder({ ...editOrder, status: e.target.value })}>
                    <option value="Pesanan Selesai">Pesanan Selesai</option>
                    <option value="Menunggu Finance">Menunggu Finance</option>
                    <option value="Batal">Batal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Catatan</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 font-medium text-sm"
                    value={editOrder.catatan} onChange={e => setEditOrder({ ...editOrder, catatan: e.target.value })} placeholder="Catatan tambahan..." />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-3xl">
              <button onClick={() => { setShowEditModal(false); setEditOrder(null); }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Batal
              </button>
              <button onClick={handleSaveEdit} disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && selectedItemForRequest && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                <Package className="text-blue-600" size={20} /> Ambil Stok
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
                  <textarea rows="2" value={requestForm.keterangan} onChange={(e) => setRequestForm({ ...requestForm, keterangan: e.target.value })} placeholder="Untuk pesanan Shopee No. 123..." className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"></textarea>
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
};

// Sub-component for Manual Order Modal
const ManualOrderModal = ({ show, onClose, onSave, order, setOrder, loading, formatRupiah, inventory, availableAccounts, pricelistOnlineData }) => {
  const [showSuggest, setShowSuggest] = useState(false);

  const selectedStockItem = inventory?.find(item => 
    (order.stok_id && item.id === order.stok_id) || 
    (!order.stok_id && order.kode_produk && item.kode_produk?.toLowerCase() === order.kode_produk?.toLowerCase())
  );

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
              <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.order_date} onChange={e => setOrder({ ...order, order_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Akun Toko <span className="text-red-500">*</span></label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium text-gray-800" value={order.akun_toko} onChange={e => setOrder({ ...order, akun_toko: e.target.value })}>
                <option value="">-- Pilih Akun Toko --</option>
                {availableAccounts && availableAccounts.map((acc, idx) => (
                  <option key={idx} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">Kode Produk <span className="text-red-500">*</span></label>
                {selectedStockItem && (
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${selectedStockItem.jumlah > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    Stok Tersedia: {selectedStockItem.jumlah} Pcs
                  </span>
                )}
              </div>
              <input 
                type="text"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium text-gray-800 text-sm" 
                placeholder="Ketik Kode Produk..."
                value={order.kode_produk || ''} 
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
                onChange={e => {
                  const val = e.target.value;
                  const matchedItem = inventory?.find(item => item.kode_produk?.toLowerCase() === val.toLowerCase());
                  if (matchedItem) {
                    const sizeText = matchedItem.ukuran && matchedItem.ukuran !== '-' ? ` - ${matchedItem.ukuran}` : '';
                    const fullName = `${matchedItem.nama_barang}${sizeText}`;
                    const priceMatch = matchedItem.kode_produk && pricelistOnlineData?.find(p => p.kode?.toLowerCase() === matchedItem.kode_produk.toLowerCase());
                    setOrder({
                      ...order,
                      stok_id: matchedItem.id,
                      kode_produk: val,
                      product_name: fullName,
                      ...(priceMatch ? {
                        hpp_aktual: parseFloat(priceMatch.hpp) || order.hpp_aktual,
                        price_unit: parseFloat(priceMatch.harga_jual) || order.price_unit,
                        potongan_shopee: parseFloat(priceMatch.pot_shopee) || order.potongan_shopee,
                      } : {})
                    });
                  } else {
                    setOrder({
                      ...order,
                      stok_id: null,
                      kode_produk: val,
                    });
                  }
                }}
              />
              {showSuggest && (
                <div className="absolute z-50 left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {(() => {
                    const pricelistItems = pricelistOnlineData || [];
                    const combinedSuggestions = [...inventory];
                    
                    pricelistItems.forEach(p => {
                      const existsInInventory = inventory.some(item => (item.kode_produk || '').toLowerCase() === (p.kode || '').toLowerCase());
                      if (!existsInInventory && p.kode) {
                        combinedSuggestions.push({
                          id: `temp-${p.kode}`,
                          isTemp: true,
                          kode_produk: p.kode,
                          nama_barang: p.nama_produk,
                          ukuran: '-',
                          jumlah: 0,
                        });
                      }
                    });

                    const filtered = combinedSuggestions.filter(item => {
                      const searchStr = `${item.kode_produk || ''} ${item.nama_barang || ''}`.toLowerCase();
                      return searchStr.includes((order.kode_produk || '').toLowerCase());
                    });

                    if (filtered.length === 0) {
                      return <div className="p-3 text-sm text-gray-400 text-center font-medium">Tidak ada produk yang cocok. Silakan lanjut ketik manual.</div>;
                    }

                    return filtered.map(item => {
                      const sizeText = item.ukuran && item.ukuran !== '-' ? ` (${item.ukuran})` : '';
                      return (
                        <div 
                          key={item.id}
                          className="p-3 hover:bg-red-50 hover:text-red-800 cursor-pointer text-sm font-medium border-b border-gray-100 last:border-0 flex justify-between items-center"
                          onMouseDown={() => {
                            const sizeText = item.ukuran && item.ukuran !== '-' ? ` - ${item.ukuran}` : '';
                            const fullName = `${item.nama_barang}${sizeText}`;
                            const priceMatch = item.kode_produk && pricelistOnlineData?.find(p => p.kode?.toLowerCase() === item.kode_produk.toLowerCase());
                            setOrder({
                              ...order,
                              stok_id: item.isTemp ? null : item.id,
                              kode_produk: item.kode_produk || '',
                              product_name: fullName,
                              ...(priceMatch ? {
                                hpp_aktual: parseFloat(priceMatch.hpp) || order.hpp_aktual,
                                price_unit: parseFloat(priceMatch.harga_jual) || order.price_unit,
                                potongan_shopee: parseFloat(priceMatch.pot_shopee) || order.potongan_shopee,
                              } : {})
                            });
                            setShowSuggest(false);
                          }}
                        >
                          <div>
                            <span className="font-bold text-red-700">{item.kode_produk ? `${item.kode_produk} - ` : ''}</span>
                            <span>{item.nama_barang}{sizeText}</span>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                            {item.isTemp ? 'Belum Ada Stok' : `Stok: ${item.jumlah}`}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Produk <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium text-gray-800 text-sm"
                placeholder="Nama Produk..."
                value={order.product_name || ''} 
                onChange={e => setOrder({ ...order, product_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qty <span className="text-red-500">*</span></label>
              <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-bold text-[#990000]" value={order.qty} onChange={e => setOrder({ ...order, qty: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Price (Unit)</label>
              <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.price_unit} onChange={e => setOrder({ ...order, price_unit: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">HPP Satuan</label>
              <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.hpp_aktual} onChange={e => setOrder({ ...order, hpp_aktual: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Potongan</label>
              <input type="number" className="w-full p-3 bg-red-50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-bold text-red-600" value={order.potongan_shopee} onChange={e => setOrder({ ...order, potongan_shopee: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase"># TOTAL PRICE</span>
              <span className="block text-base font-black text-gray-800">{formatRupiah((order.qty || 0) * (order.price_unit || 0))}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase"># HPP</span>
              <span className="block text-base font-black text-gray-800">{formatRupiah((order.qty || 0) * (order.hpp_aktual || 0))}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase"># TOTAL HPP</span>
              <span className="block text-base font-black text-gray-800">{formatRupiah(((order.qty || 0) * (order.hpp_aktual || 0)) + (parseFloat(order.potongan_shopee) || 0))}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase"># ACTUAL</span>
              <span className="block text-base font-black text-[#13523c]">{formatRupiah(((order.qty || 0) * (order.price_unit || 0)) - (parseFloat(order.potongan_shopee) || 0))}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase"># ACTUAL SATUAN</span>
              <span className="block text-base font-black text-gray-800">{formatRupiah((order.qty || 0) > 0 ? (((order.qty || 0) * (order.price_unit || 0)) - (parseFloat(order.potongan_shopee) || 0)) / (order.qty || 1) : 0)}</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] font-black text-gray-400 uppercase"># PROFIT</span>
              <span className="block text-base font-black text-blue-700">{formatRupiah(((order.qty || 0) * (order.price_unit || 0)) - (parseFloat(order.potongan_shopee) || 0) - ((order.qty || 0) * (order.hpp_aktual || 0)))}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status Pesanan</label>
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-bold text-emerald-600" value={order.status} onChange={e => setOrder({ ...order, status: e.target.value })}>
                <option value="Pesanan Selesai">Pesanan Selesai</option>
                <option value="Menunggu Finance">Menunggu Finance</option>
                <option value="Batal">Batal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Catatan</label>
              <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.catatan || ''} onChange={e => setOrder({ ...order, catatan: e.target.value })} placeholder="Masukkan catatan tambahan" />
            </div>
          </div>

          <div className="p-6 bg-[#13523c] rounded-3xl shadow-lg shadow-emerald-100 animate-in slide-in-from-top-2">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Estimasi Keuntungan (Profit)</p>
                <h3 className="text-2xl font-black">{formatRupiah(((order.qty || 0) * (order.price_unit || 0)) - (parseFloat(order.potongan_shopee) || 0) - ((order.qty || 0) * (order.hpp_aktual || 0)))}</h3>
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

export default MarketingOnlineTanaka;

