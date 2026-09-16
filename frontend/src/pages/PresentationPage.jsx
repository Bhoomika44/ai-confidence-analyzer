import React, { useState, useRef, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useSocket } from '../context/SocketContext';

import {
  createPresentation,
  uploadVideoFile,
  startAnalysis
} from '../services/api';

import StatusTracker from '../components/StatusTracker';

import {
  Video,
  Mic,
  Square,
  Play,
  ShieldAlert
} from 'lucide-react';

const PresentationPage = () => {
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionError, setPermissionError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState('Recording completed');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const navigate = useNavigate();

  const { socket, joinPresentationRoom } = useSocket();

  // =========================================================
  // STOP ANY PREVIOUS CAMERA AND MICROPHONE
  // =========================================================

  const stopMedia = () => {
    const activeStream = streamRef.current;

    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.error(
            '[Presentation] Error stopping media track:',
            error
          );
        }
      });
    }

    streamRef.current = null;
    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // =========================================================
  // REQUEST CAMERA AND MICROPHONE
  // THIS RUNS WHENEVER USER CLICKS START PRESENTATION
  // =========================================================

  const initMedia = async () => {
    setPermissionError('');
    setIsStarting(true);

    try {
      // Make sure no previous stream is still active.
      stopMedia();

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera and microphone are not supported by this browser.'
        );
      }

      console.log(
        '[Presentation] Requesting camera and microphone access...'
      );

      // IMPORTANT:
      // This is called directly from the Start Presentation flow.
      const userStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280
            },
            height: {
              ideal: 720
            },
            frameRate: {
              ideal: 30
            }
          },
          audio: true
        });

      console.log(
        '[Presentation] Camera and microphone access granted.'
      );

      streamRef.current = userStream;
      setStream(userStream);

      // Start recording only after permission/access succeeds.
      startRecording(userStream);

    } catch (error) {
      console.error(
        '[Presentation] Media access error:',
        error
      );

      if (error.name === 'NotAllowedError') {
        setPermissionError(
          'Camera and microphone permission was denied. Please allow access in your browser and click Start Presentation again.'
        );
      } else if (error.name === 'NotFoundError') {
        setPermissionError(
          'No camera or microphone was found on this device.'
        );
      } else if (error.name === 'NotReadableError') {
        setPermissionError(
          'Your camera or microphone is already being used by another application.'
        );
      } else if (error.name === 'SecurityError') {
        setPermissionError(
          'Camera and microphone access is blocked by browser security settings.'
        );
      } else {
        setPermissionError(
          'Camera and microphone access are required for presentation analysis. Please check your browser permissions and try again.'
        );
      }

      streamRef.current = null;
      setStream(null);

    } finally {
      setIsStarting(false);
    }
  };

  // =========================================================
  // CONNECT CAMERA STREAM TO VIDEO PREVIEW
  // =========================================================

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      videoRef.current
        .play()
        .catch((error) => {
          console.log(
            '[Presentation] Video autoplay prevented:',
            error
          );
        });
    }
  }, [stream]);

  // =========================================================
  // SOCKET ANALYSIS PROGRESS
  // =========================================================

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleProgress = (data) => {
      if (data.step) {
        setCurrentStep(data.step);
      }

      if (data.progress !== undefined) {
        setAnalysisProgress(data.progress);
      }
    };

    const handleCompleted = (data) => {
      setAnalysisProgress(100);
      setCurrentStep('Analysis completed');

      setTimeout(() => {
        navigate(
          `/results/${data.presentationId}`
        );
      }, 1000);
    };

    const handleFailed = (data) => {
      setIsAnalyzing(false);

      alert(
        `Analysis encountered an issue: ${data.error}`
      );
    };

    socket.on(
      'analysis_progress',
      handleProgress
    );

    socket.on(
      'analysis_completed',
      handleCompleted
    );

    socket.on(
      'analysis_failed',
      handleFailed
    );

    return () => {
      socket.off(
        'analysis_progress',
        handleProgress
      );

      socket.off(
        'analysis_completed',
        handleCompleted
      );

      socket.off(
        'analysis_failed',
        handleFailed
      );
    };
  }, [socket, navigate]);

  // =========================================================
  // START MEDIA RECORDER
  // =========================================================

  const startRecording = (activeStream) => {
    if (!activeStream) {
      setPermissionError(
        'Camera and microphone are not available. Please try again.'
      );
      return;
    }

    recordedChunksRef.current = [];

    let options = {
      mimeType: 'video/webm;codecs=vp8,opus'
    };

    if (
      !MediaRecorder.isTypeSupported(
        options.mimeType
      )
    ) {
      options = {
        mimeType: 'video/webm'
      };
    }

    try {
      const mediaRecorder =
        new MediaRecorder(
          activeStream,
          options
        );

      mediaRecorderRef.current =
        mediaRecorder;

      mediaRecorder.ondataavailable = (
        event
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          recordedChunksRef.current.push(
            event.data
          );
        }
      };

      mediaRecorder.onstop =
        handleRecordingComplete;

      mediaRecorder.start(1000);

      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current =
        setInterval(() => {
          setRecordingTime(
            (previousTime) =>
              previousTime + 1
          );
        }, 1000);

      console.log(
        '[Presentation] Recording started.'
      );

    } catch (error) {
      console.error(
        '[Presentation] Failed to start MediaRecorder:',
        error
      );

      stopMedia();

      alert(
        'Could not start video recording with the current browser settings.'
      );
    }
  };

  // =========================================================
  // START PRESENTATION
  // =========================================================

  const handleStartPresentation = async () => {
    if (
      isStarting ||
      isRecording ||
      isAnalyzing
    ) {
      return;
    }

    console.log(
      '[Presentation] Start Presentation clicked.'
    );

    // Every click reaches initMedia().
    // initMedia() calls getUserMedia().
    await initMedia();
  };

  // =========================================================
  // STOP RECORDING
  // =========================================================

  const stopRecording = () => {
    const recorder =
      mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    if (
      recorder.state === 'inactive'
    ) {
      return;
    }

    console.log(
      '[Presentation] Stopping recording...'
    );

    recorder.stop();

    setIsRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(
        timerIntervalRef.current
      );

      timerIntervalRef.current = null;
    }

    // Stop camera and microphone immediately.
    stopMedia();
  };

  // =========================================================
  // PROCESS COMPLETED RECORDING
  // =========================================================

  const handleRecordingComplete =
    async () => {
      setIsAnalyzing(true);

      setCurrentStep(
        'Recording completed'
      );

      setAnalysisProgress(5);

      try {
        // =====================================================
        // CREATE VIDEO BLOB
        // =====================================================

        const videoBlob = new Blob(
          recordedChunksRef.current,
          {
            type: 'video/webm'
          }
        );

        console.log(
          '[Presentation] Recorded video size:',
          videoBlob.size,
          'bytes'
        );

        if (videoBlob.size === 0) {
          throw new Error(
            'The recorded video is empty.'
          );
        }

        // =====================================================
        // CREATE VIDEO FILE
        // =====================================================

        const videoFile = new File(
          [videoBlob],
          `presentation-${Date.now()}.webm`,
          {
            type: 'video/webm'
          }
        );

        // =====================================================
        // STEP 1: UPLOAD VIDEO
        // =====================================================

        const formData =
          new FormData();

        formData.append(
          'video',
          videoFile
        );

        const uploadRes =
          await uploadVideoFile(
            formData,
            (percent) => {
              setAnalysisProgress(
                Math.min(
                  20,
                  Math.round(
                    percent * 0.2
                  )
                )
              );
            }
          );

        const {
          videoPath
        } = uploadRes.data;

        // =====================================================
        // STEP 2: CREATE PRESENTATION
        // =====================================================

        const presRes =
          await createPresentation({
            title: `Rehearsal — ${new Date().toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit'
              }
            )}`,

            inputType: 'recording',

            videoPath,

            duration: recordingTime
          });

        const presentationId =
          presRes.data.id ||
          presRes.data._id;

        if (!presentationId) {
          throw new Error(
            'Presentation ID was not returned by the server.'
          );
        }

        console.log(
          '[Presentation] Presentation created:',
          presentationId
        );

        // =====================================================
        // STEP 3: JOIN ANALYSIS ROOM
        // =====================================================

        joinPresentationRoom(
          presentationId
        );

        // =====================================================
        // STEP 4: START AI ANALYSIS
        // =====================================================

        console.log(
          '[Presentation] Starting AI analysis...'
        );

        await startAnalysis(
          presentationId
        );

      } catch (error) {
        console.error(
          '[Presentation] Error uploading/analyzing recording:',
          error
        );

        setIsAnalyzing(false);

        alert(
          'Failed to process recording. Please check your connection and try again.'
        );
      }
    };

  // =========================================================
  // CLEANUP WHEN LEAVING PAGE
  // =========================================================

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        try {
          if (
            mediaRecorderRef.current
              .state !== 'inactive'
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          console.error(
            '[Presentation] Recorder cleanup error:',
            error
          );
        }
      }

      if (timerIntervalRef.current) {
        clearInterval(
          timerIntervalRef.current
        );
      }

      stopMedia();
    };
  }, []);

  // =========================================================
  // FORMAT TIMER
  // =========================================================

  const formatTimer = (
    seconds
  ) => {
    const mins = Math.floor(
      seconds / 60
    );

    const secs =
      seconds % 60;

    return `${mins
      .toString()
      .padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Real-Time Presentation Rehearsal
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deliver your presentation naturally.
            Click Start Presentation when you
            are ready and End Presentation when
            you are done.
          </p>

        </div>

      </div>

      {/* Permission Error */}

      {permissionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">

          <ShieldAlert className="w-5 h-5 shrink-0" />

          <span>
            {permissionError}
          </span>

        </div>
      )}

      {/* Analysis */}

      {isAnalyzing ? (

        <div className="py-12">

          <StatusTracker
            currentStep={currentStep}
            progress={analysisProgress}
          />

        </div>

      ) : (

        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border-indigo-500/20">

          {/* Video Preview */}

          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex items-center justify-center">

            {/* Camera Off Message */}

            {!stream && !isRecording && (

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">

                <Video className="w-12 h-12 text-slate-600 mb-4" />

                <h2 className="text-lg font-semibold text-slate-300">
                  Camera is off
                </h2>

                <p className="text-sm text-slate-500 mt-2">
                  Your camera and microphone
                  will start only after you
                  click Start Presentation.
                </p>

              </div>

            )}

            {/* Camera Preview */}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${stream
                  ? 'block'
                  : 'hidden'
                }`}
            />

            {/* Recording Indicator */}

            {isRecording && (

              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold backdrop-blur-md">

                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 pulse-recording" />

                <span>
                  REC
                </span>

                <span className="font-mono ml-1">
                  {formatTimer(
                    recordingTime
                  )}
                </span>

              </div>

            )}

            {/* Camera Status */}

            {stream && (

              <div className="absolute top-4 left-4 mt-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md">

                <Video className="w-3.5 h-3.5 text-emerald-400" />

                <span>
                  Camera Active
                </span>

              </div>

            )}

            {/* Microphone Status */}

            {stream && (

              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-300 text-xs font-medium backdrop-blur-md">

                <Mic className="w-3.5 h-3.5 text-indigo-400" />

                <span>
                  Mic Ready
                </span>

              </div>

            )}

            {/* Recording Message */}

            {isRecording && (

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-dark-bg/85 border border-slate-800 backdrop-blur-md text-slate-300 text-xs text-center font-medium shadow-glass">

                Presenting naturally —
                detailed metric scores will
                be computed after ending
                recording.

              </div>

            )}

          </div>

          {/* Controls */}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">

            {/* Duration */}

            <div className="flex items-center gap-3 text-xs text-slate-400">

              <span>
                Duration:{' '}

                <strong className="font-mono text-slate-200">
                  {formatTimer(
                    recordingTime
                  )}
                </strong>
              </span>

              <span>
                •
              </span>

              <span>
                No time limits
              </span>

            </div>

            {/* Buttons */}

            <div className="flex items-center gap-3">

              {!isRecording ? (

                <button
                  onClick={
                    handleStartPresentation
                  }

                  disabled={
                    isStarting ||
                    isAnalyzing
                  }

                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-glow transition-all active:scale-95 disabled:opacity-50"
                >

                  <Play className="w-4 h-4 fill-white" />

                  <span>
                    {isStarting
                      ? 'Requesting Camera...'
                      : 'Start Presentation'}
                  </span>

                </button>

              ) : (

                <button
                  onClick={
                    stopRecording
                  }

                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-glow transition-all active:scale-95"
                >

                  <Square className="w-4 h-4 fill-white" />

                  <span>
                    End Presentation & Analyze
                  </span>

                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default PresentationPage;