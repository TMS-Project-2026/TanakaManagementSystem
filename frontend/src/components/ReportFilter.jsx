import React from 'react';
import { Search, Filter, Printer, Download, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportFilter = ({ filters, setFilters, onFilter, onPrint, dataForExport, exportFileName, columns }) => {
    
    const handleDownloadPDF = () => {
        if (!dataForExport || dataForExport.length === 0) return alert('Tidak ada data untuk diexport');
        const doc = new jsPDF();
        doc.text(`Laporan ${exportFileName}`, 14, 15);
        autoTable(doc, {
            head: [columns.map(c => c.header)],
            body: dataForExport.map(row => columns.map(c => row[c.key] || '-')),
            startY: 20
        });
        doc.save(`${exportFileName}.pdf`);
    };

    const handleDownloadExcel = () => {
        if (!dataForExport || dataForExport.length === 0) return alert('Tidak ada data untuk diexport');
        
        // Prepare data
        const wsData = dataForExport.map(row => {
            const obj = {};
            columns.forEach(c => {
                obj[c.header] = row[c.key] || '-';
            });
            return obj;
        });

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${exportFileName}.xlsx`);
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Dari Tanggal</label>
                    <input 
                        type="date" 
                        value={filters.startDate}
                        onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-sm w-full md:w-40"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sampai Tanggal</label>
                    <input 
                        type="date" 
                        value={filters.endDate}
                        onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-sm w-full md:w-40"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Cabang</label>
                    <select 
                        value={filters.cabang} 
                        onChange={(e) => setFilters({...filters, cabang: e.target.value})}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-sm bg-white w-full md:w-40"
                    >
                        <option value="Semua Cabang">Semua Cabang</option>
                        <option value="Banua">Banua</option>
                        <option value="Tanaka">Tanaka</option>
                        <option value="Acestreet">Acestreet</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={onFilter}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 h-[38px]"
                    >
                        <Filter size={16} /> Filter
                    </button>
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end">
                {onPrint && (
                    <button onClick={onPrint} className="bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg transition-colors" title="Cetak">
                        <Printer size={18} />
                    </button>
                )}
                {dataForExport && (
                    <>
                        <button onClick={handleDownloadPDF} className="bg-gray-50 hover:bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium" title="Download PDF">
                            <Download size={18} /> PDF
                        </button>
                        <button onClick={handleDownloadExcel} className="bg-gray-50 hover:bg-green-50 text-green-600 border border-green-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium" title="Download Excel">
                            <FileSpreadsheet size={18} /> Excel
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportFilter;
