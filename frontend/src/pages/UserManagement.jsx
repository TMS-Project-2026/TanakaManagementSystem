import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/itApi';
import { Users, PlusCircle, Edit, Trash2, Search, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [form, setForm] = useState({ id: '', nama: '', username: '', password: '', role: 'marketing', status: 'aktif' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await getUsers();
            if (res.data.status === 'success') setUsers(res.data.data);
        } catch (error) {
            console.error("Gagal memuat users", error);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await updateUser(form.id, form);
            } else {
                await createUser(form);
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || "Gagal menyimpan user");
        }
    };

    const openEdit = (item) => {
        setForm({ ...item, password: '' });
        setIsEdit(true);
        setShowModal(true);
    };

    const openCreate = () => {
        setForm({ id: '', nama: '', username: '', password: '', role: 'marketing', status: 'aktif' });
        setIsEdit(false);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if(window.confirm('Yakin ingin menghapus user ini?')) {
            try {
                await deleteUser(id);
                fetchUsers();
            } catch (error) {
                console.error("Gagal hapus user", error);
            }
        }
    };

    const filteredUsers = users.filter(u => u.nama.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    const RoleBadge = ({ role }) => {
        const colors = {
            owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            admin_it: 'bg-blue-100 text-blue-800 border-blue-200',
            marketing: 'bg-purple-100 text-purple-800 border-purple-200',
            finance: 'bg-green-100 text-green-800 border-green-200',
            gudang: 'bg-red-100 text-red-800 border-red-200',
            produksi: 'bg-orange-100 text-orange-800 border-orange-200'
        };
        const color = colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
        return <span className={`text-[10px] px-2 py-1 rounded border font-bold uppercase ${color}`}>{role.replace('_', ' ')}</span>;
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen relative">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 border-l-4 border-[#990000] pl-4 flex items-center gap-2">
                            <Users className="text-[#990000]" /> Manajemen User
                        </h1>
                        <button onClick={openCreate} className="bg-[#990000] hover:bg-red-800 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                            <PlusCircle size={18} /> Tambah User
                        </button>
                    </div>

                    <div className="relative mb-6 w-full md:w-1/3">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau username..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-10 p-2 focus:ring-[#990000] focus:border-[#990000]" 
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                    <th className="p-4 font-semibold">Nama Lengkap</th>
                                    <th className="p-4 font-semibold">Username</th>
                                    <th className="p-4 font-semibold text-center">Role</th>
                                    <th className="p-4 font-semibold text-center">Status</th>
                                    <th className="p-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{item.nama}</td>
                                        <td className="p-4 text-gray-600">{item.username}</td>
                                        <td className="p-4 text-center"><RoleBadge role={item.role} /></td>
                                        <td className="p-4 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${item.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center flex justify-center gap-3">
                                            <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit User' : 'Tambah User Baru'}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateOrUpdate} className="p-4 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                    <input type="text" required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input type="text" required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{isEdit ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password'}</label>
                                    <input type={isEdit ? "text" : "password"} required={!isEdit} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2">
                                        <option value="owner">Owner</option>
                                        <option value="admin_it">Admin IT</option>
                                        <option value="marketing">Marketing</option>
                                        <option value="finance">Finance</option>
                                        <option value="gudang">Gudang</option>
                                        <option value="produksi">Produksi</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2">
                                        <option value="aktif">Aktif</option>
                                        <option value="nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                                    <button type="submit" className="px-6 py-2 text-white bg-[#990000] hover:bg-red-800 rounded-lg">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserManagement;
