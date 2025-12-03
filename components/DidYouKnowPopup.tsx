import React from 'react';

interface DidYouKnowPopupProps {
  text: string;
  onClose: () => void;
}

const DidYouKnowPopup: React.FC<DidYouKnowPopupProps> = ({ text, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-history-dark/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-[#fdfbf7] rounded-2xl shadow-2xl max-w-sm w-full border-4 border-history-gold overflow-hidden transform animate-[scaleIn_0.3s_ease-out] relative">
        
        {/* Header Icon */}
        <div className="bg-history-gold p-6 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
            <span className="text-5xl relative z-10 drop-shadow-md">💡</span>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-2xl font-serif font-bold text-history-dark mb-4">
            Você Sabia?
          </h3>
          <p className="text-gray-700 font-medium leading-relaxed text-lg italic font-serif">
            "{text}"
          </p>
          
          {/* Action Button */}
          <button 
            onClick={onClose}
            className="mt-8 w-full py-3.5 bg-history-dark text-[#fdfbf7] font-bold rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>Ver no Mapa</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DidYouKnowPopup;