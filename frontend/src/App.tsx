import { AudioPlayer } from './components/player/AudioPlayer/AudioPlayer';
import { PlayerProvider } from './context/PlayerContext';

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink } from '@apollo/client';
import { createClient } from 'graphql-ws';
import { ApolloProvider } from "@apollo/client/react";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';

const client = new ApolloClient({
  link: ApolloLink.split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    new GraphQLWsLink(
      createClient({
        url: 'ws://localhost:8080/graphql',
        shouldRetry: () => true,
        connectionParams: {
          init: true 
        },
      })
    ),
    new HttpLink({
      uri: 'http://localhost:8080/graphql',
    })
  ),
  cache: new InMemoryCache(),
});


export function App() {
  return (
    <ApolloProvider client={client}>
      <PlayerProvider>
        <AudioPlayer />
      </PlayerProvider>
    </ApolloProvider>
  );
}

export default App
