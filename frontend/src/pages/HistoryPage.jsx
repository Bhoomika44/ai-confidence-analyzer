import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getHistory, deletePresentation } from '../services/api';
import {
  History as HistoryIcon, TrendingUp, Video, UploadCloud,
  CheckCircle2, Trash2, ArrowRight, Eye, Calendar, Clock
} from 'lucide-react';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const res = await getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this presentation recording and analysis?')) {
      try {
        await deletePresentation(id);
        fetchHistory();
      } catch (err) {
        alert('Failed to delete presentation.');
      }
    }
  };

  const completed = history.filter(h => h.processingStatus === 'completed');

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="w-7 h-7 text-indigo-400" /> Presentation History & Progression
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your performance score growth across all rehearsals and uploaded talks.
          </p>
        </div>

        <Link
          to="/presentation"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-glow transition-all"
        >
          <Video className="w-4 h-4" /> Start New Rehearsal
        </Link>
      </div>

      {/* Progression Score Curve Card */}
      {completed.length > 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Score Growth Timeline</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {completed.slice().reverse().map((item, idx) => (
              <div
                key={item.id}
                onClick={() => navigate(`/results/${item.id}`)}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all hover:-translate-y-1"
              >
                <span className="text-[11px] text-slate-400 block mb-1">
                  Session #{idx + 1}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-indigo-400">
                    {item.overallScore}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1 truncate">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presentation List */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
        <h2 className="text-base font-bold text-white mb-2">All Presentation Sessions</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading presentation logs...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No presentations saved yet</p>
            <p className="text-xs text-slate-500 mt-1">Start a recording or upload a video to build your performance log.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {history.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/results/${p.id}`)}
                className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    {p.inputType === 'recording' ? <Video className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {p.duration > 0 ? `${Math.round(p.duration)}s` : 'Full Length'}
                      </span>
                      {p.completedPractices > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {p.completedPractices} Repair Drill{p.completedPractices > 1 ? 's' : ''} Done
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  {p.processingStatus === 'completed' ? (
                    <div className="text-left sm:text-right">
                      <span className="text-xl font-black text-indigo-300">
                        {p.overallScore !== null && p.overallScore !== undefined ? `${Math.round(p.overallScore)}%` : '--'}
                      </span>
                      <span className="text-[11px] block text-slate-400 font-medium">
                        {p.performanceLevel || 'Analyzed'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Processing...
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Delete presentation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
