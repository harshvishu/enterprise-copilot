import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeProviderContext = createContext({ theme: 'dark', setTheme: () => null });

export function ThemeProvider({ children, defaultTheme = 'dark', storageKey = 'enterprise-copilot-theme' }) {
    const [theme, setThemeState] = useState(() => localStorage.getItem(storageKey) || defaultTheme);

    useEffect(() => {
        const root = document.documentElement;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
            root.classList.remove('light', 'dark');
            root.classList.add(resolved);
        };
        apply();
        if (theme !== 'system') return undefined;
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);

    const setTheme = (next) => {
        localStorage.setItem(storageKey, next);
        setThemeState(next);
    };

    return (
        <ThemeProviderContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeProviderContext);
