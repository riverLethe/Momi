import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getUserPreferences, updateUserPreferences } from '@/utils/userPreferences.utils';

type ThemeMode = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    actualTheme: ActualTheme;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [actualTheme, setActualTheme] = useState<ActualTheme>('light');

    // 计算实际主题
    useEffect(() => {
        if (themeMode === 'system') {
            setActualTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
        } else {
            setActualTheme(themeMode);
        }
    }, [themeMode, systemColorScheme]);

    // 从本地存储加载主题偏好
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const preferences = await getUserPreferences();
                setThemeModeState(preferences.theme);
            } catch (error) {
                console.error('Failed to load theme preference:', error);
            }
        };

        loadThemePreference();
    }, []);

    // 设置主题模式并保存到本地存储
    const setThemeMode = async (mode: ThemeMode) => {
        try {
            setActualTheme(mode === 'dark' ? 'dark' : 'light');
            setThemeModeState(mode);
            await updateUserPreferences({ theme: mode });
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    // 切换主题（light <-> dark）
    const toggleTheme = () => {
        const newMode = actualTheme === 'light' ? 'dark' : 'light';
        setThemeMode(newMode);
    };

    const value: ThemeContextType = {
        themeMode,
        actualTheme,
        setThemeMode,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider; 