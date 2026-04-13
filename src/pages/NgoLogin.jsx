import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

const API_URL = 'https://hopeworks.onrender.com/api';

export default function NgoLogin({ setLoggedInNgo }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/ngos/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json().catch(() => ({}));

            if (isMounted.current) {
                if (response.ok) {
                    // Save the ID and instantly update the global state
                    const ngoId = data.ngoId || data._id || data.id;
                    localStorage.setItem('loggedInNgoId', ngoId);
                    setLoggedInNgo(ngoId);
                    navigate('/ngo-dashboard');
                } else {
                    setError(data.message || 'Invalid credentials.');
                }
            }
        } catch (err) {
            if (isMounted.current) setError('Could not connect to server.');
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    return (
        <section className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-12 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-[#0B2948] mb-2">NGO Login</h2>
                <p className="text-slate-600">Access your organization's control center.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <p className="text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-center">{error}</p>}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#007A78] focus:border-[#007A78] outline-none transition-all"
                        placeholder="contact@yourngo.org"
                    />
                </div>

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

                <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Authenticating...' : 'Log In'}
                </Button>
            </form>
            
            <p className="text-center mt-6 text-sm text-slate-500">
                Not registered yet? <Link to="/register" className="text-[#007A78] font-bold hover:underline transition-colors">Apply here</Link>
            </p>
        </section>
    );
}