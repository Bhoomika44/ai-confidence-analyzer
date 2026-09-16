import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, UploadCloud, Target, Sparkles, CheckCircle2, TrendingUp, Mic, Eye, Zap, ShieldCheck, ArrowRight, Play, UserPlus } from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartPresentation = () => {
    if (isAuthenticated) {
      navigate('/presentation');
    } else {
      navigate('/register', { state: { from: { pathname: '/presentation' } } });
    }
  };

  const handleUploadVideo = () => {
    if (isAuthenticated) {
      navigate('/upload');
    } else {
      navigate('/register', { state: { from: { pathname: '/upload' } } });
    }
  };

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-glow">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next-Gen Presentation Performance & Weakness Repair Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Master Your Presentations With <span className="gradient-text">Observable AI Feedback</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Real-time video and audio analysis for eye contact, posture, speaking cadence, and filler words.
          Pinpoint exact weak sections, practice targeted repairs, and measure concrete improvement.
        </p>

        {/* Start / Upload CTAs (Prompt for Account Creation if not authenticated) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStartPresentation}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:opacity-95 text-white font-bold text-base shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            <Video className="w-5 h-5" />
            <span>Start Live Presentation</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleUploadVideo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base transition-all cursor-pointer"
          >
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span>Upload Existing Video</span>
          </button>
        </div>

        {/* Disclaimer Tag */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Scores reflect observable behavioral performance & delivery delivery metrics.</span>
        </div>
      </section>

      {/* Differentiating Innovation Callout */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="glass-panel-glow p-8 sm:p-12 rounded-3xl relative overflow-hidden border-indigo-500/40">
          <div className="max-w-3xl">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Core Differentiating Feature
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-4">
              Don’t Just Tell Users What Went Wrong — <span className="gradient-text">Fix It In-Place</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Traditional tools provide a generic overall score and leave you to figure out what to change.
              ConfidenceAI identifies the <strong>exact timestamp of weak performance</strong>, diagnoses the exact issues (e.g. eye contact drops + filler words at 04:23), generates an actionable 30-second repair drill, and performs a <strong>Before vs. After comparison</strong> to verify your improvement.
            </p>

            {/* Workflow Diagram */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-indigo-400 block mb-1">STEP 1</span>
                <p className="text-xs text-slate-300 font-semibold">Analyze Full Video</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-rose-400 block mb-1">STEP 2</span>
                <p className="text-xs text-slate-300 font-semibold">Detect Weak Timestamp</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-cyan-400 block mb-1">STEP 3</span>
                <p className="text-xs text-slate-300 font-semibold">Targeted Practice Drill</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs font-bold text-emerald-400 block mb-1">STEP 4</span>
                <p className="text-xs text-slate-300 font-semibold">Before vs After Diff</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Multi-Modal Presentation Intelligence</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Comprehensive computer vision and acoustic speech processing combined into observable score metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Eye Contact & Gaze</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tracks iris position and head orientation to determine continuous direct audience engagement and flag significant drops.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Speech Pace & WPM</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acoustic word segmentation calculating real-time Words Per Minute, flagging fast rushes (&gt; 165 WPM) and sluggish deliveries.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Filler Words & Pauses</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pinpoints exact occurrences of "um", "uh", "like", "you know", and awkward silences (&gt; 2.0s) with precise timestamps.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Posture & Gestures</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates shoulder alignment, slouching, hand gesture expressiveness, and whole-body fidgeting dynamics.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No Artificial Time Limits</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Record complete presentations or upload entire recordings. Analyzed smoothly from beginning to end without 10-second cutoffs.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Weakness Repair Studio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct webcam practice studio with tailored instructions, instant re-analysis, and side-by-side progression tracking.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="glass-panel-glow p-10 rounded-3xl border-indigo-500/30">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to elevate your speaking confidence?
          </h2>
          <p className="text-sm text-slate-300 mb-8 max-w-lg mx-auto">
            Create an account to start your live rehearsal recording or upload your existing presentation.
          </p>
          <button
            onClick={handleStartPresentation}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-glow transition-all active:scale-95 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>{isAuthenticated ? 'Go to Rehearsal Studio' : 'Create Account & Start Rehearsal'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
