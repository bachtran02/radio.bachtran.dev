function requireEnv(key: string): string {
    const val = import.meta.env[key];
    if (!val) throw new Error(`Missing required env var: ${key}`);
    return val as string;
}

const _protocol = window.location.protocol === 'https:' ? 'https' : 'http';

export const config = {
    hlsBase: requireEnv('VITE_HLS_BASE'),
    graphqlBase: requireEnv('VITE_GRAPHQL_BASE'),
    oauthBase: (import.meta.env.VITE_OAUTH_BASE as string | undefined) ?? '',
    protocol: _protocol,
    wsProtocol: _protocol === 'https' ? 'wss' : 'ws',
} as const;
