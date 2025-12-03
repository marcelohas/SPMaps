export interface GeoLocation {
  lat: number;
  lng: number;
  heading?: number | null;
}

export interface HistoricalPlace {
  id: string;
  title: string;
  description: string;
  location: GeoLocation;
  address?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingsTotal?: number;
}

export interface GeminiResult {
  text: string;
  highlight?: string;
  places: HistoricalPlace[];
}

export enum AppState {
  IDLE = 'IDLE',
  LOCATING = 'LOCATING',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface AudioState {
  isPlaying: boolean;
  audioBuffer: AudioBuffer | null;
}