import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
    getAllCashInBank, getCashInBankSummary, createCashInBank, 
    updateCashInBank, deleteCashInBank 
} from '../api/cashInBankApi';
import { 
    getAllCashOut, createCashOut, updateCashOut, voidCashOut 
} from '../api/cashOutBankApi';
import { 
    Plus, Search, Edit, Trash2,
    TrendingUp, DollarSign, UserCircle, FileText, Upload, X,
    Eye, Ban
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
const formatRupiahValue = (number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(number || 0);

const BANKS = [
    'BCA Tanaka', 'BRI Tanaka', 'Mandiri Tanaka', 'BNI Tanaka', 'Cash Tanaka',
    'BCA Banua', 'BRI Banua', 'Mandiri Banua', 'BNI Banua', 'Cash Banua',
    'BCA Acestreet', 'BRI Acestreet', 'Mandiri Acestreet', 'BNI Acestreet', 'Cash Acestreet'
];

const CashBank = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [voidItem, setVoidItem] = useState(null);

    const [filters, setFilters] = useState({
        search: '', bank: '', status: '', startDate: '', endDate: '', cabang: ''
    });

    // ===== LAPORAN KORAN STATE =====
    const [showLaporanKoran, setShowLaporanKoran] = useState(false);
    const [lkFilters, setLkFilters] = useState({
        bank: '',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    // Compute laporan koran data from current `data` filtered by lkFilters
    const getLaporanKoranData = () => {
        let rows = data;
        if (lkFilters.bank) rows = rows.filter(r => r.bank === lkFilters.bank);
        if (lkFilters.startDate) rows = rows.filter(r => r.tanggal_transaksi >= lkFilters.startDate || r.tanggal_transaksi.split('T')[0] >= lkFilters.startDate);
        if (lkFilters.endDate) rows = rows.filter(r => (r.tanggal_transaksi.split('T')[0] || r.tanggal_transaksi) <= lkFilters.endDate);
        return rows.sort((a, b) => new Date(a.tanggal_transaksi) - new Date(b.tanggal_transaksi));
    };

    const downloadLaporanKoran = () => {
        const rows = getLaporanKoranData();
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const company = 'PT Tanaka Rizqi Barokah';
        const bankLabel = lkFilters.bank || 'Semua Bank';
        const periodeLabel = `${new Date(lkFilters.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} s/d ${new Date(lkFilters.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;

        // Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN KORAN', 105, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(company, 105, 25, { align: 'center' });
        doc.text(`Rekening: ${bankLabel}`, 105, 31, { align: 'center' });
        doc.text(`Periode: ${periodeLabel}`, 105, 37, { align: 'center' });

        // Divider
        doc.setDrawColor(153, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(14, 41, 196, 41);

        // Running balance calculation
        let runningBalance = 0;
        const tableBody = rows.map((r, idx) => {
            const masuk = r.status === 'Paid' ? parseFloat(r.total || 0) : 0;
            const pending = r.status !== 'Paid' ? parseFloat(r.total || 0) : 0;
            runningBalance += masuk;
            return [
                idx + 1,
                new Date(r.tanggal_transaksi).toLocaleDateString('id-ID'),
                r.transaksi_id,
                r.nama_vendor,
                r.keterangan,
                r.status,
                masuk > 0 ? `Rp ${masuk.toLocaleString('id-ID')}` : '-',
                pending > 0 ? `Rp ${pending.toLocaleString('id-ID')}` : '-',
                `Rp ${runningBalance.toLocaleString('id-ID')}`,
            ];
        });

        const totalMasuk = rows.filter(r => r.status === 'Paid').reduce((s, r) => s + parseFloat(r.total || 0), 0);
        const totalPending = rows.filter(r => r.status !== 'Paid').reduce((s, r) => s + parseFloat(r.total || 0), 0);

        autoTable(doc, {
            startY: 45,
            head: [['No', 'Tanggal', 'No. Transaksi', 'Nama Vendor', 'Keterangan', 'Status', 'Masuk (Paid)', 'Pending', 'Saldo Berjalan']],
            body: tableBody,
            foot: [['', '', '', '', '', 'TOTAL', `Rp ${totalMasuk.toLocaleString('id-ID')}`, `Rp ${totalPending.toLocaleString('id-ID')}`, `Rp ${runningBalance.toLocaleString('id-ID')}`]],
            theme: 'grid',
            headStyles: { fillColor: [153, 0, 0], fontStyle: 'bold', fontSize: 7, halign: 'center' },
            footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 7 },
            styles: { cellPadding: 2 },
            columnStyles: { 0: { cellWidth: 8 }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right', fontStyle: 'bold' } },
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, finalY);
        doc.text('Tanaka Management System', 196, finalY, { align: 'right' });

        doc.save(`Laporan_Koran_${bankLabel}_${lkFilters.startDate}_${lkFilters.endDate}.pdf`);
    };

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        cabang: 'Banua', nama_vendor: '', keterangan: '', deskripsi: '',
        satuan: 'pcs', qty: 1, harga_satuan: 0, nominal: 0,
        kategori: 'Penjualan', bank: 'BCA',
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        status: 'Pending', catatan: '', bukti_file: null
    });

    const exportExcel = () => {
        const rows = data.map((r, i) => ({
            No: i + 1,
            'No. Transaksi': r.transaksi_id,
            Tanggal: new Date(r.tanggal_transaksi).toLocaleDateString('id-ID'),
            Vendor: r.nama_vendor,
            Bank: r.bank,
            Nominal: r.total,
            Kategori: r.kategori || '-',
            Keterangan: r.keterangan,
            Status: r.status,
            Cabang: r.cabang,
        }));
        const header = Object.keys(rows[0] || {});
        const csv = [header.join(','), ...rows.map(r => header.map(h => `"${r[h] ?? ''}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `CashInBank_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    };

    const handleVoid = async () => {
        if (!voidItem) return;
        try {
            await updateCashInBank(voidItem.id, { ...voidItem, status: 'Void' });
            setVoidItem(null);
            fetchData();
        } catch { alert('Gagal void transaksi'); }
    };

    const COLORS = ['#990000', '#D32F2F', '#FFCDD2', '#B71C1C', '#FF8A80'];
    const STATUS_COLORS = { Paid: '#10B981', Unpaid: '#6B7280', Pending: '#F59E0B', Overdue: '#EF4444' };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listIn, listOut, summaryRes] = await Promise.all([
                getAllCashInBank({...filters}),
                getAllCashOut({...filters}),
                getCashInBankSummary()
            ]);
            const combined = [
                ...(listIn.data.data || []).map(d => ({...d, type: 'IN'})),
                ...(listOut.data.data || []).map(d => ({...d, type: 'OUT'}))
            ];
            combined.sort((a, b) => new Date(a.tanggal_transaksi) - new Date(b.tanggal_transaksi));
            setData(combined);
            
            // We can still use the summary from CashInBank for now, or just calculate it from combined
            const summary = summaryRes.data.summary;
            setSummary(summary);
            setCharts(summaryRes.data.charts);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                ...item,
                nominal: item.total || 0,
                kategori: item.kategori || 'Penjualan',
                tanggal_transaksi: new Date(item.tanggal_transaksi).toISOString().split('T')[0],
                due_date: new Date(item.due_date).toISOString().split('T')[0]
            });
        } else {
            setEditingId(null);
            setFormData({
                cabang: 'Banua', nama_vendor: '', keterangan: '', deskripsi: '',
                satuan: 'pcs', qty: 1, harga_satuan: 0, nominal: 0,
                kategori: 'Penjualan', bank: 'BCA',
                tanggal_transaksi: new Date().toISOString().split('T')[0],
                due_date: new Date().toISOString().split('T')[0],
                status: 'Pending', catatan: '', bukti_file: null
            });
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateCashInBank(editingId, formData);
            } else {
                await createCashInBank(formData);
            }
            setModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Error saving data", error);
            alert("Gagal menyimpan data.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
            try {
                await deleteCashInBank(id);
                fetchData();
            } catch (error) {
                console.error("Error deleting", error);
            }
        }
    };

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans relative">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari transaksi cash in..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-6">

          <NotificationBell />
                    <div className="relative">
                      <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
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

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Cash In Bank
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm font-medium">Sistem Pencatatan Uang Masuk Perusahaan</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowLaporanKoran(true)}
                            className="bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all text-sm">
                            <FileText size={16} /> Laporan Koran
                        </button>
                        <button onClick={exportExcel}
                            className="bg-green-50 border border-green-100 hover:bg-green-100 hover:border-green-200 text-green-700 px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all text-sm">
                            <Upload size={16} /> Export Excel
                        </button>
                        <button onClick={() => handleOpenModal()}
                            className="bg-[#990000] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all hover:scale-105 text-sm">
                            <Plus size={16} /> Tambah Cash In
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs text-gray-500 font-medium mb-1">Saldo Awal</p>
                            <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(summary.saldo_awal)}</h3>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-indigo-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs text-gray-500 font-medium mb-1">Cash In Hari Ini</p>
                            <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(summary.total_cash_in_today)}</h3>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-emerald-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs text-gray-500 font-medium mb-1">Total Paid</p>
                            <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(summary.total_paid)}</h3>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-amber-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs text-gray-500 font-medium mb-1">Total Pending</p>
                            <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(summary.total_pending)}</h3>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs text-gray-500 font-medium mb-1">Saldo Akhir</p>
                            <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(summary.saldo_akhir)}</h3>
                        </div>
                    </div>
                )}

                {/* Charts */}
                {charts && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-4">Trend Cash In per Bulan</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.monthly}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} tickFormatter={(v) => `Rp ${v/1000000}M`} />
                                        <RechartsTooltip formatter={(v) => formatRupiah(v)} />
                                        <Line type="monotone" dataKey="total" stroke="#990000" strokeWidth={3} dot={{r: 4, fill: '#990000'}} activeDot={{r: 6}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-4">Cash In per Bank</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.bank}>
                                        <XAxis dataKey="bank" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                        <RechartsTooltip formatter={(v) => formatRupiah(v)} cursor={{fill: '#f3f4f6'}} />
                                        <Bar dataKey="total" fill="#990000" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 mb-4">Paid vs Unpaid & Cabang</h3>
                            <div className="h-64 flex flex-col items-center">
                                <ResponsiveContainer width="100%" height="50%">
                                    <PieChart>
                                        <Pie data={charts.status} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} cx="50%" cy="50%">
                                            {charts.status.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(v) => formatRupiah(v)} />
                                        <Legend wrapperStyle={{fontSize: '10px'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                <ResponsiveContainer width="100%" height="50%">
                                    <PieChart>
                                        <Pie data={charts.cabang} dataKey="value" nameKey="name" innerRadius={25} outerRadius={40} cx="50%" cy="50%">
                                            {charts.cabang.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(v) => formatRupiah(v)} />
                                        <Legend wrapperStyle={{fontSize: '10px'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px] flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-[#990000] transition-colors">
                        <Search size={18} className="text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Cari Vendor / ID..." 
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]"
                        value={filters.bank} onChange={(e) => setFilters({...filters, bank: e.target.value})}
                    >
                        <option value="">Semua Bank</option>
                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]"
                        value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="">Semua Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Pending">Pending</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                    <select 
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]"
                        value={filters.cabang} onChange={(e) => setFilters({...filters, cabang: e.target.value})}
                    >
                        <option value="">Semua Cabang</option>
                        <option value="Banua">PT Banua Mitra Lestari</option>
                        <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                        <option value="Acestreet">Acestreet</option>
                    </select>
                    <input type="date" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
                    <span className="text-gray-400">-</span>
                    <input type="date" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
                </div>

                {/* Rekening Koran — Bank Statement Style */}
                {(() => {
                    let runningBal = 0;
                    const sortedData = [...data].sort((a, b) => new Date(a.tanggal_transaksi) - new Date(b.tanggal_transaksi));
                    const totalMasuk = sortedData.filter(r => r.status === 'Paid' && r.type === 'IN').reduce((s, r) => s + parseFloat(r.total || 0), 0);
const totalKeluar = sortedData.filter(r => r.status === 'Paid' && r.type === 'OUT').reduce((s, r) => s + parseFloat(r.total || 0), 0);
                    const totalPending = sortedData.filter(r => r.status !== 'Paid').reduce((s, r) => s + parseFloat(r.total || 0), 0);
                    return (
                        <div className="space-y-4">
                            {/* Rekening Koran Header Card */}
                            <div className="bg-gradient-to-br from-[#990000] to-red-800 rounded-2xl p-6 text-white shadow-lg">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <p className="text-red-200 text-xs font-semibold uppercase tracking-widest">Laporan Rekening Koran</p>
                                        <h2 className="text-xl font-black mt-1">Cash In Bank</h2>
                                        <p className="text-red-200 text-sm mt-0.5">PT Tanaka Rizqi Barokah · {filters.bank || 'Semua Bank'}</p>
                                    </div>
                                    <div className="text-right text-xs text-red-200">
                                        <p>Periode filter aktif</p>
                                        <p className="font-bold text-white text-sm mt-0.5">
                                            {filters.startDate || '—'} s/d {filters.endDate || '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
                                    <div>
                                        <p className="text-red-200 text-xs">Total Masuk (Paid)</p>
                                        <p className="text-lg font-black">{formatRupiah(totalMasuk)}</p>
                                    </div>
                                    <div>
                                        <p className="text-red-200 text-xs">Total Keluar (Paid)</p>
                                        <p className="text-lg font-black">{formatRupiah(totalKeluar)}</p>
                                    </div>
                                    <div>
                                        <p className="text-red-200 text-xs">Belum Terbayar</p>
                                        <p className="text-lg font-black">{formatRupiah(totalPending)}</p>
                                    </div>
                                    <div>
                                        <p className="text-red-200 text-xs">Total Entri</p>
                                        <p className="text-lg font-black">{sortedData.length} transaksi</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rekening Koran Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                                                <th className="py-3.5 px-4">No</th>
                                                <th className="py-3.5 px-4">Tanggal</th>
                                                <th className="py-3.5 px-4">No. Transaksi</th>
                                                <th className="py-3.5 px-4">Vendor / Klien</th>
                                                <th className="py-3.5 px-4">Keterangan</th>
                                                <th className="py-3.5 px-4 text-center">Bank</th>
                                                <th className="py-3.5 px-4 text-center">Status</th>
                                                <th className="py-3.5 px-4 text-right text-green-300">Masuk (Paid)</th>
<th className="py-3.5 px-4 text-right text-red-300">Keluar (Paid)</th>
<th className="py-3.5 px-4 text-right text-yellow-300">Pending</th>
                                                <th className="py-3.5 px-4 text-right font-black text-blue-300">Saldo Berjalan</th>
                                                <th className="py-3.5 px-4 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="11" className="text-center py-10"><div className="animate-spin h-8 w-8 border-4 border-[#990000] border-t-transparent rounded-full mx-auto"></div></td></tr>
                                            ) : sortedData.length === 0 ? (
                                                <tr><td colSpan="11" className="text-center py-12 text-gray-400">
                                                    <FileText size={36} className="mx-auto mb-2 opacity-20"/>
                                                    Tidak ada data transaksi.
                                                </td></tr>
                                            ) : (
                                                sortedData.map((item, idx) => {
                                                    const masuk = (item.status === 'Paid' && item.type === 'IN') ? parseFloat(item.total || 0) : 0;
const keluar = (item.status === 'Paid' && item.type === 'OUT') ? parseFloat(item.total || 0) : 0;
const pending = item.status !== 'Paid' ? parseFloat(item.total || 0) : 0;
runningBal += masuk - keluar;
                                                    return (
                                                        <tr key={item.id} className={`border-b border-gray-50 group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-red-50/30`}>
                                                            <td className="py-3 px-4 text-gray-400 text-xs font-medium">{idx + 1}</td>
                                                            <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{new Date(item.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                                                            <td className="py-3 px-4 font-semibold text-[#990000] text-xs">{item.transaksi_id}</td>
                                                            <td className="py-3 px-4 text-gray-800 font-semibold">{item.nama_vendor}<br/><span className="text-xs text-gray-400 font-normal">{item.cabang}</span></td>
                                                            <td className="py-3 px-4 text-gray-500 max-w-[180px] truncate" title={item.keterangan}>{item.keterangan}</td>
                                                            <td className="py-3 px-4 text-center"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-semibold">{item.bank}</span></td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                                    item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                                    item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    item.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>{item.status}</span>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-semibold text-green-700">
    {masuk > 0 ? formatRupiah(masuk) : <span className="text-gray-200">—</span>}
</td>
<td className="py-3 px-4 text-right font-semibold text-red-700">
    {keluar > 0 ? formatRupiah(keluar) : <span className="text-gray-200">—</span>}
</td>
<td className="py-3 px-4 text-right font-semibold text-yellow-600">
    {pending > 0 ? formatRupiah(pending) : <span className="text-gray-200">—</span>}
</td>
                                                            <td className="py-3 px-4 text-right font-black text-gray-900 bg-blue-50/50">
                                                                {formatRupiah(runningBal)}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <button onClick={() => setDetailItem(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Detail"><Eye size={14}/></button>
                                                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors" title="Edit"><Edit size={14}/></button>
                                                                    {item.status !== 'Void' && <button onClick={() => setVoidItem(item)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Void"><Ban size={14}/></button>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                        {sortedData.length > 0 && (
                                            <tfoot>
                                                <tr className="bg-[#990000] text-white font-bold text-sm">
                                                    <td colSpan={7} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">Total</td>
                                                    <td className="py-3.5 px-4 text-right">{formatRupiah(totalMasuk)}</td>
                                                    <td className="py-3.5 px-4 text-right">{formatRupiah(totalKeluar)}</td>
                                                    <td className="py-3.5 px-4 text-right">{formatRupiah(totalPending)}</td>
                                                    <td className="py-3.5 px-4 text-right font-black">{formatRupiah(runningBal)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()}
                </div>
                </div>
            </main>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Edit Transaksi' : 'Tambah Cash In Baru'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto px-1">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Transaksi</label>
                                    <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.tanggal_transaksi} onChange={e => setFormData({...formData, tanggal_transaksi: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">No. Ref (Auto)</label>
                                    <input type="text" disabled placeholder="CIB-xxxxxxxxxxxx" className="w-full px-4 py-2 border border-gray-100 rounded-xl bg-gray-50 text-gray-400 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Vendor / Klien</label>
                                    <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.nama_vendor} onChange={e => setFormData({...formData, nama_vendor: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cabang</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.cabang} onChange={e => setFormData({...formData, cabang: e.target.value})}>
                                        <option value="Banua">PT Banua Mitra Lestari</option>
                                        <option value="Tanaka">PT Tanaka Rizqi Barokah</option>
                                        <option value="Acestreet">Acestreet</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Bank</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})}>
                                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal (Rp)</label>
                                    <input required type="number" min="0" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.nominal} onChange={e => setFormData({...formData, nominal: e.target.value, harga_satuan: e.target.value, qty: 1})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})}>
                                        <option>Penjualan</option><option>Down Payment</option><option>Pelunasan</option>
                                        <option>Transfer Masuk</option><option>Pendapatan Lain</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option>Paid</option><option>Unpaid</option><option>Pending</option><option>Overdue</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Upload Bukti Transaksi</label>
                                    <input type="file" accept="image/*,application/pdf" className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-red-50 file:text-[#990000] file:font-semibold" onChange={e => setFormData({...formData, bukti_file: e.target.files[0]})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                                    <input type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} />
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="text-gray-500">
                                    Total Estimasi: <span className="text-[#990000] font-bold text-lg">{formatRupiah(Number(formData.qty) * Number(formData.harga_satuan))}</span>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" className="px-6 py-2.5 bg-[#990000] hover:bg-red-800 text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all hover:scale-105">
                                        Simpan Transaksi
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== MODAL LAPORAN KORAN ===== */}
            {showLaporanKoran && (() => {
                const lkData = getLaporanKoranData();
                let runningBal = 0;
                const totalMasuk = lkData.filter(r => r.status === 'Paid').reduce((s, r) => s + parseFloat(r.total || 0), 0);
                const totalPending = lkData.filter(r => r.status !== 'Paid').reduce((s, r) => s + parseFloat(r.total || 0), 0);
                return (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-[#990000] flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FileText size={20} /> Laporan Koran — Cash In Bank
                                    </h2>
                                    <p className="text-red-200 text-xs mt-0.5">Rekening Koran Perusahaan · Tanaka Management System</p>
                                </div>
                                <button onClick={() => setShowLaporanKoran(false)} className="text-white/70 hover:text-white transition-colors">
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Filter Bar */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bank</label>
                                    <select
                                        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]"
                                        value={lkFilters.bank}
                                        onChange={e => setLkFilters({...lkFilters, bank: e.target.value})}
                                    >
                                        <option value="">Semua Bank</option>
                                        {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dari Tanggal</label>
                                    <input type="date" className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]"
                                        value={lkFilters.startDate} onChange={e => setLkFilters({...lkFilters, startDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sampai Tanggal</label>
                                    <input type="date" className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]"
                                        value={lkFilters.endDate} onChange={e => setLkFilters({...lkFilters, endDate: e.target.value})} />
                                </div>
                                <div className="ml-auto flex gap-3">
                                    <button
                                        onClick={downloadLaporanKoran}
                                        className="flex items-center gap-2 bg-[#990000] hover:bg-red-800 text-white px-5 py-2 rounded-xl font-semibold text-sm transition-all shadow-md"
                                    >
                                        <Upload size={16} /> Download PDF
                                    </button>
                                </div>
                            </div>

                            {/* Statement Preview */}
                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                {/* Bank Statement Header */}
                                <div className="bg-gradient-to-br from-[#990000] to-red-800 rounded-2xl p-6 text-white mb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-red-200 text-xs font-semibold uppercase tracking-wider">Rekening Koran</p>
                                            <h3 className="text-2xl font-black mt-1">PT Tanaka Rizqi Barokah</h3>
                                            <p className="text-red-200 text-sm mt-1">Bank: {lkFilters.bank || 'Semua Bank'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-red-200 text-xs">Periode</p>
                                            <p className="text-sm font-bold">
                                                {new Date(lkFilters.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {' '}&mdash;{' '}
                                                {new Date(lkFilters.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Summary strip */}
                                    <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/20">
                                        <div>
                                            <p className="text-red-200 text-xs">Total Masuk (Paid)</p>
                                            <p className="text-xl font-black">{formatRupiah(totalMasuk)}</p>
                                        </div>
                                        <div>
                                            <p className="text-red-200 text-xs">Total Keluar (Paid)</p>
                                            <p className="text-xl font-black">{formatRupiah(totalKeluar)}</p>
                                        </div>
                                        <div>
                                            <p className="text-red-200 text-xs">Belum Terbayar</p>
                                            <p className="text-xl font-black">{formatRupiah(totalPending)}</p>
                                        </div>
                                        <div>
                                            <p className="text-red-200 text-xs">Total Transaksi</p>
                                            <p className="text-xl font-black">{lkData.length} entri</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Statement Table */}
                                {lkData.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <FileText size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>Tidak ada transaksi pada periode ini.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-gray-900 text-white text-xs uppercase tracking-wider">
                                                    <th className="py-3 px-3 text-left">No</th>
                                                    <th className="py-3 px-3 text-left">Tanggal</th>
                                                    <th className="py-3 px-3 text-left">No. Transaksi</th>
                                                    <th className="py-3 px-3 text-left">Vendor</th>
                                                    <th className="py-3 px-3 text-left">Keterangan</th>
                                                    <th className="py-3 px-3 text-center">Bank</th>
                                                    <th className="py-3 px-3 text-center">Status</th>
                                                    <th className="py-3 px-3 text-right">Masuk (Paid)</th>
                                                    <th className="py-3 px-3 text-right">Keluar (Paid)</th>
                                                    <th className="py-3 px-3 text-right">Pending</th>
                                                    <th className="py-3 px-3 text-right font-bold">Saldo Berjalan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lkData.map((r, idx) => {
                                                    const masuk = r.status === 'Paid' ? parseFloat(r.total || 0) : 0;
                                                    const pending = r.status !== 'Paid' ? parseFloat(r.total || 0) : 0;
                                                    runningBal += masuk;
                                                    return (
                                                        <tr key={r.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-red-50/20 transition-colors`}>
                                                            <td className="py-2.5 px-3 text-gray-400 text-xs">{idx + 1}</td>
                                                            <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{new Date(r.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                                                            <td className="py-2.5 px-3 text-[#990000] font-medium text-xs">{r.transaksi_id}</td>
                                                            <td className="py-2.5 px-3 text-gray-800 font-semibold">{r.nama_vendor}<br/><span className="text-xs text-gray-400 font-normal">{r.cabang}</span></td>
                                                            <td className="py-2.5 px-3 text-gray-600 max-w-[140px] truncate" title={r.keterangan}>{r.keterangan}</td>
                                                            <td className="py-2.5 px-3 text-center"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">{r.bank}</span></td>
                                                            <td className="py-2.5 px-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                                    r.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                                    r.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    r.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>{r.status}</span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right text-green-700 font-semibold">{masuk > 0 ? formatRupiah(masuk) : <span className="text-gray-300">—</span>}</td>
                                                            <td className="py-2.5 px-3 text-right text-red-700 font-semibold">{keluar > 0 ? formatRupiah(keluar) : <span className="text-gray-300">—</span>}</td>
                                                            <td className="py-2.5 px-3 text-right text-yellow-700 font-semibold">{pending > 0 ? formatRupiah(pending) : <span className="text-gray-300">—</span>}</td>
                                                            <td className="py-2.5 px-3 text-right font-black text-gray-900">{formatRupiah(runningBal)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-[#990000] text-white font-bold text-sm">
                                                    <td colSpan={7} className="py-3 px-3 text-right">TOTAL</td>
                                                    <td className="py-3 px-3 text-right">{formatRupiah(totalMasuk)}</td>
                                                    <td className="py-3 px-3 text-right">{formatRupiah(totalKeluar)}</td>
                                                    <td className="py-3 px-3 text-right">{formatRupiah(totalPending)}</td>
                                                    <td className="py-3 px-3 text-right">{formatRupiah(runningBal)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-400">
                                <span>Tanaka Management System · Cash In Bank</span>
                                <button onClick={() => setShowLaporanKoran(false)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors">Tutup</button>
                            </div>
                        </div>
                    </div>
                );
            })()}
            {/* ===== MODAL DETAIL ===== */}
            {detailItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 bg-[#990000] flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-white">Detail Transaksi</h2>
                                <p className="text-red-200 text-xs">{detailItem.transaksi_id}</p>
                            </div>
                            <button onClick={() => setDetailItem(null)} className="text-white/70 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-3 text-sm">
                            {[
                                ['Tanggal', new Date(detailItem.tanggal_transaksi).toLocaleDateString('id-ID')],
                                ['Vendor / Klien', detailItem.nama_vendor],
                                ['Cabang', detailItem.cabang],
                                ['Bank', detailItem.bank],
                                ['Nominal', formatRupiah(detailItem.total)],
                                ['Kategori', detailItem.kategori || '-'],
                                ['Keterangan', detailItem.keterangan],
                                ['Status', detailItem.status],
                                ['Due Date', new Date(detailItem.due_date).toLocaleDateString('id-ID')],
                                ['Catatan', detailItem.catatan || '-'],
                            ].map(([label, val]) => (
                                <div key={label} className="flex gap-3 py-2 border-b border-gray-50">
                                    <span className="w-36 text-gray-400 font-semibold shrink-0">{label}</span>
                                    <span className="font-bold text-gray-800">{val}</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end">
                            <button onClick={() => setDetailItem(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm">Tutup</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL VOID CONFIRM ===== */}
            {voidItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Ban size={28} className="text-red-600"/>
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-2">Void Transaksi?</h3>
                        <p className="text-sm text-gray-500 mb-1">{voidItem.transaksi_id}</p>
                        <p className="text-sm text-gray-500 mb-6">{voidItem.nama_vendor} · {formatRupiah(voidItem.total)}</p>
                        <p className="text-xs text-red-500 bg-red-50 rounded-xl p-3 mb-6">Transaksi ini akan ditandai sebagai <strong>Void</strong> dan tidak masuk ke saldo.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setVoidItem(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Batal</button>
                            <button onClick={handleVoid} className="flex-1 py-2.5 bg-[#990000] text-white rounded-xl font-bold hover:bg-red-800">Void</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CashBank;
