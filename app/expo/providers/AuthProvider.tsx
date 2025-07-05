import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert, ActionSheetIOS, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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

        if (Platform.OS === 'ios') {
          const options = ['Merge (keep both)', 'Clear & Download Remote', 'Push & Override Remote', 'Sign Out'];
          const destructiveIndex = 1;
          const signOutIndex = 3;

          ActionSheetIOS.showActionSheetWithOptions(
            {
              options,
              destructiveButtonIndex: destructiveIndex,
              cancelButtonIndex: signOutIndex,
            },
            async (buttonIndex) => {
              switch (buttonIndex) {
                case 0: // Merge
                  syncData();
                  break;
                case 1: // Clear & Download
                  await storage.setItem(STORAGE_KEYS.BILLS, []);
                  await clearQueue();
                  syncData();
                  break;
                case 2: // Push & Override
                  try {
                    await apiClient.sync.uploadBills(token, localBills.map((b) => ({ action: 'create', bill: b })));
                    await clearQueue();
                    syncData();
                  } catch (err) {
                    console.error('Upload bills failed', err);
                    syncData();
                  }
                  break;
                case signOutIndex: // sign out
                  await removeAuthToken();
                  setAuthState({ ...initialAuthState, isLoading: false });
                  break;
                default:
                  break;
              }
            }
          );
        } else {
          Alert.alert(
            'Sync Options',
            'Local bills detected. How would you like to sync with your cloud data?',
            [
              {
                text: 'Merge',
                onPress: () => syncData(),
              },
              {
                text: 'Clear & Download Remote',
                onPress: async () => {
                  await storage.setItem(STORAGE_KEYS.BILLS, []);
                  await clearQueue();
                  syncData();
                },
                style: 'destructive',
              },
              {
                text: 'Push & Override Remote',
                onPress: async () => {
                  try {
                    await apiClient.sync.uploadBills(token, localBills.map((b) => ({ action: 'create', bill: b })));
                    await clearQueue();
                    syncData();
                  } catch (err) {
                    console.error('Upload bills failed', err);
                    syncData();
                  }
                },
              },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await removeAuthToken();
                  setAuthState({ ...initialAuthState, isLoading: false });
                },
              },
            ]
          );
        }
      } catch (err) {
        console.error('Post-login sync prompt error:', err);
        syncData();
      }
    },
    [syncData]
  );

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

          handlePostLoginSync(response.token);

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
  }, [syncData, handlePostLoginSync]);

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
    loginWithWeChat,
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
