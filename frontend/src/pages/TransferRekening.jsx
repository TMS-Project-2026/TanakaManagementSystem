import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAllTransfer, getTransferSummary, createTransfer, updateTransfer, deleteTransfer } from '../api/transferApi';
import { Plus, Search, Edit, Trash2, ArrowRightLeft, UserCircle, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
const STATUS_COLORS = { Completed: '#10B981', Pending: '#F59E0B', Void: '#9CA3AF' };
const BANKS = ['BCA', 'BRI', 'Mandiri', 'BNI'];
const CABANG = ['Banua', 'Tanaka', 'Acestreet'];

const defaultForm = {
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    dari_bank: 'BCA', ke_bank: 'BRI', dari_cabang: 'Banua', ke_cabang: 'Tanaka',
    nominal: 0, biaya_transfer: 0, keterangan: '', status: 'Pending', catatan: ''
};

const TransferRekening = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [filters, setFilters] = useState({ search: '', status: '', dari_cabang: '', ke_cabang: '', startDate: '', endDate: '' });
    const [sameError, setSameError] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [listRes, summaryRes] = await Promise.all([getAllTransfer(filters), getTransferSummary()]);
            setData(listRes.data.data || []);
            setSummary(summaryRes.data.summary);
            setCharts(summaryRes.data.charts);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [filters]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({ ...item, tanggal_transaksi: new Date(item.tanggal_transaksi).toISOString().split('T')[0] });
        } else {
            setEditingId(null);
            setFormData(defaultForm);
        }
        setSameError(false);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.dari_bank === formData.ke_bank && formData.dari_cabang === formData.ke_cabang) {
            setSameError(true);
            return;
        }
        try {
            if (editingId) await updateTransfer(editingId, formData);
            else await createTransfer(formData);
            setModalOpen(false);
            fetchData();
        } catch (e) { alert(e.response?.data?.error || 'Gagal menyimpan'); }
    };

    const handleVoid = async (id) => {
        if (window.confirm('Void transfer ini?')) { await deleteTransfer(id); fetchData(); }
    };

    const user = JSON.parse(localStorage.getItem('user')) || {};

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 mb-4">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari ID / keterangan..." value={filters.search}
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
                                        <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider">{user.role || 'Finance'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-black text-gray-900">Transfer <span className="text-[#990000]">Rekening</span></h1>
                                <p className="text-gray-500 font-medium mt-1">Pencatatan transfer antar rekening & cabang</p>
                            </div>
                            <button onClick={() => handleOpenModal()}
                                className="bg-[#990000] hover:bg-red-800 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all hover:scale-105">
                                <Plus size={18} /> Tambah Transfer
                            </button>
                        </div>

                        {/* Summary Cards */}
                        {summary && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Transfer Hari Ini', val: summary.total_today, bg: 'bg-red-50 border border-red-100', tc: 'text-red-800', vc: 'text-red-900' },
                                    { label: 'Total Pending', val: summary.total_pending, bg: 'bg-amber-50 border border-amber-100', tc: 'text-amber-700', vc: 'text-amber-900' },
                                    { label: 'Total Completed', val: summary.total_completed, bg: 'bg-green-50 border border-green-100', tc: 'text-green-700', vc: 'text-green-900' },
                                    { label: 'Total Biaya Transfer', val: summary.total_biaya, bg: 'bg-[#990000]', tc: 'text-white', vc: 'text-white' },
                                ].map((c, i) => (
                                    <div key={i} className={`${c.bg} p-5 rounded-2xl shadow-sm flex flex-col gap-1 hover:shadow-md transition-all`}>
                                        <p className={`text-xs font-bold ${c.tc} uppercase tracking-wide`}>{c.label}</p>
                                        <h3 className={`text-sm font-black ${c.vc} break-words`}>{fmt(c.val)}</h3>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Charts */}
                        {charts && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Trend Transfer per Bulan</h3>
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
                                    <h3 className="text-sm font-bold text-gray-700 mb-4">Per Bank Sumber</h3>
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            {[
                                { key: 'status', placeholder: 'Filter Status', opts: ['Completed','Pending','Void'] },
                                { key: 'dari_cabang', placeholder: 'Dari Cabang', opts: CABANG },
                                { key: 'ke_cabang', placeholder: 'Ke Cabang', opts: CABANG },
                            ].map(f => (
                                <select key={f.key} value={filters[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    <option value="">{f.placeholder}</option>
                                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ))}
                            <input type="date" value={filters.startDate} onChange={e => setFilters(p => ({ ...p, startDate: e.target.value }))}
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
                                            <th className="px-5 py-3.5">Dari</th>
                                            <th className="px-5 py-3.5">Ke</th>
                                            <th className="px-5 py-3.5 text-right">Nominal</th>
                                            <th className="px-5 py-3.5 text-right">Biaya</th>
                                            <th className="px-5 py-3.5">Status</th>
                                            <th className="px-5 py-3.5 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Memuat data...</td></tr>
                                            : data.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Tidak ada data</td></tr>
                                            : data.map(row => (
                                                <tr key={row.id} className={`hover:bg-red-50/30 transition-colors ${row.status === 'Void' ? 'opacity-50' : ''}`}>
                                                    <td className="px-5 py-3 font-mono text-xs text-[#990000] font-semibold">{row.transaksi_id}</td>
                                                    <td className="px-5 py-3 text-sm text-gray-700">{new Date(row.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                                                    <td className="px-5 py-3 text-sm">
                                                        <span className="font-semibold text-gray-900">{row.dari_bank}</span>
                                                        <span className="text-gray-400 text-xs ml-1">({row.dari_cabang})</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm">
                                                        <span className="font-semibold text-gray-900">{row.ke_bank}</span>
                                                        <span className="text-gray-400 text-xs ml-1">({row.ke_cabang})</span>
                                                    </td>
                                                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900">{fmt(row.nominal)}</td>
                                                    <td className="px-5 py-3 text-right text-sm text-gray-600">{fmt(row.biaya_transfer)}</td>
                                                    <td className="px-5 py-3">
                                                        <span style={{ backgroundColor: STATUS_COLORS[row.status] + '22', color: STATUS_COLORS[row.status] }}
                                                            className="px-2.5 py-1 rounded-full text-xs font-bold">{row.status}</span>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex justify-center gap-1">
                                                            {row.status !== 'Void' && <>
                                                                <button onClick={() => handleOpenModal(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                                                                <button onClick={() => handleVoid(row.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
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
                            <h2 className="text-white font-black text-lg">{editingId ? 'Edit Transfer' : 'Tambah Transfer Rekening'}</h2>
                            <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white"><X size={22} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto">
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal</label>
                                <input type="date" required value={formData.tanggal_transaksi} onChange={e => setFormData(p => ({ ...p, tanggal_transaksi: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>

                            {/* Dari */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Dari Bank</label>
                                <select value={formData.dari_bank} onChange={e => setFormData(p => ({ ...p, dari_bank: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Dari Cabang</label>
                                <select value={formData.dari_cabang} onChange={e => setFormData(p => ({ ...p, dari_cabang: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {CABANG.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Ke */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Ke Bank</label>
                                <select value={formData.ke_bank} onChange={e => setFormData(p => ({ ...p, ke_bank: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Ke Cabang</label>
                                <select value={formData.ke_cabang} onChange={e => setFormData(p => ({ ...p, ke_cabang: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {CABANG.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {sameError && (
                                <div className="col-span-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs font-semibold">
                                    ⚠️ Tidak bisa transfer ke rekening yang sama (bank & cabang sama)
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal (Rp)</label>
                                <input type="number" min={0} required value={formData.nominal} onChange={e => setFormData(p => ({ ...p, nominal: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Biaya Transfer (Rp)</label>
                                <input type="number" min={0} value={formData.biaya_transfer} onChange={e => setFormData(p => ({ ...p, biaya_transfer: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                                <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]">
                                    {['Pending','Completed'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan</label>
                                <input type="text" value={formData.keterangan} onChange={e => setFormData(p => ({ ...p, keterangan: e.target.value }))}
                                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#990000]" />
                            </div>

                            <div className="col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold">Batal</button>
                                <button type="submit" className="px-5 py-2.5 bg-[#990000] hover:bg-red-800 text-white rounded-xl font-semibold shadow">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransferRekening;
