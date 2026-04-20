import React, { useState } from 'react';
import api from '../api/axios'; // Menggunakan instance api yang sudah kita buat
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [nip, setNip] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Kita kirim 'nip' ke backend sebagai 'username'
            const res = await api.post('/auth/login', { 
                username: nip, 
                password: password 
            });
            
            // Simpan data ke localStorage
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            alert('Login Berhasil, Selamat Datang di TMS!');
            navigate('/dashboard');
        } catch (err) {
            // Cek detail error di console jika gagal
            console.error(err);
            alert('Login Gagal: ' + (err.response?.data?.message || 'Server mati/Masalah koneksi'));
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Log in</h2>
                <p style={styles.subtitle}>Pastikan anda mempunyai NIP untuk Login</p>
                
                <form onSubmit={handleLogin}>
                    <div style={styles.inputGroup}>
                        <input 
                            type="text" 
                            placeholder="Masukan NIP anda" 
                            value={nip}
                            onChange={(e) => setNip(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" style={styles.loginBtn}>
                        Log in
                    </button>
                </form>
            </div>
        </div>
    );
};

// Styling minimalis agar mendekati desain gambar kamu
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f8f9fa'
    },
    card: {
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        width: '350px',
        textAlign: 'center'
    },
    title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' },
    subtitle: { fontSize: '14px', color: '#666', marginBottom: '25px' },
    inputGroup: { marginBottom: '15px' },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        boxSizing: 'border-box'
    },
    loginBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#990000', // Warna merah khas Tanaka
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px'
    }
};

export default Login;