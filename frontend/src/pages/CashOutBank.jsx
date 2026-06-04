import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAllCashOutBank, getCashOutBankSummary, createCashOutBank, updateCashOutBank, deleteCashOutBank } from '../api/cashOutBankApi';
import { Plus, Search, Edit, Trash2, TrendingDown, Clock, UserCircle, X, Download, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const COLORS = ['#990000', '#D32F2F', '#EF5350', '#B71C1C', '#FF8A80'];
const STATUS_COLORS = { Paid: '#10B981', Pending: '#F59E0B', Overdue: '#EF4444', Void: '#9CA3AF' };
const BANKS = [
    'BCA Tanaka', 'BRI Tanaka', 'Mandiri Tanaka', 'BNI Tanaka', 'Cash Tanaka',
    'BCA Banua', 'BRI Banua', 'Mandiri Banua', 'BNI Banua', 'Cash Banua',
    'BCA Acestreet', 'BRI Acestreet', 'Mandiri Acestreet', 'BNI Acestreet', 'Cash Acestreet'
];
const CABANG = ['Banua', 'Tanaka', 'Acestreet'];
const KATEGORI = ['Pembayaran Supplier', 'Biaya Operasional', 'Gaji', 'Pajak', 'Lainnya'];

const defaultForm = {
    cabang: 'Banua', nama_vendor: '', keterangan: '', kategori: 'Pembayaran Supplier',
    satuan: 'pcs', qty: 1, harga_satuan: 0, bank: 'BCA',
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0], status: 'Pending', catatan: ''
};

const CashOutBank = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [filters, setFilters] = useState({ search: '', bank: '', status: '', cabang: '', startDate: '', endDate: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([getAllCashOutBank(filters), getCashOutBankSummary()]);
            setData(listRes.data.data || []);
            setSummary(summaryRes.data.summary);
            setCharts(summaryRes.data.charts);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filters]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({ ...item, tanggal_transaksi: new Date(item.tanggal_transaksi).toISOString().split('T')[0], due_date: item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '' });
        } else {
            setEditingId(null);
            setFormData(defaultForm);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) await updateCashOutBank(editingId, formData);
            else await createCashOutBank(formData);
            setModalOpen(false);
            fetchData();
        } catch (e) { alert(e.response?.data?.error || 'Gagal menyimpan'); }
    };

    const handleVoid = async (id) => {
        if (window.confirm('Void transaksi ini? Data tidak akan dihapus.')) {
            await deleteCashOutBank(id);
            fetchData();
        }
    };

    const total = (parseFloat(formData.qty) || 1) * (parseFloat(formData.harga_satuan) || 0);
    const user = JSON.parse(localStorage.getItem('user')) || {};

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                {/* Topbar */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 mb-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari vendor, ID transaksi..." value={filters.search}
                            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                            className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                                <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
                            </div>
                            {showProfile && (
                                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
                                    <div className="p-4 bg-red-50/50">
                                        <p className="text-sm font-black text-gray-900">{user.nama || 'Admin'}</p>
                                        <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{user.role || 'Finance'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Cash Out <span className="text-[#990000]">Bank</span></h1>
                                <p className="text-gray-500 font-medium mt-1">Pencatatan pengeluaran & pembayaran perusahaan</p>
                            </div>
                            <button onClick={() => handleOpenModal()}
                                className="bg-[#990000] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all hover:scale-105">
                                <Plus size={18} /> Tambah Cash Out
                            </button>
                        </div>

                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Transaksi Hari Ini', val: summary.total_today, bg: 'bg-red-50 border-red-100', text: 'text-red-800', val_text: 'text-red-900' },
                                    { label: 'Total Pending', val: summary.total_pending, bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', val_text: 'text-amber-900' },
                                    { label: 'Total Paid', val: summary.total_paid, bg: 'bg-green-50 border-green-100', text: 'text-green-700', val_text: 'text-green-900' },
                                    { label: 'Total Overdue', val: summary.total_overdue, bg: 'bg-red-500', text: 'text-white', val_text: 'text-white' },
                                ].map((c, i) => (
                                    <div key={i} className={`${c.bg} p-5 rounded-2xl shadow-sm border flex flex-col gap-1 hover:shadow-md transition-all`}>
                                        <p className={`text-xs font-bold ${c.text} uppercase tracking-wide`}>{c.label}</p>
                                        <h3 className={`text-sm md:text-base font-black ${c.val_text} break-words`}>{fmt(c.val)}</h3>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Charts */}
                        {charts && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Trend Cash Out per Bulan</h3>
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={charts.trend}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} />
                                                <Tooltip formatter={v => fmt(v)} />
                                                <Line type="monotone" dataKey="total" stroke="#990000" strokeWidth={2} dot={{ fill: '#990000', r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Per Bank</h3>
                                    <div className="h-52">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={charts.byBank}>
                                                <XAxis dataKey="bank" tick={{ fontSize: 11 }} />
                                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} />
                                                <Tooltip formatter={v => fmt(v)} />
                                                <Bar dataKey="total" fill="#990000" radius={[4,4,0,0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                            {[
                                { key: 'bank', placeholder: 'Filter Bank', opts: BANKS },
                                { key: 'status', placeholder: 'Filter Status', opts: ['Paid','Pending','Overdue','Void'] },
                                { key: 'cabang', placeholder: 'Filter Cabang', opts: CABANG },
                            ].map(f => (
                                <select key={f.key} value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    <option value="">{f.placeholder}</option>
                                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ))}
                            <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            <input type="date" value={filters.endDate} onChange={e => setFilters(p => ({ ...p, endDate: e.target.value }))}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-900 text-white text-xs uppercase tracking-wider">
                                            <th className="px-5 py-3.5">No. Ref</th>
                                            <th className="px-5 py-3.5">Tanggal</th>
                                            <th className="px-5 py-3.5">Vendor</th>
                                            <th className="px-5 py-3.5">Kategori</th>
                                            <th className="px-5 py-3.5">Bank</th>
                                            <th className="px-5 py-3.5 text-right">Nominal</th>
                                            <th className="px-5 py-3.5">Status</th>
                                            <th className="px-5 py-3.5">Cabang</th>
                                            <th className="px-5 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
                                        ) : data.length === 0 ? (
                                            <tr><td colSpan={9} className="text-center py-12 text-gray-400">Tidak ada data transaksi</td></tr>
                                        ) : data.map((row, i) => (
                                            <tr key={row.id} className={`hover:bg-red-50/30 transition-colors ${row.status === 'Void' ? 'opacity-50' : ''}`}>
                                                <td className="px-5 py-3 font-mono text-xs text-[#990000] font-semibold">{row.transaksi_id}</td>
                                                <td className="px-5 py-3 text-sm text-gray-700">{new Date(row.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                                                <td className="px-5 py-3 text-sm font-medium text-gray-900">{row.nama_vendor}</td>
                                                <td className="px-5 py-3 text-xs text-gray-600">{row.kategori}</td>
                                                <td className="px-5 py-3 text-sm text-gray-700">{row.bank}</td>
                                                <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{fmt(row.total)}</td>
                                                <td className="px-5 py-3">
                                                    <span style={{ backgroundColor: STATUS_COLORS[row.status] + '22', color: STATUS_COLORS[row.status] }}
                                                        className="px-2.5 py-1 rounded-full text-xs font-bold">{row.status}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{row.cabang}</span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex justify-center gap-1">
                                                        {row.status !== 'Void' && <>
                                                            <button onClick={() => handleOpenModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={14} /></button>
                                                            <button onClick={() => handleVoid(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                        </>}
                                                        {row.status === 'Void' && <span className="text-xs text-gray-400 italic">Voided</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="bg-[#990000] px-6 py-4 flex justify-between items-center">
                            <h2 className="text-white font-black text-lg">{editingId ? 'Edit Transaksi' : 'Tambah Cash Out Bank'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white"><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal</label>
                                <input type="date" required value={formData.tanggal_transaksi} onChange={e => setFormData(p => ({ ...p, tanggal_transaksi: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Jatuh Tempo</label>
                                <input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Vendor / Penerima</label>
                                <input type="text" required placeholder="Nama vendor..." value={formData.nama_vendor} onChange={e => setFormData(p => ({ ...p, nama_vendor: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Cabang</label>
                                <select value={formData.cabang} onChange={e => setFormData(p => ({ ...p, cabang: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {CABANG.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Bank</label>
                                <select value={formData.bank} onChange={e => setFormData(p => ({ ...p, bank: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                                <select value={formData.kategori} onChange={e => setFormData(p => ({ ...p, kategori: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {['Pending','Paid','Overdue'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Satuan</label>
                                <input type="text" value={formData.satuan} onChange={e => setFormData(p => ({ ...p, satuan: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                                <input type="number" min={1} value={formData.qty} onChange={e => setFormData(p => ({ ...p, qty: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Satuan</label>
                                <input type="number" min={0} value={formData.harga_satuan} onChange={e => setFormData(p => ({ ...p, harga_satuan: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div className="col-span-2 bg-red-50 p-3 rounded-xl">
                                <p className="text-xs text-red-700 font-semibold">Total: <span className="text-red-900 font-black text-base ml-2">{fmt(total)}</span></p>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan</label>
                                <textarea rows={2} value={formData.keterangan} onChange={e => setFormData(p => ({ ...p, keterangan: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-[#990000] hover:bg-red-800 text-white rounded-xl font-semibold shadow transition-colors">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashOutBank;
