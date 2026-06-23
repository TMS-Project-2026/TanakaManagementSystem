import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import NewLogo from '../assets/new_logo.png';

const Login = () => {
    const [nip, setNip] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    const redirectUser = (role) => {
        const userRole = role ? role.toLowerCase() : '';
        if (userRole === 'finance') navigate('/finance');
        else if (userRole === 'gudang') navigate('/gudang');
        else if (userRole === 'admin_it') navigate('/it/dashboard');
        else if (userRole === 'owner') navigate('/marketing-online/dashboard');
        else if (userRole === 'marketing_online') navigate('/marketing-online/dashboard');
        else if (userRole === 'marketing_offline') navigate('/marketing-offline/dashboard');
        else if (userRole === 'marketing_offline_tanaka') navigate('/marketing-offline-tanaka/dashboard');
        else if (userRole === 'marketing_accestret') navigate('/accestret/marketing/dashboard');
        else if (userRole === 'gudang_accestret') navigate('/accestret/gudang/dashboard');
        else if (userRole === 'produksi_accestret') navigate('/accestret/produksi/dashboard');
        else if (userRole === 'marketing') navigate('/marketing');
        else navigate('/dashboard');
    };

    // Auto-login jika token sudah ada, atau load credential jika remember me aktif
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.role) {
                    redirectUser(user.role);
                    return;
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }

        const savedNip = localStorage.getItem('savedNip');
        const savedPassword = localStorage.getItem('savedPassword');
        if (savedNip && savedPassword) {
            setNip(savedNip);
            setPassword(savedPassword);
            setRememberMe(true);
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', {
                username: nip,
                password: password
            });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem('savedNip', nip);
                localStorage.setItem('savedPassword', password);
            } else {
                localStorage.removeItem('savedNip');
                localStorage.removeItem('savedPassword');
            }

            // Navigasi ke dashboard yang sesuai
            redirectUser(res.data.user.role);
        } catch (err) {
            console.error(err);
            alert('Login Gagal: ' + (err.response?.data?.message || 'Server mati/Masalah koneksi'));
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        alert("Silakan hubungi Admin IT atau Supervisor untuk mereset password akun Anda.");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 font-sans relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            {/* Card Container */}
            <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col md:flex-row w-full max-w-4xl overflow-hidden min-h-[550px] relative z-10 border border-white/50 backdrop-blur-sm">
                
                {/* --- KOLOM KIRI: Sign In Form --- */}
                <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center items-center relative z-10">
                    
                    {/* Logo Area */}
                    <div className="mb-8 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100 p-2 overflow-hidden">
                            <img src={NewLogo} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sign In</h2>
                        <p className="text-gray-500 text-sm mt-2 font-medium text-center">Welcome back! Please enter your details.</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="w-full max-w-xs space-y-5">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#990000] transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="NIP"
                                value={nip}
                                onChange={(e) => setNip(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] transition-all text-sm font-medium shadow-sm hover:border-gray-300"
                                required
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#990000] transition-colors" />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] transition-all text-sm font-medium shadow-sm hover:border-gray-300"
                                required
                            />
                        </div>
                        
                        <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center">
                                <input 
                                    id="remember-me" 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-[#990000] focus:ring-[#990000] border-gray-300 rounded cursor-pointer" 
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-600 font-medium cursor-pointer">
                                    Remember me
                                </label>
                            </div>
                            <button 
                                onClick={handleForgotPassword}
                                className="text-[#990000] text-xs font-bold hover:text-red-700 transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <div className="pt-4 flex justify-center">
                            <button
                                type="submit"
                                className="w-full bg-[#990000] hover:bg-[#7a0000] text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_8px_20px_rgba(153,0,0,0.3)] hover:shadow-[0_8px_25px_rgba(153,0,0,0.4)] transition-all active:scale-[0.98] tracking-wide text-sm flex justify-center items-center gap-2"
                            >
                                SIGN IN
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- KOLOM KANAN: Colored Panel --- */}
                {/* Menggunakan border-radius khusus untuk membuat lengkungan ke dalam (concave curve) pada sisi kiri */}
                <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#990000] to-[#660000] text-white p-12 flex-col justify-center items-center text-center relative overflow-hidden shadow-inner" 
                     style={{ borderTopLeftRadius: '120px', borderBottomLeftRadius: '30px' }}>
                    
                    {/* Decorative Elements inside red panel */}
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay"></div>
                    <div className="absolute bottom-[-10%] left-[10%] w-40 h-40 rounded-full bg-white opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-[40%] right-[20%] w-16 h-16 rounded-full border-4 border-white opacity-10"></div>
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-1 bg-white/30 rounded-full mb-8"></div>
                        <h2 className="text-4xl font-black mb-6 tracking-tight drop-shadow-md">Hello, Friend!</h2>
                        <p className="text-red-50 text-sm font-medium leading-relaxed max-w-xs drop-shadow-sm opacity-90">
                            Welcome to Tanaka Management System. A complete solution to manage and monitor your business efficiently in one place.
                        </p>
                        <div className="mt-12 flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-white opacity-100"></span>
                            <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                            <span className="w-2 h-2 rounded-full bg-white opacity-40"></span>
                        </div>
                    </div>
                </div>

                {/* Mobile version for Colored Panel (shows at bottom on small screens) */}
                <div className="md:hidden w-full bg-gradient-to-br from-[#990000] to-[#660000] text-white p-10 flex flex-col justify-center items-center text-center rounded-t-[3rem] relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-white opacity-5"></div>
                    <h2 className="text-3xl font-black mb-3 relative z-10">Hello, Friend!</h2>
                    <p className="text-red-100 text-sm font-medium relative z-10">
                        Welcome to Tanaka Management System.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Login;