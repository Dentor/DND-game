import React from 'react';

const CombatStatCard = ({ title, value, description, formula, colorTheme }) => {
  // Pre-mapped Tailwind classes so PurgeCSS doesn't accidentally delete them
  const themes = {
    indigo: { bg: 'bg-indigo-950/30', border: 'border-indigo-900', text: 'text-indigo-400' },
    rose: { bg: 'bg-rose-950/30', border: 'border-rose-900', text: 'text-rose-400' },
    orange: { bg: 'bg-orange-950/30', border: 'border-orange-900', text: 'text-orange-400' },
  };

  const theme = themes[colorTheme] || themes.indigo;

  return (
    <div className={`relative group flex flex-col items-center justify-center w-full sm:w-32 cursor-help p-2 rounded-xl transition-colors hover:${theme.bg}`}>
      <span className={`${theme.text} font-black tracking-widest uppercase text-[10px] mb-1`}>{title}</span>
      <span className="text-3xl sm:text-4xl text-white font-black drop-shadow-lg">{value}</span>

      {/* DETAILED FORMULA HOVER TOOLTIP */}
      <div 
        className="fixed z-[999] hidden group-hover:flex flex-col w-64 bg-slate-800 border-2 border-slate-500 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] pointer-events-none p-4 text-left"
        style={{ transform: 'translate(calc(-50% + 50%), calc(-100% - 10px))' }}
      >
        <span className={`font-black ${theme.text} text-sm uppercase tracking-widest mb-2 border-b border-slate-600 pb-2`}>
          {title}
        </span>
        <p className="text-slate-300 text-xs italic leading-relaxed mb-3">
          {description}
        </p>
        
        <div className="bg-slate-900 rounded p-2 border border-slate-700">
          <span className="text-slate-500 uppercase tracking-widest text-[9px] font-black block mb-1">Calculation Formula</span>
          <span className="font-bold text-amber-400 text-xs break-words">{formula}</span>
        </div>
      </div>
    </div>
  );
};

export default CombatStatCard;