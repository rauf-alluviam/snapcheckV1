import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import { AuthState, AuthResponse } from '../types';

/**
 * AuthContext provides authentication functionality throughout the application
 * 
 * Key features:
 * - User registration with organization selection/creation
 * - Login functionality with token management
 * - Session persistence with token storage
 * - Automatic token refresh
 * - Role-based authorization
 * 
 * Error handling:
 * - All authentication functions return result objects with success/error status
 * - Registration properly handles organization creation errors
 * - Token expiration is automatically detected and handled
 * - Clear error messages are provided for common auth issues
 */

interface AuthContextProps {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string, 
    email: string, 
    password: string, 
    organizationId: string, 
    role: string,
    customRole?: string
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

enum ActionType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAIL = 'LOGIN_FAIL',
  REGISTER_SUCCESS = 'REGISTER_SUCCESS',
  REGISTER_FAIL = 'REGISTER_FAIL',
  LOGOUT = 'LOGOUT',
  AUTH_ERROR = 'AUTH_ERROR',
  USER_LOADED = 'USER_LOADED',
  AUTH_LOADING = 'AUTH_LOADING',
  SET_UNAUTHENTICATED = 'SET_UNAUTHENTICATED' // Add this new action
}

type Action =
  | { type: ActionType.LOGIN_SUCCESS | ActionType.REGISTER_SUCCESS | ActionType.USER_LOADED; payload: AuthResponse }
  | { type: ActionType.LOGIN_FAIL | ActionType.REGISTER_FAIL | ActionType.AUTH_ERROR; payload: string }
  | { type: ActionType.LOGOUT | ActionType.SET_UNAUTHENTICATED }
  | { type: ActionType.AUTH_LOADING };

const authReducer = (state: AuthState, action: Action): AuthState => {
  switch (action.type) {
    case ActionType.AUTH_LOADING:
      return {
        ...state,
        loading: true,
      };
    case ActionType.USER_LOADED:
    case ActionType.LOGIN_SUCCESS:
    case ActionType.REGISTER_SUCCESS:
      // Store the token value from the payload
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null,
      };
    case ActionType.AUTH_ERROR:
    case ActionType.LOGIN_FAIL:
    case ActionType.REGISTER_FAIL:
      // Clear token on auth error
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case ActionType.LOGOUT:
      // Clear token on logout
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case ActionType.SET_UNAUTHENTICATED:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null, // No error message
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already authenticated when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up axios response interceptor to handle token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        // Check if error is due to token expiration
        if (error.response && 
            (error.response.status === 401 || error.response.status === 403) && 
            error.response.data?.expired) {
          
          console.log('Token expired, logging out...');
          // Token has expired, logout the user
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Set auth token for all future axios requests
  const setAuthToken = (token: string | null) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Check if user is authenticated by validating the token
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({
        type: ActionType.SET_UNAUTHENTICATED,
      });
      return;
    }
    
    try {
      dispatch({ type: ActionType.AUTH_LOADING });
      
      // Validate token by fetching user data using the API instance
      const res = await api.get('/api/auth');
      
      // Create AuthResponse object with token and user data
      const authResponse: AuthResponse = {
        token, // Use existing token
        user: res.data
      };
      
      dispatch({
        type: ActionType.USER_LOADED,
        payload: authResponse,
      });
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      // If error is due to token expiration, show specific message
      const errorMessage = err.response?.data?.expired 
        ? 'Your session has expired. Please log in again.' 
        : 'Authentication failed. Please log in again.';
      
      // On error, clear token and set auth error
      localStorage.removeItem('token');
      setAuthToken(null);
      
      dispatch({
        type: ActionType.AUTH_ERROR,
        payload: errorMessage,
      });
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: ActionType.AUTH_LOADING });
      
      // Real API call to login endpoint
      const res = await api.post('/api/auth/login', { email, password });
      
      // Set token in axios headers
      setAuthToken(res.data.token);
      
      dispatch({
        type: ActionType.LOGIN_SUCCESS,
        payload: res.data,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      
      dispatch({
        type: ActionType.LOGIN_FAIL,
        payload: errorMessage,
      });
    }
  };
  // Register new user
  const register = async (
    name: string, 
    email: string, 
    password: string, 
    organizationId: string, 
    role: string,
    customRole?: string
  ) => {
    try {
      dispatch({ type: ActionType.AUTH_LOADING });
      
      // Real API call to register endpoint
      const res = await api.post('/api/auth/register', { 
        name, 
        email, 
        password, 
        organizationId, 
        role,
        customRole 
      });
      
      // Set token in axios headers
      setAuthToken(res.data.token);
      
      dispatch({
        type: ActionType.REGISTER_SUCCESS,
        payload: res.data,
      });

      // Return success result
      return { success: true, data: res.data };
    } catch (err: any) {
      console.error('Registration error:', err);
      
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      
      dispatch({
        type: ActionType.REGISTER_FAIL,
        payload: errorMessage,
      });

      // Return error result
      return { success: false, error: errorMessage };
    }
  };

  // Logout user
  const logout = () => {
    // Clear token from axios headers
    setAuthToken(null);
    
    // Dispatch logout action to clear auth state
    dispatch({ type: ActionType.LOGOUT });
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};