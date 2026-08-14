import React, { useState, useEffect } from 'react';

// Generates the specific Polyhedron SVGs
const getSvgShape = (face, color = 'text-indigo-900') => {
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
  // Default to D20
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

// CSS-Tricks 3D Box Engine
const Dice3D = ({ face, isRolling, finalValue }) => {
  const [rands, setRands] = useState([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (isRolling) {
      const id = setInterval(() => {
        setRands(Array(5).fill(0).map(() => Math.floor(Math.random() * face) + 1));
      }, 80); // Rapid scrambling
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
      <div 
        className="w-full h-full relative transition-transform duration-500 ease-out" 
        style={{ 
          transformStyle: 'preserve-3d', 
          animation: isRolling ? 'tumble3d 0.4s linear infinite' : 'none', 
          transform: isRolling ? 'none' : 'rotateX(0deg) rotateY(0deg) scale(1.1)' 
        }}
      >
        {/* Front Face: Always shows the exact rolled result when stopped */}
        <div className="absolute inset-0" style={{ transform: 'translateZ(64px)', backfaceVisibility: isRolling ? 'visible' : 'hidden' }}>
           {getSvgShape(face)}
           <span className={`absolute inset-0 flex items-center justify-center font-black font-mono drop-shadow-md ${face === 4 ? 'text-2xl pt-6' : 'text-4xl'} ${textColor}`}>
             {finalValue}
           </span>
        </div>
        
        {/* Render the rest of the 3D bounding box ONLY while tumbling */}
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

const DiceRollModal = ({ rollData, onComplete }) => {
  const [phase, setPhase] = useState('init');

  useEffect(() => {
    let timers = [];
    
    // SEQUENCE TIMING
    if (phase === 'init') {
      if (rollData.type === 'attack') timers.push(setTimeout(() => setPhase('roll_d20'), 100));
      else timers.push(setTimeout(() => setPhase('roll_dmg'), 100)); // Spells/Heals skip D20 hit check
    }
    else if (phase === 'roll_d20') timers.push(setTimeout(() => setPhase('show_d20'), 1000));
    else if (phase === 'show_d20') {
      timers.push(setTimeout(() => {
        // If it's a hit AND there is damage to roll (Combat)
        if (rollData.isHit && rollData.damage) setPhase('roll_dmg');
        // If it's a miss, or a successful skill check with no damage (Traps)
        else setPhase('finish'); 
      }, 1500));
    }
    else if (phase === 'roll_dmg') timers.push(setTimeout(() => setPhase('show_dmg'), 1000));
    else if (phase === 'show_dmg') timers.push(setTimeout(() => setPhase('finish'), 2000));
    
    else if (phase === 'finish') onComplete();

    return () => timers.forEach(clearTimeout);
  }, [phase, rollData, onComplete]);

  if (!rollData) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      
      {/* Real 3D Tumble CSS Keyframes */}
      <style>{`
        @keyframes tumble3d {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(720deg) rotateZ(180deg); }
        }
      `}</style>

      <div className="bg-slate-900 border-4 border-slate-700 rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Dynamic Background Aura */}
        <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-500 ${
          (phase === 'show_d20' || phase === 'finish') && !rollData.isHit ? 'bg-red-500' : 
          (phase === 'show_dmg' && rollData.type === 'heal') ? 'bg-emerald-500' : 
          (phase === 'show_dmg' || phase === 'show_d20') ? 'bg-amber-500' : 'bg-transparent'
        }`} />

        <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest mb-6 relative z-10 border-b border-slate-700 pb-2 w-full">
          {rollData.title}
        </h3>

        <div className="h-56 flex items-center justify-center relative z-10 w-full">
          
          {/* D20 HIT OR SKILL ROLL */}
          {(phase === 'roll_d20' || phase === 'show_d20' || (phase === 'finish' && !rollData.damage)) && rollData.d20 && (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <Dice3D face={rollData.d20.face} isRolling={phase === 'roll_d20'} finalValue={rollData.d20.result} />
              
              <div className={`mt-6 transition-opacity duration-300 ${phase === 'roll_d20' ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">
                  d20({rollData.d20.result}) {rollData.d20.mod >= 0 ? '+' : ''}{rollData.d20.mod} = <span className="text-white text-lg">{rollData.d20.result + rollData.d20.mod}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Target DC: {rollData.d20.targetDC}
                </div>
                
                {(phase === 'show_d20' || phase === 'finish') && rollData.isHit && (
                  <div className="mt-2 text-2xl font-black text-emerald-400 uppercase tracking-widest animate-bounce">
                    {rollData.damage ? 'Hit!' : 'Success!'}
                  </div>
                )}
                {(phase === 'show_d20' || phase === 'finish') && !rollData.isHit && (
                  <div className="mt-2 text-2xl font-black text-red-500 uppercase tracking-widest animate-bounce">
                    {rollData.damage ? 'Miss!' : 'Failed!'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DAMAGE / HEAL ROLL */}
          {(phase === 'roll_dmg' || phase === 'show_dmg') && rollData.damage && (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <Dice3D face={rollData.damage.face} isRolling={phase === 'roll_dmg'} finalValue={rollData.damage.result} />
              
              <div className={`mt-6 transition-opacity duration-300 ${phase === 'roll_dmg' ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">
                  d{rollData.damage.face}({rollData.damage.result}) {rollData.damage.mod >= 0 ? '+' : ''}{rollData.damage.mod}
                </div>
                <div className={`text-3xl font-black uppercase tracking-widest animate-in slide-in-from-bottom-2 ${rollData.type === 'heal' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {rollData.damage.result + rollData.damage.mod} {rollData.damage.label || 'Damage'}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DiceRollModal;