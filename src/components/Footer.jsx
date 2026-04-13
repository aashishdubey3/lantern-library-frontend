import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ loggedInNgo }) {
    return (
        <footer className="text-center mt-12 p-10 bg-[#0B2948] text-gray-400">
            <div className="flex justify-center flex-wrap gap-4 md:gap-6 mb-4">
                <Link to="/about" className="font-bold text-white hover:text-gray-300 transition-colors">About Us</Link>
                <Link to="/contact" className="font-bold text-white hover:text-gray-300 transition-colors">Contact Us</Link>
                <Link to="/admin" className="font-bold text-white hover:text-gray-300 transition-colors">Admin</Link>
                {!loggedInNgo && (
                    <Link to="/ngo-login" className="font-bold text-white hover:text-gray-300 transition-colors">NGO Login</Link>
                )}
            </div>
            <p>© 2026 HopeWorks Platform. All Rights Reserved.</p>
        </footer>
    );
}