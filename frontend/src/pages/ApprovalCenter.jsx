import React, { useEffect, useState } from 'react';
import { getApprovals, getApprovalDetail, updateApprovalStatus } from '../api/ownerApi';
import { Check, X, Clock, ShieldCheck, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);

const ApprovalCenter = () => {
    const [approvals, setApprovals] = useState([]);
    const [selectedApproval, setSelectedApproval] = useState(null);
    const [showModal, setShowModal] = useState(false);

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

    const handleView = async (id) => {
        try {
            const res = await getApprovalDetail(id);
            if (res.data.status === 'success') {
                setSelectedApproval(res.data.data);
                setShowModal(true);
            }
        } catch (error) {
            console.error(error);
            alert("Gagal mengambil detail approval");
        }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-[#990000] pl-4">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Approval <span className="text-[#990000]">Center</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Pusat persetujuan khusus Finance (Pengeluaran, Pembelian, Refund, Quotation).</p>
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
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleView(item.id)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors tooltip" title="Lihat Detail"><Eye size={16} /></button>
                                                {item.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApproval(item.id, 'approved')} className="w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center transition-colors tooltip" title="Setujui"><Check size={16} /></button>
                                                        <button onClick={() => handleApproval(item.id, 'rejected')} className="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors tooltip" title="Tolak"><X size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {approvals.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-gray-500 font-bold">Tidak ada request approval</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal Detail Approval */}
            {showModal && selectedApproval && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-gray-800">Detail Approval</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Informasi Pengajuan</p>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tipe</p>
                                        <p className="font-bold text-gray-800 capitalize">{selectedApproval.approval.tipe.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Diajukan Oleh</p>
                                        <p className="font-bold text-gray-800">{selectedApproval.approval.diajukan_oleh}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Keterangan</p>
                                        <p className="font-medium text-gray-800">{selectedApproval.approval.keterangan}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Nominal</p>
                                        <p className="font-black text-[#990000] text-lg">{formatRupiah(selectedApproval.approval.nominal)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedApproval.detail && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Detail Referensi</p>
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <p className="text-xs text-gray-500 mb-1">Nama Customer / PT</p>
                                                <p className="font-bold text-gray-800 text-base">{selectedApproval.detail.customer || selectedApproval.detail.customer_name || selectedApproval.detail.nama_customer || '-'}</p>
                                            </div>
                                            {selectedApproval.detail.items && (
                                                <div className="col-span-2 mt-2">
                                                    <p className="text-xs text-gray-500 font-bold mb-2">Daftar Item / Produk</p>
                                                    <div className="border border-gray-100 rounded-lg overflow-hidden">
                                                        <table className="w-full text-left text-sm">
                                                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                                                                <tr>
                                                                    <th className="p-3 pl-4">Barang</th>
                                                                    <th className="p-3 text-center">Qty</th>
                                                                    <th className="p-3 text-right pr-4">Harga Satuan</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {(typeof selectedApproval.detail.items === 'string' ? JSON.parse(selectedApproval.detail.items) : selectedApproval.detail.items).map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="p-3 pl-4 font-medium text-gray-800">{item.rincian || item.nama_barang}</td>
                                                                        <td className="p-3 text-center">{item.qty} <span className="text-gray-400 text-xs">{item.satuan}</span></td>
                                                                        <td className="p-3 text-right pr-4">{formatRupiah(item.harga_satuan || item.harga || 0)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Untuk kasus yang tidak memiliki JSON items (seperti Quotation lama/Leads) */}
                                            {!selectedApproval.detail.items && (selectedApproval.detail.produk || selectedApproval.detail.product_name) && (
                                                <div className="col-span-2 mt-2">
                                                    <p className="text-xs text-gray-500 font-bold mb-1">Produk</p>
                                                    <p className="font-medium text-gray-800">{selectedApproval.detail.produk || selectedApproval.detail.product_name}</p>
                                                    <p className="text-sm text-gray-600 mt-1">Qty: <b>{selectedApproval.detail.qty}</b></p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {selectedApproval.approval.status === 'pending' && (
                            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
                                <button onClick={() => { handleApproval(selectedApproval.approval.id, 'rejected'); setShowModal(false); }} className="px-6 py-2 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors">Tolak</button>
                                <button onClick={() => { handleApproval(selectedApproval.approval.id, 'approved'); setShowModal(false); }} className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-sm transition-colors flex items-center gap-2"><Check size={18}/> Setujui</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalCenter;
