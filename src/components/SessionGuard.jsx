import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSessionId, clearSession } from '../utils/session';

const SessionGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, loading } = useAuth();
  const isFirstCheck = useRef(true);

  useEffect(() => {
    if (loading) return;

    const isPublicPage = location.pathname === '/login' || location.pathname === '/blocked';
    if (isPublicPage) {
      isFirstCheck.current = false;
      return;
    }

    if (!isAuthenticated) {
      isFirstCheck.current = false;
      return;
    }

    const urlSid = new URLSearchParams(location.search).get('sid');
    const storedSid = getSessionId();

    if (urlSid && urlSid === storedSid) {
      // Correct session
      isFirstCheck.current = false;
      return;
    }

    if (urlSid && urlSid !== storedSid) {
      // Wrong session ID — clear everything and redirect to login
      clearSession();
      logout();
      navigate('/login', { replace: true });
      return;
    }

    // No sid in URL
    if (isFirstCheck.current) {
      // Initial page load (typed/pasted/refreshed URL) without sid — reject
      isFirstCheck.current = false;
      clearSession();
      logout();
      navigate('/login', { replace: true });
      return;
    }

    // Client-side navigation without sid — auto-add it
    if (storedSid) {
      const params = new URLSearchParams(location.search);
      params.set('sid', storedSid);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, isAuthenticated, loading]);

  return <>{children}</>;
};

export default SessionGuard;
