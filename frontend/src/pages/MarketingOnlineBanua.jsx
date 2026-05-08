import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import { shopeeDataAdapter } from '../utils/shopeeAdapter';
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
  const [dbProducts, setDbProducts] = useState([]);
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

        // Helper to sum revenue within Month-to-Date (MTD) up to a target day
        const getMtdRevenue = (orders, account, targetDateStr) => {
          if (!targetDateStr) return 0;
          const targetDate = new Date(targetDateStr);
          const targetYear = targetDate.getFullYear();
          const targetMonth = targetDate.getMonth(); // 0-11
          const targetDay = targetDate.getDate();

          // Start of target month: YYYY-MM-01 00:00:00
          const startOfMonth = new Date(targetYear, targetMonth, 1);
          // End of target day: YYYY-MM-DD 23:59:59
          const endOfMtd = new Date(targetYear, targetMonth, targetDay, 23, 59, 59);

          return orders
            .filter(o => {
              const orderAcc = o.akun_toko || 'Unknown';
              if (orderAcc !== account) return false;
              
              const orderDate = new Date(o.order_date);
              return orderDate >= startOfMonth && orderDate <= endOfMtd;
            })
            .reduce((sum, o) => {
              const total_price = parseFloat(o.total_price) || 0;
              const potongan_shopee = parseFloat(o.potongan_shopee) || 0;
              return sum + (total_price - potongan_shopee);
            }, 0);
        };

        accounts.forEach(acc => {
          const mtd1Revenue = getMtdRevenue(allOrders, acc, filterDate1);
          const mtd2Revenue = getMtdRevenue(allOrders, acc, filterDate2);
          const achievement = mtd2Revenue > 0 ? (mtd1Revenue / mtd2Revenue) * 100 : (mtd1Revenue > 0 ? 100 : 0);

          if (mtd1Revenue > 0 || mtd2Revenue > 0) {
            dailyData.push({
              account: acc,
              date1: filterDate1,
              date2: filterDate2,
              revenue: mtd1Revenue,       // Primary Periode
              prevRevenue: mtd2Revenue,   // Pembanding Periode
              achievement: achievement
            });
          }
        });

        dailyData.sort((a, b) => b.revenue - a.revenue);
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

  useEffect(() => {
    fetchDbProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    else if (activeTab === 'orders') {
      fetchOrders();
      fetchDbProducts();
    }
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

      // ========== AUTO-DETECT HEADER ROW ==========
      // Read raw data as 2D array first to find where the actual headers are
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      console.log('📊 Raw Excel rows (first 5):', rawRows.slice(0, 5));

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
          console.log(`✅ Header row detected at row index ${i} with ${matchCount} matches:`, rawRows[i]);
          break;
        }
      }

      // Fallback: If no row had >= 3 matches, but there is a row with some matches (e.g. 1 or 2), use the best matched row
      if (headerRowIndex === 0 && maxMatches > 0 && maxMatches < 3) {
        headerRowIndex = bestHeaderRowIndex;
        console.log(`⚠️ Low header matches (${maxMatches}), using best matched row index ${bestHeaderRowIndex}:`, rawRows[bestHeaderRowIndex]);
      }

      // Re-read with correct header row using range option
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: '' });

      console.log('📋 Parsed JSON data count:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('🔑 Column headers detected:', Object.keys(jsonData[0]));
        console.log('📄 First row data:', jsonData[0]);
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
        console.log('🚀 [UI] Format Shopee terdeteksi & dikonversi secara otomatis!', finalMappedData.length);
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
          const productName = getField(['product', 'produk', 'barang', 'nama produk', 'product name', 'nama barang']) || 'Produk Tidak Diketahui';

          // Attempt to find matching product in our master DB to automatically populate HPP
          let matchedHpp = 0;
          if (dbProducts && dbProducts.length > 0 && productName !== 'Produk Tidak Diketahui') {
            // Find if the Shopee product name contains the DB product name, or vice versa (case-insensitive substring match)
            const match = dbProducts.find(p => {
              const dbName = (p.nama_produk || '').toLowerCase().trim();
              const excelName = productName.toLowerCase().trim();
              return excelName.includes(dbName) || dbName.includes(excelName);
            });
            if (match) {
              matchedHpp = parseFloat(match.hpp_satuan) || 0;
            }
          }

          const priceUnit = parseNum(getField(['price', 'harga satuan', 'unit price', 'harga awal', 'deal price', 'harga asli', 'harga jualan'], ['total price']));
          const totalPrice = parseNum(getField(['total price', 'total harga', 'subtotal', 'total bayar', 'total pembayaran', 'total real', 'total penghasilan'])) || (qty * priceUnit);

          // HPP fields - use excludeKeys to prevent "HPP" from matching "HPP ACTUAL" or "TOTAL HPP"
          const hppActual = parseNum(getField(['hpp actual', 'hpp aktual', 'hpp_actual', 'hpp_aktual'], ['total hpp', 'total hpp aktual', 'total cost', 'total modal']));
          const hppUnit = parseNum(getField(['hpp', 'hpp satuan', 'cost', 'modal', 'cost unit', 'hpp_satuan'], ['hpp actual', 'hpp aktual', 'hpp_actual', 'hpp_aktual', 'total hpp', 'total hpp aktual'])) || matchedHpp;
          const totalHpp = parseNum(getField(['total hpp', 'total hpp aktual', 'total cost', 'total modal', 'total_hpp']));

          // Use HPP ACTUAL if available, otherwise use HPP
          const finalHppUnit = hppActual || hppUnit;
          const finalTotalHpp = totalHpp || (qty * finalHppUnit);

          const discount = parseNum(getField(['potongan shopee', 'potongan', 'diskon shopee', 'shopee discount', 'diskon dari shopee', 'voucher shopee', 'harga potongan shopee', 'diskon'], ['total']));
          const satuan = parseNum(getField(['satuan']));

          // Parse actual and actual_satuan fields correctly
          const actual = parseNum(getField(['actual', 'total actual', 'total_actual', 'total real', 'total_real', 'harga real', 'total bersih', 'actual total'], ['hpp actual', 'hpp aktual', 'hpp_actual']));
          const actualSatuan = parseNum(getField(['actual satuan', 'actual_satuan', 'harga actual satuan', 'harga real satuan', 'harga bersih satuan', 'harga_aktual_satuan', 'harga_real_satuan'])) || (qty > 0 ? actual / qty : 0);

          const profit = parseNum(getField(['profit', 'laba', 'keuntungan'])) || (totalPrice - finalTotalHpp - discount);
          const catatan = getField(['catatan', 'note', 'notes', 'keterangan', 'remark']);

          const result = {
            customer_name: getField(['nama', 'pembeli', 'username', 'customer', 'username pembeli', 'nama customer']) || 'Anonim',
            akun_toko: getField(['item code', 'item_code', 'kode item', 'akun', 'toko', 'shop', 'account', 'username penjual', 'akun toko']) || '-',
            product_name: productName,
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
            console.log('🔄 First row mapping result:', result);
          }

          return result;
        });
      }

      console.log('✅ Total mapped rows:', finalMappedData.length);
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
    const qty = parseInt(manualOrder.qty) || 0;
    const price_unit = parseFloat(manualOrder.price_unit) || 0;
    const hpp_aktual = parseFloat(manualOrder.hpp_aktual) || 0;
    const potongan_shopee = parseFloat(manualOrder.potongan_shopee) || 0;

    const total_price = qty * price_unit;
    const hpp = qty * hpp_aktual;
    const total_hpp_aktual = hpp + potongan_shopee;
    const actual = total_price - potongan_shopee;
    const actual_satuan = qty > 0 ? actual / qty : 0;
    const profit = actual - hpp;

    const finalOrder = {
      ...manualOrder,
      qty,
      price_unit,
      hpp_aktual,
      potongan_shopee,
      total_price,
      hpp,
      total_hpp_aktual,
      actual_satuan,
      actual,
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
                      <th className="py-3 px-3 font-semibold text-left min-w-[180px]">
                        <div className="flex items-center justify-between gap-1">
                          <span>CATATAN</span>
                          <ChevronDown size={10} className="text-red-400" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-800 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan="15" className="text-center py-24 bg-white">
                          <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto" />
                          <p className="text-gray-500 font-black text-sm mt-3 uppercase tracking-wider">Memuat lembar data Excel...</p>
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="text-center py-24 bg-white text-gray-400 font-bold italic">
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
                        const total_hpp_aktual = order.total_hpp_aktual || (hpp + potongan_shopee);
                        const actual_satuan = order.actual_satuan || (price_unit - potongan_shopee);
                        const actual = order.actual || (total_price - (potongan_shopee * qty));
                        const profit = order.profit || (total_price - total_hpp_aktual);

                        return (
                          <tr
                            key={order.id || idx}
                            className={`hover:bg-red-50/30 border-b border-gray-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}
                          >
                            <td className="py-2.5 px-3 border-r border-gray-100 text-center text-gray-300 text-[10px] select-none font-bold"></td>
                            <td className="py-2.5 px-3 border-r border-gray-100 font-bold text-gray-900 whitespace-nowrap">{formatIndoLongDate(order.order_date)}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 font-black text-gray-800 uppercase text-[10px] tracking-wide whitespace-nowrap">{order.akun_toko || '-'}</td>
                            <td className="py-2.5 px-3 border-r border-gray-100 font-bold text-gray-900 max-w-[200px] truncate" title={order.product_name}>{order.product_name}</td>
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
                            <td className="py-2.5 px-3 border-gray-100 text-gray-600 font-bold max-w-[180px] truncate" title={order.catatan || order.address}>{order.catatan || order.address || '-'}</td>
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
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto ${item.stock_qty > 0
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
                          {reportSubTab === 'harian' ? 'Rentang Tanggal (MTD)' : 'Bulan'}
                        </th>
                        <th className="py-4 px-6 text-right text-xs font-black uppercase tracking-widest border border-gray-800">Pendapatan</th>
                        <th className="py-4 px-6 text-center text-xs font-black uppercase tracking-widest border border-gray-800">Achievement</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {reportComparisonData.length > 0 ? (
                        reportSubTab === 'harian' ? (
                          reportComparisonData.map((row, idx) => (
                            <React.Fragment key={idx}>
                              <tr className="hover:bg-blue-50/30 transition-colors">
                                <td rowSpan={2} className="py-6 px-6 text-center font-bold text-gray-400 border-x border-b border-gray-100">{idx + 1}</td>
                                <td rowSpan={2} className="py-6 px-6 font-black text-gray-900 border-x border-b border-gray-100">{row.account}</td>
                                <td className="py-3 px-6 text-center font-bold bg-cyan-50 text-cyan-800 border-b border-gray-100">
                                  {formatMtdRange(row.date1)}
                                </td>
                                <td className="py-3 px-6 text-right font-black text-blue-700 border-b border-gray-100">{formatRupiah(row.revenue)}</td>
                                <td rowSpan={2} className="py-6 px-6 text-center border-x border-b border-gray-100">
                                  <span className={`text-xl font-black ${row.achievement >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                                    {row.achievement.toFixed(2)}%
                                  </span>
                                </td>
                              </tr>
                              <tr className="hover:bg-blue-50/30 transition-colors">
                                <td className="py-3 px-6 text-center font-bold bg-gray-50 text-gray-500 border-b border-gray-100">
                                  {formatMtdRange(row.date2)}
                                </td>
                                <td className="py-3 px-6 text-right font-bold text-gray-400 border-b border-gray-100">{formatRupiah(row.prevRevenue)}</td>
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
              <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.order_date} onChange={e => setOrder({ ...order, order_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Akun Toko</label>
              <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.akun_toko} onChange={e => setOrder({ ...order, akun_toko: e.target.value })} placeholder="Contoh: Shopee_Tanaka" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Produk</label>
            <input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 outline-none font-medium" value={order.product_name} onChange={e => setOrder({ ...order, product_name: e.target.value })} placeholder="Masukkan nama barang lengkap" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Qty</label>
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

export default MarketingOnlineBanua;
