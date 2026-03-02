import { AudioPlayer } from '@/components/player/AudioPlayer/AudioPlayer';
import { PlayerProvider } from '@/context/PlayerContext';
import { config } from '@/config';
import { StreamStatus } from '@/types/player';
import type { StreamStatusValue } from '@/types/player';

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { createClient } from 'graphql-ws';
import { ApolloProvider } from "@apollo/client/react";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition, Observable } from '@apollo/client/utilities';
import { useEffect, useMemo, useState } from 'react';

export { StreamStatus } from '@/types/player';

export const fakeEmptyClient = new ApolloClient({
  link: new ApolloLink(() => {
    return new Observable((_) => {
    });
  }),
  cache: new InMemoryCache(),
});

export function App() {
	const [status, setStatus] = useState<StreamStatusValue>(StreamStatus.CHECKING);
	const [streamId, setStreamId] = useState<string | null>(null);
	
	const pathParts = window.location.pathname.split('/').filter(Boolean);
	const rawStreamId = pathParts[0] || 'guest';

	useEffect(() => {
		const checkStreamStatus = async () =>{
			try {
				const res = await fetch(`/api/stream/${rawStreamId}`);
				if (!res.ok) {
					setStatus(StreamStatus.NOT_FOUND);
					return;
				}

				const data = await res.json();

				if (!data.existed) {
					/* Stream doesn't exist. Navigate to root */
					window.location.href = '/'; 
					return;
				}
				if (!data.active) {
					/* Stream created but inactive */
					setStatus(StreamStatus.INACTIVE);
					setStreamId(rawStreamId);
				} else {
					/* Stream is active */
					setStreamId(rawStreamId);
					setStatus(StreamStatus.READY);
				}
			} catch {
				setStatus(StreamStatus.NOT_FOUND);
			}
		};
    	checkStreamStatus();
  	}, [rawStreamId]);

  	const client = useMemo(() => {
		// Only init a real connection if the stream is ready
		if (status !== StreamStatus.READY || !streamId) return null;

		const baseUrl = `${config.graphqlBase}/graphql`;
		const httpLink = new HttpLink({ uri: `${config.protocol}://${baseUrl}` });

		const wsLink = new GraphQLWsLink(
			createClient({
				url: `${config.wsProtocol}://${baseUrl}`,
				shouldRetry: () => true,
				connectionParams: { init: true },
			})
		);

		const splitLink = ApolloLink.split(
			({ query }) => {
				const definition = getMainDefinition(query);
				return (
				definition.kind === 'OperationDefinition' &&
				definition.operation === 'subscription'
				);
			},
			wsLink,
			httpLink
		);

		return new ApolloClient({
			link: splitLink,
			cache: new InMemoryCache(),
		});
	}, [status, streamId]);

	return (
		<ApolloProvider client={client || fakeEmptyClient}>
			<PlayerProvider streamStatus={status} streamId={streamId}>
				<AudioPlayer />
			</PlayerProvider>
		</ApolloProvider>
	);
}

export default App
