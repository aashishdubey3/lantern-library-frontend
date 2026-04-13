import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../components/Button';
import CampaignCard from '../components/CampaignCard';

const API_BASE_URL = 'https://hopeworks.onrender.com';
const API_URL = `${API_BASE_URL}/api`;

// Helper to ensure images load properly
function getImageUrl(relativePath) {
    if (!relativePath) return 'https://placehold.co/400x400/eee/aaa?text=No+Logo';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
    return `${API_BASE_URL}${relativePath}`;
}

export default function ProfilePage() {
    const { id } = useParams(); // Grabs the ID from the URL
    const [ngo, setNgo] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        setLoading(true);
        setError(null);

        async function loadProfileData() {
            try {
                // 1. Fetch the NGO Profile Data
                const ngoRes = await fetch(`${API_URL}/ngos/${id}`);
                if (!ngoRes.ok) throw new Error("NGO not found");
                const ngoData = await ngoRes.json();
                
                if (isMounted.current) {
                    setNgo(ngoData);
                }

                // 2. SAFELY fetch campaigns (Bulletproof wrapper)
                try {
                    const campRes = await fetch(`${API_URL}/campaigns/ngo/${encodeURIComponent(ngoData.name)}`);
                    
                    // Check if the response is actually JSON before parsing to prevent HTML crashes
                    const contentType = campRes.headers.get("content-type");
                    if (campRes.ok && contentType && contentType.includes("application/json")) {
                        const campData = await campRes.json();
                        if (isMounted.current) {
                            setCampaigns(campData);
                        }
                    } else {
                        // If server sends HTML or fails, default to empty array
                        if (isMounted.current) setCampaigns([]);
                    }
                } catch (campErr) {
                    // Catch network errors for campaigns silently
                    if (isMounted.current) setCampaigns([]);
                }

            } catch (err) {
                if (isMounted.current) setError(err.message);
            } finally {
                if (isMounted.current) setLoading(false);
            }
        }

        loadProfileData();
        return () => { isMounted.current = false; };
    }, [id]);

    if (loading) return <div className="text-center py-20 text-xl font-bold text-[#0B2948] animate-pulse">Loading Profile...</div>;
    if (error || !ngo) return <div className="text-center py-20 text-xl text-red-600">Error: {error || 'Profile not found.'}</div>;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mb-10 flex flex-col md:flex-row items-center md:items-start gap-8 mt-6">
                <img 
                    src={getImageUrl(ngo.logo)} 
                    alt={`${ngo.name} Logo`} 
                    className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-slate-50"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/eee/aaa?text=Error'; }}
                />
                <div className="text-center md:text-left flex-grow">
                    <h2 className="text-4xl font-black text-[#0B2948] mb-2">{ngo.name}</h2>
                    <p className="text-lg text-[#007A78] font-semibold mb-4">{ngo.cause}</p>
                    <p className="text-slate-600 mb-6 leading-relaxed whitespace-pre-line">{ngo.description}</p>
                    
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        {ngo.website && (
                            <a href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="secondary">Visit Website</Button>
                            </a>
                        )}
                        <a href={`mailto:${ngo.email}`}>
                            <Button variant="secondary">Contact NGO</Button>
                        </a>
                    </div>
                </div>
            </div>

            {/* NGO's Campaigns */}
            <div className="mb-12">
                <h3 className="text-2xl font-bold text-[#0B2948] mb-6 border-b border-slate-200 pb-2">
                    Active Campaigns by {ngo.name}
                </h3>
                
                {campaigns && campaigns.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {campaigns.map(campaign => (
                            <CampaignCard key={campaign.id || campaign._id} campaign={campaign} hostingNgo={ngo} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 p-10 rounded-xl text-center border border-slate-200">
                        <p className="text-slate-500 mb-4">This organization doesn't have any active campaigns right now.</p>
                        <Link to="/">
                            <Button variant="primary">Explore Other Causes</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}