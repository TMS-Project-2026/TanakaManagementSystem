import React, { useEffect, useState } from 'react';
import { getStok, createStok, updateStok, deleteStok } from '../api/gudangApi';
import { PlusCircle, Edit, Trash2, Search, Filter, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Stok = () => {
    const navigate = useNavigate();
    const [stok, setStok] = useState([]);
    const [form, setForm] = useState({ 
        id: 0, 
        nama_brand: '', 
        nama_barang: '', 
        jumlah: '', 
        kategori: '', 
        cabang_id: '', 
        kode_rak: '', 
        ukuran: '', 
        minimum_stok: '' 
    });
    const [isEdit, setIsEdit] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCabang, setFilterCabang] = useState('');

    useEffect(() => {
        fetchStok();
    }, [filterCabang]);

    const fetchStok = async () => {
        try {
            const res = await getStok(filterCabang);
            if (res.data.status === 'success') {
                setStok(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat stok", error);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateStok(form.id, form);
            } else {
                await createStok(form);
            }
            fetchStok();
            resetForm();
        } catch (error) {
            console.error("Gagal simpan stok", error);
        }
    };

    const handleEdit = (item) => {
        setIsEdit(true);
        setForm(item);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus barang ini?')) {
            try {
                await deleteStok(id);
                fetchStok();
            } catch (error) {
                console.error("Gagal hapus stok", error);
            }
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setForm({ 
            id: 0, 
            nama_brand: '', 
            nama_barang: '', 
            jumlah: '', 
            kategori: '', 
            cabang_id: '', 
            kode_rak: '', 
            ukuran: '', 
            minimum_stok: '' 
        });
    };

    // Extract unique brands and items for recommendations
    const uniqueBrands = Array.from(new Set(stok.map(s => s.nama_brand).filter(Boolean)));
    const uniqueBarang = Array.from(new Set(stok.map(s => s.nama_barang).filter(Boolean)));

    // Grouping stok
    const groupedStok = Object.values(stok.reduce((acc, curr) => {
        const brand = (curr.nama_brand || '').trim().toLowerCase();
        const nama = (curr.nama_barang || '').trim().toLowerCase();
        const cabang = (curr.cabang_id || '').trim().toLowerCase();
        
        const key = `${brand}|${nama}|${cabang}`;
        if (!acc[key]) {
            acc[key] = { ...curr, jumlah: 0, rawItems: [] };
        }
        acc[key].jumlah += parseInt(curr.jumlah || 0, 10);
        acc[key].rawItems.push(curr);
        return acc;
    }, {}));

    const filteredStok = groupedStok.filter(item => item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4">Manajemen Stok Barang</h1>

                    {/* Form Create/Edit */}
                    <div className="bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PlusCircle className="text-red-600" /> {isEdit ? 'Edit Barang' : 'Tambah Barang Baru'}
                        </h3>
                        <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Brand</label>
                                <input list="brand-list" type="text" placeholder="Contoh: Honda" required value={form.nama_brand} onChange={e => setForm({...form, nama_brand: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" />
                                <datalist id="brand-list">
                                    {uniqueBrands.map(b => <option key={b} value={b} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Barang</label>
                                <input list="barang-list" type="text" placeholder="Nama item" required value={form.nama_barang} onChange={e => setForm({...form, nama_barang: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" />
                                <datalist id="barang-list">
                                    {uniqueBarang.map(b => <option key={b} value={b} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                                <select required value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none bg-white transition-all">
                                    <option value="" disabled>Pilih Kategori</option>
                                    <option value="Reguler">Reguler</option>
                                    <option value="Utama">Utama</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Cabang</label>
                                <select required value={form.cabang_id} onChange={e => setForm({...form, cabang_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none bg-white transition-all">
                                    <option value="" disabled>Pilih Cabang</option>
                                    <option value="Tanaka">Tanaka</option>
                                    <option value="Banua">Banua</option>
                                    <option value="Acestreet">Acestreet</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Rak</label>
                                <input type="text" placeholder="A1-02" value={form.kode_rak} onChange={e => setForm({...form, kode_rak: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Ukuran</label>
                                <select required value={form.ukuran} onChange={e => setForm({...form, ukuran: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none bg-white transition-all">
                                    <option value="" disabled>Pilih Ukuran</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                    <option value="XXXL">XXXL</option>
                                    <option value="XXXXL">XXXXL</option>
                                    <option value="XXXXXL">XXXXXL</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Stok Total</label>
                                <input type="number" required value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className={`w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all ${isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} disabled={isEdit} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Minimal Stok</label>
                                <input type="number" required value={form.minimum_stok} onChange={e => setForm({...form, minimum_stok: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" />
                            </div>
                            <div className="lg:col-span-4 flex gap-3 justify-end mt-4 pt-4 border-t border-gray-200">
                                {isEdit && <button type="button" onClick={resetForm} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors">Batal</button>}
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-transform active:scale-95">{isEdit ? 'Simpan Perubahan' : 'Tambah Barang'}</button>
                            </div>
                        </form>
                    </div>

                    {/* Table Filters */}
                    <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                        <div className="relative w-full md:w-1/3">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Cari nama barang..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400" size={20} />
                            <select
                                value={filterCabang}
                                onChange={(e) => setFilterCabang(e.target.value)}
                                className="border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Semua Cabang</option>
                                {/* Anda bisa fetch list cabang dinamis jika ada */}
                                <option value="Pusat">Pusat</option>
                                <option value="Cabang 1">Cabang 1</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-red-50 border-b border-red-100 text-gray-700">
                                        <th className="p-4 font-semibold">Brand</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold text-center">Jumlah Stok</th>
                                        <th className="p-4 font-semibold text-center">Minimal Stok</th>
                                        <th className="p-4 font-semibold">Rak</th>
                                        <th className="p-4 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStok.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-600">{item.nama_brand || '-'}</td>
                                            <td className="p-4 font-bold text-gray-800">{item.nama_barang} <span className="text-xs text-gray-500 block">({item.cabang_id})</span></td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.kategori}</span></td>
                                            <td className="p-4 text-center font-bold text-lg text-red-600">{item.jumlah}</td>
                                            <td className="p-4 text-center text-gray-500">{item.minimum_stok}</td>
                                            <td className="p-4 text-gray-600">{item.kode_rak || '-'}</td>
                                            <td className="p-4 text-center flex justify-center gap-2">
                                                <button onClick={() => navigate(`/stok/detail?brand=${encodeURIComponent(item.nama_brand || '')}&barang=${encodeURIComponent(item.nama_barang || '')}&cabang=${encodeURIComponent(item.cabang_id || '')}`)} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
                                                    <Eye size={16} /> Lihat Detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStok.length === 0 && (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Barang tidak ditemukan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Stok;
