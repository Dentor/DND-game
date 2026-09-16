import React from 'react';

const ExpeditionMapCanvas = ({
  nodes,
  currentNode,
  maxRow,
  visitedIds,
  nextNodeIds,
  stagedNodeId,
  onSelectNode,
  setStagedNodeId,
  canvasTopOffset = 200
}) => {
  return (
    // We added mx-auto here to center the map horizontally without breaking vertical scrolling!
    <div className="relative w-[500px] mx-auto" style={{ height: `${(maxRow + 1) * 110 + canvasTopOffset + 100}px` }}>
      
      {/* SVG Path Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {nodes.map(node => {
          const isVisible = node.row <= currentNode.row + 3 || node.isBoss;
          if (!isVisible) return null;

          return (node.connections || []).map(targetId => {
            const target = nodes.find(n => n.id === targetId);
            if (!target || (target.row > currentNode.row + 3 && !target.isBoss)) return null;

            const x1 = node.col * 160 + 60;
            const y1 = (maxRow - node.row) * 110 + (canvasTopOffset + 24); 
            const x2 = target.col * 160 + 60;
            const y2 = (maxRow - target.row) * 110 + (canvasTopOffset + 24);
            
            const isPlayerPath = node.id === currentNode.id;
            const isFuturePath = nextNodeIds.includes(node.id);

            let strokeColor = '#334155'; let strokeWidth = '3'; let dash = 'none';
            if (isPlayerPath) { strokeColor = '#34d399'; strokeWidth = '4'; dash = '6'; } 
            else if (isFuturePath) { strokeColor = '#38bdf8'; strokeWidth = '3'; dash = '3'; }

            return <line key={`${node.id}-${targetId}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={dash} className={isPlayerPath ? 'animate-pulse' : ''} />;
          });
        })}
      </svg>

      {/* Interactive Map Nodes */}
      {nodes.map(node => {
        const isVisited = visitedIds.includes(node.id);
        const isCurrent = node.id === currentNode.id;
        const isNext = currentNode.connections.includes(node.id);
        
        const isVisible = node.row <= currentNode.row + 3 || node.isBoss;
        if (!isVisible) return null;

        let icon = '⚔️';
        let colorBg = 'bg-red-950 border-red-700 text-red-300';
        if (node.type === 'Entrance') { icon = '🚪'; colorBg = 'bg-slate-800 border-slate-600 text-slate-300'; }
        else if (node.type === 'Merchant') { icon = '🪙'; colorBg = 'bg-yellow-950 border-yellow-700 text-yellow-300'; }
        else if (node.type === 'Camp') { icon = '🏕️'; colorBg = 'bg-blue-950 border-blue-700 text-blue-300'; }
        else if (node.type === 'Trap') { icon = '⚠️'; colorBg = 'bg-purple-950 border-purple-700 text-purple-300'; }
        if (node.isBoss) { icon = '💀'; colorBg = 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse'; }

        const renderTop = (maxRow - node.row) * 110 + canvasTopOffset;
        const isStaged = stagedNodeId === node.id;

        return (
          <div key={node.id} className="absolute group" style={{ left: `${node.col * 160 + 36}px`, top: `${renderTop}px` }}>
            <button
              disabled={!isNext} 
              onClick={() => {
                if (isStaged) {
                   onSelectNode(node.id);
                   setStagedNodeId(null);
                } else {
                   setStagedNodeId(node.id);
                }
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg font-bold text-lg
                ${isCurrent ? 'ring-4 ring-indigo-400 bg-indigo-600 border-indigo-300 text-white scale-110 z-20 cursor-default' : 
                  isVisited ? 'bg-slate-900 border-slate-700 text-slate-500 opacity-60 cursor-not-allowed' : 
                  isNext ? (isStaged ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-400 text-white scale-110 z-30 shadow-[0_0_20px_rgba(16,185,129,0.8)] cursor-pointer' : `${colorBg} hover:scale-110 cursor-pointer z-10 animate-bounce ring-2 ring-emerald-400/50`) : 
                  'bg-slate-950 border-slate-900 text-slate-700 opacity-40 cursor-not-allowed'}`}
            >
              {isVisited ? '✅' : icon}
            </button>
            
            {isStaged && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap animate-pulse pointer-events-none">
                Click to Confirm
              </div>
            )}
            
            {isNext && !isStaged && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded shadow-xl border border-slate-600 whitespace-nowrap flex flex-col items-center gap-0.5">
                  <span className="font-bold text-amber-400 uppercase tracking-widest">{node.type}</span>
                  {node.type === 'Trap' && <span className="text-[8px] text-slate-300 border-t border-slate-600 pt-0.5 mt-0.5 w-full text-center">Requires {node.challengeStat}</span>}
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600 mt-[-1px]"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExpeditionMapCanvas;