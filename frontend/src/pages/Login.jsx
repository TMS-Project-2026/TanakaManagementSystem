import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import LogoTanaka from '../assets/logotanaka.jpeg';
const Login = () => {
    const [nip, setNip] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', {
                username: nip,
                password: password
            });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            alert('Login Berhasil, Selamat Datang di TMS!');

            // Navigasi ke dashboard yang sesuai
            const userRole = res.data.user.role ? res.data.user.role.toLowerCase() : '';
            if (userRole === 'finance') {
                navigate('/finance');
            } else if (userRole === 'gudang') {
                navigate('/gudang');
            } else if (userRole === 'admin_it') {
                navigate('/it/dashboard');
            } else if (userRole === 'owner') {
                navigate('/owner/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err);
            alert('Login Gagal: ' + (err.response?.data?.message || 'Server mati/Masalah koneksi'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/50 to-white p-4 sm:p-6 font-sans">
            <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 py-10 md:py-0">

                {/* --- KOLOM KIRI: Teks & Branding --- */}
                <div className="flex-1 text-center md:text-left w-full">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-8 md:mb-12">
                        <img src={LogoTanaka} alt="Logo Tanaka" className="w-10 h-10 object-contain" />

                        <span className="text-[#990000] font-bold text-xl tracking-widest">TANAKA GROUP</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-[#990000] mb-3">
                        SELAMAT DATANG
                    </h1>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#990000] mb-6">
                        TMS ( Tanaka Management System )
                    </h2>

                    {/* Garis Pemisah Merah */}
                    <div className="h-0.5 w-full max-w-md bg-[#990000] mb-6 mx-auto md:mx-0"></div>

                    <p className="text-gray-800 text-lg leading-relaxed max-w-md mx-auto md:mx-0 font-medium">
                        Dengan satu aplikasi, memudahkan pemantauan, pengelolaan, dan analisis data secara real-time untuk meningkatkan produktivitas perusahaan.
                    </p>
                </div>

                {/* --- KOLOM KANAN: Card Login --- */}
                <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Log in</h3>
                        <p className="text-sm text-gray-600">Pastikan anda mempunyai NIP untuk Login</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Input NIP */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                placeholder="Masukan NIP anda"
                                value={nip}
                                onChange={(e) => setNip(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-400 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] transition-all"
                                required
                            />
                        </div>

                        {/* Input Password */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-400 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] transition-all"
                                required
                            />
                        </div>

                        {/* Checkbox Remember Me */}
                        <div className="flex items-center pt-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 text-[#990000] focus:ring-[#990000] border-gray-400 rounded cursor-pointer"
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-800 font-bold cursor-pointer">
                                Remember me
                            </label>
                        </div>

                        {/* Tombol Login */}
                        <button
                            type="submit"
                            className="w-full bg-[#990000] hover:bg-[#7a0000] text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] mt-2"
                        >
                            Log in
                        </button>
                    </form>

                    {/* Divider "Or" */}
                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-400"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-800 font-medium">Or</span>
                            </div>
                        </div>

                        {/* Tombol Login with Google */}
                        <button
                            type="button"
                            className="mt-6 w-full flex items-center justify-center gap-3 bg-white border border-gray-400 text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
                            Login with Google
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;