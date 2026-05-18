import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById } from '../api/invoiceApi';
import { ArrowLeft, Printer, Download, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../components/Sidebar';
import LogoBanua from '../assets/LOGO BANUA.png';
import LogoTanaka from '../assets/kop_tanaka.png';
import LogoAcestreet from '../assets/logoacestreet.png';
const addresses = {
    Banua: 'Geblagan, Tamantirto, Kasihan, Bantul Regency,\nSpecial Region of Yogyakarta 55184\nMarketing: +62 888 8888 8888 | Finance: +62 857 2768 4722',
    'PT BANUA MITRA LESTARI': 'Geblagan, Tamantirto, Kasihan, Bantul Regency,\nSpecial Region of Yogyakarta 55184\nMarketing: +62 888 8888 8888 | Finance: +62 857 2768 4722',
    Tanaka: 'Jl. Demakan Jl. Wiratama No.50, Tegalrejo, Kec. Tegalrejo,\nKota Yogyakarta, Daerah Istimewa Yogyakarta 55244\nMarketing: +62 851 6975 9267 | Finance: +62 857 2768 4722',
    'PT TANAKA RIZQI BAROKAH': 'Jl. Demakan Jl. Wiratama No.50, Tegalrejo, Kec. Tegalrejo,\nKota Yogyakarta, Daerah Istimewa Yogyakarta 55244\nMarketing: +62 851 6975 9267 | Finance: +62 857 2768 4722',
    Acestreet: 'Jl. Ambarbinangun, Brajan, Tamantirto, Kec. Kasihan,\nKabupaten Bantul, Daerah Istimewa Yogyakarta 55184\nMarketing: +62 838 2236 7608 | Finance: +62 857 2768 4722'
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

    const handleDownloadPdf = async () => {
        if (!invoice) return;
        try {
            const doc = new jsPDF('p', 'mm', 'a4');

            // Helper to load image as base64 for jsPDF
            const loadImageBase64 = (src) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = () => resolve(null);
                    img.src = src;
                });
            };

            const ptNames = {
                Banua: 'PT BANUA MITRA LESTARI',
                Tanaka: 'PT TANAKA RIZQI BAROKAH',
                Acestreet: 'ACESTREET'
            };
            const cabangName = ptNames[invoice.cabang] || invoice.cabang;
            const isBanua = invoice.cabang === 'Banua';

            // Format Rupiah for PDF (with dots, no decimals)
            const fmtRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

            // Add logo + header text
            let addressStartY = 24;
            let yOffset = 0; // extra offset for branches with large kop surat
            if (invoice.cabang === 'Banua') {
                const logoData = await loadImageBase64(LogoBanua);
                if (logoData) {
                    doc.addImage(logoData, 'PNG', 14, 6, 55, 22);
                    addressStartY = 30;
                }
            } else if (invoice.cabang === 'Tanaka') {
                // Kop surat - full width banner, proper aspect ratio (871x190 = 4.58:1)
                const logoData = await loadImageBase64(LogoTanaka);
                if (logoData) {
                    const kopHeight = 210 / 4.58; // ~46mm
                    doc.addImage(logoData, 'PNG', 0, 0, 210, kopHeight);
                    yOffset = kopHeight - 10; // shift all content below kop
                    addressStartY = kopHeight + 4;
                }
            } else if (invoice.cabang === 'Acestreet') {
                const logoData = await loadImageBase64(LogoAcestreet);
                if (logoData) {
                    doc.addImage(logoData, 'PNG', 14, 2, 45, 50);
                    addressStartY = 32;
                }
            } else {
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(153, 0, 0);
                doc.text(cabangName, 14, 20);
            }

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            const addressLines = (addresses[invoice.cabang] || '').split('\n');
            addressLines.forEach((line, i) => {
                doc.text(line.trim(), 14, addressStartY + (i * 4));
            });

            // INVOICE Title - positioned on the right
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);
            doc.text("INVOICE", 196, 20 + yOffset, { align: 'right' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`No Invoice: ${invoice.no_invoice || ''}`, 196, 28 + yOffset, { align: 'right' });
            doc.text(`Date: ${invoice.tanggal_terbit ? new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID') : ''}`, 196, 34 + yOffset, { align: 'right' });
            doc.text(`Due Date: ${invoice.tanggal_jatuh_tempo ? new Date(invoice.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : ''}`, 196, 40 + yOffset, { align: 'right' });
            if (invoice.no_po_kontrak) {
                doc.text(`No. PO/Kontrak: ${invoice.no_po_kontrak}`, 196, 46 + yOffset, { align: 'right' });
            }

            // Line separator
            doc.setDrawColor(200, 200, 200);
            doc.line(14, 52 + yOffset, 196, 52 + yOffset);

            // Bill to
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text("Billed To:", 14, 58 + yOffset);

            doc.setFont("helvetica", "normal");
            doc.text(invoice.nama_pt || '', 14, 64 + yOffset);
            doc.text(invoice.alamat_pt || '', 14, 69 + yOffset, { maxWidth: 80 });
            if (invoice.up_penagihan) doc.text(`UP: ${invoice.up_penagihan}`, 14, 75 + yOffset);
            if (invoice.cp_penagihan) doc.text(`CP: ${invoice.cp_penagihan}`, 14, 80 + yOffset);

            // Table
            const tableColumn = ["Nama Produk", "Ukuran", "Qty", "Unit", "Harga Satuan", "Total"];
            let tableRows = [];
            let items = [];
            if (typeof invoice.items === 'string') {
                try { items = JSON.parse(invoice.items); } catch (e) { }
            } else if (Array.isArray(invoice.items)) {
                items = invoice.items;
            }

            if (items && items.length > 0) {
                items.forEach((item, index) => {
                    tableRows.push([
                        item.rincian || '',
                        item.ukuran || '-',
                        item.qty || 0,
                        item.satuan || 'Pcs',
                        fmtRp(item.harga_satuan),
                        fmtRp(Number(item.qty || 0) * Number(item.harga_satuan || 0))
                    ]);
                });
            } else {
                tableRows = [
                    [
                        invoice.detail_pekerjaan || '',
                        '-',
                        invoice.qty || 0,
                        'Pcs',
                        fmtRp(invoice.harga_satuan),
                        fmtRp(invoice.subtotal)
                    ]
                ];
            }

            autoTable(doc, {
                startY: 90 + yOffset,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: isBanua ? [30, 64, 175] : [153, 0, 0], textColor: [255, 255, 255] },
                styles: { fontSize: 10, cellPadding: 4, font: 'helvetica' }
            });

            const finalY = doc.lastAutoTable.finalY || 90;

            // Totals - aligned colons
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Subtotal', 130, finalY + 10);
            doc.text(':', 158, finalY + 10);
            doc.text(fmtRp(invoice.subtotal), 196, finalY + 10, { align: 'right' });

            doc.text('PPN', 130, finalY + 16);
            doc.text(':', 158, finalY + 16);
            doc.text(fmtRp(invoice.jumlah_ppn), 196, finalY + 16, { align: 'right' });

            if (invoice.diskon > 0) {
                const diskonText = invoice.diskon_persen > 0 ? `Diskon (${invoice.diskon_persen}%)` : 'Diskon';
                doc.text(diskonText, 130, finalY + 22);
                doc.text(':', 158, finalY + 22);
                doc.setTextColor(153, 0, 0); // Red
                doc.text(`- ${fmtRp(invoice.diskon)}`, 196, finalY + 22, { align: 'right' });
                doc.setTextColor(0, 0, 0);
                
                doc.setFont('helvetica', 'bold');
                doc.text('GRAND TOTAL', 130, finalY + 30);
                doc.text(':', 158, finalY + 30);
                doc.text(fmtRp(invoice.grand_total), 196, finalY + 30, { align: 'right' });
            } else {
                doc.setFont('helvetica', 'bold');
                doc.text('GRAND TOTAL', 130, finalY + 24);
                doc.text(':', 158, finalY + 24);
                doc.text(fmtRp(invoice.grand_total), 196, finalY + 24, { align: 'right' });
            }

            // Notes - render as aligned key-value pairs
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            const noteText = invoice.note || "Terima kasih atas kerja samanya.";
            const noteLines = noteText.split('\n');
            let noteY = finalY + 10;
            noteLines.forEach((line) => {
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0 && colonIdx < line.length - 1) {
                    const label = line.substring(0, colonIdx).trim();
                    const value = line.substring(colonIdx + 1).trim();
                    doc.text(label, 14, noteY);
                    doc.text(': ' + value, 55, noteY);
                } else {
                    doc.setFont('helvetica', 'bold');
                    doc.text(line.trim(), 14, noteY);
                    doc.setFont('helvetica', 'normal');
                }
                noteY += 4.5;
            });

            // Term of Payment (if filled)
            if (invoice.term_of_payment) {
                noteY += 2;
                doc.setDrawColor(200, 200, 200);
                doc.line(14, noteY, 120, noteY);
                noteY += 4;
                doc.setFont('helvetica', 'bold');
                doc.text('Term of Payment :', 14, noteY);
                doc.setFont('helvetica', 'normal');
                noteY += 4.5;
                const topLines = doc.splitTextToSize(invoice.term_of_payment, 106);
                topLines.forEach(line => { doc.text(line, 14, noteY); noteY += 4.5; });
            }

            // Keterangan tambahan
            if (invoice.keterangan) {
                noteY += 2;
                doc.setTextColor(120, 120, 120);
                doc.setFont('helvetica', 'italic');
                const ketLines = doc.splitTextToSize(invoice.keterangan, 106);
                ketLines.forEach(line => { doc.text(line, 14, noteY); noteY += 4.5; });
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
            }

            // TTD
            if (invoice.ttd || invoice.nama_accounting || invoice.penanggung_jawab) {
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');

                // Marketing name defaults per branch
                const isTanaka = invoice.cabang === 'Tanaka';
                const marketingName = invoice.nama_accounting || (isBanua ? 'Aji Pangestu' : isTanaka ? 'M.Rangga Maulana' : '(.........................)');

                // Left Signature (Prepared by)
                doc.text("Prepared by,", 40, finalY + 50, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                doc.text(marketingName, 40, finalY + 80, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text("Marketing", 40, finalY + 85, { align: 'center' });

                // Right Signature (Approved by)
                doc.text("Approved by,", 150, finalY + 50, { align: 'center' });
                
                const approvedName = invoice.penanggung_jawab || ((isBanua || isTanaka || invoice.cabang === 'Acestreet') ? 'Hanifah Abdillah' : '(..........................)');
                
                // Add QR Code
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Validasi_Invoice_${invoice.no_invoice}`;
                const qrData = await loadImageBase64(qrUrl);
                if (qrData) {
                    doc.addImage(qrData, 'PNG', 138, finalY + 54, 24, 24);
                }
                
                // Add digital signature
                doc.setFont('times', 'italic');
                doc.setFontSize(16);
                doc.setTextColor(20, 50, 150);
                doc.text(approvedName.replace(/\(.*\)/, ''), 150, finalY + 70, { align: 'center', angle: -5 });
                doc.setTextColor(0, 0, 0);
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(approvedName, 150, finalY + 80, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text(invoice.jabatan || "Accounting", 150, finalY + 85, { align: 'center' });
            }

            doc.save(`${(invoice.no_invoice || 'invoice').replace(/\//g, '_')}.pdf`);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Gagal menghasilkan PDF. Silakan cek console untuk detail.');
        }
    };

    if (!invoice) return <div className="p-8 text-center">Memuat...</div>;

    const formatRupiah = (number) => 'Rp ' + Number(number || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const PriceCell = ({ value }) => (
        <div className="flex justify-between w-full text-sm">
            <span>Rp</span>
            <span>{Number(value || 0).toLocaleString('id-ID')}</span>
        </div>
    );

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
                    {(() => {
                        const ptNames = {
                            Banua: 'PT BANUA MITRA LESTARI',
                            Tanaka: 'PT TANAKA RIZQI BAROKAH',
                            Acestreet: 'ACESTREET'
                        };
                        const cabangName = ptNames[invoice.cabang] || invoice.cabang;
                        const isBanua = invoice.cabang === 'Banua';
                        return (
                            <div className="border-b-2 border-gray-100 pb-8 mb-8">
                                {/* Tanaka: Full-width kop surat */}
                                {invoice.cabang === 'Tanaka' && (
                                    <div className="-mx-10 md:-mx-16 -mt-10 md:-mt-16 mb-6">
                                        <img src={LogoTanaka} alt="Kop Surat Tanaka" className="w-full object-cover" />
                                    </div>
                                )}
                                {/* Other branches: Logo + INVOICE side by side */}
                                {invoice.cabang !== 'Tanaka' && (
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            {invoice.cabang === 'Banua' && (
                                                <img src={LogoBanua} alt="Logo Banua" className="h-24 object-contain" />
                                            )}
                                            {invoice.cabang === 'Acestreet' && (
                                                <img src={LogoAcestreet} alt="Logo Acestreet" className="h-32 object-contain" />
                                            )}
                                        </div>
                                        <div className="text-right shrink-0 ml-8">
                                            <h1 className="text-4xl font-black text-gray-200 tracking-widest mb-2">INVOICE</h1>
                                            <p className="font-bold text-gray-800 text-lg">{invoice.no_invoice}</p>
                                            <div className="text-sm text-gray-500 mt-2">
                                                <p>Date: <span className="font-medium text-gray-800">{new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID')}</span></p>
                                                <p>Due Date: <span className="font-medium text-gray-800">{new Date(invoice.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}</span></p>
                                                {invoice.no_po_kontrak && <p className="mt-1">No. PO/Kontrak: <span className="font-medium text-gray-800">{invoice.no_po_kontrak}</span></p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Tanaka: INVOICE info below kop surat */}
                                {invoice.cabang === 'Tanaka' && (
                                    <div className="flex justify-between items-start">
                                        <div></div>
                                        <div className="text-right">
                                            <h1 className="text-4xl font-black text-gray-200 tracking-widest mb-2">INVOICE</h1>
                                            <p className="font-bold text-gray-800 text-lg">{invoice.no_invoice}</p>
                                            <div className="text-sm text-gray-500 mt-2">
                                                <p>Date: <span className="font-medium text-gray-800">{new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID')}</span></p>
                                                <p>Due Date: <span className="font-medium text-gray-800">{new Date(invoice.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}</span></p>
                                                {invoice.no_po_kontrak && <p className="mt-1">No. PO/Kontrak: <span className="font-medium text-gray-800">{invoice.no_po_kontrak}</span></p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Address */}
                                <p className={`text-sm whitespace-pre-line mt-1 max-w-md ${isBanua ? 'text-blue-700/70' : 'text-gray-500'}`}>{addresses[invoice.cabang] || ''}</p>
                            </div>
                        );
                    })()}

                    {/* Customer */}
                    <div className="mb-10">
                        <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Billed To:</p>
                        <h2 className="text-xl font-bold text-gray-800">{invoice.nama_pt}</h2>
                        <p className="text-gray-600 mt-1 max-w-sm">{invoice.alamat_pt}</p>
                        {invoice.up_penagihan && <p className="text-gray-600 mt-1 font-medium">UP: {invoice.up_penagihan}</p>}
                        {invoice.cp_penagihan && <p className="text-gray-600 mt-1 font-medium">CP: {invoice.cp_penagihan}</p>}

                    </div>

                    {/* Deskripsi Pesanan */}
                    {invoice.deskripsi_pesanan && (
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Pesanan</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.deskripsi_pesanan}</p>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className={`${invoice.cabang === 'Banua' ? 'bg-blue-800' : 'bg-[#990000]'} text-white`}>
                                    <th className="p-3 font-semibold text-sm">Nama Produk</th>
                                    <th className="p-3 font-semibold text-sm text-center">Ukuran</th>
                                    <th className="p-3 font-semibold text-sm text-center">Qty</th>
                                    <th className="p-3 font-semibold text-sm text-center">Unit</th>
                                    <th className="p-3 font-semibold text-sm text-right">Harga Satuan</th>
                                    <th className="p-3 font-semibold text-sm text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let items = [];
                                    if (typeof invoice.items === 'string') {
                                        try { items = JSON.parse(invoice.items); } catch (e) { }
                                    } else if (Array.isArray(invoice.items)) {
                                        items = invoice.items;
                                    }

                                    if (items && items.length > 0) {
                                        return items.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-200">
                                                <td className="p-3 text-gray-800 align-top">{item.rincian}</td>
                                                <td className="p-3 text-gray-800 align-top text-center font-bold">{item.ukuran || '-'}</td>
                                                <td className="p-3 text-gray-800 align-top text-center">{item.qty}</td>
                                                <td className="p-3 text-gray-800 align-top text-center">{item.satuan || 'Pcs'}</td>
                                                <td className="p-3 text-gray-800 align-top text-right min-w-[120px]"><PriceCell value={item.harga_satuan} /></td>
                                                <td className="p-3 text-gray-800 align-top text-right font-medium min-w-[120px]"><PriceCell value={item.qty * item.harga_satuan} /></td>
                                            </tr>
                                        ));
                                    } else {
                                        return (
                                            <tr className="border-b border-gray-200">
                                                <td className="p-3 text-gray-800 align-top">{invoice.detail_pekerjaan}</td>
                                                <td className="p-3 text-gray-800 align-top text-center">-</td>
                                                <td className="p-3 text-gray-800 align-top text-center">{invoice.qty}</td>
                                                <td className="p-3 text-gray-800 align-top text-center">Pcs</td>
                                                <td className="p-3 text-gray-800 align-top text-right min-w-[120px]"><PriceCell value={invoice.harga_satuan} /></td>
                                                <td className="p-3 text-gray-800 align-top text-right font-medium min-w-[120px]"><PriceCell value={invoice.subtotal} /></td>
                                            </tr>
                                        )
                                    }
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Notes */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="border-l-4 border-gray-200 pl-3 space-y-3">
                                {/* Payment Method block */}
                                {(() => {
                                    const defaultNotes = {
                                        Banua: `PAYMENT METHOD :\nBank                      : BANK RAKYAT INDONESIA (BRI)\nCabang                    : Yogyakarta\nNo. Rekening              : 2099 0100 0545 304\nAtas Nama                 : PT BANUA MITRA LESTARI`,
                                        Tanaka: `PAYMENT METHOD :\nBank                      : BANK RAKYAT INDONESIA (BRI)\nCabang                    : Yogyakarta\nNo. Rekening              : 2099 0100 0495 305\nAtas Nama                 : PT TANAKA RIZQI BAROKAH`,
                                        Acestreet: `PAYMENT METHOD :\nBank                      : BANK RAKYAT INDONESIA (BRI)\nCabang                    : Yogyakarta\nNo. Rekening              : 2099 0100 0545 304\nAtas Nama                 : ACESTREET`
                                    };
                                    const noteText = invoice.note || defaultNotes[invoice.cabang] || "Terima kasih atas kerja sama Anda.";
                                    const noteLines = noteText.split('\n');
                                    return (
                                        <table className="text-xs text-gray-700 font-sans">
                                            <tbody>
                                                {noteLines.map((line, idx) => {
                                                    const colonIdx = line.indexOf(':');
                                                    if (colonIdx > 0 && colonIdx < line.length - 1) {
                                                        const label = line.substring(0, colonIdx).trim();
                                                        const value = line.substring(colonIdx + 1).trim();
                                                        return (
                                                            <tr key={idx}>
                                                                <td className="pr-1 py-0.5 whitespace-nowrap align-top">{label}</td>
                                                                <td className="py-0.5 whitespace-nowrap align-top">: {value}</td>
                                                            </tr>
                                                        );
                                                    } else {
                                                        return (
                                                            <tr key={idx}>
                                                                <td colSpan="2" className="py-0.5 font-bold">{line.trim()}</td>
                                                            </tr>
                                                        );
                                                    }
                                                })}
                                            </tbody>
                                        </table>
                                    );
                                })()}

                                {/* Term of Payment — only shown if filled */}
                                {invoice.term_of_payment && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-700 mb-1">Term of Payment :</p>
                                        <p className="text-xs text-gray-600 whitespace-pre-line">{invoice.term_of_payment}</p>
                                    </div>
                                )}

                                {/* Keterangan tambahan */}
                                {invoice.keterangan && (
                                    <div className="pt-1">
                                        <p className="text-xs text-gray-500 italic">{invoice.keterangan}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full md:w-80">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">Subtotal</td>
                                        <td className="py-2 text-gray-600">:</td>
                                        <td className="py-2 text-right font-semibold text-gray-800"><PriceCell value={invoice.subtotal} /></td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">PPN</td>
                                        <td className="py-2 text-gray-600">:</td>
                                        <td className="py-2 text-right font-semibold text-gray-800"><PriceCell value={invoice.jumlah_ppn} /></td>
                                    </tr>
                                    {invoice.diskon > 0 && (
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 font-medium">Diskon {invoice.diskon_persen > 0 && `(${invoice.diskon_persen}%)`}</td>
                                            <td className="py-2 text-gray-600">:</td>
                                            <td className="py-2 text-right font-semibold text-gray-800"><PriceCell value={-invoice.diskon} /></td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className={`py-3 font-bold ${invoice.cabang === 'Banua' ? 'text-blue-800' : 'text-[#990000]'}`}>GRAND TOTAL</td>
                                        <td className={`py-3 font-bold ${invoice.cabang === 'Banua' ? 'text-blue-800' : 'text-[#990000]'}`}>:</td>
                                        <td className={`py-3 text-right font-black text-xl ${invoice.cabang === 'Banua' ? 'text-blue-800' : 'text-[#990000]'}`}>
                                            <div className="flex justify-between w-full">
                                                <span>Rp</span>
                                                <span>{Number(invoice.grand_total || 0).toLocaleString('id-ID')}</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    {(invoice.ttd || invoice.nama_accounting || invoice.penanggung_jawab) && (
                        <div className="mt-20 flex justify-between px-10">
                            {/* Left Signature: Prepared By */}
                            <div className="text-center w-48">
                                <p className="text-gray-600 mb-4">Prepared by,</p>
                                <div className="h-24"></div>
                                <p className="font-bold text-gray-800 underline decoration-gray-300 underline-offset-4">
                                    {invoice.nama_accounting || (invoice.cabang === 'Banua' ? 'Aji Pangestu' : invoice.cabang === 'Tanaka' ? 'M.Rangga Maulana' : '(.........................)')}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">Marketing</p>
                            </div>

                            {/* Right Signature: Approved By */}
                            <div className="text-center w-48 relative">
                                <p className="text-gray-600 mb-2">Approved by,</p>

                                <div className="h-24 flex flex-col items-center justify-center relative">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=Validasi_Invoice_${invoice.no_invoice || invoice.id}`} alt="QR Code" className="w-16 h-16 opacity-80" />
                                    <div className="absolute top-1/2 left-1/2 w-full text-blue-800" style={{ fontFamily: "'Brush Script MT', cursive, serif", fontSize: '1.5rem', transform: 'translate(-50%, -50%) rotate(-5deg)' }}>
                                        {invoice.penanggung_jawab || ((invoice.cabang === 'Banua' || invoice.cabang === 'Tanaka' || invoice.cabang === 'Acestreet') ? 'Hanifah Abdillah' : '')}
                                    </div>
                                </div>

                                <p className="font-bold text-gray-800 underline decoration-gray-300 underline-offset-4">
                                    {invoice.penanggung_jawab || ((invoice.cabang === 'Banua' || invoice.cabang === 'Tanaka' || invoice.cabang === 'Acestreet') ? 'Hanifah Abdillah' : '(.........................)')}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">{invoice.jabatan || 'Accounting'}</p>
                            </div>
                        </div>
                    )}

                </div>

                {/* Print Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body { background: white; }
                        @page { size: auto; margin: 0mm; }
                    }
                `}} />

            </main>
        </div>
    );
};

export default InvoicePreview;