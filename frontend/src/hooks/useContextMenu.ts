import { useState, useEffect } from 'react';

interface MenuPosition {
    x: number;
    y: number;
}

interface UseContextMenuReturn {
    openIndex: number | null;
    menuPosition: MenuPosition | null;
    toggle: (e: React.MouseEvent, index: number) => void;
    close: () => void;
}

/**
 * Manages the open/closed state and screen position of a single context menu
 * tied to an indexed list of items.
 */
export function useContextMenu(): UseContextMenuReturn {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenIndex(null);
            setMenuPosition(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggle = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (openIndex === index) {
            setOpenIndex(null);
            setMenuPosition(null);
        } else {
            const button = e.currentTarget as HTMLElement;
            const rect = button.getBoundingClientRect();
            setMenuPosition({ x: rect.right - 8, y: rect.top + rect.height / 2 });
            setOpenIndex(index);
        }
    };

    const close = () => {
        setOpenIndex(null);
        setMenuPosition(null);
    };

    return { openIndex, menuPosition, toggle, close };
}
