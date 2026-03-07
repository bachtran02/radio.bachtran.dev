import {
  CirclePlay,
  LogIn,
  LogOut,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { authApi } from '@/lib/api';

interface MenuPosition {
    x: number;
    y: number;
}

interface ProfileMenuProps {
    isOpen: boolean;
    menuPosition: MenuPosition;
    isLoggedIn: boolean;
    username?: string;
    onLogin: () => void;
    onLogout: () => void;
    onClose: () => void;
}

export function ProfileMenu({ isOpen, menuPosition, isLoggedIn, username, onLogin, onLogout, onClose }: ProfileMenuProps) {
    if (!isOpen) return null;

    const handleItem = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        onClose();
        action();
    };

    return createPortal(
        <div
            className="context-menu"
            style={{ left: `${menuPosition.x + 150}px`, top: `${menuPosition.y + 60}px` }}
        >
            {isLoggedIn ? (
                <div>
                    <div
                      className="context-menu-item context-menu-item--label"
                    >
                        <span>{username}</span>
                    </div>

                    <button
                        className="context-menu-item"
                        onClick={(e) => handleItem(e, onLogout)}
                    >
                        <LogOut size={16} />
                        <span>Log Out</span>
                    </button>
                    
                    <button
                    className="context-menu-item"
                    onClick={(e) => handleItem(e, () => {
                        authApi.createStream().then((res) => {
                            window.location.href = `/${res.identifier}`;
                        });
                    })}
                    >
                        <CirclePlay size={16} />
                        <span>Personal Player</span>
                    </button>
                </div>
            ) : (
                <div>
                    <button
                        className="context-menu-item"
                        onClick={(e) => handleItem(e, onLogin)}
                    >
                        <LogIn size={16} />
                        <span>Log In</span>
                    </button>
                    <button
                        className="context-menu-item context-menu-item--disabled"
                    >
                        <CirclePlay size={16} />
                        <span>Player</span>
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
}
