import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import DashboardCard from '../components/DashboardCard';

// Make sure this matches your active backend URL!
const API_URL = 'https://hopeworks.onrender.com/api'; 

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [ngos, setNgos] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State to control the Verification Modal
    const [reviewNgo, setReviewNgo] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        fetchDashboardData();
        return () => { isMounted.current = false; };
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ngoRes, campRes] = await Promise.all([
                fetch(`${API_URL}/ngos`),
                fetch(`${API_URL}/campaigns`)
            ]);

            if (!ngoRes.ok || !campRes.ok) throw new Error("Failed to fetch dashboard data");

            const ngoData = await ngoRes.json();
            const campData = await campRes.json();

            if (isMounted.current) {
                setNgos(Array.isArray(ngoData) ? ngoData : []);
                setCampaigns(Array.isArray(campData) ? campData : []);
            }
        } catch (err) {
            if (isMounted.current) setError(err.message);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            // Assuming you have a backend route to update status. 
            // If not, we will need to build app.put('/api/ngos/:id/approve') next!
            const res = await fetch(`${API_URL}/ngos/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                // Update the local state instantly without reloading the page
                setNgos(ngos.map(ngo => ngo._id === id ? { ...ngo, status: 'approved' } : ngo));
            } else {
                alert("Failed to approve NGO. Check backend route.");
            }
        } catch (err) {
            alert("Connection error.");
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-bold text-[#0B2948] animate-pulse">Loading System Data...</div>;
    if (error) return <div className="text-center py-20 text-xl text-red-600">Error: {error}</div>;

    const pendingNgos = ngos.filter(ngo => ngo.status === 'pending');
    const approvedNgos = ngos.filter(ngo => ngo.status === 'approved');

    return (
        <div className="animate-fade-in relative">
            <header className="mb-10 border-b border-slate-200 pb-6">
                <h1 className="text-4xl font-black text-[#0B2948] mb-2">Platform Control Center</h1>
                <p className="text-slate-500">Manage organizations, verify identities, and monitor campaigns.</p>
                
                {/* Quick Stats Row */}
                <div className="flex gap-6 mt-6">
                    <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Pending</span>
                        <span className="text-2xl font-black text-amber-600">{pendingNgos.length}</span>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Approved NGOs</span>
                        <span className="text-2xl font-black text-[#007A78]">{approvedNgos.length}</span>
                    </div>
                    <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
                        <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</span>
                        <span className="text-2xl font-black text-[#0B2948]">{campaigns.length}</span>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Pending NGOs Needs Verification */}
                <DashboardCard 
                    title="Needs Verification" 
                    className="border-amber-200 shadow-md"
                    list={pendingNgos} 
                    renderItem={ngo => (
                        <div className="flex justify-between items-center py-2">
                            <div>
                                <span className="font-bold text-slate-900 block">{ngo.name}</span>
                                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    Awaiting Review
                                </span>
                            </div>
                            {/* Triggers the Modal instead of opening a new tab */}
                            <Button onClick={() => setReviewNgo(ngo)} variant="secondary" className="px-3 py-1.5 text-xs">
                                Review Data
                            </Button>
                        </div>
                    )}
                />

                {/* Approved NGOs */}
                <DashboardCard 
                    title="Active Organizations" 
                    list={approvedNgos} 
                    renderItem={ngo => (
                        <div className="flex justify-between items-center py-2">
                            <div>
                                <span className="font-bold text-slate-900 block">{ngo.name}</span>
                                <span className="text-xs text-slate-500">{ngo.email}</span>
                            </div>
                            <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">
                                Verified
                            </span>
                        </div>
                    )}
                />

                {/* All Campaigns Overview */}
                <div className="lg:col-span-2">
                    <DashboardCard 
                        title="All Platform Campaigns" 
                        list={campaigns} 
                        renderItem={camp => (
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <span className="font-bold text-slate-900 block">{camp.title}</span>
                                    <span className="text-xs text-slate-500">By {camp.host || 'Unknown NGO'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-bold text-[#007A78]">₹{camp.raisedAmount} raised</span>
                                    <span className="text-xs text-slate-400">of ₹{camp.goalAmount}</span>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* --- ADMIN VERIFICATION MODAL --- */}
            {reviewNgo && (
                <div className="fixed inset-0 bg-[#0B2948]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in">
                        
                        {/* Modal Header */}
                        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-[#0B2948]">Verify Organization</h3>
                                <p className="text-sm text-slate-500 mt-1">Review official details before granting platform access.</p>
                            </div>
                            <button onClick={() => setReviewNgo(null)} className="text-slate-400 hover:text-red-500 font-bold text-2xl transition-colors">
                                &times;
                            </button>
                        </div>
                        
                        {/* Modal Body: Secure Data */}
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Organization Name</p>
                                    <p className="font-semibold text-slate-800">{reviewNgo.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Darpan ID / Reg No.</p>
                                    <p className="font-mono text-[#007A78] font-bold bg-teal-50 inline-block px-2 py-0.5 rounded border border-teal-100">
                                        {reviewNgo.darpanId || 'Missing Document'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Official Email</p>
                                    <p className="text-sm text-slate-800">{reviewNgo.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Official Phone</p>
                                    <p className="text-sm text-slate-800">{reviewNgo.phone || 'Not Provided'}</p>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-slate-200 mt-2">
                                    <p className="text-xs text-slate-400 font-bold uppercase mb-1">Registered Address</p>
                                    <p className="text-sm text-slate-800">{reviewNgo.address || 'Not Provided'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase mb-2">Public Mission Statement</p>
                                <div className="text-sm text-slate-700 bg-white border border-slate-200 p-4 rounded-lg leading-relaxed whitespace-pre-line shadow-inner">
                                    {reviewNgo.description}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <Button onClick={() => setReviewNgo(null)} variant="secondary" className="px-6">
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => { 
                                    handleApprove(reviewNgo._id); 
                                    setReviewNgo(null); 
                                }} 
                                variant="primary" 
                                className="px-6 bg-green-600 hover:bg-green-700 border-green-700"
                            >
                                Approve Official Status
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}