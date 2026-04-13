import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';

export default function Header({ loggedInNgo, setLoggedInNgo }) {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const handleLogout = () => { 
        localStorage.removeItem('loggedInNgoId'); 
        setLoggedInNgo(null); 
        navigate('/'); 
        setIsMobileMenuOpen(false); 
    };

    const closeMenus = () => {
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="border-b border-gray-300 mb-10 pb-5">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#0B2948]">
                    <Link to="/" onClick={closeMenus}>HopeWorks</Link>
                </h1>
                
                {/* Desktop Menu */}
                <nav className="hidden sm:block">
                    <ul className="flex items-center gap-2 sm:gap-4">
                        <li><Link to="/"><Button variant="primary" className="py-2 px-4">Home</Button></Link></li>
                        <li className="relative">
                            <Button onClick={() => setDropdownOpen(!dropdownOpen)} variant="secondary" className="py-2 px-4">
                                Community ▾
                            </Button>
                            {dropdownOpen && ( 
                                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    <Link to="/news" onClick={closeMenus} className="block px-4 py-2 hover:bg-[#F0F4F8]">Latest News</Link>
                                    <Link to="/events" onClick={closeMenus} className="block px-4 py-2 hover:bg-[#F0F4F8]">Upcoming Events</Link>
                                    <Link to="/all-campaigns" onClick={closeMenus} className="block px-4 py-2 hover:bg-[#F0F4F8]">All Campaigns</Link>
                                </div>
                            )}
                        </li>
                        {loggedInNgo && (
                            <>
                                <li><Link to="/ngo-dashboard" className="p-2 rounded-md hover:bg-[#F0F4F8]">Dashboard</Link></li>
                                <li><button onClick={handleLogout} className="p-2 rounded-md text-red-600 hover:bg-[#F0F4F8]">Logout</button></li>
                            </>
                        )}
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <div className="sm:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-[#F0F4F8]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <nav className="sm:hidden mt-4">
                    <ul className="flex flex-col gap-2">
                        <li><Link to="/" onClick={closeMenus}><Button variant="primary" className="w-full">Home</Button></Link></li>
                        <li><Link to="/all-campaigns" onClick={closeMenus}><Button variant="secondary" className="w-full">All Campaigns</Button></Link></li>
                        {loggedInNgo && (
                            <>
                                <hr className="my-2" />
                                <li><Link to="/ngo-dashboard" onClick={closeMenus}><Button variant="secondary" className="w-full">Dashboard</Button></Link></li>
                                <li><button onClick={handleLogout} className="w-full p-2 rounded-md text-red-600 hover:bg-[#F0F4F8]">Logout</button></li>
                            </>
                        )}
                    </ul>
                </nav>
            )}
        </header>
    );
}