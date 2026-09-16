import os
import sys
import json
import argparse
import time
import subprocess
import shutil

import cv2
import mediapipe as mp

from visual.eye_contact import EyeContactAnalyzer
from visual.facial_expression import FacialExpressionAnalyzer
from visual.head_position import HeadPositionAnalyzer
from visual.posture import PostureAnalyzer
from visual.hand_gestures import HandGestureAnalyzer
from visual.body_movement import BodyMovementAnalyzer

from audio.voice_analysis import VoiceAnalyzer
from audio.pause_detector import PauseDetector
from audio.speech_transcription import SpeechTranscriber
from audio.filler_words import FillerWordDetector

from scoring.confidence_scorer import ConfidenceScorer
from scoring.weak_section_detector import WeakSectionDetector


# ============================================================
# MODEL PATH RESOLUTION
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")


def get_model_path(
    model_filename,
    fallback_dir=r"C:\StudentConfidence"
):
    local_path = os.path.join(
        MODELS_DIR,
        model_filename
    )

    if os.path.exists(local_path):
        return local_path

    fallback_path = os.path.join(
        fallback_dir,
        model_filename
    )

    if os.path.exists(fallback_path):
        return fallback_path

    return local_path


# ============================================================
# PROGRESS
# ============================================================

def emit_progress(step, percent):
    print(
        json.dumps({
            "type": "progress",
            "step": step,
            "percent": percent
        }),
        flush=True
    )


# ============================================================
# FFMPEG
# ============================================================

def get_ffmpeg_executable():

    ffmpeg_path = shutil.which("ffmpeg")

    if ffmpeg_path:
        return ffmpeg_path

    backend_ffmpeg = os.path.abspath(
        os.path.join(
            BASE_DIR,
            "..",
            "backend",
            "node_modules",
            "@ffmpeg-installer",
            "win32-x64",
            "ffmpeg.exe"
        )
    )

    if os.path.exists(backend_ffmpeg):
        return backend_ffmpeg

    fallback_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\StudentConfidence\ffmpeg.exe"
    ]

    for fallback in fallback_paths:

        if os.path.exists(fallback):
            return fallback

    return "ffmpeg"


# ============================================================
# EXTRACT AUDIO
# ============================================================

def extract_audio_from_video(video_path):

    try:

        base_name = os.path.splitext(video_path)[0]

        wav_path = base_name + "_analysis.wav"

        ffmpeg_bin = get_ffmpeg_executable()

        command = [
            ffmpeg_bin,
            "-y",
            "-i",
            video_path,
            "-vn",
            "-map",
            "0:a:0?",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-acodec",
            "pcm_s16le",
            wav_path
        ]

        print(
            "[Audio] Extracting audio with FFmpeg...",
            file=sys.stderr
        )

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:

            print(
                "[Audio] FFmpeg could not extract audio.",
                file=sys.stderr
            )

            print(
                result.stderr[-2000:],
                file=sys.stderr
            )

            return None

        if not os.path.exists(wav_path):

            print(
                "[Audio] FFmpeg did not create WAV file.",
                file=sys.stderr
            )

            return None

        if os.path.getsize(wav_path) < 1000:

            print(
                "[Audio] Extracted WAV file is empty or too small.",
                file=sys.stderr
            )

            return None

        print(
            f"[Audio] Audio extracted successfully: {wav_path}",
            file=sys.stderr
        )

        return wav_path

    except Exception as e:

        print(
            f"[Audio] Audio extraction failed: {e}",
            file=sys.stderr
        )

        return None


# ============================================================
# FALLBACK RESULTS
# ============================================================

def create_no_audio_results():

    return {
        "score": None,
        "speech_detected": False,
        "voice_activity_percentage": None,
        "volume_consistency": "No Audio Detected",
        "feedback": "No audio was detected in the recording.",
        "duration": 0.0,
        "energy_profile": []
    }


def create_no_speech_results():

    return {
        "score": None,
        "speech_detected": False,
        "voice_activity_percentage": None,
        "volume_consistency": "No Speech Detected",
        "feedback": "No speech was detected in the recording.",
        "duration": 0.0,
        "energy_profile": []
    }


def create_no_speech_pause_result():

    return {
        "score": None,
        "speech_detected": False,
        "total_pauses": None,
        "long_pauses": None,
        "average_pause_duration": None,
        "longest_pause": None,
        "pause_timestamps": [],
        "pause_details": []
    }


