import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../api/itApi';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        nama_aplikasi: 'Tanaka Management System',
        logo: '',
        warna_tema: '#990000',
        timezone: 'Asia/Jakarta',
        maintenance_mode: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await getSystemSettings();
            if (res.data.status === 'success' && res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat pengaturan sistem", error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateSystemSettings(settings);
            if (res.data.status === 'success') {
                alert("Pengaturan sistem berhasil disimpan!");
            }
        } catch (error) {
            console.error("Gagal simpan pengaturan", error);
            alert("Terjadi kesalahan saat menyimpan pengaturan");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8 border-l-4 border-gray-800 pl-4 flex items-center gap-2">
                        <Settings className="text-gray-800" /> Pengaturan Sistem Global
                    </h1>

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Application Details */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Informasi Aplikasi</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Aplikasi</label>
                                    <input 
                                        type="text" 
                                        value={settings.nama_aplikasi}
                                        onChange={(e) => setSettings({...settings, nama_aplikasi: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-gray-800 focus:border-gray-800 outline-none transition-all" 
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Nama ini akan muncul di sidebar dan judul tab browser.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Warna Tema Utama (Hex)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={settings.warna_tema}
                                            onChange={(e) => setSettings({...settings, warna_tema: e.target.value})}
                                            className="h-12 w-12 rounded cursor-pointer border border-gray-300" 
                                        />
                                        <input 
                                            type="text" 
                                            value={settings.warna_tema}
                                            onChange={(e) => setSettings({...settings, warna_tema: e.target.value})}
                                            className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-gray-800 focus:border-gray-800 outline-none uppercase font-mono" 
                                            pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Zona Waktu (Timezone)</label>
                                    <select 
                                        value={settings.timezone}
                                        onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-gray-800 focus:border-gray-800 outline-none"
                                    >
                                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                                        <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                                        <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Security & Maintenance */}
                        <div className={`p-6 rounded-2xl border transition-colors ${settings.maintenance_mode === 1 || settings.maintenance_mode === '1' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertTriangle className={settings.maintenance_mode === 1 || settings.maintenance_mode === '1' ? 'text-red-500' : 'text-gray-400'} /> Maintenance Mode
                            </h3>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-800">Aktifkan Mode Pemeliharaan</p>
                                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                                        Jika diaktifkan, semua pengguna (kecuali Admin IT dan Owner) akan otomatis ter-logout dan tidak bisa login hingga mode ini dimatikan. Gunakan saat ada perbaikan sistem.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={settings.maintenance_mode === 1 || settings.maintenance_mode === '1'}
                                        onChange={(e) => setSettings({...settings, maintenance_mode: e.target.checked ? 1 : 0})}
                                    />
                                    <div className="w-14 h-7 bg-gray-300 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`px-8 py-3 text-white font-bold rounded-xl flex items-center gap-2 transition-all ${loading ? 'bg-gray-400' : 'bg-gray-900 hover:bg-black shadow-lg hover:shadow-xl'}`}
                            >
                                <Save size={20} /> {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default SystemSettings;
