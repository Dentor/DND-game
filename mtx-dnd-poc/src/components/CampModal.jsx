import React from 'react';

const CampModal = ({ character, onComplete }) => {
  return (
    <div className="w-full bg-slate-900 border-4 border-blue-600 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col items-center text-center">
      <span className="text-4xl mb-3">🔥</span>
      <h3 className="text-xl font-black text-blue-400 uppercase tracking-widest mb-2">Safe Rest Camp</h3>
      <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
        You pitch your tent away from the dangers of the road. The warmth of the fire completely restores your vigor and readies your spirit.
      </p>

      <button
        onClick={onComplete}
        className="w-full max-w-xs py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase rounded-xl border-b-4 border-blue-800 tracking-widest text-xs shadow-lg transition-all"
      >
        Break Camp & Proceed 🏕️
      </button>
    </div>
  );
};

export default CampModal;