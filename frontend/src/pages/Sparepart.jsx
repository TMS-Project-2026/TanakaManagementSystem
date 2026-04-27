import React, { useEffect, useState } from 'react';
import { getSpareparts, createSparepart, updateSparepart, deleteSparepart } from '../api/gudangApi';
import { PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Sparepart = () => {
    const [spareparts, setSpareparts] = useState([]);
    const [form, setForm] = useState({ id: 0, nama_part: '', jumlah: '', kategori: '', supplier: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
        } catch (error) {
            console.error("Gagal simpan sparepart", error);
        }
    };

    const handleEdit = (item) => {
        setIsEdit(true);
        setForm(item);
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
    };

    const filteredData = spareparts.filter(item => item.nama_part.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4">Manajemen Suku Cadang</h1>

                    {/* Form Create/Edit */}
                    <div className="bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PlusCircle className="text-red-600" /> {isEdit ? 'Edit Suku Cadang' : 'Tambah Suku Cadang'}
                        </h3>
                        <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Part</label>
                                <input type="text" required value={form.nama_part} onChange={e => setForm({...form, nama_part: e.target.value})} placeholder="Contoh: Resleting, Benang" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                <input type="text" required value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                <input type="number" required value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" disabled={isEdit} />
                            </div>
                            <div className="lg:col-span-5 flex gap-2 justify-end mt-2">
                                {isEdit && <button type="button" onClick={resetForm} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors">Batal</button>}
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-8 rounded-lg transition-colors">Simpan</button>
                            </div>
                        </form>
                    </div>

                    <div className="relative mb-4 w-full md:w-1/3">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari suku cadang..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:ring-red-500 focus:border-red-500" 
                        />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-red-50 border-b border-red-100 text-gray-700">
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
            </main>
        </div>
    );
};

export default Sparepart;
