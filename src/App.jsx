import { BrowserRouter, Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <BrowserRouter>
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

          {/* 🔥 The Summoning Room */}
          <Route path="/summon" element={<SummonChat />} />
          <Route path="/settings" element={<Settings />} />

          {/* 📖 The Manuscript Reader */}
          <Route path="/article/:id" element={<Read />} />
          <Route path="/scholar/:id" element={<ScholarProfile />} />
          <Route path="/community" element={<Community />} />
          <Route path="/messages" element={<Messages />} />

          {/* 📱 The New Mobile Deepstash Feeds */}
          <Route path="/articles" element={<Articles />} />
          <Route path="/research" element={<Research />} />

          {/* 🔐 Authentication Routes */}
          <Route path="/verify/:token" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </div>

      <Footer />
    </BrowserRouter>
  );
}

export default App;