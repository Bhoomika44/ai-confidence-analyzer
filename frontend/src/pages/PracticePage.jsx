import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWeakSectionById, uploadVideoFile, analyzePracticeAttempt } from '../services/api';
import ComparisonTable from '../components/ComparisonTable';
import StatusTracker from '../components/StatusTracker';
import {
  Target, Clock, AlertCircle, Video, Mic, Play, Square,
  RotateCcw, CheckCircle2, Sparkles, ArrowLeft, ArrowRight
} from 'lucide-react';

const PracticePage = () => {
  const { id } = useParams(); // weakSectionId
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Practice Recording States
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Recording practice attempt...');

  // Comparison Results
  const [comparisonResult, setComparisonResult] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWeakSection = async () => {
      try {
        const res = await getWeakSectionById(id);
        setData(res.data);
        if (res.data.attempts && res.data.attempts.length > 0) {
          const latest = res.data.attempts[res.data.attempts.length - 1];
          setComparisonResult({
            isImproved: latest.overallImproved,
            verdictMessage: latest.verdictMessage,
            comparisonTable: latest.comparisonTable
          });
        }
      } catch (err) {
        console.error('Failed to load weak section:', err);
        setError('Could not load weak section details.');
      } finally {
        setLoading(false);
      }
    };
    fetchWeakSection();
  }, [id]);

  // Init media stream
  const initMedia = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setStream(userStream);
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
    } catch (e) {
      console.error('Error accessing media devices for practice:', e);
    }
  };

  useEffect(() => {
    initMedia();
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setComparisonResult(null);

    let options = { mimeType: 'video/webm;codecs=vp8,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = handlePracticeRecordingDone;

      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting practice recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      // Turn off webcam immediately upon stopping recording
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
    }
  };

  const handlePracticeRecordingDone = async () => {
    setIsAnalyzing(true);
    setCurrentStep('Uploading practice video...');
    setAnalysisProgress(15);

    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `practice-${Date.now()}.webm`, { type: 'video/webm' });

      // 1. Upload video
      const formData = new FormData();
      formData.append('video', file);

      const uploadRes = await uploadVideoFile(formData, (p) => {
        setAnalysisProgress(Math.min(30, Math.round(p * 0.3)));
      });

      setCurrentStep('Re-analyzing visual & speech factors...');
      setAnalysisProgress(50);

      // 2. Analyze practice
      const analyzeRes = await analyzePracticeAttempt(id, {
        videoPath: uploadRes.data.videoPath,
        duration: recordingTime
      });

      setCurrentStep('Generating Before vs After comparison...');
      setAnalysisProgress(100);

      setComparisonResult({
        isImproved: analyzeRes.data.isImproved,
        verdictMessage: analyzeRes.data.verdictMessage,
        comparisonTable: analyzeRes.data.comparisonTable
      });
    } catch (err) {
      console.error('Error analyzing practice:', err);
      alert('Failed to analyze practice recording.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-300">Loading Practice Studio...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Weak Section Not Found</h3>
        <p className="text-xs text-slate-400 mb-6">{error || 'Unable to retrieve section details.'}</p>
        <Link to="/dashboard" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { weakSection, presentation } = data;
  const metrics = weakSection.metrics || {};

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/results/${weakSection.presentationId}`)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block">
              Targeted Weakness Repair Studio
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Practice Weak Section ({weakSection.startTime} – {weakSection.endTime})
            </h1>
          </div>
        </div>

        <Link
          to={`/results/${weakSection.presentationId}`}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/60"
        >
          <span>Back to Full Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Diagnosis & Actionable Instruction Card */}
      <div className="glass-panel-glow p-6 sm:p-8 rounded-3xl border-indigo-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Specific Repair Mission</h2>
            <p className="text-xs text-slate-400">Target duration: ~{Math.round(weakSection.durationSec || 30)} seconds</p>
          </div>
        </div>

        {/* Problems Detected Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {weakSection.problems?.map((prob, i) => (
            <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
              • {prob}
            </span>
          ))}
        </div>

        {/* Action Prompt */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm leading-relaxed">
          <strong className="text-white font-bold block mb-1">AI Coaching Instruction:</strong>
          "{weakSection.practiceInstruction}"
        </div>
      </div>

      {/* Practice Viewport / Status Tracker */}
      {isAnalyzing ? (
        <div className="py-8">
          <StatusTracker currentStep={currentStep} progress={analysisProgress} />
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl border-indigo-500/20">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Overlays */}
            <div className="absolute top-4 left-4">
              {isRecording ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-bold backdrop-blur-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 pulse-recording" />
                  <span>RECORDING PRACTICE</span>
                  <span className="font-mono ml-1">{formatTimer(recordingTime)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Practice Camera Ready</span>
                </div>
              )}
            </div>

            {/* Guiding Prompt in Viewport */}
            {isRecording && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-dark-bg/90 border border-indigo-500/30 backdrop-blur-md text-white text-xs text-center font-medium max-w-md shadow-glow">
                Focus on eye contact & eliminating filler words. Keep steady pace.
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Practice Timer: <strong className="font-mono text-slate-200">{formatTimer(recordingTime)}</strong>
            </div>

            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-glow transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{comparisonResult ? 'Record Practice Again' : 'Record Practice Attempt'}</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-glow transition-all active:scale-95"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>End Attempt & Re-Analyze</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Before vs After Comparison */}
      {comparisonResult && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Before vs After Comparison
            </h2>
            <button
              onClick={startRecording}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-attempt drill
            </button>
          </div>

          <ComparisonTable
            comparisonData={comparisonResult.comparisonTable}
            isImproved={comparisonResult.isImproved}
            verdictMessage={comparisonResult.verdictMessage}
          />
        </section>
      )}
    </div>
  );
};

export default PracticePage;
