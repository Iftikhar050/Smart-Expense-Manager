import { useState, useEffect } from 'react';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserId(decoded.userId);
      } catch (e) {
        console.error('Invalid token', e);
        localStorage.removeItem('token');
        setUserId(null);
      }
    } else {
      setUserId(null);
    }
  }, []);

  return { userId };
}

export function getCurrentUserId() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      return JSON.parse(atob(token.split('.')[1])).userId;
    } catch (e) {
      return null;
    }
  }
  return null;
}
