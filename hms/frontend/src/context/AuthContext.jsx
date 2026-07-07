import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse user data:', e);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;

        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state
        setUser(userData);

        toast.success(`Welcome back, ${userData.name || username}!`);
        return userData;
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // hasRole function - checks if user has a specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // Check if user has any of the provided roles
  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Check if user has all of the provided roles
  const hasAllRoles = (roles) => {
    if (!user) return false;
    return roles.every(role => user.role === role);
  };

  const value = {
    // State
    user,
    loading,

    // Auth methods
    login,
    logout,

    // Role checking methods
    hasRole,
    hasAnyRole,
    hasAllRoles,

    // Convenience booleans
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isDoctor: user?.role === 'Doctor',
    isPharmacist: user?.role === 'Pharmacist',
    isReceptionist: user?.role === 'Receptionist',

    // Get user info
    getUserId: () => user?.id,
    getUserName: () => user?.name,
    getUserRole: () => user?.role,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};