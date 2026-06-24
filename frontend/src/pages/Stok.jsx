import React, { useEffect, useState } from 'react';
import { getStok, createStok, updateStok, deleteStok } from '../api/gudangApi';
import { Search, Filter, Eye, Plus, X, Package, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const Stok = () => {
    const navigate = useNavigate();
    const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';

    const [stok, setStok] = useState([]);
    const [pricelist, setPricelist] = useState([]);
    const [form, setForm] = useState({
        id: 0, kode_produk: '', nama_brand: '', nama_barang: '', bahan: '',
        jumlah: '', kategori: 'Reguler',
        cabang_id: userRole === 'gudang_accestret' ? 'Acestreet' : 'Banua',
        kode_rak: '', ukuran: 'All Size', minimum_stok: '5',
        created_at: new Date().toISOString().split('T')[0]
    });
    const [isEdit, setIsEdit] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCabang, setFilterCabang] = useState(userRole === 'gudang_accestret' ? 'Acestreet' : '');

    useEffect(() => { fetchStok(); fetchPricelist(); }, [filterCabang]);

    const fetchStok = async () => {
        try {
            const res = await getStok(filterCabang);
            if (res.data.status === 'success') {
                let data = res.data.data;
                if (userRole === 'gudang_accestret') data = data.filter(d => ['Accestret','Acestreet'].includes(d.cabang_id));
                setStok(data);
            }
        } catch (e) { console.error(e); }
    };

    const fetchPricelist = async () => {
        try {
            const res = await api.get('/pricelist-online');
            setPricelist(res.data.data || []);
        } catch (e) { console.error(e); }
    };

    // Autofill dari pricelist saat kode diketik
    const handleKodeChange = (kode) => {
        setForm(f => ({ ...f, kode_produk: kode.toUpperCase() }));
        const found = pricelist.find(p => p.kode === kode.toUpperCase());
        if (found) {
            setForm(f => ({
                ...f,
                kode_produk: found.kode,
                nama_brand: found.grup_produk,
                nama_barang: found.nama_produk,
                bahan: found.bahan || '',
                kategori: found.jenis || 'Reguler',
            }));
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) await updateStok(form.id, form);
            else await createStok(form);
            await fetchStok();
            resetForm();
        } catch (e) { console.error(e); }
    };

    const handleEdit = (item) => { setIsEdit(true); setForm(item); setShowAddModal(true); };
    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus barang ini?')) {
            try { await deleteStok(id); fetchStok(); } catch (e) { console.error(e); }
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setForm({ id:0, kode_produk:'', nama_brand:'', nama_barang:'', bahan:'', jumlah:'', kategori:'Reguler',
            cabang_id: userRole === 'gudang_accestret' ? 'Acestreet' : 'Banua',
            kode_rak:'', ukuran:'All Size', minimum_stok:'5', created_at: new Date().toISOString().split('T')[0] });
        setShowAddModal(false);
    };

    const sizesArray = ['XS','S','M','L','XL','XXL','XXXL','XXXXL','XXXXXL','All Size'];

    // Group by kode_produk | nama_barang | cabang
    const groupedStok = Object.values(stok.reduce((acc, curr) => {
        const key = `${(curr.kode_produk||'').toLowerCase()}|${(curr.nama_barang||'').toLowerCase()}|${(curr.cabang_id||'').toLowerCase()}`;
        if (!acc[key]) {
            acc[key] = {
                id: curr.id,
                kode_produk: curr.kode_produk || '-',
                nama_brand: curr.nama_brand || '-',
                nama_barang: curr.nama_barang,
                bahan: curr.bahan || '-',
                kategori: curr.kategori || '-',
                cabang_id: curr.cabang_id,
                kode_rak: curr.kode_rak || '-',
                total_stok: 0,
                minimum_stok: curr.minimum_stok || 5,
                sizes: sizesArray.reduce((o, sz) => { o[sz] = { qty: 0, id: null }; return o; }, {})
            };
        }
        acc[key].total_stok += Number(curr.jumlah) || 0;
        if (curr.ukuran && acc[key].sizes[curr.ukuran] !== undefined) {
            acc[key].sizes[curr.ukuran].qty += Number(curr.jumlah) || 0;
            if (!acc[key].sizes[curr.ukuran].id) acc[key].sizes[curr.ukuran].id = curr.id;
        }
        return acc;
    }, {}));

    const q = searchTerm.toLowerCase();
    const filteredStok = groupedStok.filter(item =>
        item.nama_barang?.toLowerCase().includes(q) ||
        item.kode_produk?.toLowerCase().includes(q) ||
        item.nama_brand?.toLowerCase().includes(q) ||
        item.bahan?.toLowerCase().includes(q) ||
        item.kategori?.toLowerCase().includes(q)
    );

    const kodeProdukList = pricelist.map(p => p.kode);

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 z-50 shrink-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari kode, nama produk, bahan..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all" />
                    </div>
                    <div className="relative">
                        <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md border border-gray-100" onClick={() => setShowProfile(p => !p)}>
                            <UserCircle size={32} className="text-gray-400 hover:text-red-600 transition-colors" />
                        </div>
                        {showProfile && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="p-4 bg-red-50/50">
                                    <p className="text-sm font-black text-gray-900">{(JSON.parse(localStorage.getItem('user'))||{}).nama || 'Admin'}</p>
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">{userRole}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                        <Package className="text-red-600" size={20} />
                                    </div>
                                    Stok Barang
                                </h1>
                                <p className="text-sm text-gray-500 mt-1 font-medium">{filteredStok.length} produk terdaftar</p>
                            </div>
                            <button onClick={() => { resetForm(); setShowAddModal(true); }}
                                className="bg-[#990000] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-red-800 transition-all">
                                <Plus size={18} /> Tambah Barang
                            </button>
                        </div>

                        {/* Filter Cabang */}
                        <div className="flex items-center gap-2 mb-4">
                            <Filter className="text-gray-400" size={20} />
                            <select value={filterCabang} onChange={e => setFilterCabang(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 bg-white text-sm focus:ring-red-500 focus:border-red-500">
                                <option value="">Semua Cabang</option>
                                <option value="Tanaka">Tanaka</option>
                                <option value="Banua">Banua</option>
                                <option value="Acestreet">Acestreet</option>
                            </select>
                        </div>

                        {/* TABEL */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-gray-900 text-white text-[11px] uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 border-r border-gray-700">KODE</th>
                                            <th className="px-3 py-3 border-r border-gray-700">JENIS / KATEGORI</th>
                                            <th className="px-3 py-3 border-r border-gray-700">NAMA PRODUK</th>
                                            <th className="px-3 py-3 border-r border-gray-700">BAHAN</th>
                                            <th className="px-3 py-3 border-r border-gray-700">CABANG</th>
                                            {sizesArray.map(sz => (
                                                <th key={sz} className="px-2 py-3 text-center border-r border-gray-700 w-14">{sz}</th>
                                            ))}
                                            <th className="px-3 py-3 text-center border-r border-gray-700">TOTAL</th>
                                            <th className="px-3 py-3 text-center border-r border-gray-700">MIN</th>
                                            <th className="px-3 py-3 text-center">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStok.map((item, idx) => {
                                            const isLow = item.total_stok <= item.minimum_stok;
                                            return (
                                                <tr key={idx} className={`border-b border-gray-100 hover:bg-red-50/30 transition-colors ${isLow ? 'bg-red-50/20' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                                                    <td className="px-3 py-2.5 font-bold text-[#990000] border-r border-gray-100 whitespace-nowrap">{item.kode_produk}</td>
                                                    <td className="px-3 py-2.5 border-r border-gray-100">
                                                        <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{item.kategori}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 font-semibold text-gray-800 border-r border-gray-100 whitespace-nowrap">{item.nama_barang}</td>
                                                    <td className="px-3 py-2.5 text-gray-500 border-r border-gray-100">{item.bahan}</td>
                                                    <td className="px-3 py-2.5 text-gray-600 border-r border-gray-100">{item.cabang_id}</td>
                                                    {sizesArray.map(sz => {
                                                        const qty = item.sizes[sz]?.qty || 0;
                                                        return (
                                                            <td key={sz} className="px-2 py-2.5 text-center border-r border-gray-100 font-bold text-gray-800">
                                                                {qty > 0 ? qty : <span className="text-gray-300 font-normal">-</span>}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className={`px-3 py-2.5 text-center font-black text-base border-r border-gray-100 ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {item.total_stok}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center border-r border-gray-100">
                                                        <span className="bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{item.minimum_stok}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <button
                                                            onClick={() => navigate(`/stok/detail?brand=${encodeURIComponent(item.nama_brand||'')}&barang=${encodeURIComponent(item.nama_barang||'')}&cabang=${encodeURIComponent(item.cabang_id||'')}`)}
                                                            className="bg-red-50 hover:bg-[#990000] hover:text-white text-[#990000] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 mx-auto">
                                                            <Eye size={13} /> Detail
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredStok.length === 0 && (
                                            <tr><td colSpan={5 + sizesArray.length + 3} className="p-8 text-center text-gray-400">Tidak ada data stok.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL TAMBAH / EDIT */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[90vh] border border-gray-100">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h2>
                                <button onClick={resetForm} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* KODE PRODUK — dengan autofill */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">KODE PRODUK <span className="text-gray-400 font-normal">(pilih dari pricelist)</span></label>
                                    <select
                                        value={form.kode_produk}
                                        onChange={e => handleKodeChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-red-100 focus:border-[#990000] outline-none text-sm font-semibold text-gray-900"
                                    >
                                        <option value="">-- Pilih Kode Produk --</option>
                                        {pricelist.map((p, i) => (
                                            <option key={i} value={p.kode}>{p.kode} - {p.nama_produk}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">NAMA PRODUK</label>
                                    <input type="text" value={form.nama_barang} onChange={e => setForm({...form, nama_barang: e.target.value})} required
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">BAHAN</label>
                                    <input type="text" value={form.bahan} onChange={e => setForm({...form, bahan: e.target.value})}
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">JENIS / KATEGORI</label>
                                    <input list="jenis-list" type="text" value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 outline-none text-sm uppercase" />
                                    <datalist id="jenis-list">
                                        {['PDH','PDL','WEARPACK','CELANA','TOPI','APRON','KEMEJA','FULL SET','Reguler'].map(v => <option key={v} value={v} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">CABANG</label>
                                    <select value={form.cabang_id} onChange={e => setForm({...form, cabang_id: e.target.value}) }
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none text-sm bg-white">
                                        <option value="Banua">Banua</option>
                                        <option value="Tanaka">Tanaka</option>
                                        <option value="Acestreet">Acestreet</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">UKURAN</label>
                                    <select value={form.ukuran} onChange={e => setForm({...form, ukuran: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none text-sm bg-white">
                                        {sizesArray.map(sz => <option key={sz} value={sz}>{sz}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">JUMLAH STOK</label>
                                    <input type="number" value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} required
                                        disabled={isEdit}
                                        className={`w-full border border-gray-200 rounded-xl p-2.5 outline-none text-sm ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">MINIMAL STOK</label>
                                    <input type="number" value={form.minimum_stok} onChange={e => setForm({...form, minimum_stok: e.target.value})} required
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">KODE RAK</label>
                                    <input type="text" placeholder="A1-02" value={form.kode_rak} onChange={e => setForm({...form, kode_rak: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl p-2.5 outline-none text-sm" />
                                </div>

                                <div className="md:col-span-2 pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm">Batal</button>
                                    <button type="submit" className="bg-[#990000] hover:bg-red-800 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm text-sm">
                                        {isEdit ? 'Simpan Perubahan' : 'Simpan Barang'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Stok;
