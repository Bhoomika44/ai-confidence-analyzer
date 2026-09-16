import React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AlertCircle,
  Target,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';

const WeakSectionCard = ({ weakSection }) => {
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // Normalize the incoming weak section
  // ---------------------------------------------------------

  let section = weakSection;

  // Sometimes the backend may send:
  // { weak_sections: [...] }
  // instead of one section object.

  if (
    section &&
    !Array.isArray(section) &&
    Array.isArray(section.weak_sections)
  ) {
    section = section.weak_sections[0];
  }

  // If an array somehow reaches this component,
  // safely use the first section instead of crashing.

  if (Array.isArray(section)) {
    section = section[0];
  }

  // No valid section
  if (!section || typeof section !== 'object') {
    return null;
  }

  // ---------------------------------------------------------
  // Practice
  // ---------------------------------------------------------

  const sectionId =
    section._id ||
    section.id;

  const handlePractice = () => {
    if (!sectionId) {
      console.error(
        '[WeakSectionCard] No weak section ID found:',
        section
      );
      return;
    }

    navigate(`/practice/${sectionId}`);
  };

  // ---------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------

  const metrics =
    section.metrics &&
      typeof section.metrics === 'object'
      ? section.metrics
      : {};

  // ---------------------------------------------------------
  // Timestamp
  // ---------------------------------------------------------

  const startTime =
    section.startTime ||
    section.start_time ||
    '--:--';

  const endTime =
    section.endTime ||
    section.end_time ||
    '--:--';

  // ---------------------------------------------------------
  // Practice status
  // ---------------------------------------------------------

  const practiceCompleted =
    section.practiceCompleted === true ||
    section.practice_completed === true;

  // ---------------------------------------------------------
  // Explanation
  // ---------------------------------------------------------

  const explanation =
    section.explanation ||
    'This section needs additional practice based on the detected presentation behavior.';

  const practiceInstruction =
    section.practiceInstruction ||
    section.practice_instruction ||
    '';

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-indigo-500/60">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">

            <AlertCircle className="w-5 h-5" />

          </div>

          <div>

            <div className="flex items-center gap-2">

              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Weak Section Detected
              </span>

              {practiceCompleted && (

                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">

                  <CheckCircle2 className="w-3 h-3" />

                  Practiced

                </span>

              )}

            </div>

            <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-white">

              <Clock className="w-4 h-4 text-indigo-400" />

              <span>
                {startTime} – {endTime}
              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            PRACTICE BUTTON
        ================================================== */}

        <button
          onClick={handlePractice}
          disabled={!sectionId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-glow transition-all active:scale-95 group"
        >

          <Target className="w-4 h-4" />

          <span>
            Practice This Section
          </span>

          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

        </button>

      </div>

      {/* =====================================================
          METRICS
      ====================================================== */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">

        {/* Eye Contact */}

        {metrics.eye_contact !== undefined &&
          metrics.eye_contact !== null && (

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">

              <span className="text-[11px] text-slate-400 block mb-0.5">
                Eye Contact
              </span>

              <span
                className={`text-base font-bold ${Number(metrics.eye_contact) < 65
                    ? 'text-rose-400'
                    : 'text-slate-200'
                  }`}
              >
                {Math.round(
                  Number(metrics.eye_contact)
                )}
                %
              </span>

            </div>

          )}

        {/* Speaking Speed */}

        {metrics.speaking_speed !== undefined &&
          metrics.speaking_speed !== null && (

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">

              <span className="text-[11px] text-slate-400 block mb-0.5">
                Speaking Speed
              </span>

              <span
                className={`text-base font-bold ${Number(metrics.speaking_speed) > 160
                    ? 'text-rose-400'
                    : 'text-slate-200'
                  }`}
              >
                {Math.round(
                  Number(metrics.speaking_speed)
                )}{' '}
                WPM
              </span>

            </div>

          )}

        {/* Filler Words */}

        {metrics.filler_words !== undefined &&
          metrics.filler_words !== null && (

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">

              <span className="text-[11px] text-slate-400 block mb-0.5">
                Filler Words
              </span>

              <span
                className={`text-base font-bold ${Number(metrics.filler_words) >= 3
                    ? 'text-rose-400'
                    : 'text-slate-200'
                  }`}
              >
                {metrics.filler_words}
              </span>

            </div>

          )}

        {/* Long Pauses */}

        {metrics.long_pauses !== undefined &&
          metrics.long_pauses !== null && (

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">

              <span className="text-[11px] text-slate-400 block mb-0.5">
                Long Pauses
              </span>

              <span
                className={`text-base font-bold ${Number(metrics.long_pauses) >= 1
                    ? 'text-amber-400'
                    : 'text-slate-200'
                  }`}
              >
                {metrics.long_pauses}
              </span>

            </div>

          )}

      </div>

      {/* =====================================================
          DIAGNOSIS
      ====================================================== */}

      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">

        <p className="text-xs text-slate-300 leading-relaxed">

          <strong className="text-white font-semibold">
            Diagnosis:{' '}
          </strong>

          {explanation}

        </p>

        {practiceInstruction && (

          <p className="text-xs text-indigo-300/90 leading-relaxed">

            <strong className="text-indigo-400 font-semibold">
              Repair Exercise:{' '}
            </strong>

            "{practiceInstruction}"

          </p>

        )}

      </div>

    </div>
  );
};

export default WeakSectionCard;