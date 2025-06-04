import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import * as SecureStore from "expo-secure-store";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkLoginStatus = async () => {
      try {
        const userJson = await SecureStore.getItemAsync("user");
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error("Error retrieving auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // In a real app, this would make an API call to authenticate
  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Simplified mock authentication for demo
      // In a real app, this would call your backend API
      if (username && password) {
        const mockUser = {
          id: `user_${Date.now()}`,
          username,
        };

        // Store user in secure storage
        await SecureStore.setItemAsync("user", JSON.stringify(mockUser));
        setUser(mockUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await SecureStore.deleteItemAsync("user");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
