/**
 * Hook to check if Google Sign-In is properly configured
 */
export const useGoogleConfig = () => {
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const isGoogleConfigured = !!(googleWebClientId && googleIosClientId);

  return {
    isGoogleConfigured,
    googleWebClientId,
    googleIosClientId,
  };
};
