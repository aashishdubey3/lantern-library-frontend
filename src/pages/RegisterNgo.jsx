import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const API_URL = 'https://hopeworks.onrender.com/api';

export default function RegisterNgo() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
    name: '', email: '', password: '', cause: '', description: '', website: '', logo: '', darpanId: '', phone: '', address: ''
});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/ngos/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert("Application submitted! An admin will review your profile shortly.");
                navigate('/ngo-login');
            } else {
                const data = await res.json();
                alert(data.message || "Registration failed.");
            }
        } catch (err) {
            alert("Connection error. Is the backend live?");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="max-w-2xl mx-auto py-10 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-3xl font-black text-[#0B2948] mb-2 text-center">Join HopeWorks</h2>
                <p className="text-slate-500 text-center mb-8">Register your NGO to start raising funds.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">NGO Name</label>
                            <input name="name" type="text" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="Helping Hands Foundation" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Contact Email</label>
                            <input name="email" type="email" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="contact@ngo.org" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                        <input name="password" type="password" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="••••••••" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Primary Cause</label>
                        <input name="cause" type="text" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="Education, Healthcare, etc." />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                        <textarea name="description" rows="4" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="Tell us about your mission..."></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Website URL (Optional)</label>
                        <input name="website" type="url" onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="https://yourngo.org" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">NGO Darpan ID / Registration No.</label>
                        <input name="darpanId" type="text" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="e.g., WB/2026/0001234" />
                    </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Official Phone</label>
                        <input name="phone" type="tel" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="+91 9876543210" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Registered Address</label>
                       <input name="address" type="text" required onChange={handleChange} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007A78]" placeholder="City, State" />
                    </div>
                 </div>

                    <Button type="submit" variant="primary" className="w-full py-4 text-lg" disabled={loading}>
                        {loading ? 'Submitting Application...' : 'Register NGO'}
                    </Button>
                </form>
            </div>
        </div>
    );
}