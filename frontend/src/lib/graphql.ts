import { gql } from '@apollo/client';

const TRACK_FIELDS = gql`
  fragment TrackFields on TrackInfo {
    title
    author
    duration
    identifier
    isStream
    uri
    artworkUrl
  }
`;

export const GET_INITIAL_STATE = gql`
  query GetInitialState($streamId: String!) {
    getInitialState(streamId: $streamId) {
      eventType
      state {
        isPlaying
        isPaused
        position
        loop
        track {
          ...TrackFields
        }
      }
      queue {
        ...TrackFields
      }
      history {
        ...TrackFields
      }
    }
  }
  ${TRACK_FIELDS}
`;

export const PLAYER_UPDATES_SUBSCRIPTION = gql`
  subscription OnPlayerUpdate($streamId: String!) {
    playerUpdates(streamId: $streamId) {
      eventType
      state {
        isPlaying
        isPaused
        position
        loop
        track {
          ...TrackFields
        }
      }
      queue {
        ...TrackFields
      }
      history {
        ...TrackFields
      }
    }
  }
  ${TRACK_FIELDS}
`;