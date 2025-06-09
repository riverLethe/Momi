import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '@/types/user.types';
import { 
  getAuthToken, 
  removeAuthToken, 
  storeAuthToken,
  isAuthenticated as checkAuthentication,
  getMockUser
} from '@/utils/userPreferences.utils';

// Initial auth state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Auth context type
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isUserAuthenticated = await checkAuthentication();
        
        if (isUserAuthenticated) {
          // In a real app, you would fetch the user data from API
          // For now, we'll use a mock user
          const mockUser = getMockUser();
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: mockUser,
            error: null,
          });
        } else {
          setAuthState({
            ...initialAuthState,
            isLoading: false,
          });
        }
      } catch (error) {
        setAuthState({
          ...initialAuthState,
          isLoading: false,
          error: 'Failed to check authentication status',
        });
      }
    };

    checkAuth();
  }, []);

  /**
   * Login function - would connect to authentication API in a real app
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Mock login for now
      // In a real app, this would be an API call that returns a token
      const mockToken = 'mock-token-' + Date.now();
      await storeAuthToken(mockToken);
      
      // Mock user
      const mockUser = getMockUser();
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        error: null,
      });
      
      return true;
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      }));
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Remove token from storage
      await removeAuthToken();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev,
        isLoading: false,
        error: 'Logout failed',
      }));
    }
  };

  /**
   * Update user data
   */
  const updateUser = (userData: Partial<User>): void => {
    if (!authState.user) return;
    
    setAuthState(prev => ({
      ...prev,
      user: {
        ...prev.user!,
        ...userData,
      },
    }));
  };

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
