import { useCallback, useEffect, useState } from 'react';
import { config } from '@/config';

export interface AuthUser {
    id: string;
    name: string | null;
}

interface AuthState {
    user: AuthUser | null;
    loading: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({ user: null, loading: true });

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/current', { credentials: 'include' });
            if (res.ok) {
                const user = await res.json() as AuthUser;
                setState({ user, loading: false });
            } else {
                setState({ user: null, loading: false });
            }
        } catch {
            setState({ user: null, loading: false });
        }
    }, []);

    useEffect(() => {
        void fetchUser();
    }, [fetchUser]);

    const login = useCallback(() => {
        const base = config.oauthBase || window.location.origin;
        window.location.href = `${base}/oauth2/authorization/github`;
    }, []);

    const logout = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
            if (res.ok) {
                setState({ user: null, loading: false });
            }
        } catch {
            setState({ user: null, loading: false });
        }
    }, []);

    return { user: state.user, loading: state.loading, login, logout };
}
