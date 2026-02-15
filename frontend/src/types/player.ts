export interface TrackInfo {
  title: string;
  author: string;
  duration: number;
  identifier: string;
  isStream: boolean;
  uri: string;
  artworkUrl: string;
}

export interface PlayerUpdateEvent {
  eventType: string;
  state: {
    isPlaying: boolean;
    isPaused: boolean;
    position?: number;
    loop: string;
    track?: TrackInfo;
  };
  queue: TrackInfo[];
  history: TrackInfo[];
}