def create_no_speech_transcription_result():

    return {
        "score": None,
        "wpm": None,
        "word_count": None,
        "transcript": "",
        "pace_category": "No Speech Detected",
        "speech_detected": False
    }


def create_no_speech_filler_result():

    return {
        "score": None,
        "total_count": None,
        "rate_per_minute": None,
        "fluency_category": "No Speech Detected",
        "breakdown": {},
        "instances": [],
        "speech_detected": False
    }


# ============================================================
# MAIN ANALYSIS
# ============================================================

def analyze_presentation(
    video_path,
    audio_path=None,
    mode="full"
):

    start_time = time.time()

    print(
        f"[Analyzer] Starting presentation analysis: {video_path}",
        file=sys.stderr
    )

    if not video_path:
        raise ValueError("Video path is required.")

    if not os.path.exists(video_path):
        raise FileNotFoundError(
            f"Video file not found: {video_path}"
        )

    # ========================================================
    # OPEN VIDEO
    # ========================================================

    emit_progress(
        "Opening video...",
        5
    )

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise RuntimeError(
            "Could not open the video file."
        )

    fps = cap.get(cv2.CAP_PROP_FPS)

    # WebM recordings can sometimes report impossible FPS.
    # Do not trust values such as 1000 FPS.
    if (
        not fps
        or fps <= 1
        or fps > 120
    ):
        print(
            f"[Analyzer] Invalid video FPS reported: {fps}. Using 30 FPS.",
            file=sys.stderr
        )
        fps = 30.0

    total_frames = int(
        cap.get(cv2.CAP_PROP_FRAME_COUNT)
    )

    if total_frames < 0:
        total_frames = 0

    metadata_duration = (
        total_frames / fps
        if total_frames > 0
        else 0.0
    )

    print(
        f"[Analyzer] Video FPS: {fps}, "
        f"Metadata Duration: {metadata_duration:.2f}s, "
        f"Frames: {total_frames}",
        file=sys.stderr
    )

    # ========================================================
    # INITIALIZE VISUAL ANALYZERS
    # ========================================================

    emit_progress(
        "Initializing visual models...",
        10
    )

    eye_analyzer = EyeContactAnalyzer()
    expression_analyzer = FacialExpressionAnalyzer()
    head_analyzer = HeadPositionAnalyzer()
    posture_analyzer = PostureAnalyzer()

    gesture_analyzer = HandGestureAnalyzer()

    movement_analyzer = BodyMovementAnalyzer()

    # Store hand landmarks for the new HandGestureAnalyzer.
    hand_landmarks_history = []

    # ========================================================
    # MEDIAPIPE LANDMARKERS
    # ========================================================

    face_landmarker = None
    hand_landmarker = None
    pose_landmarker = None

    # --------------------------------------------------------
    # FACE
    # --------------------------------------------------------

    try:

        face_model_path = get_model_path(
            "face_landmarker.task"
        )

        if os.path.exists(face_model_path):

            face_options = (
                mp.tasks.vision.FaceLandmarkerOptions(
                    base_options=mp.tasks.BaseOptions(
                        model_asset_path=face_model_path
                    ),
                    running_mode=(
                        mp.tasks.vision.RunningMode.IMAGE
                    ),
                    num_faces=1,
                    min_face_detection_confidence=0.5,
                    min_face_presence_confidence=0.5,
                    min_tracking_confidence=0.5
                )
            )

            face_landmarker = (
                mp.tasks.vision.FaceLandmarker
                .create_from_options(
                    face_options
                )
            )

            print(
                "[Face] FaceLandmarker initialized",
                file=sys.stderr
            )

    except Exception as e:

        print(
            f"[Face] FaceLandmarker init error: {e}",
            file=sys.stderr
        )

    # --------------------------------------------------------
    # HAND
    # --------------------------------------------------------

    try:

        hand_model_path = get_model_path(
            "hand_landmarker.task"
        )

        if os.path.exists(hand_model_path):

            hand_options = (
                mp.tasks.vision.HandLandmarkerOptions(
                    base_options=mp.tasks.BaseOptions(
                        model_asset_path=hand_model_path
                    ),
                    running_mode=(
                        mp.tasks.vision.RunningMode.IMAGE
                    ),
                    num_hands=2,
                    min_hand_detection_confidence=0.5,
                    min_hand_presence_confidence=0.5,
                    min_tracking_confidence=0.5
                )
            )

            hand_landmarker = (
                mp.tasks.vision.HandLandmarker
                .create_from_options(
                    hand_options
                )
            )

            print(
                "[Hand] HandLandmarker initialized",
                file=sys.stderr
            )

    except Exception as e:

        print(
            f"[Hand] HandLandmarker init error: {e}",
            file=sys.stderr
        )

    # --------------------------------------------------------
    # POSE
    # --------------------------------------------------------

    try:

        pose_model_path = get_model_path(
            "pose_landmarker.task"
        )

        if os.path.exists(pose_model_path):

            pose_options = (
                mp.tasks.vision.PoseLandmarkerOptions(
                    base_options=mp.tasks.BaseOptions(
                        model_asset_path=pose_model_path
                    ),
                    running_mode=(
                        mp.tasks.vision.RunningMode.IMAGE
                    ),
                    min_pose_detection_confidence=0.5,
                    min_pose_presence_confidence=0.5,
                    min_tracking_confidence=0.5
                )
            )

            pose_landmarker = (
                mp.tasks.vision.PoseLandmarker
                .create_from_options(
                    pose_options
                )
            )

            print(
                "[Pose] PoseLandmarker initialized",
                file=sys.stderr
            )

    except Exception as e:

        print(
            f"[Pose] PoseLandmarker init error: {e}",
            file=sys.stderr
        )

    # ========================================================
    # ANALYZE VIDEO FRAMES
    # ========================================================

    emit_progress(
        "Analyzing visual dynamics...",
        15
    )

    sample_interval = max(
        1,
        int(round(fps / 8.0))
    )

    # Actual FPS of the sampled frames.
    analyzed_fps = fps / sample_interval

    frame_index = 0
    analyzed_frames = 0

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        if frame_index % sample_interval != 0:

            frame_index += 1
            continue

        frame_timestamp = (
            frame_index / fps
        )

        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_frame
        )

        # ----------------------------------------------------
        # FACE
        # ----------------------------------------------------

        face_landmarks = None

        if face_landmarker is not None:

            try:

                face_result = (
                    face_landmarker.detect(
                        mp_image
                    )
                )

                if (
                    face_result
                    and face_result.face_landmarks
                ):

                    face_landmarks = (
                        face_result.face_landmarks[0]
                    )

            except Exception:

                face_landmarks = None

        # ----------------------------------------------------
        # HANDS
        # ----------------------------------------------------

        hand_landmarks_list = []

        if hand_landmarker is not None:

            try:

                hand_result = (
                    hand_landmarker.detect(
                        mp_image
                    )
                )

                if (
                    hand_result
                    and hand_result.hand_landmarks
                ):

                    hand_landmarks_list = (
                        hand_result.hand_landmarks
                    )

            except Exception:

                hand_landmarks_list = []

        # IMPORTANT:
        # Store every sampled frame, including empty frames.
        hand_landmarks_history.append(
            hand_landmarks_list
        )

        # ----------------------------------------------------
        # POSE
        # ----------------------------------------------------

        pose_landmarks = None

        if pose_landmarker is not None:

            try:

                pose_result = (
                    pose_landmarker.detect(
                        mp_image
                    )
                )

                if (
                    pose_result
                    and pose_result.pose_landmarks
                ):

                    pose_landmarks = (
                        pose_result.pose_landmarks[0]
                    )

            except Exception:

                pose_landmarks = None

        # ----------------------------------------------------
        # VISUAL ANALYZERS
        # ----------------------------------------------------

        try:

            eye_analyzer.analyze_frame(
                face_landmarks,
                frame_timestamp=frame_timestamp
            )

        except Exception:
            pass

        try:

            expression_analyzer.analyze_frame(
                face_landmarks,
                frame_timestamp=frame_timestamp
            )

        except Exception:
            pass

        try:

            head_analyzer.analyze_frame(
                face_landmarks,
                frame_timestamp=frame_timestamp
            )

        except Exception:
            pass

        try:

            posture_analyzer.analyze_frame(
                pose_landmarks,
                frame_timestamp=frame_timestamp
            )

        except Exception:
            pass

        # Do NOT call gesture_analyzer.analyze_frame().
        # The new hand analyzer works on the complete history.

        try:

            movement_analyzer.analyze_frame(
                pose_landmarks,
                frame_timestamp=frame_timestamp
            )

        except Exception:
            pass

        analyzed_frames += 1
        frame_index += 1

        if total_frames > 0:

            progress = (
                15
                + int(
                    (frame_index / total_frames)
                    * 30
                )
            )

            progress = min(
                45,
                max(15, progress)
            )

            emit_progress(
                "Analyzing visual dynamics...",
                progress
            )

    cap.release()

    # Calculate real duration from frames actually read.
    actual_duration = (
        frame_index / fps
        if frame_index > 0
        else 0.0
    )

    if actual_duration > 0:
        duration = actual_duration
    else:
        duration = metadata_duration

    print(
        f"[Analyzer] Actual processed duration: "
        f"{duration:.2f}s",
        file=sys.stderr
    )

    # ========================================================
    # CLOSE MEDIAPIPE
    # ========================================================

    for landmarker in (
        face_landmarker,
        hand_landmarker,
        pose_landmarker
    ):

        if landmarker is not None:

            try:
                landmarker.close()
            except Exception:
                pass

    # ========================================================
    # HAND GESTURE SUMMARY
    # ========================================================

    try:

        hand_result = gesture_analyzer.analyze(
            hand_landmarks_history,
            fps=analyzed_fps
        )

    except Exception as e:

        print(
            f"[Hand] Hand gesture analysis error: {e}",
            file=sys.stderr
        )

        hand_result = {
            "score": None,
            "gesture_rate": "Cannot Analyze",
            "active_gesture_percentage": None,
            "hand_detected_percentage": 0.0,
            "hands_detected": False,
            "movement_events": [],
            "total_gesture_events": 0
        }

    # ========================================================
    # AUDIO PROCESSING
    # ========================================================

    emit_progress(
        "Processing presentation audio...",
        48
    )

    wav_path = audio_path

    if not wav_path:

        wav_path = extract_audio_from_video(
            video_path
        )

    voice_analyzer = VoiceAnalyzer()
    pause_detector = PauseDetector()
    speech_transcriber = SpeechTranscriber()
    filler_detector = FillerWordDetector()

    speech_detected = False

    voice_result = create_no_audio_results()

    pause_result = (
        create_no_speech_pause_result()
    )

    transcription_result = (
        create_no_speech_transcription_result()
    )

    filler_result = (
        create_no_speech_filler_result()
    )

    # ========================================================
    # NO AUDIO
    # ========================================================

    if (
        not wav_path
        or not os.path.exists(wav_path)
    ):

        print(
            "[Audio] No audio file extracted or available.",
            file=sys.stderr
        )

    else:

        print(
            f"[Audio] WAV ready: "
            f"{os.path.getsize(wav_path)} bytes",
            file=sys.stderr
        )

        # ====================================================
        # VOICE ANALYSIS
        # ====================================================

        emit_progress(
            "Detecting vocal energy & speech...",
            52
        )

        try:

            voice_result = (
                voice_analyzer.analyze_wav(
                    wav_path
                )
            )

        except Exception as e:

            print(
                f"[Audio] Voice analysis error: {e}",
                file=sys.stderr
            )

            voice_result = (
                create_no_speech_results()
            )

        speech_detected = bool(
            voice_result.get(
                "speech_detected",
                False
            )
        )

        voice_activity = (
            voice_result.get(
                "voice_activity_percentage"
            )
        )

        try:

            voice_activity_value = float(
                voice_activity
            )

        except (
            TypeError,
            ValueError
        ):

            voice_activity_value = 0.0

        print(
            f"[Audio] Speech detected by VoiceAnalyzer: "
            f"{speech_detected}",
            file=sys.stderr
        )

        print(
            f"[Audio] Voice activity: "
            f"{voice_activity}",
            file=sys.stderr
        )

        # Do not reject valid speech merely because
        # voice activity is below 1%.
        if speech_detected:

            print(
                "[Audio] Speech detected. Continuing audio analysis.",
                file=sys.stderr
            )

        # ====================================================
        # NO SPEECH
        # ====================================================

        if not speech_detected:

            print(
                "[Audio] No speech detected.",
                file=sys.stderr
            )

            voice_result = (
                create_no_speech_results()
            )

            pause_result = (
                create_no_speech_pause_result()
            )

            transcription_result = (
                create_no_speech_transcription_result()
            )

            filler_result = (
                create_no_speech_filler_result()
            )

        # ====================================================
        # SPEECH DETECTED
        # ====================================================

        else:

            # ------------------------------------------------
            # PAUSES
            # ------------------------------------------------

            emit_progress(
                "Analyzing pause structure...",
                58
            )

            try:

                pause_result = (
                    pause_detector.analyze_wav(
                        wav_path
                    )
                )

                pause_result[
                    "speech_detected"
                ] = True

            except Exception as e:

                print(
                    f"[Audio] Pause detector error: {e}",
                    file=sys.stderr
                )

                pause_result = {
                    "score": None,
                    "speech_detected": True,
                    "total_pauses": None,
                    "long_pauses": None,
                    "average_pause_duration": None,
                    "longest_pause": None,
                    "pause_timestamps": [],
                    "pause_details": []
                }

            # ------------------------------------------------
            # TRANSCRIPTION
            # ------------------------------------------------

            emit_progress(
                "Transcribing speech cadence...",
                64
            )

            try:

                transcription_result = (
                    speech_transcriber
                    .transcribe_and_calculate_wpm(
                        wav_path
                    )
                )

                transcription_result[
                    "speech_detected"
                ] = True

            except Exception as e:

                print(
                    f"[Audio] Speech transcription error: {e}",
                    file=sys.stderr
                )

                transcription_result = {
                    "score": None,
                    "wpm": None,
                    "word_count": None,
                    "transcript": "",
                    "pace_category":
                        "Speech Detected but Not Transcribed",
                    "speech_detected": True
                }

            # ------------------------------------------------
            # FILLER WORDS
            # ------------------------------------------------

            emit_progress(
                "Detecting disfluencies and fillers...",
                70
            )

            try:

                transcript_text = (
                    transcription_result.get(
                        "transcript",
                        ""
                    )
                )

                filler_result = (
                    filler_detector.detect(
                        transcript_text,
                        duration=duration,
                        speech_detected=True
                    )
                )

                filler_result[
                    "speech_detected"
                ] = True

            except Exception as e:

                print(
                    f"[Audio] Filler word detector error: {e}",
                    file=sys.stderr
                )

                filler_result = {
                    "score": None,
                    "total_count": None,
                    "rate_per_minute": None,
                    "fluency_category":
                        "Speech Detected but Not Transcribed",
                    "breakdown": {},
                    "instances": [],
                    "speech_detected": True
                }

    # ========================================================
    # COMPILE VISUAL RESULTS
    # ========================================================

    visual_results = {

        "eye_contact":
            eye_analyzer.get_summary(),

        "facial_expression":
            expression_analyzer.get_summary(),

        "head_position":
            head_analyzer.get_summary(),

        "posture":
            posture_analyzer.get_summary(),

        "hand_gestures":
            hand_result,

        "body_movement":
            movement_analyzer.get_summary()
    }

    # ========================================================
    # COMPILE AUDIO RESULTS
    # ========================================================

    audio_results = {

        "voice":
            voice_result,

        "pauses":
            pause_result,

        "transcription":
            transcription_result,

        "speaking_speed":
            transcription_result,

        "filler_words":
            filler_result
    }

    # ========================================================
    # CONFIDENCE SCORE
    # ========================================================

    emit_progress(
        "Computing presentation metrics...",
        78
    )

    try:

        scorer = ConfidenceScorer()

        score_data = (
            scorer.calculate_score(
                visual_results,
                audio_results
            )
        )

    except Exception as e:

        print(
            f"[Score] Confidence scorer error: {e}",
            file=sys.stderr
        )

        score_data = {
            "overall_score": None,
            "performance_level":
                "Analysis Error",
            "badge":
                "Try Again",
            "score_label":
                "Score Unavailable",
            "disclaimer":
                "The presentation could not be scored correctly.",
            "speech_detected":
                speech_detected,
            "individual_scores": {},
            "strengths": [],
            "weaknesses": [
                "The scoring system encountered "
                "an error calculating the presentation score."
            ]
        }

    # ========================================================
    # WEAK SECTIONS
    # ========================================================

    emit_progress(
        "Identifying key coaching opportunities...",
        85
    )

    try:

        weak_detector = WeakSectionDetector()

        weak_section_data = (
            weak_detector.detect_weak_sections(
                visual_results,
                audio_results,
                duration
            )
        )

    except Exception as e:

        print(
            f"[WeakSections] Error: {e}",
            file=sys.stderr
        )

        weak_section_data = []

    # ========================================================
    # FINAL REPORT DATA
    # ========================================================

    emit_progress(
        "Finalizing comprehensive report...",
        95
    )

    individual_scores = score_data.get(
        "individual_scores",
        {}
    )

    strengths = score_data.get(
        "strengths",
        []
    )

    weaknesses = score_data.get(
        "weaknesses",
        []
    )

    # ========================================================
    # VOICE ACTIVITY
    # ========================================================

    if speech_detected:

        voice_activity_percentage = (
            voice_result.get(
                "voice_activity_percentage"
            )
        )

    else:

        voice_activity_percentage = None

    # ========================================================
    # FINAL REPORT
    # ========================================================

    final_report = {

        "overall_score":
            score_data.get(
                "overall_score"
            ),

        "performance_level":
            score_data.get(
                "performance_level",
                "Confidence Not Available"
            ),

        "badge":
            score_data.get(
                "badge",
                "Record Again"
            ),

        "score_label":
            score_data.get(
                "score_label",
                "Confidence Not Available"
            ),

        "disclaimer":
            score_data.get(
                "disclaimer",
                (
                    "The confidence estimate uses only "
                    "observable presentation behaviors "
                    "that could be analyzed."
                )
            ),

        "speech_detected":
            speech_detected,

        "voice_activity_percentage":
            voice_activity_percentage,

        "individual_scores":
            individual_scores,

        "visual_metrics":
            visual_results,

        "audio_metrics":
            audio_results,

        "strengths":
            strengths,

        "weaknesses":
            weaknesses,

        "weak_sections":
            weak_section_data,

        "timeline":
            [],

        "duration":
            duration,

        "fps":
            fps,

        "frames_analyzed":
            analyzed_frames,

        "analyzed_at":
            time.strftime(
                "%Y-%m-%dT%H:%M:%S"
            ),

        "analysis_duration_seconds":
            time.time() - start_time
    }

    # ========================================================
    # COMPLETE
    # ========================================================

    emit_progress(
        "Analysis completed",
        100
    )

    print(
        f"[Analyzer] Speech detected: "
        f"{speech_detected}",
        file=sys.stderr
    )

    print(
        f"[Analyzer] Overall score: "
        f"{final_report['overall_score']}",
        file=sys.stderr
    )

    # ========================================================
    # NODE.JS JSON OUTPUT
    # ========================================================

    print(
        "__JSON_START__",
        flush=True
    )

    print(
        json.dumps(
            final_report,
            ensure_ascii=False
        ),
        flush=True
    )

    print(
        "__JSON_END__",
        flush=True
    )

    return final_report


