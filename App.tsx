import React, { useState, useEffect, useCallback, useRef, ErrorInfo, ReactNode, Component } from 'react';
import MapDisplay from './components/MapDisplay';
import HistoryPanel from './components/HistoryPanel';
import DidYouKnowPopup from './components/DidYouKnowPopup';
import DrivingOverlay from './components/DrivingOverlay';
import { fetchHistoricalContext, generateVoiceNarration, generateEmailItinerary } from './services/geminiService';
import { GeoLocation, HistoricalPlace, AppState } from './types';

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h1>
          <p className="text-gray-700 mb-4">Ocorreu um erro inesperado ao carregar o aplicativo.</p>
          <div className="bg-white p-4 rounded shadow border border-red-200 text-left overflow-auto max-w-full">
            <code className="text-xs text-red-800 font-mono break-all">
              {this.state.error?.toString()}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main App Component ---
const AppContent: React.FC = () => {
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [places, setPlaces] = useState<HistoricalPlace[]>([]);
  const [aiText, setAiText] = useState<string>("");
  const [highlightText, setHighlightText] = useState<string | undefined>(undefined);
  const [showHighlightPopup, setShowHighlightPopup] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedPlace, setSelectedPlace] = useState<HistoricalPlace | null>(null);
  const [tracking, setTracking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  // New States for Driving Mode
  const [drivingMode, setDrivingMode] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastAnalyzedLocation = useRef<GeoLocation | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Check API Key on Mount
  useEffect(() => {
    // A verificação é feita contra a string vazia definida no vite.config.ts
    if (!process.env.API_KEY || process.env.API_KEY === "") {
      setApiKeyMissing(true);
    }
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    try {
      const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextConstructor) {
        audioContextRef.current = new AudioContextConstructor({ sampleRate: 24000 });
      }
    } catch (e) {
      console.warn("AudioContext not supported");
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Wake Lock Logic (Keep Screen On during Driving Mode)
  useEffect(() => {
    const requestWakeLock = async () => {
      if (drivingMode && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock active');
        } catch (err) {
          console.error(`${err} - Wake Lock failed`);
        }
      } else {
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [drivingMode]);

  // Audio Playback Logic
  const playAudio = useCallback((buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;

    // Stop previous
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) { }
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);

    audioSourceRef.current = source;
    source.start();
    setIsPlaying(true);
  }, []);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) { }
      setIsPlaying(false);
    }
  }, []);

  // Geolocation handling
  useEffect(() => {
    if (apiKeyMissing) return;

    if (!navigator.geolocation) {
      setErrorMsg("Geolocalização não suportada.");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, heading } = position.coords;
      const newLoc = { lat: latitude, lng: longitude, heading };
      setUserLocation(newLoc);

      if (appState === AppState.IDLE) setAppState(AppState.READY);
    };

    const handleError = () => {
      setErrorMsg("Permissão de GPS necessária.");
      setAppState(AppState.ERROR);
    };

    let watchId: number;
    if (tracking || drivingMode) {
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      });
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking, drivingMode, appState, apiKeyMissing]);

  // Main Action: Analyze Surroundings
  const handleExplore = useCallback(async (location: GeoLocation, isAuto: boolean = false) => {
    setAppState(AppState.ANALYZING);
    if (!isAuto) {
      setAiText("");
      setHighlightText(undefined);
      setShowHighlightPopup(false);
      setSelectedPlace(null);
    }
    setErrorMsg(null);

    try {
      // 1. Fetch Text & Places
      const result = await fetchHistoricalContext(location.lat, location.lng, drivingMode);

      setAiText(result.text);
      // Append new places to history, avoiding duplicates by ID
      setPlaces(prev => {
        const newPlaces = result.places.filter(np => !prev.some(op => op.id === np.id));
        return [...prev, ...newPlaces];
      });

      setAppState(AppState.READY);
      lastAnalyzedLocation.current = location;

      if (result.highlight) {
        setHighlightText(result.highlight);

        // 2. If Driving Mode, Generate & Play Audio Automatically
        if (drivingMode) {
          // Subtle notification instead of popup
          setShowHighlightPopup(false);

          try {
            const buffer = await generateVoiceNarration(result.highlight);
            setAudioBuffer(buffer);
            playAudio(buffer);
          } catch (audioErr) {
            console.error("Audio gen failed", audioErr);
          }
        } else {
          // Standard Mode: Show popup
          setShowHighlightPopup(true);
        }
      }

    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_MISSING') {
        setApiKeyMissing(true);
        return;
      }
      if (!isAuto) setErrorMsg("Erro ao conectar à história.");
      setAppState(AppState.ERROR);
    }
  }, [drivingMode, playAudio]);

  // Auto-Explore in Driving Mode
  useEffect(() => {
    if (!drivingMode || !userLocation || appState === AppState.ANALYZING) return;

    if (!lastAnalyzedLocation.current) {
      handleExplore(userLocation, true);
    }

  }, [drivingMode, userLocation, appState, handleExplore]);


  // Email Itinerary
  const handleEmailGeneration = async () => {
    setIsGeneratingEmail(true);
    try {
      const body = await generateEmailItinerary(places);
      const subject = encodeURIComponent("Meu Roteiro: Sampa Histórica AI");
      const bodyEncoded = encodeURIComponent(body);
      window.location.href = `mailto:?subject=${subject}&body=${bodyEncoded}`;
    } catch (e) {
      console.error(e);
      setErrorMsg("Erro ao gerar roteiro.");
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  if (apiKeyMissing) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-history-paper p-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md text-center border-4 border-history-gold">
          <h2 className="text-2xl font-serif font-bold text-history-dark mb-4">Configuração Pendente</h2>
          <p className="text-gray-600 mb-6">
            O aplicativo precisa da sua Chave de API do Google para funcionar.
          </p>
          <div className="text-left bg-gray-100 p-4 rounded-lg text-sm text-gray-700 font-mono mb-6">
            <p className="mb-2 font-bold">Na Vercel:</p>
            <p>1. Vá em Settings &gt; Environment Variables</p>
            <p>2. Key: <span className="text-blue-600">API_KEY</span></p>
            <p>3. Value: <span className="text-green-600">Sua_Chave_AI_Studio</span></p>
            <p className="mt-2 text-red-500 font-bold">4. Faça Redeploy!</p>
          </div>
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            className="block w-full py-3 bg-history-dark text-white font-bold rounded-xl"
          >
            Ir para Vercel
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden flex flex-col">

      {/* Header / Top Bar with Integrated Search */}
      <div className={`absolute top-0 left-0 right-0 z-30 p-4 transition-all duration-300 ${drivingMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl p-3 pointer-events-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-history-gold rounded-full flex items-center justify-center text-white font-bold">
                SP
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">Sampa Histórica</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">AI Copilot</p>
              </div>
            </div>

            <button
              onClick={() => setDrivingMode(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md active:scale-95 transition-transform"
            >
              <span>🚗 Modo Direção</span>
            </button>
          </div>

          {/* Integrated Search Bar */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-history-gold pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Buscar endereço em São Paulo..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // TODO: Implement search functionality
                  console.log('Search:', e.currentTarget.value);
                }
              }}
              className="w-full h-10 pl-10 pr-4 rounded-xl border-2 border-history-gold/30 focus:outline-none focus:ring-2 focus:ring-history-gold focus:border-transparent font-sans text-sm bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Driving Mode Exit Button */}
      {drivingMode && (
        <button
          onClick={() => {
            setDrivingMode(false);
            stopAudio();
          }}
          className="absolute top-4 right-4 z-50 bg-red-50 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm hover:bg-red-600 transition-colors"
        >
          Sair
        </button>
      )}

      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapDisplay
          userLocation={userLocation}
          places={places}
          onSelectPlace={setSelectedPlace}
        />
      </div>

      {/* Driving Overlay (HUD) */}
      {drivingMode && (
        <DrivingOverlay
          highlightText={highlightText}
          isPlaying={isPlaying}
          onStopAudio={stopAudio}
          onReplayAudio={() => audioBuffer && playAudio(audioBuffer)}
        />
      )}

      {/* Standard Mode Pop-up */}
      {!drivingMode && showHighlightPopup && highlightText && (
        <DidYouKnowPopup
          text={highlightText}
          onClose={() => setShowHighlightPopup(false)}
        />
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="absolute top-24 left-4 right-4 z-50 bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 shadow-lg text-sm text-center">
          {errorMsg}
        </div>
      )}

      {/* Standard Mode Action Button */}
      {!drivingMode && !selectedPlace && !showHighlightPopup && appState !== AppState.ANALYZING && (
        <div className="absolute bottom-64 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <button
            onClick={() => userLocation && handleExplore(userLocation)}
            disabled={!userLocation}
            className="pointer-events-auto shadow-2xl bg-history-gold hover:bg-yellow-600 text-white font-serif font-bold text-lg py-3 px-8 rounded-full transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ring-4 ring-white/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <span>Explorar História Aqui</span>
          </button>
        </div>
      )}

      {/* Standard Mode Info Panel */}
      {!drivingMode && (
        <HistoryPanel
          text={aiText}
          selectedPlace={selectedPlace}
          loading={appState === AppState.ANALYZING}
          onClosePlace={() => setSelectedPlace(null)}
          places={places}
          onGenerateEmail={handleEmailGeneration}
          isGeneratingEmail={isGeneratingEmail}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;