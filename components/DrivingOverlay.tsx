import React from 'react';

interface DrivingOverlayProps {
  highlightText?: string;
  isPlaying: boolean;
  onStopAudio: () => void;
  onReplayAudio: () => void;
}

const DrivingOverlay: React.FC<DrivingOverlayProps> = ({ 
  highlightText, 
  isPlaying, 
  onStopAudio,
  onReplayAudio 
}) => {
  if (!highlightText) return null;

  return (
    <div className="absolute top-24 left-4 right-4 z-40 animate-[slideDown_0.5s_ease-out]">
      <div className="bg-gray-900/85 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border-l-4 border-history-gold flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="flex items-center space-x-2 mb-1">
             <span className="text-history-gold text-xs font-bold uppercase tracking-widest">Ponto Histórico Próximo</span>
             {isPlaying && (
                <span className="flex space-x-1 h-3 items-end">
                    <span className="w-1 bg-green-400 h-2 animate-bounce"></span>
                    <span className="w-1 bg-green-400 h-3 animate-bounce delay-75"></span>
                    <span className="w-1 bg-green-400 h-1 animate-bounce delay-150"></span>
                </span>
             )}
          </div>
          <p className="font-serif text-lg leading-tight shadow-black drop-shadow-md">
            "{highlightText}"
          </p>
        </div>
        
        <div className="flex flex-col space-y-2">
            {isPlaying ? (
                <button 
                    onClick={onStopAudio}
                    className="p-3 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                </button>
            ) : (
                <button 
                    onClick={onReplayAudio}
                    className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   </svg>
                </button>
            )}
        </div>
      </div>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DrivingOverlay;