# ============================================================
# CLI
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="AI Confidence Analyzer"
    )

    parser.add_argument(
        "--video",
        required=True,
        help="Path to video file"
    )

    parser.add_argument(
        "--audio",
        required=False,
        default=None,
        help="Optional path to audio file"
    )

    parser.add_argument(
        "--mode",
        required=False,
        default="full",
        help="Analysis mode"
    )

    args = parser.parse_args()

    try:

        analyze_presentation(
            video_path=args.video,
            audio_path=args.audio,
            mode=args.mode
        )

    except Exception as e:

        print(
            f"[Analyzer] ERROR: {e}",
            file=sys.stderr
        )

        error_report = {

            "overall_score": None,

            "performance_level":
                "Analysis Failed",

            "badge":
                "Try Again",

            "score_label":
                "Score Unavailable",

            "disclaimer":
                "The presentation could not be analyzed.",

            "speech_detected":
                False,

            "individual_scores":
                {},

            "visual_metrics":
                {},

            "audio_metrics":
                {},

            "strengths":
                [],

            "weaknesses":
                [str(e)],

            "weak_sections":
                [],

            "timeline":
                []
        }

        print(
            "__JSON_START__",
            flush=True
        )

        print(
            json.dumps(
                error_report,
                ensure_ascii=False
            ),
            flush=True
        )

        print(
            "__JSON_END__",
            flush=True
        )

        sys.exit(1)


if __name__ == "__main__":
    main()