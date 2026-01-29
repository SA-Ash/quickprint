import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/auth.service';
import { wsService } from '../services/websocket.service';

const AuthContext = createContext();

// Check if we should use mock mode (for development without backend)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get fresh token for WebSocket reconnect
  const getToken = () => {
    return localStorage.getItem('accessToken');
  };

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
      // Connect WebSocket with existing session
      const token = localStorage.getItem('accessToken');
      if (token) {
        wsService.connect(token, getToken);
      }
    }
    setLoading(false);

    // Cleanup on unmount
    return () => {
      wsService.disconnect();
    };
  }, []);

  const login = async (loginData) => {
    try {
      setError(null);

      // Mock mode for development without backend
      if (USE_MOCK) {
        return handleMockLogin(loginData);
      }

      // Real API calls
      if (loginData.type === 'phone') {
        if (loginData.step === 'initiate') {
          const response = await authService.initiatePhoneOTP(loginData.phone);
          return { success: true, message: response.message || 'OTP sent successfully' };
        } else if (loginData.step === 'verify') {
          const code = loginData.otp || loginData.code;
          const response = await authService.verifyPhoneOTP(loginData.phone, code, loginData.college);
          setUser(response.user);
          // Connect WebSocket after successful login
          const token = localStorage.getItem('accessToken');
          if (token) wsService.connect(token, getToken);
          return { success: true, user: response.user };
        }
      } else if (loginData.type === 'phone_password') {
        // Phone + Password authentication
        if (loginData.step === 'signup') {
          const response = await authService.phonePasswordSignup(
            loginData.phone,
            loginData.password,
            loginData.name,
            loginData.college
          );
          setUser(response.user);
          return { success: true, user: response.user };
        } else {
          // Default to login
          const response = await authService.phonePasswordLogin(loginData.phone, loginData.password);
          setUser(response.user);
          const token = localStorage.getItem('accessToken');
          if (token) wsService.connect(token, getToken);
          return { success: true, user: response.user };
        }
      } else if (loginData.type === 'email_password') {
        // Email + Password authentication
        if (loginData.step === 'signup') {
          const response = await authService.emailPasswordSignup(
            loginData.email,
            loginData.password,
            loginData.name,
            loginData.college
          );
          setUser(response.user);
          return { success: true, user: response.user };
        } else {
          // Default to login
          const response = await authService.emailPasswordLogin(loginData.email, loginData.password);
          setUser(response.user);
          const token = localStorage.getItem('accessToken');
          if (token) wsService.connect(token, getToken);
          return { success: true, user: response.user };
        }
      } else if (loginData.type === 'google') {
        const response = await authService.googleAuth(loginData.idToken);
        setUser(response.user);
        return { success: true, user: response.user };
      } else if (loginData.type === 'partner') {
        if (loginData.step === 'register') {
          // Legacy direct registration (without 2FA)
          const response = await authService.partnerRegister(loginData);
          setUser(response.user);
          return { success: true, user: response.user };
        } else if (loginData.step === 'initiate') {
          // Step 1: Initiate 2FA registration - sends OTP to phone
          const response = await authService.initiatePartnerRegister(loginData);
          return { success: true, message: response.message, phone: response.phone };
        } else if (loginData.step === 'verify-otp') {
          // Step 2: Verify OTP - sends magic link to email
          const response = await authService.verifyPartnerOTP(loginData.phone, loginData.code);
          return { success: true, message: response.message, email: response.email };
        } else if (loginData.step === 'verify-email') {
          // Step 3: Complete registration via magic link
          const response = await authService.completePartnerRegister(loginData.token);
          setUser(response.user);
          return { success: true, user: response.user };
        } else if (loginData.step === 'resend-otp') {
          // Resend OTP
          const response = await authService.resendPartnerOTP(loginData.phone);
          return { success: true, message: response.message };
        } else {
          // Default: login with email/password
          const response = await authService.partnerLogin(loginData.email, loginData.password);
          setUser(response.user);
          const token = localStorage.getItem('accessToken');
          if (token) wsService.connect(token, getToken);
          return { success: true, user: response.user };
        }
      }

      throw new Error('Invalid login type');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Mock login for development without backend
  const handleMockLogin = async (loginData) => {
    let mockUser = {
      id: 'user_' + Date.now(),
      role: 'STUDENT',
      createdAt: new Date().toISOString()
    };

    if (loginData.type === 'phone') {
      if (loginData.step === 'initiate') {
        return { success: true, message: 'OTP sent (mock)' };
      } else if (loginData.step === 'verify') {
        mockUser.phone = loginData.phone;
        mockUser.college = loginData.college || 'CBIT';
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('accessToken', 'mock_token_' + Date.now());
        setUser(mockUser);
        return { success: true, user: mockUser };
      }
    } else if (loginData.type === 'google') {
      mockUser.email = 'user@gmail.com';
      mockUser.name = 'Google User';
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('accessToken', 'mock_token_' + Date.now());
      setUser(mockUser);
      return { success: true, user: mockUser };
    } else if (loginData.type === 'partner') {
      mockUser.role = 'SHOP';
      mockUser.email = loginData.email;
      mockUser.name = loginData.name || 'Partner User';
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('accessToken', 'mock_token_' + Date.now());
      setUser(mockUser);
      return { success: true, user: mockUser };
    }

    return { success: true, user: mockUser };
  };

  const logout = async () => {
    try {
      // Disconnect WebSocket first
      wsService.disconnect();
      
      if (!USE_MOCK) {
        await authService.logout();
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user state even if API call fails
      wsService.disconnect();
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    setUser: updateUser,
    login,
    logout,
    loading,
    error,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
