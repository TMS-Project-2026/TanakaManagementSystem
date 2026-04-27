import React, { useEffect, useState } from 'react';
import { getApprovals, updateApprovalStatus } from '../api/ownerApi';
import { Check, X, Clock, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const ApprovalCenter = () => {
    const [approvals, setApprovals] = useState([]);

    const fetch = async () => {
        try {
            const res = await getApprovals();
            if (res.data.status === 'success') setApprovals(res.data.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetch(); }, []);

    const handleApproval = async (id, status) => {
        if (!window.confirm(`Yakin ingin men-${status} pengajuan ini?`)) return;
        try {
            await updateApprovalStatus(id, status);
            alert(`Pengajuan berhasil di-${status}`);
            fetch();
        } catch (error) {
            console.error(error);
            alert("Gagal memproses persetujuan");
        }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-[#990000] pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Approval <span className="text-[#990000]">Center</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Pusat persetujuan khusus Owner (Pengeluaran, Pembelian, Refund).</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="p-4 font-bold w-1/5">Tipe & Tanggal</th>
                                    <th className="p-4 font-bold w-1/3">Keterangan</th>
                                    <th className="p-4 font-bold w-1/6">Diajukan Oleh</th>
                                    <th className="p-4 font-bold w-1/6">Status</th>
                                    <th className="p-4 font-bold w-1/6 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approvals.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-black text-gray-800 capitalize text-sm">{item.tipe.replace('_', ' ')}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Clock size={10}/> {new Date(item.tanggal_pengajuan).toLocaleString('id-ID')}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800 text-sm">{item.keterangan}</p>
                                            {item.nominal > 0 && <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded">{formatRupiah(item.nominal)}</span>}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-600">{item.diajukan_oleh}</td>
                                        <td className="p-4">
                                            {item.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>}
                                            {item.status === 'approved' && <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Approved</span>}
                                            {item.status === 'rejected' && <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.status === 'pending' ? (
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleApproval(item.id, 'approved')} className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center transition-colors tooltip"><Check size={16} /></button>
                                                    <button onClick={() => handleApproval(item.id, 'rejected')} className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors tooltip"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <ShieldCheck size={20} className="text-gray-300 mx-auto" />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {approvals.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500 font-bold">Tidak ada request approval</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ApprovalCenter;
