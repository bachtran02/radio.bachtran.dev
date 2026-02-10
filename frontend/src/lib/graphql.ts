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
  query GetInitialState {
    getInitialState {
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
  subscription OnPlayerUpdate {
    playerUpdates {
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