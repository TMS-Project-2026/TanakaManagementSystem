import React from 'react';
import Sidebar from '../components/Sidebar';

const Gudang = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="p-10"><h1>Ini Halaman Gudang (Suku Cadang)</h1></div>
    </div>
  );
};
export default Gudang;