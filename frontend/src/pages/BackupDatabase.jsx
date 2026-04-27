import React, { useEffect, useState } from 'react';
import { getBackupHistory, generateBackup, downloadBackup } from '../api/itApi';
import { Database, Download, FileText, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BackupDatabase = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const res = await getBackupHistory();
            if (res.data.status === 'success') {
                setBackups(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat riwayat backup", error);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateBackup();
            if (res.data.status === 'success') {
                alert("Backup berhasil dibuat!");
                fetchBackups();
            }
        } catch (error) {
            console.error("Gagal membuat backup", error);
            alert("Gagal membuat backup. Pastikan server memiliki mysqldump.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-4 flex items-center gap-2">
                        <Database className="text-orange-500" /> Backup Database
                    </h1>

                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-orange-900 mb-2">Generate SQL Backup</h2>
                            <p className="text-sm text-orange-800">
                                Fitur ini akan mengekspor seluruh tabel dan data di dalam database TMS Anda menjadi satu file `.sql` yang bisa Anda unduh.
                            </p>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className={`flex-shrink-0 px-6 py-3 rounded-xl font-bold text-white shadow-sm flex items-center gap-2 transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
                        >
                            <Database size={20} /> {loading ? 'Memproses...' : 'Buat Backup Sekarang'}
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Riwayat Backup</h3>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                    <th className="p-4 font-semibold">Tanggal & Waktu</th>
                                    <th className="p-4 font-semibold">Nama File Backup</th>
                                    <th className="p-4 font-semibold">Di-trigger Oleh</th>
                                    <th className="p-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map((item) => {
                                    const fileName = item.aktivitas.replace('backup_database: ', '');
                                    return (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="p-4 font-medium text-gray-800">{new Date(item.created_at).toLocaleString('id-ID')}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FileText size={16} className="text-orange-400" /> {fileName}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">{item.user}</td>
                                            <td className="p-4 text-center flex justify-center">
                                                <a 
                                                    href={downloadBackup(fileName)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                                                >
                                                    <Download size={14} /> Unduh
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {backups.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="p-10 text-center text-gray-500">
                                            <p className="text-lg font-bold mb-2">Belum ada riwayat backup</p>
                                            <p className="text-sm">Klik tombol "Buat Backup Sekarang" untuk memulai.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BackupDatabase;
