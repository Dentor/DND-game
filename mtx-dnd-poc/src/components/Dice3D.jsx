import React, { useState, useEffect } from 'react';

// Generates the specific Polyhedron SVGs
export const getSvgShape = (face, color = 'text-indigo-900') => {
  if (face === 4) {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${color}`}>
        <polygon points="50,10 95,90 5,90" fill="currentColor" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <polygon points="50,10 95,90 50,75" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <polygon points="50,10 5,90 50,75" fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <polygon points="5,90 95,90 50,75" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>
    );
  }
  if (face === 6) {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${color}`}>
        <rect x="10" y="10" width="80" height="80" rx="8" fill="currentColor" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <rect x="15" y="15" width="70" height="70" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>
    );
  }
  if (face === 8) {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${color}`}>
        <polygon points="50,5 95,50 50,95 5,50" fill="currentColor" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <polygon points="50,5 95,50 50,45" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <polygon points="50,5 5,50 50,45" fill="rgba(0,0,0,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <polygon points="50,95 95,50 50,45" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <polygon points="50,95 5,50 50,45" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>
    );
  }
  if (face === 12) {
    return (
      <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${color}`}>
        <polygon points="50,5 95,38 78,95 22,95 5,38" fill="currentColor" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
        <polygon points="50,25 75,45 65,75 35,75 25,45" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="50" y1="5" x2="50" y2="25" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="95" y1="38" x2="75" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="78" y1="95" x2="65" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="22" y1="95" x2="35" y2="75" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="5" y1="38" x2="25" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      </svg>
    );
  }
  // Default to D20[cite: 13]
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-2xl ${color}`}>
      <polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="currentColor" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <polygon points="50,5 95,25 50,50" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <polygon points="5,25 50,5 50,50" fill="rgba(0,0,0,0.1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <polygon points="5,75 5,25 50,50" fill="rgba(0,0,0,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <polygon points="95,75 95,25 50,50" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <polygon points="50,95 5,75 50,50" fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      <polygon points="50,95 95,75 50,50" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  );
};

// CSS-Tricks 3D Box Engine[cite: 13]
const Dice3D = ({ face, isRolling, finalValue }) => {
  const [rands, setRands] = useState([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (isRolling) {
      const id = setInterval(() => {
        setRands(Array(5).fill(0).map(() => Math.floor(Math.random() * face) + 1));
      }, 80); // Rapid scrambling[cite: 13]
      return () => clearInterval(id);
    }
  }, [isRolling, face]);

  let textColor = 'text-white';
  if (!isRolling && face === 20) {
    if (finalValue === 20) textColor = 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,1)]';
    if (finalValue === 1) textColor = 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,1)]';
  }

  const renderFace = (val, transform) => (
    <div className="absolute inset-0 flex items-center justify-center" style={{ transform }}>
      {getSvgShape(face)}
      <span className={`absolute font-black font-mono drop-shadow-md ${face === 4 ? 'text-2xl pt-6' : 'text-4xl'} ${textColor}`}>
        {val}
      </span>
    </div>
  );

  return (
    <div className="relative w-32 h-32" style={{ perspective: '1000px' }}>
      <style>{`
        @keyframes tumble3d {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(720deg) rotateZ(180deg); }
        }
      `}</style>
      <div 
        className="w-full h-full relative transition-transform duration-500 ease-out" 
        style={{ 
          transformStyle: 'preserve-3d', 
          animation: isRolling ? 'tumble3d 0.4s linear infinite' : 'none', 
          transform: isRolling ? 'none' : 'rotateX(0deg) rotateY(0deg) scale(1.1)' 
        }}
      >
        {/* Front Face: Always shows the exact rolled result when stopped[cite: 13] */}
        <div className="absolute inset-0" style={{ transform: 'translateZ(64px)', backfaceVisibility: isRolling ? 'visible' : 'hidden' }}>
           {getSvgShape(face)}
           <span className={`absolute inset-0 flex items-center justify-center font-black font-mono drop-shadow-md ${face === 4 ? 'text-2xl pt-6' : 'text-4xl'} ${textColor}`}>
             {finalValue}
           </span>
        </div>
        
        {/* Render the rest of the 3D bounding box ONLY while tumbling[cite: 13] */}
        {isRolling && (
          <>
            {renderFace(rands[0], 'rotateY(180deg) translateZ(64px)')}
            {renderFace(rands[1], 'rotateY(90deg) translateZ(64px)')}
            {renderFace(rands[2], 'rotateY(-90deg) translateZ(64px)')}
            {renderFace(rands[3], 'rotateX(90deg) translateZ(64px)')}
            {renderFace(rands[4], 'rotateX(-90deg) translateZ(64px)')}
          </>
        )}
      </div>
    </div>
  );
};

export default Dice3D;