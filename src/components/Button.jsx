import React from 'react';

export default function Button({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) {
    const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-md transition-colors";
    let variantStyles = '';
    
    switch(variant) {
        case 'secondary':
            variantStyles = 'bg-transparent text-[#007A78] border border-[#007A78] hover:bg-[#F0F4F8]';
            break;
        case 'danger':
            variantStyles = 'bg-red-600 text-white hover:bg-red-700';
            break;
        default: // primary
            variantStyles = 'bg-[#007A78] text-white hover:bg-[#005A58]'; 
    }
    
    return (
        <button 
            type={type} 
            onClick={onClick} 
            className={`${baseStyles} ${variantStyles} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
            disabled={disabled}
        >
            {children}
        </button>
    );
}