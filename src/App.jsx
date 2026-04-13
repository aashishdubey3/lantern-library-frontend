import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import NgoLogin from './pages/NgoLogin';
import NgoDashboard from './pages/NgoDashboard';
import RegisterNgo from './pages/RegisterNgo';
// --- ADD THESE TWO NEW IMPORTS ---
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
    const [loggedInNgo, setLoggedInNgo] = useState(localStorage.getItem('loggedInNgoId'));

    return (
        <BrowserRouter>
            <div className="min-h-screen flex flex-col font-sans">
                
                <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-5 pt-5">
                        <Header loggedInNgo={loggedInNgo} setLoggedInNgo={setLoggedInNgo} />
                    </div>
                </div>
                
                <main className="flex-grow max-w-6xl mx-auto w-full px-5 py-8">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        
                        {/* --- ADD THESE TWO NEW ROUTES --- */}
                        <Route path="/admin" element={<AdminLogin />} />
                        <Route path="/admin-dashboard" element={<AdminDashboard />} />
                        <Route path="/profile/:id" element={<ProfilePage />} />
                        <Route path="/ngo-login" element={<NgoLogin setLoggedInNgo={setLoggedInNgo} />} />
                        <Route path="/ngo-dashboard" element={<NgoDashboard />} />
                        <Route path="/register" element={<RegisterNgo />} />

                    </Routes>
                </main>

                <Footer loggedInNgo={loggedInNgo} />
                
            </div>
        </BrowserRouter>
    );
}