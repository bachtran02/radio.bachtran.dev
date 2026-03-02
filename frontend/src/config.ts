const _protocol = window.location.protocol === 'https:' ? 'https' : 'http';

export const config = {
    hlsBase: import.meta.env.VITE_HLS_BASE as string,
    graphqlBase: import.meta.env.VITE_GRAPHQL_BASE as string,
    protocol: _protocol,
    wsProtocol: _protocol === 'https' ? 'wss' : 'ws',
} as const;
