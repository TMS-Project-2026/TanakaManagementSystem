import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { 
    getAllCashInBank, getCashInBankSummary, createCashInBank, 
    updateCashInBank, deleteCashInBank 
} from '../api/cashInBankApi';
import { 
    Plus, Search, Filter, Edit, Trash2, Wallet, 
    TrendingUp, Activity, DollarSign, Clock 
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend 
} from 'recharts';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const CashInBank = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: '', bank: '', status: '', cabang: '', startDate: '', endDate: ''
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        cabang: 'Banua', nama_vendor: '', keterangan: '', deskripsi: '', 
        satuan: 'pcs', qty: 1, harga_satuan: 0, bank: 'BCA', 
        tanggal_transaksi: new Date().toISOString().split('T')[0], 
        due_date: new Date().toISOString().split('T')[0], 
        status: 'Pending', catatan: ''
    });

    const COLORS = ['#990000', '#D32F2F', '#FFCDD2', '#B71C1C', '#FF8A80'];
    const STATUS_COLORS = { Paid: '#10B981', Unpaid: '#6B7280', Pending: '#F59E0B', Overdue: '#EF4444' };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([
                getAllCashInBank(filters),
                getCashInBankSummary()
            ]);
            setData(listRes.data.data);
            setSummary(summaryRes.data.summary);
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
                tanggal_transaksi: new Date(item.tanggal_transaksi).toISOString().split('T')[0],
                due_date: new Date(item.due_date).toISOString().split('T')[0]
            });
        } else {
            setEditingId(null);
            setFormData({
                cabang: 'Banua', nama_vendor: '', keterangan: '', deskripsi: '', 
                satuan: 'pcs', qty: 1, harga_satuan: 0, bank: 'BCA', 
                tanggal_transaksi: new Date().toISOString().split('T')[0], 
                due_date: new Date().toISOString().split('T')[0], 
                status: 'Pending', catatan: ''
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
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen ml-64">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cash In Bank</h1>
                        <p className="text-gray-500 mt-1">Sistem Pencatatan Uang Masuk Perusahaan</p>
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="bg-[#990000] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all hover:scale-105"
                    >
                        <Plus size={18} /> Tambah Cash In
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative">
                                <p className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-2"><Wallet size={16} className="text-blue-500"/> Saldo Awal</p>
                                <h3 className="text-2xl font-bold text-gray-800">{formatRupiah(summary.saldo_awal)}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative">
                                <p className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-green-500"/> Cash In Hari Ini</p>
                                <h3 className="text-2xl font-bold text-gray-800">{formatRupiah(summary.total_cash_in_today)}</h3>
                            </div>
                        </div>
                        <div className="bg-[#990000] p-6 rounded-2xl shadow-md border border-red-800 relative overflow-hidden group hover:shadow-lg transition-all text-white">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-800 rounded-full group-hover:scale-150 transition-all duration-500 opacity-50"></div>
                            <div className="relative">
                                <p className="text-sm font-medium mb-1 flex items-center gap-2"><Activity size={16} /> Saldo Akhir</p>
                                <h3 className="text-2xl font-bold">{formatRupiah(summary.saldo_akhir)}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative">
                                <p className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-2"><Clock size={16} className="text-yellow-500"/> Total Pending</p>
                                <h3 className="text-2xl font-bold text-gray-800">{formatRupiah(summary.total_pending)}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                            <div className="relative">
                                <p className="text-sm font-semibold text-gray-500 mb-1 flex items-center gap-2"><DollarSign size={16} className="text-emerald-500"/> Total Paid</p>
                                <h3 className="text-2xl font-bold text-gray-800">{formatRupiah(summary.total_paid)}</h3>
                            </div>
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
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-64 focus-within:border-[#990000] focus-within:ring-1 focus-within:ring-[#990000] transition-all">
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
                        <option value="BRI">BRI</option>
                        <option value="BCA">BCA</option>
                        <option value="BNI">BNI</option>
                        <option value="Mandiri">Mandiri</option>
                        <option value="Cash">Cash</option>
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
                        <option value="Banua">Banua</option>
                        <option value="Tanaka">Tanaka</option>
                        <option value="Acestreet">Acestreet</option>
                    </select>
                    <input type="date" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
                    <span className="text-gray-400">-</span>
                    <input type="date" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#990000]" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
                                    <th className="py-4 px-4 font-semibold">Transaksi ID</th>
                                    <th className="py-4 px-4 font-semibold">Tanggal</th>
                                    <th className="py-4 px-4 font-semibold">Vendor/Klien</th>
                                    <th className="py-4 px-4 font-semibold">Keterangan</th>
                                    <th className="py-4 px-4 font-semibold text-right">Qty</th>
                                    <th className="py-4 px-4 font-semibold text-right">Total</th>
                                    <th className="py-4 px-4 font-semibold text-center">Bank</th>
                                    <th className="py-4 px-4 font-semibold text-center">Due Date</th>
                                    <th className="py-4 px-4 font-semibold text-center">Status</th>
                                    <th className="py-4 px-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="10" className="text-center py-10"><div className="animate-spin h-8 w-8 border-4 border-[#990000] border-t-transparent rounded-full mx-auto"></div></td></tr>
                                ) : data.length === 0 ? (
                                    <tr><td colSpan="10" className="text-center py-10 text-gray-400">Tidak ada data transaksi.</td></tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors group">
                                            <td className="py-3 px-4 font-medium text-[#990000]">{item.transaksi_id}</td>
                                            <td className="py-3 px-4 text-gray-600">{new Date(item.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                                            <td className="py-3 px-4 text-gray-800 font-semibold">{item.nama_vendor}<br/><span className="text-xs text-gray-400 font-normal">{item.cabang}</span></td>
                                            <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate" title={item.keterangan}>{item.keterangan}</td>
                                            <td className="py-3 px-4 text-gray-600 text-right">{item.qty} <span className="text-xs">{item.satuan}</span></td>
                                            <td className="py-3 px-4 text-gray-900 font-bold text-right">{formatRupiah(item.total)}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-semibold">{item.bank}</span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 text-center">{new Date(item.due_date).toLocaleDateString('id-ID')}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    item.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenModal(item)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={16}/></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[60vh] overflow-y-auto px-2">
                                
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Vendor / Klien</label>
                                    <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.nama_vendor} onChange={e => setFormData({...formData, nama_vendor: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cabang</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.cabang} onChange={e => setFormData({...formData, cabang: e.target.value})}>
                                        <option value="Banua">Banua</option>
                                        <option value="Tanaka">Tanaka</option>
                                        <option value="Acestreet">Acestreet</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan</label>
                                    <input required type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.keterangan} onChange={e => setFormData({...formData, keterangan: e.target.value})} />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Deskripsi Lengkap</label>
                                    <textarea className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" rows="2" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})}></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Satuan</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.satuan} onChange={e => setFormData({...formData, satuan: e.target.value})}>
                                        <option value="pcs">pcs</option>
                                        <option value="day">day</option>
                                        <option value="pckg">pckg</option>
                                    </select>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-1/3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                                        <input required type="number" min="1" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} />
                                    </div>
                                    <div className="w-2/3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Satuan</label>
                                        <input required type="number" min="0" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.harga_satuan} onChange={e => setFormData({...formData, harga_satuan: e.target.value})} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Masuk</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})}>
                                        <option value="BCA">BCA</option>
                                        <option value="BRI">BRI</option>
                                        <option value="BNI">BNI</option>
                                        <option value="Mandiri">Mandiri</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                    <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Transaksi</label>
                                    <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.tanggal_transaksi} onChange={e => setFormData({...formData, tanggal_transaksi: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                                    <input required type="date" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Catatan Tambahan</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none transition-all" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} />
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

        </div>
    );
};

export default CashInBank;
