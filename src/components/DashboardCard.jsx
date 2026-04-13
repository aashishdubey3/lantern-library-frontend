import React from 'react';

export default function DashboardCard({ title, list, renderItem, className = '' }) {
    return (
        <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ${className}`}>
            <h3 className="text-xl font-bold text-[#0B2948] mb-4 pb-2 border-b border-slate-100">
                {title}
            </h3>
            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {Array.isArray(list) && list.length > 0 ? (
                    list.map((item, index) => (
                        <li key={item?.id || index} className="pb-3 border-b border-slate-50 last:border-b-0 last:pb-0">
                            {renderItem(item)}
                        </li>
                    ))
                ) : (
                    <li className="text-slate-500 text-sm">No data yet.</li>
                )}
            </ul>
        </div>
    );
}