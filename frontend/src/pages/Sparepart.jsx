import React, { useEffect, useState } from 'react';
import { getSpareparts, createSparepart, updateSparepart, deleteSparepart } from '../api/gudangApi';
import { PlusCircle, Edit, Trash2, Search, Plus, X, Settings, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Sparepart = () => {
    const [spareparts, setSpareparts] = useState([]);
    const [form, setForm] = useState({ id: 0, nama_part: '', jumlah: '', kategori: '', supplier: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        fetchSpareparts();
    }, []);

    const fetchSpareparts = async () => {
        try {
            const res = await getSpareparts();
            if (res.data.status === 'success') {
                setSpareparts(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat sparepart", error);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateSparepart(form.id, form);
            } else {
                await createSparepart(form);
            }
            fetchSpareparts();
            resetForm();
            setShowAddModal(false);
        } catch (error) {
            console.error("Gagal simpan sparepart", error);
        }
    };

    const handleEdit = (item) => {
        setIsEdit(true);
        setForm(item);
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        if(window.confirm('Yakin ingin menghapus sparepart ini?')) {
            try {
                await deleteSparepart(id);
                fetchSpareparts();
            } catch (error) {
                console.error("Gagal hapus sparepart", error);
            }
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setForm({ id: 0, nama_part: '', jumlah: '', kategori: '', supplier: '' });
        setShowAddModal(false);
    };

    const filteredData = spareparts.filter(item => item.nama_part.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 z-50 shrink-0">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari suku cadang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                      <UserCircle size={32} className="text-gray-400 hover:text-red-600 transition-colors" />
                    </div>
                    {showProfile && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-4 bg-red-50/50">
                          <p className="text-sm font-black text-gray-900">Admin</p>
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">Gudang</p>
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                    <Settings className="text-[#990000]" size={20} />
                                </div>
                                Suku Cadang Barang
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Kelola data suku cadang gudang</p>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-red-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} className="text-white" /> Tambah Suku Cadang
                        </button>
                    </div>

                    {/* MODAL INPUT DATA */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Suku Cadang' : 'Tambah Suku Cadang Baru'}</h2>
                                        <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk manajemen data suku cadang.</p>
                                    </div>
                                    <button type="button" onClick={resetForm} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Part</label>
                                <input type="text" required value={form.nama_part} onChange={e => setForm({...form, nama_part: e.target.value})} placeholder="Contoh: Resleting, Benang" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kategori</label>
                                <input type="text" required value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Supplier</label>
                                <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jumlah</label>
                                <input type="number" required value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" disabled={isEdit} />
                            </div>
                            <div className="sm:col-span-2 pt-5 mt-2 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">Batal</button>
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all active:scale-95">Simpan</button>
                            </div>
                        </form>
                            </div>
                        </div>
                    )}


                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Nama Suku Cadang</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Supplier</th>
                                        <th className="p-4 font-semibold text-center">Jumlah</th>
                                        <th className="p-4 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-800">{item.nama_part}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.kategori}</span></td>
                                            <td className="p-4">{item.supplier}</td>
                                            <td className="p-4 text-center font-bold text-lg">{item.jumlah}</td>
                                            <td className="p-4 text-center flex justify-center gap-2">
                                                <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredData.length === 0 && (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Suku cadang tidak ditemukan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Sparepart;
