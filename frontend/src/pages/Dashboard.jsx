import React from 'react';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="p-10"><h1>Ini Halaman Dashboard</h1></div>
    </div>
  );
};
export default Dashboard;