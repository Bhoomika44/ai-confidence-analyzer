import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

const ComparisonTable = ({ comparisonData, isImproved, verdictMessage }) => {
  if (!comparisonData || !comparisonData.length) {
    return null;
  }

  const getStatusBadge = (status, change) => {
    if (status === 'improved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ArrowUpRight className="w-3.5 h-3.5" /> Improved
        </span>
      );
    } else if (status === 'declined') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ArrowDownRight className="w-3.5 h-3.5" /> Needs Focus
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        <Minus className="w-3.5 h-3.5" /> Steady
      </span>
    );
  };

  return (
    <div className="glass-panel p-6 rounded-2xl overflow-hidden">
      {/* Verdict Banner */}
      <div
        className={`p-4 rounded-xl border mb-6 flex items-center gap-3.5 ${
          isImproved
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}
      >
        {isImproved ? (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
        )}
        <div>
          <h4 className="font-bold text-sm">
            {isImproved ? 'Improvement Detected!' : 'Keep Practicing'}
          </h4>
          <p className="text-xs opacity-90 leading-relaxed mt-0.5">{verdictMessage}</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Presentation Factor</th>
              <th className="py-3 px-4">Original Section</th>
              <th className="py-3 px-4">Practice Attempt</th>
              <th className="py-3 px-4">Change</th>
              <th className="py-3 px-4">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {comparisonData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 px-4 font-semibold text-slate-200">{row.metric}</td>
                <td className="py-3.5 px-4 text-slate-400 font-mono">{row.original}</td>
                <td className="py-3.5 px-4 text-indigo-300 font-mono font-bold">{row.practice}</td>
                <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">{row.change}</td>
                <td className="py-3.5 px-4">{getStatusBadge(row.status, row.change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonTable;
