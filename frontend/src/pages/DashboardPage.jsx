import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHistory } from '../services/api';
import { Video, UploadCloud, TrendingUp, Award, Clock, ArrowRight, Play, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

const DashboardPage = () => {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await getHistory();
        setPresentations(res.data || []);
      } catch (err) {
        console.error('Failed to load dashboard history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const completedSessions = presentations.filter(p => p.processingStatus === 'completed');
  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((acc, p) => acc + (p.overallScore || 0), 0) / completedSessions.length)
    : 0;
  const totalWeakFixed = presentations.reduce((acc, p) => acc + (p.completedPractices || 0), 0);

  return (
    <div className="space-y-10 py-6">
      {/* Top Welcome Banner */}
      <div className="glass-panel-glow p-8 rounded-3xl relative overflow-hidden border-indigo-500/30">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Presentation Coach</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Presentation Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Record a live rehearsal or upload an existing talk. We evaluate your observable delivery behaviors, pinpoint timestamped weaknesses, and guide you through targeted repair drills.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            <Link
              to="/presentation"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-glow transition-all active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Start Live Presentation</span>
            </Link>
            <Link
              to="/upload"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>Upload Video Recording</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Performance</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{avgScore || '--'}</span>
            <span className="text-xs font-bold text-slate-400">%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Across {completedSessions.length} completed sessions</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Presentations</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-white">{presentations.length}</span>
            <span className="text-xs font-bold text-slate-400">Sessions</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Live rehearsals & uploaded videos</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weak Sections Repaired</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-400">{totalWeakFixed}</span>
            <span className="text-xs font-bold text-slate-400">Drills</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Targeted weak section practice attempts</p>
        </div>
      </div>

      {/* Recent Presentations List */}
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Recent Presentations</h2>
          </div>
          <Link to="/history" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading sessions...</p>
          </div>
        ) : presentations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No presentations analyzed yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start your first presentation recording or upload a video file to receive deep multi-modal AI feedback.
            </p>
            <Link
              to="/presentation"
              className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-glow"
            >
              <Video className="w-3.5 h-3.5" /> Start First Rehearsal
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {presentations.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/results/${p.id}`)}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 px-3 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    {p.inputType === 'recording' ? <Video className="w-5 h-5" /> : <UploadCloud className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{new Date(p.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{p.inputType}</span>
                      {p.duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{Math.round(p.duration)}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {p.processingStatus === 'completed' ? (
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-indigo-300">
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
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
