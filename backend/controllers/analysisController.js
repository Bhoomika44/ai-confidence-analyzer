const {
  PresentationRepo,
  AnalysisResultRepo,
  WeakSectionRepo
} = require('../models/repo');

const {
  runPythonAnalysis
} = require('../services/pythonBridge');


// =========================================================
// START ANALYSIS
// =========================================================

exports.startAnalysis = async (req, res) => {
  try {
    const { presentationId } = req.body;

    if (!presentationId) {
      return res.status(400).json({
        message: 'presentationId is required'
      });
    }

    const presentation =
      await PresentationRepo.findById(presentationId);

    if (!presentation) {
      return res.status(404).json({
        message: 'Presentation not found'
      });
    }

    // -----------------------------------------------------
    // Update status to processing
    // -----------------------------------------------------

    await PresentationRepo.findByIdAndUpdate(
      presentationId,
      {
        processingStatus: 'processing',
        processingStep: 'Processing video...',
        processingProgress: 10
      }
    );

    const io = req.app.get('io');

    // -----------------------------------------------------
    // Run analysis asynchronously
    // -----------------------------------------------------

    (async () => {
      try {

        if (io) {
          io
            .to(`presentation_${presentationId}`)
            .emit('analysis_progress', {
              presentationId,
              step: 'Processing video...',
              progress: 10
            });
        }

        // -------------------------------------------------
        // Run Python analyzer
        // -------------------------------------------------

        const rawResult = await runPythonAnalysis(
          presentation.videoPath,
          presentation.audioPath || null,
          'full',
          io,
          presentationId
        );

        console.log(
          '[AnalysisController] Python analysis completed'
        );

        console.log(
          '[AnalysisController] Speech detected:',
          rawResult.speech_detected
        );

        console.log(
          '[AnalysisController] Overall score:',
          rawResult.overall_score
        );

        // -------------------------------------------------
        // Determine speech state
        // -------------------------------------------------

        const speechDetected =
          rawResult.speech_detected === true;


        // =================================================
        // SAVE ANALYSIS RESULT
        // =================================================

        const savedAnalysis =
          await AnalysisResultRepo.create({

            presentationId,

            overallScore:
              rawResult.overall_score ?? null,

            performanceLevel:
              rawResult.performance_level ??
              (
                speechDetected
                  ? 'Presentation Performance'
                  : 'No Speech Detected'
              ),

            badge:
              rawResult.badge ??
              (
                speechDetected
                  ? 'Presentation Analyzed'
                  : 'Record Again'
              ),

            scoreLabel:
              rawResult.score_label ??
              (
                speechDetected
                  ? 'Estimated Presentation Confidence'
                  : 'Confidence Not Available'
              ),

            disclaimer:
              rawResult.disclaimer ??
              (
                speechDetected
                  ? 'Observable Presentation Performance Score'
                  : 'A confidence score cannot be calculated because no speech was detected.'
              ),

            speechDetected,

            // =================================================
            // INDIVIDUAL SCORES
            // =================================================

            eyeContact:
              rawResult.individual_scores?.eye_contact ?? null,

            facialExpression:
              rawResult.individual_scores?.facial_expression ?? null,

            headPosition:
              rawResult.individual_scores?.head_position ?? null,

            posture:
              rawResult.individual_scores?.posture ?? null,

            handGestures:
              rawResult.individual_scores?.hand_gestures ?? null,

            bodyMovement:
              rawResult.individual_scores?.body_movement ?? null,

            voice:
              rawResult.individual_scores?.voice ?? null,

            speakingSpeed:
              rawResult.individual_scores?.speaking_speed ?? null,

            pauseScore:
              rawResult.individual_scores?.pauses ?? null,

            fillerWordScore:
              rawResult.individual_scores?.filler_words ?? null,


            // =================================================
            // AUDIO VALUES
            // =================================================

            wpm:
              rawResult.audio_metrics
                ?.speaking_speed
                ?.wpm ?? null,

            pauseCount:
              rawResult.audio_metrics
                ?.pauses
                ?.total_pauses ?? null,

            longPauseCount:
              rawResult.audio_metrics
                ?.pauses
                ?.long_pauses ?? null,

            fillerWordCount:
              rawResult.audio_metrics
                ?.filler_words
                ?.total_count ?? null,


            // =================================================
            // VISUAL VALUES
            // =================================================

            eyeContactPercentage:
              rawResult.visual_metrics
                ?.eye_contact
                ?.percentage ?? null,


            // =================================================
            // COMPLETE METRICS
            // =================================================

            visualMetrics:
              rawResult.visual_metrics ?? {},

            audioMetrics:
              rawResult.audio_metrics ?? {},


            // =================================================
            // FEEDBACK
            // =================================================

            strengths:
              rawResult.strengths ?? [],

            weaknesses:
              rawResult.weaknesses ?? [],

            timeline:
              rawResult.timeline ?? []

          });


        // =================================================
        // SAVE WEAK SECTIONS
        // =================================================

        let weakSections = [];

        if (speechDetected) {

          const rawWeakSections =
            rawResult.weak_sections;

          console.log(
            '[AnalysisController] Raw weak sections:',
            rawWeakSections
          );

          // -----------------------------------------------
          // Case 1:
          // weak_sections is already an array
          // -----------------------------------------------

          if (Array.isArray(rawWeakSections)) {

            weakSections =
              rawWeakSections;

          }

          // -----------------------------------------------
          // Case 2:
          // weak_sections is an object containing
          // weak_sections array
          // -----------------------------------------------

          else if (
            rawWeakSections &&
            Array.isArray(
              rawWeakSections.weak_sections
            )
          ) {

            weakSections =
              rawWeakSections.weak_sections;

          }

          // -----------------------------------------------
          // Case 3:
          // object containing sections
          // -----------------------------------------------

          else if (
            rawWeakSections &&
            Array.isArray(
              rawWeakSections.sections
            )
          ) {

            weakSections =
              rawWeakSections.sections;

          }

          // -----------------------------------------------
          // Invalid format
          // -----------------------------------------------

          else {

            console.warn(
              '[AnalysisController] Weak sections were returned in an unexpected format.'
            );

            weakSections = [];

          }
        }

        console.log(
          '[AnalysisController] Normalized weak sections:',
          weakSections
        );


        // =================================================
        // CREATE WEAK SECTION RECORDS
        // =================================================

        for (const ws of weakSections) {

          if (!ws || typeof ws !== 'object') {
            continue;
          }

          await WeakSectionRepo.create({

            presentationId,

            startSec:
              ws.start_sec ??
              ws.startSec ??
              0,

            endSec:
              ws.end_sec ??
              ws.endSec ??
              30,

            startTime:
              ws.start_time ??
              ws.startTime ??
              '00:00',

            endTime:
              ws.end_time ??
              ws.endTime ??
              '00:30',

            durationSec:
              ws.duration_sec ??
              ws.durationSec ??
              30,

            problems:
              Array.isArray(ws.problems)
                ? ws.problems
                : [],

            metrics:
              ws.metrics &&
                typeof ws.metrics === 'object'
                ? ws.metrics
                : {},

            explanation:
              ws.explanation ?? '',

            practiceInstruction:
              ws.practice_instruction ??
              ws.practiceInstruction ??
              '',

            practiceCompleted:
              false

          });
        }


        // =================================================
        // UPDATE PRESENTATION
        // =================================================

        await PresentationRepo.findByIdAndUpdate(
          presentationId,
          {

            overallScore:
              rawResult.overall_score ?? null,

            duration:
              rawResult.duration ??
              presentation.duration ??
              null,

            performanceLevel:
              rawResult.performance_level ??
              (
                speechDetected
                  ? 'Presentation Performance'
                  : 'No Speech Detected'
              ),

            processingStatus:
              'completed',

            processingStep:
              speechDetected
                ? 'Analysis completed'
                : 'No speech detected',

            processingProgress:
              100

          }
        );


        // =================================================
        // SEND COMPLETION EVENT
        // =================================================

        if (io) {

          io
            .to(`presentation_${presentationId}`)
            .emit('analysis_completed', {

              presentationId,

              analysisId:
                savedAnalysis.id,

              overallScore:
                rawResult.overall_score ?? null,

              speechDetected

            });

        }


        console.log(
          `[AnalysisController] Analysis completed for ${presentationId}`
        );

      } catch (err) {

        console.error(
          `[AnalysisController] Error analyzing presentation ${presentationId}:`,
          err
        );

        await PresentationRepo.findByIdAndUpdate(
          presentationId,
          {

            processingStatus:
              'failed',

            processingStep:
              `Analysis failed: ${err.message}`,

            processingProgress:
              0

          }
        );

        if (io) {

          io
            .to(`presentation_${presentationId}`)
            .emit('analysis_failed', {

              presentationId,

              error:
                err.message

            });

        }

      }
    })();


    // -----------------------------------------------------
    // Respond immediately
    // -----------------------------------------------------

    res.json({

      message:
        'Analysis started successfully',

      presentationId,

      status:
        'processing'

    });

  } catch (error) {

    console.error(
      'Error initiating analysis:',
      error
    );

    res.status(500).json({

      message:
        'Failed to initiate analysis'

    });

  }
};


