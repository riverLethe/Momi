import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { User, AuthState } from '@/types/user.types';
import {
  getAuthToken,
  removeAuthToken,
  storeAuthToken,
  isAuthenticated as checkAuthentication,
} from '@/utils/userPreferences.utils';
import { storage, STORAGE_KEYS } from '@/utils/storage.utils';
import { clearQueue } from '@/utils/offlineQueue.utils';
import { apiClient } from '@/utils/api';
import { smartSync } from '@/utils/sync.utils';
import { SyncOptionsSheet } from '@/components/ui/SyncOptionsSheet';

// Configure Google Sign-In
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;


// Complete the sign-in with web browser for OAuth flows
WebBrowser.maybeCompleteAuthSession();

// Use Expo Auth Request for WeChat Sign In
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
  loginWithWeChat: () => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  syncData: () => Promise<void>;
  lastSyncTime: Date | null;
  showSyncOptionsSheet: boolean;
  setSyncOptionsSheet: (show: boolean) => void;
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
  const [showSyncOptionsSheet, setShowSyncOptionsSheet] = useState(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [localBills, setLocalBills] = useState<any[]>([]);

  // Google Auth Request Setup
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  // WeChat Auth Request Setup (only if APP_ID exists)
  const wechatRequestConfig = React.useMemo(() => {
    const wechatAppId = process.env.EXPO_PUBLIC_WECHAT_APP_ID;
    if (!wechatAppId) return null;

    return {
      clientId: wechatAppId,
      scopes: ["snsapi_userinfo"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      state: Crypto.randomUUID(),
      extraParams: {
        appid: wechatAppId,
        scope: "snsapi_userinfo",
      },
    };
  }, [redirectUri]);

  const wechatServiceConfig = React.useMemo(() => {
    if (!wechatRequestConfig) return null;
    return {
      authorizationEndpoint: "https://open.weixin.qq.com/connect/oauth2/authorize",
      tokenEndpoint: "https://api.weixin.qq.com/sns/oauth2/access_token",
    };
  }, [wechatRequestConfig]);

  const [wechatRequest, wechatResponse, wechatPromptAsync] = AuthSession.useAuthRequest(
    // If WeChat is not configured, provide a dummy config to satisfy hook rules
    (wechatRequestConfig ?? {
      clientId: "",
      redirectUri,
      scopes: [],
      responseType: AuthSession.ResponseType.Token,
    }),
    wechatServiceConfig ?? null
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
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
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

  // Handle Google response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSignInResponse(googleResponse);
    }
  }, [googleResponse]);

  // Handle WeChat response
  useEffect(() => {
    if (wechatResponse?.type === 'success') {
      handleWeChatSignInResponse(wechatResponse);
    }
  }, [wechatResponse]);

  /**
   * Sync data with server
   */
  const syncData = useCallback(async (): Promise<void> => {
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // 使用智能同步策略，非阻塞
      await smartSync(authState.user.id, "app_start");

      // 更新本地存储的同步时间，确保与useDataSync保持一致
      const newSyncTime = new Date();
      await storage.setItem("momiq_last_sync", newSyncTime.toISOString());
      setLastSyncTime(newSyncTime);
    } catch (error) {
      console.error('Data sync error:', error);
      // 不阻塞用户流程，静默处理错误
    }
  }, [authState.isAuthenticated, authState.user]);

  /**
   * After successful login prompt user how to handle existing local bills.
   */
  const handlePostLoginSync = useCallback(
    async (token: string) => {
      try {
        const localBills = (await storage.getItem<any[]>(STORAGE_KEYS.BILLS)) || [];

        // If no local bills, just run normal sync
        if (localBills.length === 0) {
          syncData();
          return;
        }

        // Store token and bills for sheet handlers
        setSyncToken(token);
        setLocalBills(localBills);
        setShowSyncOptionsSheet(true);
      } catch (err) {
        console.error('Post-login sync prompt error:', err);
        syncData();
      }
    },
    [syncData]
  );

  // Sync option handlers
  const handleMerge = useCallback(async () => {
    syncData();
  }, [syncData]);

  const handleClearAndDownload = useCallback(async () => {
    await storage.setItem(STORAGE_KEYS.BILLS, []);
    await clearQueue();
    syncData();
  }, [syncData]);

  const handlePushAndOverride = useCallback(async () => {
    if (!syncToken) return;
    try {
      await apiClient.sync.uploadBills(syncToken, localBills.map((b) => ({ action: 'create', bill: b })));
      await clearQueue();
      syncData();
    } catch (err) {
      console.error('Upload bills failed', err);
      syncData();
    }
  }, [syncToken, localBills, syncData]);

  const handleSyncSignOut = useCallback(async () => {
    await removeAuthToken();
    setAuthState({ ...initialAuthState, isLoading: false });
  }, []);

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

        // Prompt user for sync strategy
        handlePostLoginSync(response.token);

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
  }, [syncData, handlePostLoginSync]);

  /**
   * Handle Google Sign In response
   */
  const handleGoogleSignInResponse = useCallback(async (response: AuthSession.AuthSessionResult): Promise<boolean> => {
    try {
      if (response.type === 'success') {
        // expo-auth-session/providers/google returns tokens in authentication object
        const authentication = (response as any).authentication;
        const params = response.params;

        // Try to get id_token from authentication object first, then from params
        const idToken = authentication?.idToken || params?.id_token;

        // Only proceed if we have an idToken (skip the first response with just authorization code)
        if (idToken) {
          const apiResponse = await apiClient.auth.googleLogin({ idToken });

          if (apiResponse.token) {
            await storeAuthToken(apiResponse.token);

            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: apiResponse.user,
              error: null,
            });

            handlePostLoginSync(apiResponse.token);

            return true;
          }
        } else {
          // This is likely the first response with authorization code, not an error
          // Just log for debugging but don't throw error
          return false; // Return false but don't throw error
        }
      } else {
        console.error('Google sign-in response type:', response.type);
        if (response.type === 'error') {
          console.error('Google sign-in error details:', response.error);
        }
      }

      throw new Error('Google sign-in failed');
    } catch (error) {
      console.error('Google sign-in response error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'Google sign-in failed' }));
      return false;
    }
  }, [handlePostLoginSync]);

  /**
   * Google Sign In
   */
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      // Check if Google configuration is complete
      if (!googleWebClientId || !googleIosClientId) {
        console.error('Google OAuth configuration incomplete:', {
          webClientId: !!googleWebClientId,
          iosClientId: !!googleIosClientId,
          androidClientId: !!googleAndroidClientId
        });
        Alert.alert('Error', 'Google login is not properly configured. Please check environment variables.');
        return false;
      }

      if (!googlePromptAsync || typeof googlePromptAsync !== 'function') {
        console.error('Google promptAsync not available');
        Alert.alert('Error', 'Google login is not configured');
        return false;
      }

      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await googlePromptAsync();

      if (result.type === 'success') {
        return await handleGoogleSignInResponse(result);
      } else if (result.type === 'cancel') {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      } else {
        console.error('Google sign-in failed with type:', result.type);
        setAuthState(prev => ({ ...prev, isLoading: false, error: 'Google sign-in failed' }));
        return false;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'Google sign-in failed' }));
      return false;
    }
  }, [googlePromptAsync, handleGoogleSignInResponse, googleWebClientId, googleIosClientId]);

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

      // 使用 expo-apple-authentication 进行苹果登录
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential && credential.identityToken) {
        // 发送 identity token 到后端进行验证
        const appleResponse = await apiClient.auth.appleLogin({
          identityToken: credential.identityToken,
          user: credential.user
        });

        if (appleResponse.token) {
          await storeAuthToken(appleResponse.token);

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: appleResponse.user,
            error: null,
          });

          handlePostLoginSync(appleResponse.token);

          return true;
        }
      }

      throw new Error('Apple sign-in failed');
    } catch (error) {
      console.error('Apple sign-in error:', error);

      // 用户取消登录
      if ((error as any)?.code === 'ERR_CANCELED') {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Apple sign-in failed',
      }));
      return false;
    }
  }, [syncData, handlePostLoginSync]);

  /**
   * WeChat Sign In
   */
  const loginWithWeChat = useCallback(async (): Promise<boolean> => {
    try {
      if (!wechatPromptAsync || typeof wechatPromptAsync !== 'function') {
        Alert.alert('Error', 'WeChat login is not configured');
        return false;
      }

      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await wechatPromptAsync();

      if (result.type === 'success') {
        return await handleWeChatSignInResponse(result);
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('WeChat sign-in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'WeChat sign-in failed' }));
      return false;
    }
  }, [wechatPromptAsync, syncData]);

  /**
   * Handle WeChat Sign In response
   */
  const handleWeChatSignInResponse = useCallback(async (response: AuthSession.AuthSessionResult): Promise<boolean> => {
    try {
      if (response.type === 'success' && response.params.code) {
        const apiResponse = await apiClient.auth.wechatLogin({ code: response.params.code });

        if (apiResponse.token) {
          await storeAuthToken(apiResponse.token);

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: apiResponse.user,
            error: null,
          });

          // Trigger data sync
          syncData();

          return true;
        }
      }

      throw new Error('WeChat sign-in failed');
    } catch (error) {
      console.error('WeChat sign-in response error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'WeChat sign-in failed' }));
      return false;
    }
  }, [syncData]);

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
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
   * Delete account function
   */
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call API to delete account
      await apiClient.auth.deleteAccount(token);

      // Remove token from storage
      await removeAuthToken();

      // Clear local data
      await storage.clear();

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });

      setLastSyncTime(null);
      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to delete account',
      }));
      return false;
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
    loginWithWeChat,
    logout,
    deleteAccount,
    updateUser,
    syncData,
    lastSyncTime,
    showSyncOptionsSheet,
    setSyncOptionsSheet: setShowSyncOptionsSheet,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <SyncOptionsSheet
        open={showSyncOptionsSheet}
        onOpenChange={setShowSyncOptionsSheet}
        onMerge={handleMerge}
        onClearAndDownload={handleClearAndDownload}
        onPushAndOverride={handlePushAndOverride}
        onSignOut={handleSyncSignOut}
      />
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
