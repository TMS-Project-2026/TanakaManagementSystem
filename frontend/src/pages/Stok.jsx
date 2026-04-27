import React, { useEffect, useState } from 'react';
import { getStok, createStok, updateStok, deleteStok } from '../api/gudangApi';
import { PlusCircle, Edit, Trash2, Search, Filter } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Stok = () => {
    const [stok, setStok] = useState([]);
    const [form, setForm] = useState({ id: 0, nama_barang: '', jumlah: '', kategori: '', cabang_id: '', minimum_stok: '' });
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
        if(window.confirm('Yakin ingin menghapus barang ini?')) {
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
        setForm({ id: 0, nama_barang: '', jumlah: '', kategori: '', cabang_id: '', minimum_stok: '' });
    };

    // Filter array based on search term locally
    const filteredStok = stok.filter(item => item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()));

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
                        <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                                <input type="text" required value={form.nama_barang} onChange={e => setForm({...form, nama_barang: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input type="text" required value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cabang</label>
                                <input type="text" required value={form.cabang_id} onChange={e => setForm({...form, cabang_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Awal Jumlah</label>
                                <input type="number" required value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" disabled={isEdit} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                                <input type="number" required value={form.minimum_stok} onChange={e => setForm({...form, minimum_stok: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div className="lg:col-span-6 flex gap-2 justify-end mt-2">
                                {isEdit && <button type="button" onClick={resetForm} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors">Batal</button>}
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-8 rounded-lg transition-colors">Simpan</button>
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
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        <th className="p-4 font-semibold text-center">Jumlah</th>
                                        <th className="p-4 font-semibold text-center">Status</th>
                                        <th className="p-4 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStok.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.kategori}</span></td>
                                            <td className="p-4">{item.cabang_id}</td>
                                            <td className="p-4 text-center font-bold text-lg">{item.jumlah}</td>
                                            <td className="p-4 text-center">
                                                {item.jumlah <= item.minimum_stok ? (
                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">Warning</span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">Aman</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center flex justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
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
