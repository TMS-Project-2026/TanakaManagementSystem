import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, FileText, Upload, Printer, Activity, AlertTriangle, UserCircle, RefreshCcw, DollarSign, TrendingUp, CreditCard, PiggyBank, X, ShoppingBag, ShoppingCart, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { journalApi } from '../api/journalApi';
import { accountApi } from '../api/accountApi';
import { getAllPiutang } from '../api/piutangApi';
import { getAllHutang } from '../api/hutangApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Journal = () => {
  // Chart of Accounts (COA) Structure
  const COA = [
    {
      group: '1-1000 - ASET LANCAR (CURRENT ASSETS)',
      accounts: [
        { code: '1-1100', name: 'Kas di Bank (Cash in Bank)' },
        { code: '1-1110', name: 'Kas di Bank (Cash in Bank) - BRI BANUA' },
        { code: '1-1120', name: 'Kas di Bank (Cash in Bank) - BRI TANAKA' },
        { code: '1-1130', name: 'Kas di Bank (Cash in Bank) - BCA BANUA' },
        { code: '1-1200', name: 'Kas Kecil (Petty Cash)' },
        { code: '1-1300', name: 'Piutang Usaha' },
        { code: '1-1400', name: 'Piutang Dagang' },
        { code: '1-1500', name: 'Persediaan Barang Jadi' },
        { code: '1-1600', name: 'Persediaan Barang Setengah Jadi (On Process)' },
        { code: '1-1700', name: 'Persediaan Bahan Baku' },
        { code: '1-1800', name: 'Perlengkapan Kantor' },
      ]
    },
    {
      group: '1-2000 - ASET TETAP (FIXED ASSETS)',
      accounts: [
        { code: '1-2100', name: 'Peralatan Kantor' },
        { code: '1-2200', name: 'Peralatan Mesin' },
        { code: '1-2300', name: 'Kendaraan' },
        { code: '1-2400', name: 'Gedung' },
        { code: '1-2500', name: 'Tanah' },
        { code: '1-2600', name: 'Akumulasi Penyusutan Peralatan Kantor' },
        { code: '1-2700', name: 'Akumulasi Penyusutan Peralatan Mesin' },
        { code: '1-2800', name: 'Akumulasi Penyusutan Kendaraan' },
        { code: '1-2900', name: 'Akumulasi Penyusutan Gedung' },
      ]
    },
    {
      group: '2-1000 - KEWAJIBAN (LIABILITIES)',
      accounts: [
        { code: '2-1100', name: 'Hutang Usaha' },
        { code: '2-1200', name: 'Hutang Vendor & Mitra' },
        { code: '2-1300', name: 'Hutang Gaji & Insentif' },
        { code: '2-1400', name: 'Hutang Bank' },
        { code: '2-1500', name: 'Hutang Deviden' },
        { code: '2-1600', name: 'Prive Pemilik' },
      ]
    },
    {
      group: '3-1000 - MODAL (EKUITAS)',
      accounts: [
        { code: '3-1100', name: 'Modal Disetor' },
        { code: '3-1200', name: 'Laba Ditahan' },
      ]
    },
    {
      group: '4-1000 - PENDAPATAN / PENJUALAN (REVENUE)',
      accounts: [
        { code: '4-1100', name: 'Penjualan Offline' },
        { code: '4-1200', name: 'Penjualan Marketplace' },
        { code: '4-1300', name: 'Penjualan Dibayar Dimuka (Down Payment)' },
        { code: '4-1400', name: 'Retur Penjualan Offline' },
        { code: '4-1500', name: 'Retur Penjualan Marketplace' },
      ]
    },
    {
      group: '5-1000 - HARGA POKOK PENJUALAN (COST OF PROJECT)',
      accounts: [
        { code: '5-1100', name: 'HPP - Pemakaian Bahan Baku Kain dan Aksesoris' },
        { code: '5-1200', name: 'HPP - Biaya Tenaga Kerja Langsung (Jahit dan Bordir)' },
        { code: '5-1300', name: 'HPP - Biaya Perawatan Mesin' },
        { code: '5-1400', name: 'HPP - Biaya Utilitas Pabrik' },
        { code: '5-1500', name: 'HPP - Biaya Sewa Pabrik' },
      ]
    },
    {
      group: '6-1000 - BIAYA-BIAYA (EXPENSES)',
      accounts: [
        { code: '6-1100', name: 'Beban Listrik dan Air' },
        { code: '6-1200', name: 'Beban Utilitas' },
        { code: '6-1300', name: 'Beban Kuota & Internet' },
        { code: '6-1400', name: 'Beban Gaji dan Insentif' },
        { code: '6-1500', name: 'Beban Kesejahteraan Karyawan' },
        { code: '6-1600', name: 'Beban Marketing' },
        { code: '6-1700', name: 'Beban Perjalanan Dinas' },
        { code: '6-1800', name: 'Beban Sewa Gedung Kantor' },
        { code: '6-1900', name: 'Beban Administrasi dan Umum' },
        { code: '6-2000', name: 'Beban Reparasi dan Pemeliharaan Aset Kantor' },
        { code: '6-2100', name: 'Beban Penyusutan Peralatan Kantor' },
        { code: '6-2200', name: 'Beban Penyusutan Mesin Produksi' },
        { code: '6-2300', name: 'Beban Penyusutan Kendaraan' },
        { code: '6-2400', name: 'Beban Penyusutan Gedung' },
      ]
    }
  ];

  const { type } = useParams();
  const navigate = useNavigate();
  const tabMap = { sales: 'Sales', purchase: 'Purchase', general: 'General', expense: 'Expense' };
  const activeTab = tabMap[type] || 'Sales';
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ total_tx: 0, total_debit: 0, total_credit: 0, balance: 0 });
  const [financeSummary, setFinanceSummary] = useState({
    total_revenue: 0,
    total_receivable: 0,
    total_cash_in_bank: 0,
    total_tx: 0,
    piutang_terbayar_persen: 0,
    piutang_berjalan: 0
  });
  const [purchaseSummary, setPurchaseSummary] = useState({
    total_payable: 0,
    total_purchase: 0,
    cash_paid_out: 0,
    total_tx: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [viewJournal, setViewJournal] = useState(null);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('download'); // 'download' or 'print'
  const [selectedExportRange, setSelectedExportRange] = useState('all'); // 'daily' or 'all'
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    journal_type: 'Sales',
    branch: 'PT Banua Mitra Lestari',
    transaction_date: new Date().toISOString().split('T')[0],
    category: '',
    payment_status: 'Paid',
    due_date: '',
    debit_account: '',
    credit_account: '',
    description: '',
    debit: 0,
    credit: 0,
    notes: ''
  });

  const branches = ['PT Banua Mitra Lestari', 'PT Tanaka Rizqi Barokah', 'Accestret'];

  const getCategories = (type) => {
    if (type === 'Sales') return ['Revenue', 'Receivable', 'Cash', 'Adjustment'];
    if (type === 'Purchase') return ['Purchasing'];
    if (type === 'General') return ['General', 'Adjustment', 'Transfer', 'Koreksi'];
    if (type === 'Expense') return ['Beban Operasional', 'Beban Gaji', 'Beban Utilitas', 'Beban Marketing', 'Beban Lainnya'];
    return ['General'];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        type: activeTab,
        branch: filterBranch,
        category: filterCategory,
        from: filterDateFrom,
        to: filterDateTo,
        search: searchTerm
      };

      const [accountData, statsData] = await Promise.all([
        accountApi.getAllAccounts(),
        journalApi.getStats(activeTab)
      ]);

      // Jurnal Penjualan → data dari AR (Piutang)
      if (activeTab === 'Sales') {
        const [arRes, finSummary] = await Promise.all([
          getAllPiutang(),
          journalApi.getFinanceSummary()
        ]);
        const allAR = arRes.data.data || [];
        const arRows = allAR.map(p => ({
          id: `ar-${p.id}`,
          journal_type: 'Sales',
          transaction_id: p.no_ref,
          transaction_date: p.created_at || new Date().toISOString(),
          branch: p.cabang,
          category: 'Receivable',
          description: `${p.customer} — ${p.invoice_id || '-'}`,
          debit_account: '1-1300 Piutang Usaha',
          credit_account: '4-1100 Penjualan Offline',
          debit: Number(p.nominal),
          credit: Number(p.nominal),
          payment_status: p.status,
          due_date: p.jatuh_tempo,
          notes: p.keterangan || '',
          _source: 'ar'
        })).filter(r => {
          const ms = !searchTerm || r.description.toLowerCase().includes(searchTerm.toLowerCase()) || r.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
          const mc = !filterBranch || r.branch === filterBranch;
          return ms && mc;
        });
        setJournals(arRows);
        // Summary cards dihitung dari data AR real
        const totalNominal = allAR.filter(r=>r.status!=='Void').reduce((s,r)=>s+Number(r.nominal),0);
        const totalTerbayar = allAR.filter(r=>r.status!=='Void').reduce((s,r)=>s+Number(r.terbayar),0);
        const totalSisa = allAR.filter(r=>!['Paid','Void'].includes(r.status)).reduce((s,r)=>s+Number(r.sisa),0);
        const persen = totalNominal > 0 ? Math.min((totalTerbayar / totalNominal) * 100, 100) : 0;
        setFinanceSummary({
          total_revenue: totalNominal,
          total_receivable: totalSisa,
          total_cash_in_bank: totalTerbayar,
          total_tx: allAR.filter(r=>r.status!=='Void').length,
          piutang_terbayar_persen: parseFloat(persen.toFixed(2)),
          piutang_berjalan: totalSisa
        });
        setStats({ total_tx: arRows.length, total_debit: arRows.reduce((s,r)=>s+r.debit,0), total_credit: arRows.reduce((s,r)=>s+r.credit,0), balance: 0 });

      // Jurnal Pembelian → data dari AP (Hutang)
      } else if (activeTab === 'Purchase') {
        const [apRes, purchSum] = await Promise.all([
          getAllHutang(),
          journalApi.getPurchaseSummary()
        ]);
        const allAP = apRes.data.data || [];
        const apRows = allAP.map(h => ({
          id: `ap-${h.id}`,
          journal_type: 'Purchase',
          transaction_id: h.no_ref,
          transaction_date: h.created_at || new Date().toISOString(),
          branch: h.cabang,
          category: 'Purchasing',
          description: `${h.supplier} — ${h.invoice_id || '-'}`,
          debit_account: '5-1100 HPP - Pembelian Bahan Baku',
          credit_account: '2-1100 Hutang Usaha',
          debit: Number(h.nominal),
          credit: Number(h.nominal),
          payment_status: h.status,
          due_date: h.jatuh_tempo,
          notes: h.keterangan || '',
          _source: 'ap'
        })).filter(r => {
          const ms = !searchTerm || r.description.toLowerCase().includes(searchTerm.toLowerCase()) || r.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());
          const mc = !filterBranch || r.branch === filterBranch;
          return ms && mc;
        });
        setJournals(apRows);
        // Summary cards dihitung dari data AP real
        const totalNominal = allAP.filter(r=>r.status!=='Void').reduce((s,r)=>s+Number(r.nominal),0);
        const totalTerbayar = allAP.filter(r=>r.status!=='Void').reduce((s,r)=>s+Number(r.terbayar),0);
        const totalSisa = allAP.filter(r=>!['Paid','Void'].includes(r.status)).reduce((s,r)=>s+Number(r.sisa),0);
        setPurchaseSummary({
          total_payable: totalSisa,
          total_purchase: totalNominal,
          cash_paid_out: totalTerbayar,
          total_tx: allAP.filter(r=>r.status!=='Void').length
        });
        setStats({ total_tx: apRows.length, total_debit: apRows.reduce((s,r)=>s+r.debit,0), total_credit: apRows.reduce((s,r)=>s+r.credit,0), balance: 0 });

      } else {
        // General & Expense → tetap dari journalApi
        const journalData = await journalApi.getAllJournals(params);
        setJournals(journalData);
        setStats(statsData || { total_tx: 0, total_debit: 0, total_credit: 0, balance: 0 });
      }

      setAccounts(accountData.filter(a => a.status === 'Active'));
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [activeTab, filterBranch, filterCategory, filterDateFrom, filterDateTo]); // Auto fetch on filter change

  // Separate debounce for search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.debit) !== parseFloat(formData.credit)) {
      if (!window.confirm("Debit and Credit are not balanced. Are you sure you want to continue?")) {
        return;
      }
    }

    setSaving(true);
    try {
      let journalId = formData.id;
      if (formData.id) {
        await journalApi.updateJournal(formData.id, formData);
      } else {
        const res = await journalApi.createJournal(formData);
        journalId = res.id;
      }

      if (files.length > 0 && journalId) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        await journalApi.uploadFiles(journalId, fd);
      }

      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      journal_type: activeTab,
      branch: 'PT Banua Mitra Lestari',
      transaction_date: new Date().toISOString().split('T')[0],
      category: getCategories(activeTab)[0],
      payment_status: 'Paid',
      due_date: '',
      debit_account: '',
      credit_account: '',
      description: '',
      debit: 0,
      credit: 0,
      notes: ''
    });
    setFiles([]);
  };

  const handleEdit = (journal) => {
    setFormData({
      ...journal,
      transaction_date: journal.transaction_date.split('T')[0],
      payment_status: journal.payment_status || 'Paid',
      due_date: journal.due_date ? journal.due_date.split('T')[0] : ''
    });
    setFiles([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus jurnal ini?')) {
      try {
        await journalApi.deleteJournal(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number || 0);
  };

  const generatePdfFile = async () => {
    try {
      let dataToExport = [];
      if (selectedExportRange === 'daily') {
        dataToExport = journals.filter(j => j.transaction_date.split('T')[0] === exportDate);
      } else {
        dataToExport = journals;
      }

      if (dataToExport.length === 0) {
        alert('Tidak ada data untuk diekspor pada tanggal/periode yang dipilih');
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const dateRange = selectedExportRange === 'daily'
        ? new Date(exportDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Semua Data';

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Laporan Jurnal ${activeTab === 'Sales' ? 'Penjualan' : 'Pembelian'}`, 14, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${dateRange}`, 14, 25);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 30);

      const totalDebit = dataToExport.reduce((sum, j) => sum + parseFloat(j.debit || 0), 0);
      const totalCredit = dataToExport.reduce((sum, j) => sum + parseFloat(j.credit || 0), 0);

      const tableData = dataToExport.map((j, idx) => [
        idx + 1,
        new Date(j.transaction_date).toLocaleDateString('id-ID'),
        j.transaction_id,
        j.branch,
        j.category,
        j.description,
        j.debit_account || '-',
        j.credit_account || '-',
        formatRupiah(j.debit),
        formatRupiah(j.credit)
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Tanggal', 'No. Transaksi', 'Cabang', 'Kategori', 'Deskripsi', 'Debit Account', 'Credit Account', 'Debit', 'Credit']],
        body: tableData,
        foot: [['', '', '', '', '', '', '', 'TOTAL', formatRupiah(totalDebit), formatRupiah(totalCredit)]],
        theme: 'grid',
        headStyles: { fillColor: activeTab === 'Sales' ? [153, 0, 0] : [29, 78, 216], fontStyle: 'bold', fontSize: 7 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 8 }, 8: { halign: 'right' }, 9: { halign: 'right' } }
      });

      // Balance status
      const finalY = doc.lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.text(totalDebit === totalCredit ? '✓ Jurnal Seimbang' : '⚠ Jurnal Tidak Seimbang', 14, finalY);

      const fileName = `Jurnal_${activeTab}_${dateRange.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      setShowExportModal(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat file PDF');
    }
  };

  const printJournalReport = (journal) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const formattedDate = new Date(journal.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const amountLabel = journal.journal_type === 'Sales' ? 'Penjualan' : 'Pembelian';

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`Laporan Jurnal ${amountLabel}`, 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${journal.branch} • ${formattedDate}`, 14, 27);

      // Badge
      doc.setFillColor(journal.journal_type === 'Sales' ? 153 : 29, journal.journal_type === 'Sales' ? 0 : 78, journal.journal_type === 'Sales' ? 0 : 216);
      doc.roundedRect(170, 14, 25, 8, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(journal.journal_type, 182, 19, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      // Info section
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RINGKASAN TRANSAKSI', 14, 40);
      doc.setFont('helvetica', 'normal');

      autoTable(doc, {
        startY: 44,
        body: [
          ['No. Transaksi', journal.transaction_id, 'Kategori', journal.category],
          ['Cabang', journal.branch, 'Tanggal', formattedDate],
          ['Status', journal.payment_status || 'Paid', 'Due Date', journal.due_date ? new Date(journal.due_date).toLocaleDateString('id-ID') : '-']
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', textColor: [107, 114, 128] }, 2: { fontStyle: 'bold', textColor: [107, 114, 128] } }
      });

      // Detail table
      const detailY = doc.lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.text('DETAIL JURNAL', 14, detailY);

      autoTable(doc, {
        startY: detailY + 4,
        head: [['Deskripsi', 'Akun Debit', 'Akun Kredit', 'Debit', 'Kredit']],
        body: [[journal.description || '-', journal.debit_account || '-', journal.credit_account || '-', formatRupiah(journal.debit), formatRupiah(journal.credit)]],
        foot: [['', '', 'TOTAL', formatRupiah(journal.debit), formatRupiah(journal.credit)]],
        theme: 'grid',
        headStyles: { fillColor: journal.journal_type === 'Sales' ? [153, 0, 0] : [29, 78, 216], fontStyle: 'bold', fontSize: 9 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } }
      });

      // Balance status
      const statusY = doc.lastAutoTable.finalY + 6;
      const isBalanced = Number(journal.debit || 0) === Number(journal.credit || 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(isBalanced ? '✓ Jurnal Seimbang (Balance)' : '⚠ Jurnal Tidak Seimbang!', 14, statusY);

      // Notes
      if (journal.notes) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('CATATAN:', 14, statusY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(journal.notes, 14, statusY + 16);
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 196, 285, { align: 'right' });

      doc.save(`Jurnal_${journal.transaction_id}.pdf`);
    } catch (error) {
      console.error('Error generating journal PDF:', error);
      alert('Gagal membuat laporan jurnal PDF');
    }
  };

  const handlePrintPdf = () => {
    try {
      let dataToExport = [];
      if (selectedExportRange === 'daily') {
        dataToExport = journals.filter(j => j.transaction_date.split('T')[0] === exportDate);
      } else {
        dataToExport = journals;
      }

      if (dataToExport.length === 0) {
        alert('Tidak ada data untuk dicetak pada tanggal/periode yang dipilih');
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const dateRange = selectedExportRange === 'daily'
        ? new Date(exportDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
        : 'Semua Data';

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Laporan Jurnal ${activeTab === 'Sales' ? 'Penjualan' : 'Pembelian'}`, 14, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${dateRange}`, 14, 25);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 30);

      const totalDebit = dataToExport.reduce((sum, j) => sum + parseFloat(j.debit || 0), 0);
      const totalCredit = dataToExport.reduce((sum, j) => sum + parseFloat(j.credit || 0), 0);

      const tableData = dataToExport.map((j, idx) => [
        idx + 1,
        new Date(j.transaction_date).toLocaleDateString('id-ID'),
        j.transaction_id, j.branch, j.category, j.description,
        j.debit_account || '-', j.credit_account || '-',
        formatRupiah(j.debit), formatRupiah(j.credit)
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['No', 'Tanggal', 'No. Transaksi', 'Cabang', 'Kategori', 'Deskripsi', 'Debit Account', 'Credit Account', 'Debit', 'Credit']],
        body: tableData,
        foot: [['', '', '', '', '', '', '', 'TOTAL', formatRupiah(totalDebit), formatRupiah(totalCredit)]],
        theme: 'grid',
        headStyles: { fillColor: activeTab === 'Sales' ? [153, 0, 0] : [29, 78, 216], fontStyle: 'bold', fontSize: 7 },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        styles: { cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 8 }, 8: { halign: 'right' }, 9: { halign: 'right' } }
      });

      const finalY = doc.lastAutoTable.finalY + 5;
      doc.setFontSize(9);
      doc.text(totalDebit === totalCredit ? '✓ Jurnal Seimbang' : '⚠ Jurnal Tidak Seimbang', 14, finalY);

      // Open PDF in new window for printing
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      setShowExportModal(false);
    } catch (error) {
      console.error('Error generating print PDF:', error);
      alert('Gagal membuat PDF untuk cetak');
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari transaksi jurnal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">

          <NotificationBell />
            <div className="relative">
              <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
              </div>

              {showProfile && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 bg-red-50/50">
                    <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">

            {/* === TAB SWITCHER === */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex flex-col items-start gap-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  Journal {{ Sales: 'Penjualan', Purchase: 'Pembelian', General: 'Umum', Expense: 'Biaya' }[activeTab]}
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  {{ Sales: 'Catatan transaksi penjualan & piutang', Purchase: 'Catatan transaksi pembelian & hutang', General: 'Catatan transaksi umum & penyesuaian', Expense: 'Catatan pengeluaran & biaya operasional' }[activeTab]}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setExportType('print'); setShowExportModal(true); }}
                  className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all">
                  <Printer size={18} /> Print PDF
                </button>
                <button 
                  onClick={() => { setExportType('download'); setShowExportModal(true); }}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all">
                  <Upload size={18} /> Download PDF
                </button>
                <button
                  onClick={() => { resetForm(); setShowModal(true); }}
                  className={`${activeTab === 'Sales' ? 'bg-red-800 hover:bg-red-900' : activeTab === 'Purchase' ? 'bg-blue-700 hover:bg-blue-800' : activeTab === 'General' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'} text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all`}
                >
                  <Plus size={20} /> New Entry
                </button>
              </div>
            </div>





            {/* Header Cards (Dynamic based on tab) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {activeTab === 'Sales' ? (
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Revenue</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(financeSummary.total_revenue || 0)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-amber-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Piutang</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(financeSummary.total_receivable || 0)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-emerald-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Penerimaan (Cash In)</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(financeSummary.total_cash_in_bank || 0)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-red-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Piutang Berjalan ({financeSummary.piutang_terbayar_persen?.toFixed(1)}% terbayar)</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(financeSummary.piutang_berjalan)}</h3>
                  </div>
                </>
              ) : activeTab === 'Purchase' ? (
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-red-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Payable (Utang)</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(purchaseSummary.total_payable)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Purchase (All)</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(purchaseSummary.total_purchase)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-emerald-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Cash Paid Out</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(purchaseSummary.cash_paid_out)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-amber-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Transactions</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{purchaseSummary.total_tx}</h3>
                  </div>
                </>
              ) : activeTab === 'General' ? (
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Transaksi</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{stats.total_tx}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-emerald-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Debit</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(stats.total_debit)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-red-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Credit</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(stats.total_credit)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Balance</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(stats.balance)}</h3>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Transaksi</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{stats.total_tx}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-emerald-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Debit</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(stats.total_debit)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-red-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Credit</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(stats.total_credit)}</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 border-l-[6px] border-l-[#990000] flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Biaya</p>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 break-words">{formatRupiah(stats.balance)}</h3>
                  </div>
                </>
              )}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <span className="text-gray-500">From:</span>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="outline-none" />
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <span className="text-gray-500">To:</span>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="outline-none" />
                </div>
                <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#990000] outline-none">
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#990000] outline-none">
                  <option value="">All Categories</option>
                  {getCategories(activeTab).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => fetchData()} className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider font-bold border-b border-gray-200 ${
                    activeTab === 'Sales' ? 'bg-red-50 text-red-800' :
                    activeTab === 'Purchase' ? 'bg-blue-50 text-blue-800' :
                    activeTab === 'General' ? 'bg-emerald-50 text-emerald-800' :
                    'bg-amber-50 text-amber-800'
                  }`}>
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">No. Transaksi</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Keterangan Akun</th>
                    <th className="px-6 py-4 text-right">Debit</th>
                    <th className="px-6 py-4 text-right">Credit</th>
                    <th className="px-6 py-4">Jatuh Tempo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loading ? (
                    <tr><td colSpan="10" className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`animate-spin w-8 h-8 border-4 rounded-full border-t-transparent ${activeTab === 'Sales' ? 'border-red-400' : 'border-blue-400'}`} />
                        <span className="text-gray-500 text-sm">Memuat data jurnal...</span>
                      </div>
                    </td></tr>
                  ) : journals.length === 0 ? (
                    <tr><td colSpan="10" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${activeTab === 'Sales' ? 'bg-red-50' : 'bg-blue-50'}`}>
                          {activeTab === 'Sales' ? <ArrowUpRight size={28} className="text-red-400" /> : <ArrowDownRight size={28} className="text-blue-400" />}
                        </div>
                        <p className="text-gray-500 font-medium">Belum ada entri {activeTab === 'Sales' ? 'Jurnal Penjualan' : 'Jurnal Pembelian'}.</p>
                        <button onClick={() => { resetForm(); setShowModal(true); }} className={`text-sm font-bold px-4 py-2 rounded-xl text-white ${activeTab === 'Sales' ? 'bg-red-700 hover:bg-red-800' : activeTab === 'Purchase' ? 'bg-blue-700 hover:bg-blue-800' : activeTab === 'General' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-700 hover:bg-amber-800'}`}>
                          + Tambah Entri Baru
                        </button>
                      </div>
                    </td></tr>
                  ) : (
                    journals.map((j, index) => (
                      <tr key={j.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 text-gray-700">{new Date(j.transaction_date).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{j.transaction_id}</div>
                          <div className="text-xs text-gray-500">{j.description}</div>
                          {j.attachment && (() => {
                            try {
                              const filesArr = JSON.parse(j.attachment);
                              if (Array.isArray(filesArr) && filesArr.length > 0) {
                                return (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {filesArr.map((f, i) => (
                                      <a key={i} href={`http://localhost:3000${f.path}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 bg-red-50 text-[#990000] hover:bg-red-100 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-red-100 transition-colors">
                                        <FileText size={12} /> {f.originalname || 'Lampiran'}
                                      </a>
                                    ))}
                                  </div>
                                );
                              }
                            } catch (e) { }
                            return null;
                          })()}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{j.branch}</td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            activeTab === 'Sales' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                          }`}>{j.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          {/* Standard Accounting Format */}
                          <div className="flex flex-col gap-1">
                            <div className="font-medium text-gray-900">{j.debit_account || '-'}</div>
                            <div className="text-gray-600 pl-4">{j.credit_account || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">
                          <div className="flex flex-col gap-1">
                            <div>{formatRupiah(j.debit)}</div>
                            <div className="text-transparent select-none">{formatRupiah(0)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">
                          <div className="flex flex-col gap-1">
                            <div className="text-transparent select-none">{formatRupiah(0)}</div>
                            <div>{formatRupiah(j.credit)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {j.due_date ? (
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              new Date(j.due_date) < new Date() && j.payment_status !== 'Paid'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-gray-50 text-gray-700'
                            }`}>
                              {new Date(j.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            j.payment_status === 'Paid' ? 'bg-green-50 text-green-700' :
                            j.payment_status === 'Unpaid' ? 'bg-amber-50 text-amber-700' :
                            j.payment_status === 'Due Date' ? 'bg-orange-50 text-orange-700' :
                            j.payment_status === 'Over Due' ? 'bg-red-100 text-red-700' :
                            j.payment_status === 'Void' ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-700'
                          }`}>
                            {j.payment_status || 'Paid'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewJournal(j)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100" title="Lihat Detail"><Eye size={16} /></button>
                            <button onClick={() => printJournalReport(j)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg border border-transparent hover:border-gray-200" title="Unduh Laporan PDF"><Upload size={16} /></button>
                            {!j._source && <button onClick={() => handleEdit(j)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100" title="Edit"><Edit2 size={16} /></button>}
                            {!j._source && <button onClick={() => handleDelete(j.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100" title="Delete"><Trash2 size={16} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal View Detail / Rekap Jurnal */}
        {viewJournal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewJournal(null)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className={`p-5 flex justify-between items-center ${viewJournal.journal_type === 'Sales' ? 'bg-red-800' : 'bg-blue-800'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-white/80" />
                    <h2 className="text-lg font-black text-white">Detail Jurnal</h2>
                  </div>
                  <p className="text-white/70 text-xs mt-0.5">{viewJournal.journal_type === 'Sales' ? 'Jurnal Penjualan' : 'Jurnal Pembelian'}</p>
                </div>
                <button onClick={() => setViewJournal(null)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Info Baris */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'No. Transaksi', value: viewJournal.transaction_id },
                    { label: 'Tanggal', value: new Date(viewJournal.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    { label: 'Cabang', value: viewJournal.branch },
                    { label: 'Kategori', value: viewJournal.category },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-black text-gray-800 mt-1 break-words">{item.value || '-'}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                    <p className="text-sm font-black text-gray-800 mt-1">{viewJournal.payment_status || 'Paid'}</p>
                  </div>
                  {viewJournal.due_date && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Due Date</p>
                      <p className="text-sm font-black text-gray-800 mt-1">{new Date(viewJournal.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>

                {/* Deskripsi */}
                {viewJournal.description && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Deskripsi Transaksi</p>
                    <p className="text-sm text-gray-700 font-medium">{viewJournal.description}</p>
                  </div>
                )}

                {/* Tabel Rekap T-Account */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Rekap Akuntansi</p>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`text-xs font-bold uppercase tracking-wider ${viewJournal.journal_type === 'Sales' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
                          <th className="px-4 py-3 text-left">Keterangan</th>
                          <th className="px-4 py-3 text-left">Akun</th>
                          <th className="px-4 py-3 text-right">Debit</th>
                          <th className="px-4 py-3 text-right">Kredit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {/* Baris Debit */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              D/ Debit
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium">{viewJournal.debit_account || '-'}</td>
                          <td className="px-4 py-3 text-right font-black text-blue-700">{formatRupiah(viewJournal.debit)}</td>
                          <td className="px-4 py-3 text-right text-gray-300 select-none">-</td>
                        </tr>
                        {/* Baris Kredit */}
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                              K/ Kredit
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 pl-8 italic">{viewJournal.credit_account || '-'}</td>
                          <td className="px-4 py-3 text-right text-gray-300 select-none">-</td>
                          <td className="px-4 py-3 text-right font-black text-orange-700">{formatRupiah(viewJournal.credit)}</td>
                        </tr>
                      </tbody>
                      {/* Footer Total */}
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td colSpan="2" className="px-4 py-3 text-xs font-black text-gray-600 uppercase tracking-wider">TOTAL</td>
                          <td className="px-4 py-3 text-right font-black text-gray-800">{formatRupiah(viewJournal.debit)}</td>
                          <td className="px-4 py-3 text-right font-black text-gray-800">{formatRupiah(viewJournal.credit)}</td>
                        </tr>
                        <tr className={`${viewJournal.debit === viewJournal.credit ? 'bg-green-50' : 'bg-red-50'}`}>
                          <td colSpan="4" className={`px-4 py-2 text-center text-xs font-black ${
                            viewJournal.debit === viewJournal.credit ? 'text-green-700' : 'text-red-600'
                          }`}>
                            {viewJournal.debit === viewJournal.credit ? '✓ Jurnal Seimbang (Balance)' : '⚠ Jurnal Tidak Seimbang!'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Lampiran */}
                {viewJournal.attachment && (() => {
                  try {
                    const files = JSON.parse(viewJournal.attachment);
                    if (Array.isArray(files) && files.length > 0) return (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lampiran ({files.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {files.map((f, i) => (
                            <a key={i} href={`http://localhost:3000${f.path}`} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                              <FileText size={13} /> {f.originalname || 'Lampiran'}
                            </a>
                          ))}
                        </div>
                      </div>
                    );
                  } catch (e) {}
                  return null;
                })()}

                {/* Notes */}
                {viewJournal.notes && (
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Catatan</p>
                    <p className="text-sm text-gray-600">{viewJournal.notes}</p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <button onClick={() => setViewJournal(null)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors text-sm">
                    Tutup
                  </button>
                  <button onClick={() => { setViewJournal(null); handleEdit(viewJournal); }} className={`px-5 py-2.5 text-white rounded-xl font-bold transition-colors text-sm ${viewJournal.journal_type === 'Sales' ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-700 hover:bg-blue-800'}`}>
                    Edit Jurnal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Form New/Edit Journal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-auto">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {{ Sales: 'Jurnal Penjualan', Purchase: 'Jurnal Pembelian', General: 'Jurnal Umum', Expense: 'Jurnal Biaya' }[formData.journal_type] || 'Jurnal'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Type</label>
                    <select name="journal_type" value={formData.journal_type} onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, category: getCategories(e.target.value)[0] }));
                    }} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-gray-700 font-medium">
                      <option value="Sales">Sales Journal</option>
                      <option value="Purchase">Purchase Journal</option>
                      <option value="General">General Journal</option>
                      <option value="Expense">Expense Journal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Branch</label>
                    <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none">
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none">
                      {getCategories(formData.journal_type).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="Cth: Penjualan seragam PT ABC" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                    <select name="payment_status" value={formData.payment_status} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none">
                      <option value="Paid">Paid</option>
                      <option value="Due">Due</option>
                      <option value="Due Date">Due Date</option>
                      <option value="Over Date">Over Date</option>
                    </select>
                  </div>
                  {['Due Date', 'Over Date'].includes(formData.payment_status) && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                      <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                    </div>
                  )}
                </div>

                {/* Accounting Entry Section */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-[#990000]" /> ACCOUNTING ENTRY</h3>

                  <div className="space-y-4">
                    {/* Debit Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b border-gray-200 pb-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Debit Account - CHART OF ACCOUNTS (COA)</label>
                        <select name="debit_account" value={formData.debit_account} onChange={handleChange} required className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                          <option value="">-- Select COA --</option>
                          {COA.map((group) => (
                            <optgroup key={group.group} label={group.group}>
                              {group.accounts.map((acc) => (
                                <option key={acc.code} value={`${acc.code} ${acc.name}`}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                        <input type="number" name="debit" value={formData.debit} onChange={handleChange} min="0" required className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-800 text-right bg-white" placeholder="0" />
                      </div>
                    </div>

                    {/* Credit Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                      <div className="md:col-span-2 pl-8">
                        <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Credit Account - CHART OF ACCOUNTS (COA)</label>
                        <select name="credit_account" value={formData.credit_account} onChange={handleChange} required className="w-full p-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                          <option value="">-- Select COA --</option>
                          {COA.map((group) => (
                            <optgroup key={group.group} label={group.group}>
                              {group.accounts.map((acc) => (
                                <option key={acc.code} value={`${acc.code} ${acc.name}`}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                        <input type="number" name="credit" value={formData.credit} onChange={handleChange} min="0" required className="w-full p-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-800 text-right bg-white" placeholder="0" />
                      </div>
                    </div>
                  </div>

                  {parseFloat(formData.debit) !== parseFloat(formData.credit) && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle size={18} /> Error: Debit and Credit must be balanced!
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none resize-none" placeholder="Additional notes..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Attachment</label>
                    <div onClick={() => document.getElementById('journal_file_upload').click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer min-h-[100px]">
                      <p className="text-sm text-gray-500 font-medium">Click to upload document</p>
                      <p className="text-xs text-gray-400 mt-1">Invoice, receipt, dll (Bisa lebih dari 1 file)</p>
                      <input type="file" id="journal_file_upload" multiple onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                    </div>
                    {files.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-100 text-xs">
                            <span className="text-gray-700 truncate flex-1 font-medium">{file.name}</span>
                            <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 ml-1">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {formData.attachment && (() => {
                      try {
                        const existingArr = JSON.parse(formData.attachment);
                        if (Array.isArray(existingArr) && existingArr.length > 0) {
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">File Tersimpan:</p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {existingArr.map((f, i) => (
                                  <div key={i} className="flex items-center justify-between bg-red-50/50 p-1.5 rounded border border-red-100/50 text-xs">
                                    <a href={`http://localhost:3000${f.path}`} target="_blank" rel="noreferrer" className="text-[#990000] hover:underline truncate flex-1 font-medium flex items-center gap-1">
                                      <FileText size={12} /> {f.originalname || 'Lampiran'}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) { }
                      return null;
                    })()}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={parseFloat(formData.debit) !== parseFloat(formData.credit) || saving} className="px-8 py-2.5 text-white bg-[#990000] hover:bg-red-800 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {saving ? 'Saving...' : 'Save Journal Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Export/Print Options */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold text-gray-900">
                  {exportType === 'download' ? 'Download PDF' : 'Cetak PDF'}
                </h2>
                <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Range Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Rentang Data</label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="exportRange" 
                        value="daily" 
                        checked={selectedExportRange === 'daily'}
                        onChange={(e) => setSelectedExportRange(e.target.value)}
                        className="w-4 h-4 text-[#990000] border-gray-300 focus:ring-2 focus:ring-[#990000]"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Per Hari (Daily)</p>
                        <p className="text-xs text-gray-500">Download PDF untuk tanggal tertentu</p>
                      </div>
                    </label>
                    
                    {selectedExportRange === 'daily' && (
                      <div className="ml-8 mt-2 space-y-2">
                        <input 
                          type="date" 
                          value={exportDate}
                          onChange={(e) => setExportDate(e.target.value)}
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000] outline-none"
                        />
                        {/* Preview Data */}
                        {journals.filter(j => j.transaction_date.split('T')[0] === exportDate).length > 0 && (
                          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                            <p className="text-xs font-bold text-green-700 mb-2">✓ Preview Data ({journals.filter(j => j.transaction_date.split('T')[0] === exportDate).length} entri)</p>
                            <div className="space-y-1 text-xs">
                              {journals.filter(j => j.transaction_date.split('T')[0] === exportDate).map((j, idx) => (
                                <div key={j.id} className="bg-white rounded p-2 border border-green-100">
                                  <p className="text-gray-700"><span className="font-semibold">{idx + 1}.</span> {j.description}</p>
                                  <p className="text-gray-500">Debit: {formatRupiah(j.debit)} | Credit: {formatRupiah(j.credit)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {journals.filter(j => j.transaction_date.split('T')[0] === exportDate).length === 0 && (
                          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-red-600 font-medium">⚠ Tidak ada data pada tanggal {new Date(exportDate).toLocaleDateString('id-ID')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mt-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input 
                        type="radio" 
                        name="exportRange" 
                        value="all" 
                        checked={selectedExportRange === 'all'}
                        onChange={(e) => setSelectedExportRange(e.target.value)}
                        className="w-4 h-4 text-[#990000] border-gray-300 focus:ring-2 focus:ring-[#990000]"
                      />
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Semua Data (All)</p>
                        <p className="text-xs text-gray-500">Download PDF semua jurnal tanpa batasan tanggal</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">Total entri: </span>
                    {selectedExportRange === 'daily' 
                      ? journals.filter(j => j.transaction_date.split('T')[0] === exportDate).length
                      : journals.length
                    } jurnal
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => setShowExportModal(false)}
                    className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={exportType === 'download' ? generatePdfFile : handlePrintPdf}
                    className={`px-6 py-2.5 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors ${
                      exportType === 'download' 
                        ? 'bg-red-700 hover:bg-red-800' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {exportType === 'download' ? (
                      <>
                        <Upload size={18} /> Download PDF
                      </>
                    ) : (
                      <>
                        <Printer size={18} /> Cetak PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Journal;
