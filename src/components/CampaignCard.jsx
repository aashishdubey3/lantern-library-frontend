import React from 'react';
import { Link } from 'react-router-dom';

export default function CampaignCard({ campaign, hostingNgo }) {
    // Calculate progress safely
    const progressPercent = campaign.goalAmount > 0 
        ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)) 
        : 0;

    // Use a placeholder if the image fails or is missing
    const imageUrl = campaign.imageUrl || 'https://placehold.co/600x400/eee/aaa?text=Campaign';

    return (
        <article className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            {/* Image Section */}
            <div className="relative aspect-video overflow-hidden bg-slate-100">
                <img 
                    src={imageUrl} 
                    alt={campaign.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/eee/aaa?text=Error'; }}
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#0B2948] shadow-sm">
                    Verified NGO
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-grow p-6">
                <h3 className="text-xl font-bold text-slate-900 leading-snug mb-1 line-clamp-2">
                    {campaign.title}
                </h3>
                <p className="text-sm font-medium text-[#007A78] mb-3">
                    by {campaign.host}
                </p>
                <p className="text-sm text-slate-600 mb-6 line-clamp-3 flex-grow">
                    {campaign.description}
                </p>

                {/* Progress Bar & Stats */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <span className="text-2xl font-black text-slate-900">
                                ₹{(campaign.raisedAmount || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-sm text-slate-500 ml-1">raised</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-400">
                            {progressPercent}%
                        </span>
                    </div>
                    
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-5">
                        <div 
                            className="bg-[#007A78] h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    {/* Action Button */}
                    <Link 
                        to={`/donate/${campaign.id}`} 
                        state={{ ngo: hostingNgo }}
                        className={`block w-full text-center font-semibold py-3 px-4 rounded-xl transition-colors ${
                            hostingNgo 
                            ? 'bg-slate-900 hover:bg-[#0B2948] text-white' 
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => !hostingNgo && e.preventDefault()}
                    >
                        {hostingNgo ? 'Support this cause' : 'Donation Unavailable'}
                    </Link>
                </div>
            </div>
        </article>
    );
}