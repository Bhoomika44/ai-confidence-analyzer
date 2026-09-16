import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const TimelineChart = ({ timeline = [], onSelectTimestamp }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl text-center text-slate-400">
        <p className="text-sm">Timeline analysis will be displayed here once processing completes.</p>
      </div>
    );
  }

  const getLevelStyle = (level) => {
    switch (level) {
      case 'weak':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
          dot: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]',
          icon: AlertTriangle
        };
      case 'moderate':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-500',
          icon: Clock
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
          icon: CheckCircle2
        };
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">Performance Timeline</h3>
        </div>
        <span className="text-xs text-slate-400">Click a timestamp to inspect section</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {timeline.map((item, index) => {
          const style = getLevelStyle(item.level);
          const Icon = style.icon;
          return (
            <div
              key={index}
              onClick={() => onSelectTimestamp && onSelectTimestamp(item.timestamp_sec)}
              className="relative group cursor-pointer"
            >
              {/* Timeline indicator dot */}
              <div
                className={`absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-dark-bg transition-transform group-hover:scale-125 ${style.dot}`}
              />

              {/* Timeline Card */}
              <div
                className={`p-3.5 rounded-xl border transition-all duration-200 group-hover:translate-x-1 ${style.bg}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/50 text-indigo-300">
                      {item.timestamp_formatted} – {item.end_timestamp_formatted || item.timestamp_formatted}
                    </span>
                    <span className="text-slate-300 font-sans font-medium text-xs">
                      {item.status}
                    </span>
                  </div>

                  {item.score !== undefined && (
                    <span className="text-xs font-bold text-slate-400">
                      {item.score}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineChart;
