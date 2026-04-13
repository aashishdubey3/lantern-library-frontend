import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import CampaignCard from '../components/CampaignCard';

// Keep your API URL exactly the same
const API_BASE_URL = 'https://hopeworks.onrender.com';
const API_URL = `${API_BASE_URL}/api`;

// Helper for images
function getImageUrl(relativePath) {
    if (!relativePath) return 'https://placehold.co/100x100/eee/aaa?text=No+Image';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
    return `${API_BASE_URL}${relativePath}`;
}

export default function HomePage() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]); 
    const [campaignsLoading, setCampaignsLoading] = useState(true); 
    const [campaignsError, setCampaignsError] = useState(null);
    const [featuredNgos, setFeaturedNgos] = useState([]); 
    const [featuredNgosLoading, setFeaturedNgosLoading] = useState(true); 
    const [featuredNgosError, setFeaturedNgosError] = useState(null);
    const [allNgos, setAllNgos] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); 
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        setCampaignsLoading(true); setFeaturedNgosLoading(true); setCampaignsError(null); setFeaturedNgosError(null);
        
        const fetchCampaigns = fetch(API_URL + '/campaigns').then(res => res.ok ? res.json() : Promise.reject('Failed campaign fetch'));
        const fetchAllNgos = fetch(API_URL + '/ngos').then(res => res.ok ? res.json() : Promise.reject('Failed NGO fetch'));
        const fetchFeaturedNgos = fetch(API_URL + '/ngos/featured').then(res => res.ok ? res.json() : Promise.reject('Failed featured NGO fetch'));

        Promise.all([fetchCampaigns, fetchAllNgos, fetchFeaturedNgos])
            .then(([campaignData, allNgoData, featuredNgoData]) => {
                if (isMounted.current) {
                    setCampaigns(campaignData.slice(0, 2)); setAllNgos(allNgoData); setFeaturedNgos(featuredNgoData);
                }
            })
            .catch(err => {
                console.error("Failed homepage data fetch:", err);
                const errorMsg = (err instanceof TypeError && err.message === 'Failed to fetch') ? 'Connection Error: Could not reach the server.' : `Error loading data: ${err.message}`;
                if (isMounted.current) {
                    setCampaignsError(errorMsg); setFeaturedNgosError(errorMsg);
                }
            })
            .finally(() => {
                if (isMounted.current) {
                    setCampaignsLoading(false); setFeaturedNgosLoading(false);
                }
            });
        
        return () => { isMounted.current = false; };
    }, []);

    // Helper for finding NGO by name
    function findNgoByName(ngoList, name) {
        if (!Array.isArray(ngoList)) return undefined;
        return ngoList.find(ngo => ngo && ngo.name === name);
    }

    return (
        <div>
            {/* 1. Hero Section */}
            <section className="relative bg-[url('https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg')] bg-cover bg-center p-24 rounded-lg text-white text-center mb-12 overflow-hidden">
                <div className="absolute inset-0 bg-[#0B2948] bg-opacity-60 z-10"></div>
                <div className="relative z-20">
                    <h2 className="text-4xl md:text-5xl font-black mb-4">Amplify Your Impact.</h2>
                    <p className="text-lg md:text-xl mb-6">Discover and support trusted NGOs.</p>
                    
                    <form onSubmit={(e) => { e.preventDefault(); navigate('/ngos', { state: { initialSearch: searchTerm } }); }} className="mt-8 max-w-lg mx-auto flex rounded-md shadow-sm">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for an NGO or cause..."
                            className="flex-1 block w-full rounded-l-md p-3 border border-gray-300 text-gray-900 focus:outline-none"
                        />
                        <Button type="submit" variant="primary" className="rounded-l-none px-4 py-2">Search</Button>
                    </form>
                </div>
            </section>

            {/* 2. Organizations Spotlight */}
            <section className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-center text-[#0B2948]">Organizations Spotlight</h2>
                {featuredNgosLoading && <p className="text-center">Loading organizations...</p>}
                {featuredNgosError && <p className="text-center text-red-600">{featuredNgosError}</p>}
                {!featuredNgosLoading && !featuredNgosError && (
                    <div className="grid md:grid-cols-2 gap-6">
                        {Array.isArray(featuredNgos) && featuredNgos.length > 0 ? (
                            featuredNgos.map(ngo => (
                                <article key={ngo.id} className="bg-white rounded-lg p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all text-center">
                                    <img src={getImageUrl(ngo.logo)} alt={`${ngo.name} Logo`} className="w-20 h-20 rounded-full object-cover mx-auto mb-4"/>
                                    <h3 className="text-2xl font-bold text-[#0B2948]">{ngo.name}</h3>
                                    <p className="text-sm text-gray-500 italic mb-4">{ngo.cause}</p>
                                    <Button onClick={() => navigate(`/profile/${ngo.id}`)} variant="secondary">View Profile</Button>
                                </article>
                            ))
                        ) : ( <p className="col-span-full text-center">No organizations to spotlight.</p> )}
                    </div>
                )}
            </section>
            
            {/* 3. Active Campaigns */}
            <section className="mb-12">
                <h2 className="text-3xl font-bold mb-4 text-center text-[#0B2948]">Active Campaigns</h2>
                <p className="text-center text-lg text-gray-600 mb-6">Support time-sensitive projects.</p>
                
                {campaignsLoading && <p className="text-center">Loading campaigns...</p>}
                {campaignsError && <p className="text-center text-red-600">{campaignsError}</p>}
                
                {!campaignsLoading && !campaignsError && (
                    <>
                       <div className="grid md:grid-cols-2 gap-8 mt-4">
                           {Array.isArray(campaigns) && campaigns.length > 0 ? (
                            campaigns.map(campaign => { 
                             const hostingNgo = findNgoByName(allNgos, campaign.host); 
                            return (
                <CampaignCard 
                    key={campaign.id} 
                    campaign={campaign} 
                    hostingNgo={hostingNgo} 
                />
                                  ); 
                    })) : (<p className="col-span-full text-center text-slate-500">No active campaigns at the moment.</p>)}
                       </div>
                        <div className="text-center">
                            <Button onClick={() => navigate('/all-campaigns')} variant="secondary" className="mt-6">View All Campaigns</Button>
                        </div>
                    </>
                )}
            </section>
            
            {/* 4. NGO CTA Banner */}
            <section className="bg-[#007A78] text-white p-10 rounded-lg text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Are you an NGO?</h2>
                <p className="text-lg mb-6 text-gray-200">Join our network.</p>
                <Button variant="secondary" onClick={() => navigate('/register')} className="bg-white border-white text-[#007A78] font-bold hover:bg-gray-100">
                    Register Now
                </Button>
            </section>
        </div>
    );
}