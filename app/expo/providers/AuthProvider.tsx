import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { User, AuthState } from '@/types/user.types';
import {
  getAuthToken,
  removeAuthToken,
  storeAuthToken,
  isAuthenticated as checkAuthentication,
  getMockUser
} from '@/utils/userPreferences.utils';
import { apiClient } from '@/utils/api';
import { smartSync } from '@/utils/sync.utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure Google Sign-In
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

// Only configure Google Sign-In if proper client IDs are provided
if (googleWebClientId && googleIosClientId) {
  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  });
} else {
  console.warn('Google Sign-In not configured: Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID or EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
}

// Complete the sign-in with web browser for OAuth flows
WebBrowser.maybeCompleteAuthSession();

// Use Expo Auth Request for Apple Sign In
const redirectUri = AuthSession.makeRedirectUri({
  scheme: process.env.EXPO_PUBLIC_SCHEME || 'momiq'
});

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
  loginWithGoogle: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  syncData: () => Promise<void>;
  lastSyncTime: Date | null;
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
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Apple Sign In configuration
  const [appleRequest, appleResponse, applePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.momiq.app',
      scopes: ['name', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      state: Crypto.randomUUID(),
    },
    {
      authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      tokenEndpoint: 'https://appleid.apple.com/auth/token',
      revocationEndpoint: 'https://appleid.apple.com/auth/revoke',
    }
  );

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isUserAuthenticated = await checkAuthentication();

        if (isUserAuthenticated) {
          const token = await getAuthToken();
          if (token) {
            // Fetch user data from API
            try {
              const userData = await apiClient.auth.getProfile(token);
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: userData,
                error: null,
              });
            } catch (error) {
              console.error('Failed to fetch user profile:', error);
              // Fallback to mock user for development
              const mockUser = getMockUser();
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: mockUser,
                error: null,
              });
            }
          }
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

  // Handle Apple Sign In response
  useEffect(() => {
    if (appleResponse?.type === 'success') {
      handleAppleSignInResponse(appleResponse);
    }
  }, [appleResponse]);

  /**
   * Sync data with server
   */
  const syncData = useCallback(async (): Promise<void> => {
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // 使用智能同步策略，非阻塞
      await smartSync(authState.user.id, "app_start");
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Data sync error:', error);
      // 不阻塞用户流程，静默处理错误
    }
  }, [authState.isAuthenticated, authState.user]);

  /**
   * Email/Password login function
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Call authentication API
      const response = await apiClient.auth.login({ email, password });

      if (response.token) {
        await storeAuthToken(response.token);

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          error: null,
        });

        // Trigger initial data sync
        syncData();

        return true;
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      }));
      return false;
    }
  }, [syncData]);

  /**
   * Google Sign In
   */
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if Google Sign-in is properly configured
      if (!googleWebClientId || !googleIosClientId) {
        throw new Error('Google Sign-In is not properly configured. Please set up EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID environment variables.');
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (userInfo.data?.user) {
        // Send Google token to backend for verification
        const idToken = userInfo.data.idToken;
        if (!idToken) throw new Error('No ID token received from Google');
        const response = await apiClient.auth.googleLogin({ idToken });

        if (response.token) {
          await storeAuthToken(response.token);

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: response.user,
            error: null,
          });

          // Trigger initial data sync
          syncData();

          return true;
        }
      }

      throw new Error('Google sign-in failed');
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Google sign-in failed',
      }));
      return false;
    }
  }, [syncData]);

  /**
   * Apple Sign In
   */
  const loginWithApple = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      if (Platform.OS !== 'ios') {
        Alert.alert('Error', 'Apple Sign In is only available on iOS devices');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      const result = await applePromptAsync();

      if (result.type === 'success') {
        return await handleAppleSignInResponse(result);
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('Apple sign-in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Apple sign-in failed',
      }));
      return false;
    }
  }, [applePromptAsync]);

  /**
   * Handle Apple Sign In response
   */
  const handleAppleSignInResponse = useCallback(async (response: AuthSession.AuthSessionResult): Promise<boolean> => {
    try {
      if (response.type === 'success' && response.params.code) {
        // Send Apple authorization code to backend
        const appleResponse = await apiClient.auth.appleLogin({
          authorizationCode: response.params.code,
          state: response.params.state
        });

        if (appleResponse.token) {
          await storeAuthToken(appleResponse.token);

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: appleResponse.user,
            error: null,
          });

          // Trigger initial data sync
          syncData();

          return true;
        }
      }

      throw new Error('Apple sign-in failed');
    } catch (error) {
      console.error('Apple sign-in response error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Apple sign-in failed',
      }));
      return false;
    }
  }, [syncData]);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Sign out from Google if user was logged in with Google
      try {
        await GoogleSignin.signOut();
      } catch (error) {
        // Ignore Google sign out errors
      }

      // Remove token from storage
      await removeAuthToken();

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });

      setLastSyncTime(null);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed',
      }));
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((userData: Partial<User>): void => {
    if (!authState.user) return;

    setAuthState(prev => ({
      ...prev,
      user: {
        ...prev.user!,
        ...userData,
      },
    }));
  }, [authState.user]);

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
    updateUser,
    syncData,
    lastSyncTime,
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
