import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { uploadVideoFile, createPresentation, startAnalysis } from '../services/api';
import StatusTracker from '../components/StatusTracker';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Film } from 'lucide-react';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  
  // Pipeline Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Uploading video...');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { socket, joinPresentationRoom } = useSocket();

  const allowedFormats = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

  // Socket listener for real-time progress
  useEffect(() => {
    if (!socket) return;

    const handleProgress = (data) => {
      if (data.step) setCurrentStep(data.step);
      if (data.progress !== undefined) setAnalysisProgress(data.progress);
    };

    const handleCompleted = (data) => {
      setAnalysisProgress(100);
      setCurrentStep('Analysis completed');
      setTimeout(() => {
        navigate(`/results/${data.presentationId}`);
      }, 1000);
    };

    const handleFailed = (data) => {
      setIsProcessing(false);
      setError(`Analysis failed: ${data.error}`);
    };

    socket.on('analysis_progress', handleProgress);
    socket.on('analysis_completed', handleCompleted);
    socket.on('analysis_failed', handleFailed);

    return () => {
      socket.off('analysis_progress', handleProgress);
      socket.off('analysis_completed', handleCompleted);
      socket.off('analysis_failed', handleFailed);
    };
  }, [socket, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError('');
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedFormats.includes(ext) && !file.type.startsWith('video/')) {
      setError(`Unsupported format. Please upload MP4, MOV, WEBM, AVI, or MKV.`);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('File exceeds 500MB limit. Please upload a smaller video.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setError('');
    setIsProcessing(true);
    setCurrentStep('Uploading video...');
    setUploadProgress(10);
    setAnalysisProgress(5);

    try {
      // 1. Upload video file
      const formData = new FormData();
      formData.append('video', selectedFile);

      const uploadRes = await uploadVideoFile(formData, (percent) => {
        setUploadProgress(percent);
        setAnalysisProgress(Math.min(25, Math.round(percent * 0.25)));
      });

      const { videoPath } = uploadRes.data;
      setCurrentStep('Video uploaded. Initializing AI analysis...');

      // 2. Create presentation record
      const presRes = await createPresentation({
        title: title || selectedFile.name,
        inputType: 'upload',
        videoPath,
        duration: 0
      });

      const presentationId = presRes.data.id || presRes.data._id;
      joinPresentationRoom(presentationId);

      // 3. Trigger Python Analysis
      await startAnalysis(presentationId);
    } catch (err) {
      console.error('Upload & analysis error:', err);
      setIsProcessing(false);
      setError(err.response?.data?.message || 'Failed to upload or analyze video. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Upload Presentation Video
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload any pre-recorded presentation video. Our AI engine will analyze visual presence, speech pace, filler words, and pinpoint weak sections.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isProcessing ? (
        <div className="py-8">
          <StatusTracker currentStep={currentStep} progress={analysisProgress} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={`glass-panel p-10 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,video/x-matroska"
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-glow">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis
                  </p>
                </div>
                <span className="inline-block text-xs text-indigo-400 hover:underline">
                  Click to replace file
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    Drag and drop your presentation video here
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    or click to browse your computer
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {allowedFormats.map(fmt => (
                    <span key={fmt} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {fmt.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Presentation Title Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Presentation Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q3 Project Pitch Rehearsal"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!selectedFile || isProcessing}
            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Film className="w-4 h-4" />
            <span>Upload & Run Full AI Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default UploadPage;
