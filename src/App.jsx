import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from 'react';

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Onboarding from "./pages/Onboarding";
import Write from "./pages/Write";
import Settings from "./pages/Settings";
import Read from "./pages/Read";
import ScholarProfile from "./pages/ScholarProfile";
import Community from "./pages/Community";
import Messages from "./pages/Messages";

import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import SummonChat from "./pages/SummonChat";
import Articles from "./pages/Articles"; 
import Research from "./pages/Research";

// 🔥 A Helper Component to control the Bottom Nav
function AppLayout() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 THE MAGIC: Hide bottom nav if we are inside a specific chat or the summoning room!
  const isChatScreen = location.pathname.startsWith('/messages/') || location.pathname === '/summon';

  return (
    <>
      <Navbar />

      <div style={{ minHeight: "80vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/write" element={<Write />} />
          <Route path="/summon" element={<SummonChat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/article/:id" element={<Read />} />
          <Route path="/scholar/:id" element={<ScholarProfile />} />
          <Route path="/community" element={<Community />} />
          
          {/* 🔥 Notice we added the /:id route for Messages! */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />

          <Route path="/articles" element={<Articles />} />
          <Route path="/research" element={<Research />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </div>

      <div className="hide-on-mobile">
        <Footer />
      </div>

      {/* 📱 MOBILE BOTTOM NAV (Only shows if NOT in a chat) */}
      {isMobile && !isChatScreen && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: 'var(--bg-panel)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px 0', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
          <Link to="/" className="bottom-nav-link">🏠</Link>
          <Link to="/write" className="bottom-nav-link">✏️</Link>
          <Link to="/messages" className="bottom-nav-link">💬</Link>
          <Link to="/community" className="bottom-nav-link">🗣️</Link>
        </nav>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;