import React, { useState, useEffect, useRef } from 'react';

import { useParams, Link, useNavigate } from 'react-router-dom';

import { getPresentationById } from '../services/api';

import MetricCard from '../components/MetricCard';

import TimelineChart from '../components/TimelineChart';

import WeakSectionCard from '../components/WeakSectionCard';

import {
  Eye,
  Smile,
  Compass,
  UserCheck,
  Hand,
  Activity,
  Mic,
  Gauge,
  Pause,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Play,
  Target,
  ShieldCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const ResultsPage = () => {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const videoPlayerRef = useRef(null);

  const navigate = useNavigate();

  // =========================================================
  // LOAD RESULTS
  // =========================================================

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getPresentationById(id);

        console.log(
          '[ResultsPage] API response:',
          res.data
        );

        setData(res.data);

      } catch (err) {
        console.error(
          '[ResultsPage] Failed to load presentation results:',
          err
        );

        setError(
          'Could not load analysis results.'
        );

      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  // =========================================================
  // SEEK VIDEO
  // =========================================================

  const handleSeekVideo = (timestampSec) => {
    if (!videoPlayerRef.current) {
      return;
    }

    try {
      videoPlayerRef.current.currentTime =
        Number(timestampSec) || 0;

      videoPlayerRef.current.play();

      videoPlayerRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

    } catch (error) {
      console.error(
        '[ResultsPage] Video seek error:',
        error
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="py-24 text-center">

        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

        <p className="text-sm font-semibold text-slate-300">
          Loading Analysis Results...
        </p>

      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !data) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">

        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />

        <h3 className="text-lg font-bold text-white mb-2">
          Results Not Found
        </h3>

        <p className="text-xs text-slate-400 mb-6">
          {error ||
            'Unable to retrieve presentation.'}
        </p>

        <Link
          to="/dashboard"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Dashboard
        </Link>

      </div>
    );
  }

  // =========================================================
  // PRESENTATION DATA
  // =========================================================

  const presentation =
    data.presentation || {};

  const analysis =
    data.analysis || {};

  const visual =
    analysis.visualMetrics || {};

  const audio =
    analysis.audioMetrics || {};

  // =========================================================
  // SPEECH STATUS
  // IMPORTANT:
  // ONLY true means speech was detected.
  // =========================================================

  const speechDetected =
    analysis.speechDetected === true;

  const hasSpeech =
    speechDetected === true;

  console.log(
    '[ResultsPage] Speech detected:',
    speechDetected
  );

  // =========================================================
  // OVERALL SCORE
  // =========================================================

  const overallScore =
    hasSpeech &&
      analysis.overallScore !== null &&
      analysis.overallScore !== undefined
      ? Math.round(
        Number(
          analysis.overallScore
        )
      )
      : null;

  const performanceLevel =
    analysis.performanceLevel ||
    (
      hasSpeech
        ? 'Presentation Analyzed'
        : 'No Speech Detected'
    );

  const badge =
    analysis.badge ||
    (
      hasSpeech
        ? 'Speaker'
        : 'Record Again'
    );

  // =========================================================
  // FIX WEAK SECTION DATA SHAPE
  // =========================================================

  let weakSections = [];

  if (Array.isArray(data.weakSections)) {

    weakSections =
      data.weakSections;

  } else if (
    data.weakSections &&
    Array.isArray(
      data.weakSections.weak_sections
    )
  ) {

    weakSections =
      data.weakSections.weak_sections;

  } else if (
    data.weak_sections &&
    Array.isArray(
      data.weak_sections.weak_sections
    )
  ) {

    weakSections =
      data.weak_sections.weak_sections;

  } else if (
    Array.isArray(data.weak_sections)
  ) {

    weakSections =
      data.weak_sections;
  }

  console.log(
    '[ResultsPage] Normalized weak sections:',
    weakSections
  );

  // =========================================================
  // FIRST WEAK SECTION
  // =========================================================

  const firstWeakSection =
    weakSections.length > 0
      ? weakSections[0]
      : null;

  const firstWeakSectionId =
    firstWeakSection?._id ||
    firstWeakSection?.id;

  // =========================================================
  // VIDEO URL
  // =========================================================

  const videoPath =
    presentation.videoPath || '';

  const videoFileName =
    videoPath
      .split(/[\\/]/)
      .pop();

  const videoUrl =
    videoFileName
      ? `http://localhost:5000/uploads/${videoFileName}`
      : '';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              navigate('/dashboard')
            }
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>

            <div className="flex items-center gap-2">

              <h1 className="text-2xl font-bold text-white tracking-tight">
                {presentation.title ||
                  'Presentation Results'}
              </h1>

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">

                {presentation.duration
                  ? `${Math.round(
                    presentation.duration
                  )}s`
                  : 'Recorded'}

              </span>

            </div>

            <p className="text-xs text-slate-400 mt-0.5">

              Analyzed on{' '}

              {presentation.date ||
                presentation.createdAt
                ? new Date(
                  presentation.date ||
                  presentation.createdAt
                ).toLocaleString()
                : 'Recently'}

            </p>

          </div>

        </div>

        {/* =================================================
            PRACTICE BUTTON
        ================================================== */}

        <div className="flex items-center gap-3">

          {!hasSpeech ? (

            <button
              onClick={() =>
                navigate('/rehearse')
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-glow transition-all"
            >

              <RotateCcw className="w-4 h-4" />

              <span>
                Record Again With Microphone
              </span>

            </button>

          ) : (

            firstWeakSection &&
            firstWeakSectionId && (

              <button
                onClick={() =>
                  navigate(
                    `/practice/${firstWeakSectionId}`
                  )
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-glow transition-all"
              >

                <Target className="w-4 h-4" />

                <span>
                  Practice Weak Section (
                  {firstWeakSection.start_time ||
                    firstWeakSection.startTime ||
                    '--:--'}
                  {' – '}
                  {firstWeakSection.end_time ||
                    firstWeakSection.endTime ||
                    '--:--'}
                  )
                </span>

              </button>

            )

          )}

        </div>

      </div>

      {/* =====================================================
          NO SPEECH BANNER
      ====================================================== */}

      {!hasSpeech && (

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-4">

          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />

          <div className="space-y-1">

            <h3 className="text-sm font-bold text-white">
              No Speech Detected In Recording
            </h3>

            <p className="text-xs text-amber-200/90 leading-relaxed">
              No speech was detected in this
              recording. Speech-related metrics
              such as speaking speed, pauses,
              filler words, and voice volume are
              not available. Visual presentation
              factors can still be analyzed when
              they are observable.
            </p>

          </div>

        </div>

      )}

      {/* =====================================================
          OVERALL SCORE
      ====================================================== */}

      <div className="glass-panel-glow p-8 rounded-3xl relative overflow-hidden border-indigo-500/30">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

          {/* SCORE */}

          <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-900/60 border border-slate-800">

            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">

              {hasSpeech
                ? 'Estimated Presentation Confidence'
                : 'Presentation Confidence'}

            </span>

            <div className="flex items-baseline gap-1 my-2">

              <span
                className={`text-6xl font-black tracking-tight ${hasSpeech
                  ? 'text-white'
                  : 'text-slate-500'
                  }`}
              >

                {hasSpeech
                  ? overallScore
                  : '--'}

              </span>

              {hasSpeech && (

                <span className="text-2xl font-bold text-indigo-400">
                  %
                </span>

              )}

            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 ${hasSpeech
                ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
            >

              {hasSpeech ? (

                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />

              ) : (

                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />

              )}

              <span>
                {performanceLevel}
              </span>

            </div>

            {!hasSpeech && (

              <p className="text-[11px] text-slate-500 mt-3">
                Confidence is not available because
                no speech was detected.
              </p>

            )}

          </div>

          {/* PERFORMANCE OVERVIEW */}

          <div className="lg:col-span-2 space-y-4">

            <h3 className="text-lg font-bold text-white">
              Performance Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* STRENGTHS */}

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">

                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">

                  <CheckCircle2 className="w-4 h-4" />

                  Top Strengths

                </h4>

                <ul className="space-y-1.5 text-xs text-slate-300">

                  {Array.isArray(
                    analysis.strengths
                  ) &&
                    analysis.strengths.length > 0 ? (

                    analysis.strengths.map(
                      (strength, index) => (

                        <li
                          key={index}
                          className="flex items-start gap-2"
                        >

                          <span className="text-emerald-400 font-bold">
                            •
                          </span>

                          <span>
                            {strength}
                          </span>

                        </li>

                      )
                    )

                  ) : (

                    <li className="text-slate-400">
                      {hasSpeech
                        ? 'No strengths were returned by the analysis.'
                        : 'Visual strengths may still be available from the recording.'}
                    </li>

                  )}

                </ul>

              </div>

              {/* WEAKNESSES */}

              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">

                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">

                  <AlertTriangle className="w-4 h-4" />

                  Areas for Improvement

                </h4>

                <ul className="space-y-1.5 text-xs text-slate-300">

                  {Array.isArray(
                    analysis.weaknesses
                  ) &&
                    analysis.weaknesses.length > 0 ? (

                    analysis.weaknesses.map(
                      (weakness, index) => (

                        <li
                          key={index}
                          className="flex items-start gap-2"
                        >

                          <span className="text-amber-400 font-bold">
                            •
                          </span>

                          <span>
                            {weakness}
                          </span>

                        </li>

                      )
                    )

                  ) : (

                    <li className="text-slate-400">
                      {hasSpeech
                        ? 'No specific weaknesses were returned.'
                        : 'Speech-related weaknesses cannot be determined without speech.'}
                    </li>

                  )}

                </ul>

              </div>

            </div>

            {/* DISCLAIMER */}

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">

              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />

              <span>
                {analysis.disclaimer ||
                  'Score represents observable presentation delivery behaviors and does not assess psychological, medical, or cognitive conditions.'}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          WEAK SECTIONS
      ====================================================== */}

      {hasSpeech &&
        weakSections.length > 0 && (

          <section className="space-y-4">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Target className="w-5 h-5 text-rose-400" />

                <h2 className="text-lg font-bold text-white">
                  Detected Weak Sections &
                  Targeted Practice Drills
                </h2>

              </div>

              <span className="text-xs text-slate-400">

                {weakSections.length}{' '}
                section
                {weakSections.length > 1
                  ? 's'
                  : ''}{' '}
                detected

              </span>

            </div>

            <div className="space-y-4">

              {weakSections.map(
                (weakSection, index) => (

                  <WeakSectionCard
                    key={
                      weakSection._id ||
                      weakSection.id ||
                      index
                    }
                    weakSection={
                      weakSection
                    }
                    onSeek={
                      handleSeekVideo
                    }
                  />

                )
              )}

            </div>

          </section>

        )}

      {/* =====================================================
          NO WEAK SECTIONS
      ====================================================== */}

      {hasSpeech &&
        weakSections.length === 0 && (

          <section className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">

            <div className="flex items-center gap-3">

              <CheckCircle2 className="w-5 h-5 text-emerald-400" />

              <div>

                <h3 className="text-sm font-bold text-white">
                  No Specific Weak Section Detected
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  No timestamped section requiring
                  targeted practice was returned by
                  the analysis.
                </p>

              </div>

            </div>

          </section>

        )}

      {/* =====================================================
          VISUAL ANALYSIS
      ====================================================== */}

      <section className="space-y-4">

        <h2 className="text-lg font-bold text-white flex items-center gap-2">

          <Eye className="w-5 h-5 text-indigo-400" />

          Visual Performance Factors

        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          <MetricCard
            title="Eye Contact"

            score={
              analysis.eyeContact ??
              visual.eye_contact?.score ??
              null
            }

            icon={Eye}

            status={
              visual.eye_contact?.status ||
              visual.eye_contact?.message ||
              'Cannot Analyze'
            }

            description="Direct eye contact toward the webcam camera."
          />

          <MetricCard
            title="Facial Expression"

            score={
              analysis.facialExpression ??
              visual.facial_expression?.score ??
              null
            }

            icon={Smile}

            status={
              visual.facial_expression?.engagement_level ||
              visual.facial_expression?.status ||
              'Cannot Analyze'
            }

            description="Expression engagement, smiling, and dynamic speaking animation."
          />

          <MetricCard
            title="Head Position"

            score={
              analysis.headPosition ??
              visual.head_position?.score ??
              null
            }

            icon={Compass}

            status={
              visual.head_position?.stability ||
              visual.head_position?.status ||
              'Cannot Analyze'
            }

            description="Looking forward vs looking down at notes or sideways."
          />

          <MetricCard
            title="Body Posture"

            score={
              analysis.posture ??
              visual.posture?.score ??
              null
            }

            icon={UserCheck}

            status={
              visual.posture?.alignment ||
              visual.posture?.status ||
              'Cannot Analyze'
            }

            description="Shoulder alignment and vertical spinal stability."
          />

          <MetricCard
            title="Hand Gestures"

            score={
              analysis.handGestures ??
              visual.hand_gestures?.score ??
              null
            }

            icon={Hand}

            status={
              visual.hand_gestures?.gesture_rate ||
              visual.hand_gestures?.status ||
              'Cannot Analyze'
            }

            description="Active supportive hand movements and gestures."
          />

          <MetricCard
            title="Body Movement"

            score={
              analysis.bodyMovement ??
              visual.body_movement?.score ??
              null
            }

            icon={Activity}

            status={
              visual.body_movement?.movement_style ||
              visual.body_movement?.status ||
              'Cannot Analyze'
            }

            description="Controlled presence vs fidgeting or static rigidity."
          />

        </div>

      </section>

      {/* =====================================================
          AUDIO ANALYSIS
      ====================================================== */}

      <section className="space-y-4">

        <h2 className="text-lg font-bold text-white flex items-center gap-2">

          <Mic className="w-5 h-5 text-cyan-400" />

          Audio & Speech Factors

        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {/* VOICE */}

          <MetricCard
            title="Voice & Volume"

            score={
              hasSpeech
                ? (
                  analysis.voice ??
                  audio.voice?.score ??
                  null
                )
                : null
            }

            icon={Mic}

            status={
              hasSpeech
                ? (
                  audio.voice?.volume_consistency ||
                  'Analyzed'
                )
                : 'No Speech Detected'
            }

            description="Voice clarity, projection, and consistent vocal energy."
          />

          {/* SPEAKING SPEED */}

          <MetricCard
            title="Speaking Speed"

            value={
              hasSpeech
                ? (
                  analysis.wpm ??
                  audio.speaking_speed?.wpm ??
                  null
                )
                : null
            }

            unit={
              hasSpeech
                ? 'WPM'
                : ''
            }

            icon={Gauge}

            status={
              hasSpeech
                ? (
                  audio.speaking_speed?.pace_category ||
                  'Analyzed'
                )
                : 'No Speech Detected'
            }

            description="Average speaking speed."
          />

          {/* PAUSES */}

          <MetricCard
            title="Pauses"

            score={
              hasSpeech
                ? (
                  analysis.pauseScore ??
                  audio.pauses?.score ??
                  null
                )
                : null
            }

            value={
              hasSpeech
                ? (
                  analysis.pauseCount ??
                  audio.pauses?.total_pauses ??
                  null
                )
                : null
            }

            unit={
              hasSpeech
                ? 'Pauses'
                : ''
            }

            icon={Pause}

            status={
              hasSpeech
                ? `${analysis.longPauseCount ??
                audio.pauses?.long_pauses ??
                0} Long Pauses`
                : 'No Speech Detected'
            }

            description="Deliberate pauses between sentences vs awkward silences."
          />

          {/* FILLER WORDS */}

          <MetricCard
            title="Filler Words"

            score={
              hasSpeech
                ? (
                  analysis.fillerWordScore ??
                  audio.filler_words?.score ??
                  null
                )
                : null
            }

            value={
              hasSpeech
                ? (
                  analysis.fillerWordCount ??
                  audio.filler_words?.total_count ??
                  null
                )
                : null
            }

            unit={
              hasSpeech
                ? 'Total'
                : ''
            }

            icon={MessageSquare}

            status={
              hasSpeech
                ? (
                  audio.filler_words?.fluency_category ||
                  'Analyzed'
                )
                : 'No Speech Detected'
            }

            description="Detection of common filler words."
          />

        </div>

      </section>

      {/* =====================================================
          TIMELINE + VIDEO
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* TIMELINE */}

        <TimelineChart
          timeline={
            analysis.timeline || []
          }
          onSelectTimestamp={
            handleSeekVideo
          }
        />

        {/* VIDEO */}

        <div className="glass-panel p-6 rounded-2xl space-y-3">

          <h3 className="text-base font-semibold text-white flex items-center gap-2">

            <Play className="w-4 h-4 text-indigo-400" />

            Presentation Video Recording

          </h3>

          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">

            {videoUrl ? (

              <video
                ref={videoPlayerRef}
                controls
                src={videoUrl}
                className="w-full h-full object-contain"
              />

            ) : (

              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Video recording unavailable.
              </div>

            )}

          </div>

          <p className="text-xs text-slate-400">
            Click any timestamp on the timeline to
            jump to that moment in the video.
          </p>

        </div>

      </div>

    </div>
  );
};

export default ResultsPage;