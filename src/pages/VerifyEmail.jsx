import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your identity...');
  
  // 🔥 FIX: A shield to prevent React Strict Mode from double-firing!
  const hasFired = useRef(false);

  useEffect(() => {
    // If we already fired the request, stop immediately
    if (hasFired.current) return;
    hasFired.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`https://lantern-library-backend.onrender.com/api/auth/verify/${token}`);
        const data = await res.json();
        setMessage(data.message);
      } catch (err) {
        setMessage('Server error during verification.');
      }
    };
    verify();
  }, [token]);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2 style={{ color: 'var(--lantern-gold)' }}>{message}</h2>
      <button onClick={() => navigate('/login')} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--lantern-gold)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
        Go to Login
      </button>
    </div>
  );
}