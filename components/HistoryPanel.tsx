import React from 'react';
import { HistoricalPlace } from '../types';

interface HistoryPanelProps {
  text: string;
  selectedPlace: HistoricalPlace | null;
  loading: boolean;
  places: HistoricalPlace[];
  onClosePlace: () => void;
  onGenerateEmail: () => void;
  isGeneratingEmail: boolean;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  text, 
  selectedPlace, 
  loading, 
  onClosePlace,
  places,
  onGenerateEmail,
  isGeneratingEmail
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-10 flex flex-col max-h-[60vh]">
      
      {/* Handle Bar */}
      <div className="w-full flex justify-center pt-3 pb-1">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-10 h-10 border-4 border-history-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 animate-pulse font-serif">Consultando arquivos históricos...</p>
          </div>
        ) : selectedPlace ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-serif font-bold text-history-dark">{selectedPlace.title}</h2>
              <button onClick={onClosePlace} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              Ponto identificado via IA.
            </p>

            {selectedPlace.googleMapsUri && (
              <a 
                href={selectedPlace.googleMapsUri}
                target="_blank"
                rel="noreferrer"
                className="block w-full py-3 bg-history-gold text-white text-center font-bold rounded-xl hover:bg-yellow-600 transition-colors shadow-md"
              >
                Navegar com Google Maps
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center space-x-2 mb-2">
                <span className="bg-history-gold/20 text-history-gold px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">IA Analysis</span>
                <span className="text-xs text-gray-400">Powered by Gemini & Google Maps</span>
             </div>
             
             {text ? (
               <div className="prose prose-stone prose-sm max-w-none">
                 {text.split('\n').map((paragraph, idx) => (
                   <p key={idx} className="mb-2 text-gray-700 leading-relaxed font-serif text-lg">
                     {paragraph}
                   </p>
                 ))}
               </div>
             ) : (
               <p className="text-gray-500 text-center italic py-4">
                 Toque no botão "Explorar História" para descobrir segredos ao seu redor.
               </p>
             )}

             {places.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={onGenerateEmail}
                    disabled={isGeneratingEmail}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                     {isGeneratingEmail ? (
                       <span>Gerando Roteiro...</span>
                     ) : (
                       <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Enviar Roteiro por E-mail</span>
                       </>
                     )}
                  </button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;