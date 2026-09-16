import React from 'react';
import { Loader2, CheckCircle2, Video, Eye, UserCheck, Mic, Pause, FileCheck } from 'lucide-react';

const STEPS = [
  { key: 'video', label: 'Processing video...', icon: Video },
  { key: 'face', label: 'Analyzing facial movements...', icon: Eye },
  { key: 'posture', label: 'Analyzing posture and gestures...', icon: UserCheck },
  { key: 'speech', label: 'Analyzing speech & pacing...', icon: Mic },
  { key: 'pauses', label: 'Detecting pauses and filler words...', icon: Pause },
  { key: 'results', label: 'Generating performance report...', icon: FileCheck }
];

const StatusTracker = ({ currentStep, progress = 0 }) => {
  return (
    <div className="glass-panel p-8 rounded-3xl max-w-xl mx-auto text-center border-indigo-500/30 shadow-glow">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 text-indigo-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">Analyzing Presentation</h3>
      <p className="text-sm text-slate-400 mb-6">
        Our multi-modal AI engine is analyzing your visual presence and speech performance.
      </p>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-8 border border-slate-700/50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="space-y-3 text-left">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = progress >= (idx + 1) * 16.6 || (progress >= 100);
          const isCurrent = !isDone && (currentStep?.toLowerCase().includes(step.key) || progress >= idx * 16.6);

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-white font-medium shadow-glow-cyan'
                  : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isDone ? 'text-emerald-400' : isCurrent ? 'text-indigo-400 animate-pulse' : 'text-slate-600'}`} />
                <span className="text-xs">{step.label}</span>
              </div>
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-700" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTracker;
