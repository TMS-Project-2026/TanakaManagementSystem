import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById } from '../api/invoiceApi';
import { ArrowLeft, Printer, Download, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Sidebar from '../components/Sidebar';

// Temporary placeholders for logos. Put real logos in src/assets/ later.
const logos = {
    Banua: 'https://via.placeholder.com/150x50/990000/ffffff?text=BANUA',
    Tanaka: 'https://via.placeholder.com/150x50/333333/ffffff?text=TANAKA',
    Acestreet: 'https://via.placeholder.com/150x50/0055ff/ffffff?text=ACESTREET'
};

const addresses = {
    Banua: 'Jl. Banua Raya No. 1, Kaltim\nTelp: (0541) 123456 | Email: finance@banua.com',
    Tanaka: 'Jl. Tanaka Indah No. 88, Kaltim\nTelp: (0541) 654321 | Email: finance@tanaka.com',
    Acestreet: 'Jl. Acestreet Avenue No. 9, Kaltim\nTelp: (0541) 987654 | Email: finance@acestreet.com'
};

const InvoicePreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const res = await getInvoiceById(id);
            if (res.data.status === 'success') {
                setInvoice(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat invoice", error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        if (!invoice) return;

        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add basic header text (simulating logo)
        doc.setFontSize(22);
        doc.setTextColor(153, 0, 0); // Dark red
        doc.text(invoice.cabang.toUpperCase(), 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const addressLines = addresses[invoice.cabang].split('\n');
        doc.text(addressLines[0], 14, 26);
        doc.text(addressLines[1], 14, 31);

        // INVOICE Title
        doc.setFontSize(28);
        doc.setTextColor(50, 50, 50);
        doc.text("INVOICE", 140, 25);
        
        doc.setFontSize(10);
        doc.text(`No Invoice: ${invoice.no_invoice}`, 140, 32);
        doc.text(`Tanggal: ${new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID')}`, 140, 37);
        doc.text(`Jatuh Tempo: ${new Date(invoice.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}`, 140, 42);

        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 48, 196, 48);

        // Bill to
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Ditagihkan Kepada:", 14, 58);
        
        doc.setFont("helvetica", "normal");
        doc.text(invoice.nama_pt, 14, 64);
        doc.text(invoice.alamat_pt, 14, 69, { maxWidth: 80 });
        if(invoice.cp_penagihan) doc.text(`UP: ${invoice.cp_penagihan}`, 14, 80);

        // Table
        const tableColumn = ["Deskripsi", "Detail Pekerjaan", "Qty", "Harga Satuan", "Total"];
        const tableRows = [
            [
                invoice.deskripsi, 
                invoice.detail_pekerjaan, 
                invoice.qty, 
                `Rp ${invoice.harga_satuan.toLocaleString('id-ID')}`, 
                `Rp ${invoice.subtotal.toLocaleString('id-ID')}`
            ]
        ];

        doc.autoTable({
            startY: 90,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [153, 0, 0], textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 4 }
        });

        const finalY = doc.lastAutoTable.finalY || 90;

        // Totals
        doc.setFontSize(10);
        doc.text("Subtotal:", 130, finalY + 10);
        doc.text(`Rp ${invoice.subtotal.toLocaleString('id-ID')}`, 196, finalY + 10, { align: 'right' });
        
        if (invoice.ppn_persen > 0) {
            doc.text(`PPN (${invoice.ppn_persen}%):`, 130, finalY + 16);
            doc.text(`Rp ${invoice.jumlah_ppn.toLocaleString('id-ID')}`, 196, finalY + 16, { align: 'right' });
        }

        doc.setFont("helvetica", "bold");
        doc.text("GRAND TOTAL:", 130, finalY + 24);
        doc.text(`Rp ${invoice.grand_total.toLocaleString('id-ID')}`, 196, finalY + 24, { align: 'right' });

        // Notes
        doc.setFont("helvetica", "normal");
        doc.text("Catatan:", 14, finalY + 10);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(invoice.note || "Terima kasih atas kerja samanya.", 14, finalY + 15, { maxWidth: 100 });

        // TTD
        if (invoice.ttd) {
            doc.setTextColor(0, 0, 0);
            
            // Left Signature (Accounting)
            doc.text("Accounting,", 40, finalY + 50, { align: 'center' });
            doc.setFont("helvetica", "bold");
            doc.text(invoice.nama_accounting || '(....................)', 40, finalY + 80, { align: 'center' });
            
            // Right Signature (Direktur)
            doc.setFont("helvetica", "normal");
            doc.text("Hormat Kami,", 150, finalY + 50);
            if (invoice.materai) {
                doc.setDrawColor(153, 0, 0);
                doc.rect(145, finalY + 58, 25, 15);
                doc.setTextColor(153, 0, 0);
                doc.text("MATERAI", 147, finalY + 66);
            }
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(invoice.penanggung_jawab || "Direktur", 150, finalY + 80);
            doc.setFont("helvetica", "normal");
            doc.text(invoice.jabatan || "Direktur Utama", 150, finalY + 85);
        }

        doc.save(`${invoice.no_invoice.replace(/\//g, '_')}.pdf`);
    };

    if (!invoice) return <div className="p-8 text-center">Memuat...</div>;

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);

    return (
        <div className="flex bg-gray-100 min-h-screen font-sans">
            {/* Hide sidebar when printing */}
            <div className="print:hidden">
                <Sidebar />
            </div>
            
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen print:p-0 print:h-auto print:overflow-visible">
                {/* Actions Header - Hidden in Print */}
                <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 border border-gray-200">
                        <ArrowLeft size={18} /> Kembali
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 font-medium">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-5 py-2.5 bg-[#990000] text-white rounded-lg shadow hover:bg-red-800 font-medium">
                            <Download size={18} /> Download PDF
                        </button>
                    </div>
                </div>

                {/* A4 Paper Container */}
                <div className="max-w-4xl mx-auto bg-white min-h-[297mm] p-10 md:p-16 shadow-xl print:shadow-none print:p-0">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                        <div>
                            <img src={logos[invoice.cabang]} alt="Logo" className="h-12 object-contain mb-3" />
                            <p className="text-gray-500 text-sm whitespace-pre-line">{addresses[invoice.cabang]}</p>
                        </div>
                        <div className="text-right">
                            <h1 className="text-4xl font-black text-gray-200 tracking-widest mb-2">INVOICE</h1>
                            <p className="font-bold text-gray-800 text-lg">{invoice.no_invoice}</p>
                            <div className="text-sm text-gray-500 mt-2">
                                <p>Tanggal: <span className="font-medium text-gray-800">{new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID')}</span></p>
                                <p>Jatuh Tempo: <span className="font-medium text-gray-800">{new Date(invoice.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="mb-10">
                        <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Ditagihkan Kepada:</p>
                        <h2 className="text-xl font-bold text-gray-800">{invoice.nama_pt}</h2>
                        <p className="text-gray-600 mt-1 max-w-sm">{invoice.alamat_pt}</p>
                        {invoice.cp_penagihan && <p className="text-gray-600 mt-1 font-medium">UP: {invoice.cp_penagihan}</p>}
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#990000] text-white">
                                    <th className="p-3 font-semibold text-sm">Deskripsi Utama</th>
                                    <th className="p-3 font-semibold text-sm">Rincian</th>
                                    <th className="p-3 font-semibold text-sm text-center">Qty</th>
                                    <th className="p-3 font-semibold text-sm text-right">Harga Satuan</th>
                                    <th className="p-3 font-semibold text-sm text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="p-3 text-gray-800 align-top">{invoice.deskripsi}</td>
                                    <td className="p-3 text-gray-600 align-top whitespace-pre-line">{invoice.detail_pekerjaan}</td>
                                    <td className="p-3 text-gray-800 align-top text-center">{invoice.qty}</td>
                                    <td className="p-3 text-gray-800 align-top text-right">{formatRupiah(invoice.harga_satuan)}</td>
                                    <td className="p-3 text-gray-800 align-top text-right font-medium">{formatRupiah(invoice.subtotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Notes */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Catatan Tambahan:</p>
                            <p className="text-sm text-gray-600 whitespace-pre-line border-l-4 border-gray-200 pl-3">
                                {invoice.note || "Terima kasih atas kerja sama Anda."}
                            </p>
                        </div>
                        <div className="w-full md:w-72">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold text-gray-800">{formatRupiah(invoice.subtotal)}</span>
                            </div>
                            {invoice.ppn_persen > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-gray-600">PPN ({invoice.ppn_persen}%)</span>
                                    <span className="font-semibold text-gray-800">{formatRupiah(invoice.jumlah_ppn)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-4 mt-2 bg-gray-50 rounded-lg px-4 border border-gray-200">
                                <span className="font-bold text-[#990000]">GRAND TOTAL</span>
                                <span className="font-black text-xl text-[#990000]">{formatRupiah(invoice.grand_total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    {invoice.ttd && (
                        <div className="mt-20 flex justify-between px-10">
                            {/* Left Signature: Accounting */}
                            <div className="text-center w-48">
                                <p className="text-gray-600 mb-4">Accounting,</p>
                                <div className="h-24"></div>
                                <p className="font-bold text-gray-800 underline decoration-gray-300 underline-offset-4">
                                    {invoice.nama_accounting || '(.........................)'}
                                </p>
                            </div>
                            
                            {/* Right Signature: Direktur */}
                            <div className="text-center w-48">
                                <p className="text-gray-600 mb-4">Hormat Kami,</p>
                                <div className="h-24 flex items-center justify-center relative">
                                    {invoice.materai && (
                                        <div className="absolute left-[-10px] top-6 border border-red-300 bg-red-50 text-red-400 text-[10px] w-14 h-14 flex items-center justify-center rotate-[-15deg] opacity-70 font-bold">
                                            MATERAI
                                        </div>
                                    )}
                                </div>
                                <p className="font-bold text-gray-800 underline decoration-gray-300 underline-offset-4">
                                    {invoice.penanggung_jawab || '(.........................)'}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">{invoice.jabatan || 'Direktur'}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Print Styles for Hiding Sidebar and formatting */}
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body { background: white; }
                        @page { size: auto;  margin: 0mm; }
                    }
                `}} />
            </main>
        </div>
    );
};

export default InvoicePreview;
