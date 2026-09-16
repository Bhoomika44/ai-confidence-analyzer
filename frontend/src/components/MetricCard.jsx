import React from 'react';

const MetricCard = ({ title, score, value, unit = '%', icon: Icon, description, status, statusColor = 'indigo' }) => {
  const isAvailable = (score !== null && score !== undefined) || (value !== null && value !== undefined);
  const displayScore = score !== null && score !== undefined ? Math.round(score) : (value !== null && value !== undefined ? Math.round(value) : null);

  const getScoreColor = (val) => {
    if (val === null || val === undefined) return 'text-slate-500';
    if (val >= 80) return 'text-emerald-400';
    if (val >= 65) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getBarColor = (val) => {
    if (val === null || val === undefined) return 'bg-slate-700';
    if (val >= 80) return 'bg-emerald-500';
    if (val >= 65) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:-translate-y-1 group">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
            {title}
          </span>
        </div>
        {status && (
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {status}
          </span>
        )}
      </div>

      {/* Main Score & Unit */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(displayScore)}`}>
            {isAvailable ? displayScore : '--'}
          </span>
          {isAvailable && <span className="text-xs font-semibold text-slate-500 uppercase">{unit}</span>}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(displayScore)}`}
          style={{ width: isAvailable ? `${Math.min(100, Math.max(0, displayScore))}%` : '0%' }}
        />
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      )}
    </div>
  );
};

export default MetricCard;
