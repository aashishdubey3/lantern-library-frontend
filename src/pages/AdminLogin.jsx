import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const API_URL = 'https://hopeworks.onrender.com/api';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setShowHint(false);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            
            const result = await response.json().catch(() => ({}));

            if (isMounted.current) {
                if (response.ok && result.success) {
                    // This is the magic key that unlocks the dashboard
                    sessionStorage.setItem('admin_logged_in', 'true');
                    navigate('/admin-dashboard');
                } else {
                    setError(result.message || 'Incorrect password.');
                }
            }
        } catch (err) {
            if (isMounted.current) setError('Could not connect to server.');
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    return (
        <section className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-12">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-[#0B2948] mb-2">Admin Access</h2>
                <p className="text-slate-600">Enter your credentials to view the dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <p className="text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-center">{error}</p>}
                {showHint && <p className="text-[#007A78] bg-[#E6F2F2] border border-[#B3DDDC] p-3 rounded-lg text-sm text-center">Hint: the password is 'admin'</p>}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#007A78] focus:border-[#007A78] outline-none transition-all"
                        placeholder="••••••••"
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                    <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Secure Login'}
                    </Button>
                    <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="text-sm text-slate-500 hover:text-[#007A78] transition-colors"
                    >
                        Forgot Password?
                    </button>
                </div>
            </form>
        </section>
    );
}