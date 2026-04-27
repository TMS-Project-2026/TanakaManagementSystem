import React, { useEffect, useState } from 'react';
import { getPermissions, updatePermission } from '../api/itApi';
import { Shield, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const RolePermission = () => {
    const [permissions, setPermissions] = useState({});
    const [selectedRole, setSelectedRole] = useState('marketing');
    
    // Default menus available in the system
    const defaultMenus = ['marketing', 'finance', 'gudang', 'produksi', 'it_dashboard', 'user_management', 'settings'];

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const res = await getPermissions();
            if (res.data.status === 'success') {
                setPermissions(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat permissions", error);
        }
    };

    const handleToggle = (menu, field) => {
        setPermissions(prev => {
            const rolePerms = prev[selectedRole] || [];
            let menuPerm = rolePerms.find(p => p.menu === menu);
            
            if (!menuPerm) {
                menuPerm = { menu, can_read: 0, can_create: 0, can_update: 0, can_delete: 0 };
                rolePerms.push(menuPerm);
            }
            
            // Toggle the specific field
            menuPerm[field] = menuPerm[field] ? 0 : 1;
            
            return { ...prev, [selectedRole]: rolePerms };
        });
    };

    const handleSave = async () => {
        try {
            const rolePerms = permissions[selectedRole] || [];
            await updatePermission(selectedRole, rolePerms);
            alert("Permissions berhasil disimpan!");
        } catch (error) {
            console.error("Gagal simpan permissions", error);
            alert("Gagal menyimpan permissions");
        }
    };

    const getPermValue = (menu, field) => {
        const rolePerms = permissions[selectedRole] || [];
        const menuPerm = rolePerms.find(p => p.menu === menu);
        return menuPerm ? menuPerm[field] === 1 : false;
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-blue-600 pl-4 flex items-center gap-2">
                        <Shield className="text-blue-600" /> Role & Permission
                    </h1>

                    <div className="flex gap-4 mb-6 border-b border-gray-200 pb-4">
                        {['owner', 'admin_it', 'marketing', 'finance', 'gudang', 'produksi'].map(role => (
                            <button 
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                className={`px-4 py-2 font-bold text-sm rounded-lg transition-colors uppercase ${selectedRole === role ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                {role.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                    <th className="p-4 font-semibold uppercase">Menu Sistem</th>
                                    <th className="p-4 font-semibold text-center">Read (Akses Menu)</th>
                                    <th className="p-4 font-semibold text-center">Create</th>
                                    <th className="p-4 font-semibold text-center">Update</th>
                                    <th className="p-4 font-semibold text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defaultMenus.map((menu) => (
                                    <tr key={menu} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800 uppercase text-sm">{menu.replace('_', ' ')}</td>
                                        {['can_read', 'can_create', 'can_update', 'can_delete'].map(field => (
                                            <td key={field} className="p-4 text-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={getPermValue(menu, field)}
                                                        onChange={() => handleToggle(menu, field)}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg flex items-center gap-2 transition-colors">
                            <Save size={20} /> Simpan Pengaturan
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RolePermission;
