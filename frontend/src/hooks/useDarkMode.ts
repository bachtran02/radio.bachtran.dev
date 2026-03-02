import { useState, useEffect } from 'react';

interface UseDarkModeReturn {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

/**
 * Persists the user's dark-mode preference in localStorage and
 * syncs the `dark-mode` class on <body>.
 */
export function useDarkMode(): UseDarkModeReturn {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('darkMode');
        return saved !== null
            ? saved === 'true'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', String(isDarkMode));
        document.body.classList.toggle('dark-mode', isDarkMode);
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

    return { isDarkMode, toggleDarkMode };
}
