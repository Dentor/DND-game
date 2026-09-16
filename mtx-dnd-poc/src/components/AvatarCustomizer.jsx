import React, { useState, useMemo } from 'react';
import { useAvatarRenderer } from '../hooks/useAvatarRenderer';

// Added a new 'skin' palette with human and fantasy tones
const PALETTES = {
  skin: ['#ffe0bd', '#f4c290', '#c68642', '#8d5524', '#3d2314', '#e2e8f0', '#bbf7d0'],
  hair: ['#222222', '#e8c170', '#8a4b26', '#b32b2b', '#4868a8', '#10b981', '#ffffff'],
  shirt: ['#e53935', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#333333', '#f8fafc'],
  pants: ['#1e3a8a', '#3f2e14', '#1f2937', '#64748b', '#4d7c0f', '#b91c1c']
};

const AvatarCustomizer = ({ onSave, onCancel }) => {
  const [skinColor, setSkinColor] = useState(PALETTES.skin[0]);
  const [hairColor, setHairColor] = useState(PALETTES.hair[2]);
  const [shirtColor, setShirtColor] = useState(PALETTES.shirt[1]);
  const [pantsColor, setPantsColor] = useState(PALETTES.pants[0]);

  // The body is now passed as the very first layer, so it gets tinted first!
  const layers = useMemo(() => [
    { src: '/src/assets/avatar/body.png', color: skinColor },
    { src: '/src/assets/avatar/pants_mask.png', color: pantsColor },
    { src: '/src/assets/avatar/shirt_mask.png', color: shirtColor },
    { src: '/src/assets/avatar/hair_mask.png', color: hairColor }
  ], [skinColor, pantsColor, shirtColor, hairColor]);

  const { avatarUrl, isRendering } = useAvatarRenderer(layers);

  const handleSave = () => {
    if (avatarUrl && !isRendering) {
      onSave(avatarUrl); 
    }
  };

  const renderPalette = (title, options, currentColor, setFn) => (
    <div className="mb-4">
      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-2">{title}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((color) => (
          <button
            key={color}
            onClick={() => setFn(color)}
            className={`w-8 h-8 rounded border-2 shadow-inner transition-transform active:scale-90 ${currentColor === color ? 'border-white scale-110 ring-2 ring-indigo-500' : 'border-slate-800 hover:border-slate-500'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 font-mono animate-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border-4 border-indigo-500 rounded-3xl p-6 md:p-8 max-w-4xl w-full flex flex-col md:flex-row gap-8 shadow-2xl">
        
        {/* LEFT: Live Preview */}
        <div className="flex flex-col items-center justify-center bg-[#0b0f19] border-2 border-slate-800 rounded-2xl p-6 shadow-inner w-full md:w-[320px] shrink-0">
          <span className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-6">ID Profile</span>
          
          <div className="w-[230px] h-[400px] bg-slate-950 border-4 border-slate-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'conic-gradient(#fff 25%, transparent 25%, transparent 50%, #fff 50%, #fff 75%, transparent 75%, transparent)', backgroundSize: '16px 16px' }} />
            
            {isRendering ? (
              <span className="text-slate-500 text-xs animate-pulse font-bold relative z-10">Weaving Magic...</span>
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-contain relative z-10" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <span className="text-red-500 text-[10px] font-bold relative z-10">Missing Assets</span>
            )}
          </div>
        </div>

        {/* RIGHT: Color Controls */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3 mb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Customize</h2>
            {onCancel && <button onClick={onCancel} className="text-slate-500 hover:text-white font-bold">✕</button>}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {renderPalette('Skin Tone', PALETTES.skin, skinColor, setSkinColor)}
            {renderPalette('Hair Color', PALETTES.hair, hairColor, setHairColor)}
            {renderPalette('Shirt Dye', PALETTES.shirt, shirtColor, setShirtColor)}
            {renderPalette('Pants Dye', PALETTES.pants, pantsColor, setPantsColor)}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-slate-800">
            <button 
              onClick={handleSave}
              disabled={isRendering || !avatarUrl}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:translate-y-1 cursor-pointer"
            >
              {isRendering ? 'Rendering...' : 'Confirm Avatar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer;