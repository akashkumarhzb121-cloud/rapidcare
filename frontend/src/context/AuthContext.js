import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use sessionStorage instead of localStorage for per-tab sessions
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Session restored:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to restore session:', error);
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Login attempt for:', email);
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      console.log('Login successful:', user);
      
      // Store in sessionStorage (per-tab)
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    console.log('Logging out user:', user?.name);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isOperator: user?.role === 'ambulance_operator',
    isHospitalStaff: user?.role === 'hospital_staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
