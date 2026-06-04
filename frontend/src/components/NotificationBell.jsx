import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function NotificationBell() {
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRole = user.role || '';

  useEffect(() => {
    if (['finance', 'admin', 'manager', 'owner'].includes(userRole.toLowerCase())) {
      const fetchPendingCount = async () => {
        try {
          const res = await axios.get('http://localhost:3000/api/owner/approval/pending/count', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setPendingApprovals(res.data.count);
        } catch (err) {
          console.error('Error fetching pending approvals:', err);
        }
      };
      fetchPendingCount();
      const intervalId = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(intervalId);
    }
  }, [userRole]);

  return (
    <div 
      className="relative cursor-pointer p-2 hover:bg-red-50 rounded-full transition-colors"
      onClick={() => navigate('/finance/approval')}
      title="Cek Approval Center"
    >
      <Bell size={22} className={pendingApprovals > 0 ? "text-red-600 drop-shadow-md" : "text-gray-400 hover:text-red-600 transition-colors"} />
      {pendingApprovals > 0 && (
        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full border-2 border-white animate-pulse">
          {pendingApprovals}
        </span>
      )}
    </div>
  );
}