// =========================================================
// GET ANALYSIS RESULT
// =========================================================

exports.getAnalysisResult = async (req, res) => {

  try {

    const { id } = req.params;

    let analysis =
      await AnalysisResultRepo.findById(id);

    if (!analysis) {

      analysis =
        await AnalysisResultRepo.findOne({
          presentationId: id
        });

    }

    if (!analysis) {

      return res.status(404).json({

        message:
          'Analysis results not found'

      });

    }


    const weakSections =
      await WeakSectionRepo.find({

        presentationId:
          analysis.presentationId

      });


    const presentation =
      await PresentationRepo.findById(
        analysis.presentationId
      );


    res.json({

      analysis,

      weakSections,

      presentation

    });

  } catch (error) {

    console.error(
      'Error fetching analysis result:',
      error
    );

    res.status(500).json({

      message:
        'Failed to fetch analysis result'

    });

  }

};


// =========================================================
// GET ANALYSIS STATUS
// =========================================================

exports.getAnalysisStatus = async (req, res) => {

  try {

    const { id } = req.params;

    const presentation =
      await PresentationRepo.findById(id);

    if (!presentation) {

      return res.status(404).json({

        message:
          'Presentation not found'

      });

    }


    res.json({

      presentationId:
        id,

      status:
        presentation.processingStatus,

      step:
        presentation.processingStep,

      progress:
        presentation.processingProgress,

      overallScore:
        presentation.overallScore ?? null,

      speechDetected:
        presentation.speechDetected ?? false

    });

  } catch (error) {

    console.error(
      'Error checking status:',
      error
    );

    res.status(500).json({

      message:
        'Failed to check status'

    });

  }

};