import React, { useEffect, useState } from 'react';
import { getWarningStok } from '../api/gudangApi';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const WarningStok = () => {
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWarnings();
    }, []);

    const fetchWarnings = async () => {
        try {
            const res = await getWarningStok();
            if (res.data.status === 'success') {
                setWarnings(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat warning stok", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-yellow-500 pl-4 flex items-center gap-2">
                        <AlertTriangle className="text-yellow-500" size={32} /> Warning Stok (Habis/Menipis)
                    </h1>

                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Perhatian!</strong> Daftar barang di bawah ini memiliki jumlah stok yang kurang dari atau sama dengan batas minimum stok yang telah ditentukan. Segera lakukan pengadaan ulang (restock) untuk menghindari kehabisan barang di gudang.
                        </p>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-yellow-50 border-b border-yellow-100 text-yellow-900">
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        <th className="p-4 font-semibold text-center">Stok Saat Ini</th>
                                        <th className="p-4 font-semibold text-center">Batas Minimum</th>
                                        <th className="p-4 font-semibold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Memuat data...</td></tr>
                                    ) : warnings.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                                            <td className="p-4 font-bold text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.kategori}</span></td>
                                            <td className="p-4 font-medium text-gray-600">{item.cabang_id}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-xl font-black ${item.jumlah === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                                                    {item.jumlah}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-gray-500">{item.minimum_stok}</td>
                                            <td className="p-4 text-center">
                                                {item.jumlah === 0 ? (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto">
                                                        <AlertCircle size={14} /> HABIS TOTAL
                                                    </span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto">
                                                        <AlertTriangle size={14} /> HAMPIR HABIS
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && warnings.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle size={32} />
                                                    </div>
                                                    <p className="font-bold text-lg text-gray-700">Semua Stok Aman!</p>
                                                    <p className="text-sm">Tidak ada barang yang perlu di-restock saat ini.</p>
                                                </div>
                                            </td>
                                        </tr>
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

export default WarningStok;
