import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuotationById } from '../api/quotationApi';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../components/Sidebar';
import LogoBanua from '../assets/LOGO BANUA.png';
import LogoTanaka from '../assets/kop_tanaka.png';
import LogoAcestreet from '../assets/logoacestreet.png';

const addresses = {
    Banua: 'Geblagan, Tamantirto, Kasihan, Bantul Regency,\nSpecial Region of Yogyakarta 55184\nMarketing: +62 888 8888 8888 | Finance: +62 857 2768 4722',
    Tanaka: 'Jl. Demakan Jl. Wiratama No.50, Tegalrejo, Kec. Tegalrejo,\nKota Yogyakarta, Daerah Istimewa Yogyakarta 55244\nMarketing: +62 851 6975 9267 | Finance: +62 857 2768 4722',
    Acestreet: 'Jl. Ambarbinangun, Brajan, Tamantirto, Kec. Kasihan,\nKabupaten Bantul, Daerah Istimewa Yogyakarta 55184\nMarketing: +62 838 2236 7608 | Finance: +62 857 2768 4722'
};

const QuotationPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quotation, setQuotation] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getQuotationById(id);
                if (res.data.status === 'success') {
                    const d = res.data.data;
                    if (typeof d.items_detail === 'string') { try { d.items_detail = JSON.parse(d.items_detail); } catch(e) { d.items_detail = []; } }
                    if (typeof d.file_uploads === 'string') { try { d.file_uploads = JSON.parse(d.file_uploads); } catch(e) { d.file_uploads = []; } }
                    setQuotation(d);
                }
            } catch (err) { console.error('Error:', err); }
        };
        fetch();
    }, [id]);

    const handlePrint = () => window.print();

    const handleDownloadPdf = async () => {
        if (!quotation) return;
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const loadImageBase64 = (src) => new Promise((resolve) => {
                const img = new Image(); img.crossOrigin = 'anonymous';
                img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); };
                img.onerror = () => resolve(null); img.src = src;
            });

            const ptNames = { Banua: 'PT BANUA MITRA LESTARI', Tanaka: 'PT TANAKA RIZQI BAROKAH', Acestreet: 'ACESTREET' };
            const fmtRp = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            const isBanua = quotation.cabang === 'Banua';

            let addressStartY = 24; let yOffset = 0;
            if (quotation.cabang === 'Banua') {
                const logoData = await loadImageBase64(LogoBanua);
                if (logoData) { doc.addImage(logoData, 'PNG', 14, 6, 55, 22); addressStartY = 30; }
            } else if (quotation.cabang === 'Tanaka') {
                const logoData = await loadImageBase64(LogoTanaka);
                if (logoData) { const kopHeight = 210 / 4.58; doc.addImage(logoData, 'PNG', 0, 0, 210, kopHeight); yOffset = kopHeight - 10; addressStartY = kopHeight + 4; }
            } else if (quotation.cabang === 'Acestreet') {
                const logoData = await loadImageBase64(LogoAcestreet);
                if (logoData) { doc.addImage(logoData, 'PNG', 14, 2, 45, 50); addressStartY = 32; }
            }

            doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
            (addresses[quotation.cabang] || '').split('\n').forEach((line, i) => doc.text(line.trim(), 14, addressStartY + (i * 4)));

            doc.setFontSize(28); doc.setFont('helvetica', 'bold'); doc.setTextColor(50, 50, 50);
            doc.text("QUOTATION", 196, 20 + yOffset, { align: 'right' });
            doc.setFontSize(10); doc.setFont('helvetica', 'normal');
            doc.text(`No: ${quotation.no_quotation || ''}`, 196, 28 + yOffset, { align: 'right' });
            doc.text(`Date: ${quotation.tanggal_quotation ? new Date(quotation.tanggal_quotation).toLocaleDateString('id-ID') : ''}`, 196, 34 + yOffset, { align: 'right' });
            doc.text(`Berlaku: ${quotation.tanggal_berlaku ? new Date(quotation.tanggal_berlaku).toLocaleDateString('id-ID') : ''}`, 196, 40 + yOffset, { align: 'right' });
            if (quotation.jenis_pembayaran) doc.text(`Pembayaran: ${quotation.jenis_pembayaran}`, 196, 46 + yOffset, { align: 'right' });

            doc.setDrawColor(200, 200, 200); doc.line(14, 52 + yOffset, 196, 52 + yOffset);

            doc.setFontSize(11); doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
            doc.text("Kepada:", 14, 62 + yOffset);
            doc.setFont("helvetica", "normal");
            doc.text(quotation.nama_pt || '', 14, 68 + yOffset);
            doc.text(quotation.alamat_pt || '', 14, 73 + yOffset, { maxWidth: 80 });
            if (quotation.up_penagihan) doc.text(`UP: ${quotation.up_penagihan}`, 14, 79 + yOffset);
            if (quotation.cp_penagihan) doc.text(`CP: ${quotation.cp_penagihan}`, 14, 84 + yOffset);

            if (quotation.deskripsi_pesanan) {
                doc.setFontSize(9); doc.setTextColor(100); doc.text('Deskripsi Pesanan:', 14, 92 + yOffset);
                doc.setTextColor(50); doc.text(quotation.deskripsi_pesanan, 14, 97 + yOffset, { maxWidth: 170 });
            }

            const items = quotation.items_detail || [];
            const tableColumn = ["Nama Produk", "Detail", "Qty", "Unit", "Harga Satuan", "Total"];
            const tableRows = items.map(item => [
                item.rincian || '', item.ukuran || '-', item.qty || 0, item.satuan || 'Pcs',
                fmtRp(item.harga_satuan), fmtRp(Number(item.qty || 0) * Number(item.harga_satuan || 0))
            ]);

            const headerColor = isBanua ? [30, 64, 175] : [153, 0, 0];
            autoTable(doc, { head: [tableColumn], body: tableRows, startY: (quotation.deskripsi_pesanan ? 103 : 92) + yOffset, theme: 'grid',
                headStyles: { fillColor: headerColor, textColor: '#fff', fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 9, cellPadding: 3 }
            });

            let finalY = doc.lastAutoTable.finalY + 10;

            // Payment note (left)
            const noteText = quotation.payment_note || '';
            if (noteText) {
                doc.setFontSize(9); doc.setTextColor(80);
                noteText.split('\n').forEach((line, i) => doc.text(line, 14, finalY + (i * 5)));
            }
            if (quotation.term_of_payment) {
                const topLines = noteText ? noteText.split('\n').length : 0;
                const topY = finalY + (topLines * 5) + 5;
                doc.setFontSize(9); doc.setTextColor(80); doc.text('Term of Payment:', 14, topY);
                quotation.term_of_payment.split('\n').forEach((line, i) => doc.text(line, 14, topY + 5 + (i * 5)));
            }

            // Totals (right)
            doc.setFontSize(10); doc.setTextColor(0);
            doc.text('Subtotal:', 130, finalY); doc.text(fmtRp(quotation.subtotal), 195, finalY, { align: 'right' });
            doc.text(`PPN (${quotation.ppn_persen || 0}%):`, 130, finalY + 6); doc.text(fmtRp(quotation.jumlah_ppn), 195, finalY + 6, { align: 'right' });
            if (quotation.diskon > 0) { doc.text(`Diskon (${quotation.diskon_persen || 0}%):`, 130, finalY + 12); doc.text(`- ${fmtRp(quotation.diskon)}`, 195, finalY + 12, { align: 'right' }); }
            const gtY = quotation.diskon > 0 ? finalY + 22 : finalY + 16;
            doc.setFontSize(12); doc.setTextColor(...headerColor); doc.setFont(undefined, 'bold');
            doc.text('GRAND TOTAL:', 130, gtY); doc.text(fmtRp(quotation.grand_total_quo), 195, gtY, { align: 'right' });

            // Signatures
            const sigY = Math.max(gtY + 30, doc.internal.pageSize.height - 50);
            doc.setFontSize(10); doc.setTextColor(0); doc.setFont(undefined, 'normal');
            doc.text('Marketing,', 40, sigY, { align: 'center' }); doc.text('Client,', 150, sigY, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text(quotation.nama_marketing || '________________', 40, sigY + 30, { align: 'center' });
            doc.text(quotation.nama_client_ttd || '________________', 150, sigY + 30, { align: 'center' });

            doc.save(`Quotation_${(quotation.no_quotation || 'draft').replace(/\//g, '_')}.pdf`);
        } catch (error) { console.error('PDF error:', error); alert('Gagal menghasilkan PDF.'); }
    };

    if (!quotation) return <div className="p-8 text-center">Memuat...</div>;

    const formatRupiah = (number) => 'Rp ' + Number(number || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const PriceCell = ({ value }) => (<div className="flex justify-between w-full text-sm"><span>Rp</span><span>{Number(value || 0).toLocaleString('id-ID')}</span></div>);
    const items = quotation.items_detail || [];
    const isBanua = quotation.cabang === 'Banua';
    const textColor = isBanua ? 'text-blue-800' : 'text-[#990000]';

    return (
        <div className="flex bg-gray-100 min-h-screen font-sans">
            <div className="print:hidden"><Sidebar /></div>
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen print:p-0 print:h-auto print:overflow-visible">
                {/* Actions Header */}
                <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 border border-gray-200">
                        <ArrowLeft size={18} /> Kembali
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-900 font-medium"><Printer size={18} /> Print</button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-5 py-2.5 bg-[#990000] text-white rounded-lg shadow hover:bg-red-800 font-medium"><Download size={18} /> Download PDF</button>
                    </div>
                </div>

                {/* A4 Paper Container */}
                <div className="max-w-4xl mx-auto bg-white min-h-[297mm] p-10 md:p-16 shadow-xl print:shadow-none print:p-0">

                    {/* Header */}
                    {(() => {
                        return (
                            <div className="border-b-2 border-gray-100 pb-8 mb-8">
                                {quotation.cabang === 'Tanaka' && (
                                    <div className="-mx-10 md:-mx-16 -mt-10 md:-mt-16 mb-6">
                                        <img src={LogoTanaka} alt="Kop Surat Tanaka" className="w-full object-cover" />
                                    </div>
                                )}
                                {quotation.cabang !== 'Tanaka' && (
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            {quotation.cabang === 'Banua' && <img src={LogoBanua} alt="Logo Banua" className="h-24 object-contain" />}
                                            {quotation.cabang === 'Acestreet' && <img src={LogoAcestreet} alt="Logo Acestreet" className="h-32 object-contain" />}
                                        </div>
                                        <div className="text-right shrink-0 ml-8">
                                            <h1 className="text-4xl font-black text-gray-200 tracking-widest mb-2">QUOTATION</h1>
                                            <p className="font-bold text-gray-800 text-lg">{quotation.no_quotation}</p>
                                            <div className="text-sm text-gray-500 mt-2">
                                                <p>Date: <span className="font-medium text-gray-800">{quotation.tanggal_quotation ? new Date(quotation.tanggal_quotation).toLocaleDateString('id-ID') : '-'}</span></p>
                                                <p>Berlaku: <span className="font-medium text-gray-800">{quotation.tanggal_berlaku ? new Date(quotation.tanggal_berlaku).toLocaleDateString('id-ID') : '-'}</span></p>
                                                {quotation.jenis_pembayaran && <p className="mt-1">Pembayaran: <span className="font-medium text-gray-800">{quotation.jenis_pembayaran}</span></p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {quotation.cabang === 'Tanaka' && (
                                    <div className="flex justify-between items-start">
                                        <div></div>
                                        <div className="text-right">
                                            <h1 className="text-4xl font-black text-gray-200 tracking-widest mb-2">QUOTATION</h1>
                                            <p className="font-bold text-gray-800 text-lg">{quotation.no_quotation}</p>
                                            <div className="text-sm text-gray-500 mt-2">
                                                <p>Date: <span className="font-medium text-gray-800">{quotation.tanggal_quotation ? new Date(quotation.tanggal_quotation).toLocaleDateString('id-ID') : '-'}</span></p>
                                                <p>Berlaku: <span className="font-medium text-gray-800">{quotation.tanggal_berlaku ? new Date(quotation.tanggal_berlaku).toLocaleDateString('id-ID') : '-'}</span></p>
                                                {quotation.jenis_pembayaran && <p className="mt-1">Pembayaran: <span className="font-medium text-gray-800">{quotation.jenis_pembayaran}</span></p>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className={`text-sm whitespace-pre-line mt-1 max-w-md ${isBanua ? 'text-blue-700/70' : 'text-gray-500'}`}>{addresses[quotation.cabang] || ''}</p>
                            </div>
                        );
                    })()}

                    {/* Customer / Billed To */}
                    <div className="mb-10">
                        <p className="text-sm font-bold text-gray-400 mb-2 uppercase">Kepada:</p>
                        <h2 className="text-xl font-bold text-gray-800">{quotation.nama_pt}</h2>
                        <p className="text-gray-600 mt-1 max-w-sm">{quotation.alamat_pt}</p>
                        {quotation.up_penagihan && <p className="text-gray-600 mt-1 font-medium">UP: {quotation.up_penagihan}</p>}
                        {quotation.cp_penagihan && <p className="text-gray-600 mt-1 font-medium">CP: {quotation.cp_penagihan}</p>}
                        {quotation.email_customer && <p className="text-gray-600 mt-1 font-medium">Email: {quotation.email_customer}</p>}
                    </div>

                    {/* Deskripsi Pesanan */}
                    {quotation.deskripsi_pesanan && (
                        <div className="mb-6">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Pesanan</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{quotation.deskripsi_pesanan}</p>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full text-left">
                            <thead>
                                <tr className={`${isBanua ? 'bg-blue-800' : 'bg-[#990000]'} text-white`}>
                                    <th className="p-3 font-semibold text-sm">Nama Produk</th>
                                    <th className="p-3 font-semibold text-sm text-center">Detail</th>
                                    <th className="p-3 font-semibold text-sm text-center">Qty</th>
                                    <th className="p-3 font-semibold text-sm text-center">Unit</th>
                                    <th className="p-3 font-semibold text-sm text-right">Harga Satuan</th>
                                    <th className="p-3 font-semibold text-sm text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="p-3 text-gray-800 align-top">{item.rincian}</td>
                                        <td className="p-3 text-gray-800 align-top text-center font-bold">{item.ukuran || '-'}</td>
                                        <td className="p-3 text-gray-800 align-top text-center">{item.qty}</td>
                                        <td className="p-3 text-gray-800 align-top text-center">{item.satuan || 'Pcs'}</td>
                                        <td className="p-3 text-gray-800 align-top text-right min-w-[120px]"><PriceCell value={item.harga_satuan} /></td>
                                        <td className="p-3 text-gray-800 align-top text-right font-medium min-w-[120px]"><PriceCell value={item.qty * item.harga_satuan} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Notes */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="border-l-4 border-gray-200 pl-3">
                                {(() => {
                                    const defaultNotes = {
                                        Banua: `PAYMENT METHOD :\nBank                      : BANK RAKYAT INDONESIA (BRI)\nCabang                    : Yogyakarta\nNo. Rekening              : 2099 0100 0545 304\nAtas Nama                 : PT BANUA MITRA LESTARI`,
                                        Tanaka: `PAYMENT METHOD :\nBank                      : BANK RAKYAT INDONESIA (BRI)\nCabang                    : Yogyakarta\nNo. Rekening              : 2099 0100 0495 305\nAtas Nama                 : PT TANAKA RIZQI BAROKAH`,
                                        Acestreet: `PAYMENT METHOD :\nBank                      : BANK RAKYAT INDONESIA (BRI)\nCabang                    : Yogyakarta\nNo. Rekening              : 2099 0100 0545 304\nAtas Nama                 : ACESTREET`
                                    };
                                    const noteText = quotation.payment_note || defaultNotes[quotation.cabang] || '';
                                    const noteLines = noteText.split('\n');
                                    return (
                                        <table className="text-xs text-gray-700 font-sans">
                                            <tbody>
                                                {noteLines.map((line, idx) => {
                                                    const colonIdx = line.indexOf(':');
                                                    if (colonIdx > 0 && colonIdx < line.length - 1) {
                                                        return (<tr key={idx}><td className="pr-1 py-0.5 whitespace-nowrap align-top">{line.substring(0, colonIdx).trim()}</td><td className="py-0.5 whitespace-nowrap align-top">: {line.substring(colonIdx + 1).trim()}</td></tr>);
                                                    } else {
                                                        return (<tr key={idx}><td colSpan="2" className="py-0.5 font-bold">{line.trim()}</td></tr>);
                                                    }
                                                })}
                                            </tbody>
                                        </table>
                                    );
                                })()}
                                {quotation.term_of_payment && (
                                    <div className="mt-3">
                                        <p className="text-xs font-bold text-gray-600">Term of Payment:</p>
                                        <p className="text-xs text-gray-600 whitespace-pre-line">{quotation.term_of_payment}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-full md:w-80">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">Subtotal</td><td className="py-2 text-gray-600">:</td>
                                        <td className="py-2 text-right font-semibold text-gray-800"><PriceCell value={quotation.subtotal} /></td>
                                    </tr>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 text-gray-600">PPN ({quotation.ppn_persen || 0}%)</td><td className="py-2 text-gray-600">:</td>
                                        <td className="py-2 text-right font-semibold text-gray-800"><PriceCell value={quotation.jumlah_ppn} /></td>
                                    </tr>
                                    {quotation.diskon > 0 && (
                                        <tr className="border-b border-gray-100">
                                            <td className="py-2 text-gray-600 font-medium">Diskon {quotation.diskon_persen > 0 && `(${quotation.diskon_persen}%)`}</td><td className="py-2 text-gray-600">:</td>
                                            <td className="py-2 text-right font-semibold text-gray-800"><PriceCell value={-quotation.diskon} /></td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className={`py-3 font-bold ${textColor}`}>GRAND TOTAL</td><td className={`py-3 font-bold ${textColor}`}>:</td>
                                        <td className={`py-3 text-right font-black text-xl ${textColor}`}>
                                            <div className="flex justify-between w-full"><span>Rp</span><span>{Number(quotation.grand_total_quo || 0).toLocaleString('id-ID')}</span></div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-20 flex justify-between px-10">
                        <div className="text-center w-48">
                            <p className="text-gray-600 mb-4">Marketing,</p>
                            <div className="h-24"></div>
                            <p className="font-bold text-gray-800 underline decoration-gray-300 underline-offset-4">
                                {quotation.nama_marketing || '(.........................)'}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">Marketing</p>
                        </div>
                        <div className="text-center w-48">
                            <p className="text-gray-600 mb-4">Client,</p>
                            <div className="h-24"></div>
                            <p className="font-bold text-gray-800 underline decoration-gray-300 underline-offset-4">
                                {quotation.nama_client_ttd || '(.........................)'}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">Client</p>
                        </div>
                    </div>

                    {/* Uploaded Files */}
                    {quotation.file_uploads && quotation.file_uploads.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-200 print:hidden">
                            <h4 className="font-bold text-sm text-gray-700 mb-3">DOKUMEN PENDUKUNG</h4>
                            <div className="flex flex-wrap gap-2">
                                {quotation.file_uploads.map((f, i) => (
                                    <a key={i} href={`http://localhost:3000${f.path}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 border border-blue-200">{f.originalname}</a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Print Styles */}
                <style dangerouslySetInnerHTML={{ __html: `@media print { body { background: white; } @page { size: auto; margin: 0mm; } }` }} />
            </main>
        </div>
    );
};

export default QuotationPreview;
