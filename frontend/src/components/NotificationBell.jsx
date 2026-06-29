import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Package, FileText, AlertTriangle, ShoppingCart, ChevronRight, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('approval');
  
  // LocalStorage state for read and deleted notifications
  const [readNotifs, setReadNotifs] = useState(() => JSON.parse(localStorage.getItem('readNotifs') || '[]'));
  const [deletedNotifs, setDeletedNotifs] = useState(() => JSON.parse(localStorage.getItem('deletedNotifs') || '[]'));

  useEffect(() => {
    localStorage.setItem('readNotifs', JSON.stringify(readNotifs));
  }, [readNotifs]);

  useEffect(() => {
    localStorage.setItem('deletedNotifs', JSON.stringify(deletedNotifs));
  }, [deletedNotifs]);

  const ref = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = (user.role || '').toLowerCase();

  // Role yang berhak menerima notifikasi
  const canSeeApproval   = ['finance', 'admin', 'manager', 'owner'].includes(userRole);
  const canSeeGudang     = ['gudang', 'gudang_accestret', 'admin', 'manager', 'owner'].includes(userRole);
  const canSeeMarketing  = ['marketing_offline', 'marketing_offline_tanaka', 'marketing_online', 'marketing_accestret', 'admin', 'manager', 'owner'].includes(userRole);
  const hasNotif         = canSeeApproval || canSeeGudang || canSeeMarketing;

  const fetchData = async () => {
    if (!hasNotif) return;
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setData(res.data.data);
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasNotif) return;
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [userRole]);

  // Tutup dropdown saat klik luar
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!hasNotif) return null;

  // Pre-process items based on role
  let allItems = [];
  if (data) {
    if (canSeeApproval) {
      (data.approvals || []).forEach(i => allItems.push({ ...i, notifId: `app_${i.id}`, tabKey: 'approval', 
          icon: <FileText size={16} className="text-blue-600" />, iconBg: 'bg-blue-50',
          title: i.referensi || `Pengajuan #${i.id}`, sub: i.diajukan_oleh,
          badge: <span className="bg-yellow-100 text-yellow-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Pending</span>,
          value: formatRupiah(i.nominal), time: timeAgo(i.tanggal_pengajuan),
          onClick: () => { navigate('/finance/approval'); }
      }));
      (data.overdueInvoice || []).forEach(i => allItems.push({ ...i, notifId: `overdue_${i.id}`, tabKey: 'invoice',
          icon: <FileText size={16} className="text-red-600" />, iconBg: 'bg-red-50',
          title: i.no_invoice || `Invoice #${i.id}`, sub: i.nama_pt,
          badge: <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Overdue</span>,
          value: formatRupiah(i.grand_total), time: i.tanggal_jatuh_tempo ? new Date(i.tanggal_jatuh_tempo).toLocaleDateString('id-ID') : '',
          onClick: () => { navigate('/invoice'); }
      }));
    }
    if (canSeeGudang) {
      (data.permintaanStok || []).forEach(i => allItems.push({ ...i, notifId: `reqstok_${i.id}`, tabKey: 'gudang',
          icon: <ShoppingCart size={16} className="text-purple-600" />, iconBg: 'bg-purple-50',
          title: `${i.nama_barang}${i.ukuran ? ` (${i.ukuran})` : ''}`, sub: `${i.nama_pengambil} · ${i.divisi}`,
          badge: <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded-full">Qty: {i.jumlah}</span>,
          time: timeAgo(i.tanggal_request),
          onClick: () => { navigate('/permintaan-stok'); }
      }));
      (data.lowStok || []).forEach(i => allItems.push({ ...i, notifId: `lowstok_${i.id}`, tabKey: 'lowstok',
          icon: <AlertTriangle size={16} className="text-orange-600" />, iconBg: 'bg-orange-50',
          title: `${i.nama_barang}${i.nama_brand ? ` – ${i.nama_brand}` : ''}`, sub: `Sisa: ${i.jumlah} / Min: ${i.minimum_stok}`,
          badge: <span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-2 py-0.5 rounded-full">Stok Rendah</span>,
          onClick: () => { navigate('/warning-stok'); }
      }));
    }
    if (canSeeMarketing) {
      (data.newInvoices || []).forEach(i => allItems.push({ ...i, notifId: `newinv_${i.id}`, tabKey: 'new_invoice',
          icon: <FileText size={16} className="text-green-600" />, iconBg: 'bg-green-50',
          title: i.no_invoice || `Invoice #${i.id}`, sub: i.nama_pt,
          badge: <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Selesai Dibuat</span>,
          time: i.tanggal_terbit ? new Date(i.tanggal_terbit).toLocaleDateString('id-ID') : '',
          onClick: () => { navigate(`/invoice/preview/${i.id}`); }
      }));
    }
    if (canSeeApproval || canSeeGudang || canSeeMarketing) {
      const appItems = (canSeeApproval || canSeeMarketing) ? (data.resolvedApprovals || []) : [];
      const reqItems = canSeeGudang ? (data.resolvedPermintaan || []) : [];
      
      const allResolved = [
        ...appItems.map(a => ({ ...a, resolvedType: 'app', date: new Date(a.tanggal_pengajuan), notifId: `resapp_${a.id}` })),
        ...reqItems.map(r => ({ ...r, resolvedType: 'req', date: new Date(r.tanggal_request), notifId: `resreq_${r.id}` }))
      ].sort((a,b) => b.date - a.date);

      allResolved.forEach(i => {
        const isApp = i.resolvedType === 'app';
        const isApproved = i.status?.toLowerCase() === 'approved' || i.status?.toLowerCase() === 'selesai';
        allItems.push({ ...i, tabKey: 'status',
            icon: isApproved ? <Check size={16} className="text-green-600" /> : <X size={16} className="text-red-600" />,
            iconBg: isApproved ? "bg-green-50" : "bg-red-50",
            title: isApp ? (i.referensi || `Pengajuan #${i.id}`) : `${i.nama_barang}`,
            sub: isApp ? i.diajukan_oleh : `${i.nama_pengambil} (Qty: ${i.jumlah})`,
            badge: <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isApproved ? 'Disetujui' : 'Ditolak'}</span>,
            time: timeAgo(i.date),
            onClick: () => {
                if (isApp) {
                    if (userRole.startsWith('marketing')) {
                        if (i.tipe === 'quotation_to_invoice' && i.reference_id) {
                            navigate(`/quotation/preview/${i.reference_id}`);
                        } else {
                            navigate(userRole.includes('tanaka') ? '/marketing-offline-tanaka/orders' : '/marketing-offline/orders');
                        }
                    } else {
                        navigate('/finance/approval');
                    }
                } else {
                    navigate('/permintaan-stok');
                }
            }
        });
      });
    }
  }

  // Filter Active vs Riwayat
  const activeItems = allItems.filter(i => !readNotifs.includes(i.notifId) && !deletedNotifs.includes(i.notifId));
  const riwayatItems = allItems.filter(i => readNotifs.includes(i.notifId) && !deletedNotifs.includes(i.notifId)).sort((a, b) => b.id - a.id);

  const getTabCount = (tabKey) => activeItems.filter(i => i.tabKey === tabKey).length;
  const totalCount = activeItems.length;

  const tabs = [];
  if (canSeeApproval)  tabs.push({ key: 'approval',  label: 'Approval', count: getTabCount('approval') });
  if (canSeeGudang)    tabs.push({ key: 'gudang',    label: 'Permintaan Stok', count: getTabCount('gudang') });
  if (canSeeApproval || canSeeGudang || canSeeMarketing) tabs.push({ key: 'status', label: 'Status Pengajuan', count: getTabCount('status') });
  if (canSeeApproval)  tabs.push({ key: 'invoice',   label: 'Invoice Jatuh Tempo', count: getTabCount('invoice') });
  if (canSeeMarketing) tabs.push({ key: 'new_invoice', label: 'Invoice Baru', count: getTabCount('new_invoice') });
  if (canSeeGudang)    tabs.push({ key: 'lowstok',   label: 'Stok Rendah', count: getTabCount('lowstok') });
  
  // Tambahkan Tab Riwayat selalu di akhir
  tabs.push({ key: 'riwayat', label: 'Riwayat', count: 0, isHistory: true });

  const currentTab = tabs.find(t => t.key === activeTab) ? activeTab : (tabs[0]?.key || 'approval');

  const handleItemClick = (item) => {
      if (!readNotifs.includes(item.notifId)) {
          setReadNotifs(prev => [...prev, item.notifId]);
      }
      setOpen(false);
      if (item.onClick) item.onClick();
  };

  const handleDelete = (e, notifId) => {
      e.stopPropagation();
      setDeletedNotifs(prev => [...prev, notifId]);
  };

  const handleClearHistory = () => {
      const currentHistoryIds = riwayatItems.map(i => i.notifId);
      setDeletedNotifs(prev => [...new Set([...prev, ...currentHistoryIds])]);
  };

  const renderItems = () => {
    if (loading) return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

    let displayItems = currentTab === 'riwayat' ? riwayatItems : activeItems.filter(i => i.tabKey === currentTab);

    if (!displayItems.length) {
        return <EmptyState msg={currentTab === 'riwayat' ? "Riwayat notifikasi kosong" : "Tidak ada notifikasi baru"} />;
    }

    return displayItems.map(item => (
        <NotifItem
            key={item.notifId}
            icon={item.icon}
            iconBg={item.iconBg}
            title={item.title}
            sub={item.sub}
            badge={item.badge}
            value={item.value}
            time={item.time}
            isRead={currentTab === 'riwayat'}
            onClick={() => handleItemClick(item)}
            onDelete={(e) => handleDelete(e, item.notifId)}
        />
    ));
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(prev => !prev); fetchData(); }}
        className="relative p-2.5 rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all"
        title="Notifikasi"
      >
        <Bell
          size={20}
          className={totalCount > 0 ? 'text-red-600' : 'text-gray-400'}
          style={totalCount > 0 ? { filter: 'drop-shadow(0 0 4px rgba(153,0,0,0.35))' } : {}}
        />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden flex flex-col max-h-[500px]"
          style={{ animation: 'notifDropIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both' }}>

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-black text-gray-900 text-sm">Notifikasi</h3>
              {totalCount > 0 && <p className="text-[11px] text-red-600 font-bold">{totalCount} memerlukan tindakan</p>}
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          {tabs.length > 1 && (
            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none shrink-0 bg-white">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-4 py-2.5 text-[11px] font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5
                    ${currentTab === tab.key
                      ? (tab.isHistory ? 'border-gray-600 text-gray-700 bg-gray-50' : 'border-red-600 text-red-700 bg-red-50/40')
                      : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.isHistory && <History size={12} />}
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${currentTab === tab.key ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Header for Riwayat if needed */}
          {currentTab === 'riwayat' && riwayatItems.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-end shrink-0">
                  <button onClick={handleClearHistory} className="text-[10px] font-bold text-gray-500 hover:text-red-600 transition-colors">
                      Hapus Semua Riwayat
                  </button>
              </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
            {renderItems()}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifDropIn {
          from { opacity: 0; transform: scale(0.92) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Sub-komponen: Item Notifikasi
function NotifItem({ icon, iconBg, title, sub, badge, value, time, isRead, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors relative ${isRead ? 'opacity-70 hover:opacity-100 hover:bg-gray-50' : 'hover:bg-red-50/30'}`}
    >
      <div className={`w-8 h-8 rounded-full ${isRead ? 'bg-gray-100 grayscale' : iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 pr-6">
        <p className={`text-sm font-bold truncate ${isRead ? 'text-gray-600' : 'text-gray-800'}`}>{title}</p>
        {sub && <p className="text-[11px] text-gray-500 mt-0.5 truncate">{sub}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {badge}
          {value && <span className="text-[11px] font-black text-gray-800">{value}</span>}
        </div>
      </div>
      {time && <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0 mt-0.5">{time}</span>}
      
      {/* Delete Button (visible on hover) */}
      {isRead && (
          <button 
            onClick={onDelete}
            title="Hapus notifikasi"
            className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
          >
              <X size={12} />
          </button>
      )}
    </div>
  );
}

// Sub-komponen: Empty State
function EmptyState({ msg }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white h-full">
      <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
        <Check size={24} />
      </div>
      <p className="text-xs font-bold text-gray-400">{msg}</p>
    </div>
  );
}
