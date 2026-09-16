import os
import wave
import numpy as np


class VoiceAnalyzer:
    """
    Detects actual speech activity from WAV audio.

    The analyzer tries to separate speech from:
    - silence
    - low-level background noise
    - microphone noise

    When speech is not reliably detected:
    speech_detected = False
    score = None
    voice_activity_percentage = None
    """

    def __init__(self):
        pass

    def analyze_wav(self, wav_path):

        if not wav_path or not os.path.exists(wav_path):
            return self._no_speech_result()

        try:

            # -----------------------------------------------------
            # READ WAV
            # -----------------------------------------------------

            with wave.open(wav_path, "rb") as wf:

                channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
                sample_rate = wf.getframerate()
                frame_count = wf.getnframes()

                raw_data = wf.readframes(frame_count)

            if frame_count == 0 or sample_rate <= 0:
                return self._no_speech_result()

            # -----------------------------------------------------
            # CONVERT AUDIO TO NUMPY
            # -----------------------------------------------------

            if sample_width == 2:
                dtype = np.int16

            elif sample_width == 4:
                dtype = np.int32

            else:
                dtype = np.uint8

            audio = np.frombuffer(
                raw_data,
                dtype=dtype
            )

            if len(audio) == 0:
                return self._no_speech_result()

            # Stereo -> mono

            if channels > 1:

                audio = audio[:len(audio) - (len(audio) % channels)]

                audio = audio.reshape(
                    -1,
                    channels
                ).mean(axis=1)

            audio = audio.astype(np.float32)

            # -----------------------------------------------------
            # NORMALIZE
            # -----------------------------------------------------

            if dtype == np.uint8:

                audio = (
                    audio - 128.0
                ) / 128.0

            else:

                max_value = float(
                    np.iinfo(dtype).max
                )

                if max_value <= 0:
                    return self._no_speech_result()

                audio = audio / max_value

            duration = len(audio) / float(sample_rate)

            if duration <= 0.2:
                return self._no_speech_result()

            # -----------------------------------------------------
            # FRAME ANALYSIS
            # -----------------------------------------------------

            frame_duration = 0.05
            frame_size = max(
                1,
                int(sample_rate * frame_duration)
            )

            rms_values = []
            zero_crossing_values = []
            timestamps = []

            for start in range(
                0,
                len(audio) - frame_size + 1,
                frame_size
            ):

                frame = audio[
                    start:start + frame_size
                ]

                if len(frame) == 0:
                    continue

                # RMS energy

                rms = float(
                    np.sqrt(
                        np.mean(frame * frame)
                    )
                )

                rms_values.append(rms)

                # Zero crossing rate

                signs = np.sign(frame)

                crossings = np.sum(
                    signs[:-1] != signs[1:]
                )

                zcr = (
                    crossings
                    / max(1, len(frame) - 1)
                )

                zero_crossing_values.append(
                    float(zcr)
                )

                timestamps.append(
                    start / float(sample_rate)
                )

            if not rms_values:
                return self._no_speech_result()

            rms = np.array(
                rms_values,
                dtype=np.float32
            )

            zcr = np.array(
                zero_crossing_values,
                dtype=np.float32
            )

            # -----------------------------------------------------
            # ESTIMATE BACKGROUND NOISE
            # -----------------------------------------------------

            sorted_rms = np.sort(rms)

            bottom_count = max(
                1,
                int(len(sorted_rms) * 0.25)
            )

            noise_level = float(
                np.mean(
                    sorted_rms[:bottom_count]
                )
            )

            # -----------------------------------------------------
            # SPEECH ENERGY THRESHOLD
            # -----------------------------------------------------

            # Absolute minimum.
            absolute_threshold = 0.025

            # Dynamic threshold based on background noise.

            dynamic_threshold = (
                noise_level * 3.0
            )

            energy_threshold = max(
                absolute_threshold,
                dynamic_threshold
            )

            # -----------------------------------------------------
            # INITIAL SPEECH CANDIDATES
            # -----------------------------------------------------

            energy_active = (
                rms > energy_threshold
            )

            # -----------------------------------------------------
            # ZERO CROSSING FILTER
            # -----------------------------------------------------

            # Very unusual extremely high-frequency noise
            # should not automatically count as speech.

            zcr_reasonable = (
                zcr < 0.45
            )

            speech_candidates = (
                energy_active
                & zcr_reasonable
            )

            # -----------------------------------------------------
            # REMOVE VERY SHORT NOISE BURSTS
            # -----------------------------------------------------

            cleaned = np.zeros(
                len(speech_candidates),
                dtype=bool
            )

            minimum_active_frames = 4

            start = None

            for i, active in enumerate(
                speech_candidates
            ):

                if active and start is None:

                    start = i

                elif not active and start is not None:

                    length = i - start

                    if length >= minimum_active_frames:

                        cleaned[
                            start:i
                        ] = True

                    start = None

            # Handle final active section

            if start is not None:

                length = (
                    len(speech_candidates)
                    - start
                )

                if length >= minimum_active_frames:

                    cleaned[
                        start:
                    ] = True

            # -----------------------------------------------------
            # FILL VERY SMALL GAPS
            # -----------------------------------------------------

            speech_active = cleaned.copy()

            max_gap_frames = 3

            i = 0

            while i < len(speech_active):

                if speech_active[i]:

                    i += 1
                    continue

                gap_start = i

                while (
                    i < len(speech_active)
                    and not speech_active[i]
                ):
                    i += 1

                gap_end = i
                gap_length = (
                    gap_end - gap_start
                )

                before = (
                    gap_start > 0
                    and speech_active[
                        gap_start - 1
                    ]
                )

                after = (
                    gap_end < len(speech_active)
                    and speech_active[
                        gap_end
                    ]
                )

                if (
                    before
                    and after
                    and gap_length <= max_gap_frames
                ):

                    speech_active[
                        gap_start:gap_end
                    ] = True

            # -----------------------------------------------------
            # SPEECH ACTIVITY
            # -----------------------------------------------------

            speech_frame_count = int(
                np.sum(speech_active)
            )

            total_frames = len(speech_active)

            speech_percentage = (
                speech_frame_count
                / max(1, total_frames)
            ) * 100.0

            # -----------------------------------------------------
            # IMPORTANT SPEECH DECISION
            # -----------------------------------------------------

            # Require a meaningful amount of detected speech.
            #
            # This prevents a few random noise bursts from
            # turning the entire recording into "speech".

            speech_duration = (
                speech_frame_count
                * frame_duration
            )

            minimum_speech_duration = 0.75

            speech_detected = (
                speech_duration
                >= minimum_speech_duration
            )

            # Also require multiple separated active frames.

            if speech_frame_count < 15:
                speech_detected = False

            # -----------------------------------------------------
            # NO SPEECH
            # -----------------------------------------------------

            if not speech_detected:

                return {
                    "score": None,
                    "speech_detected": False,
                    "voice_activity_percentage": None,
                    "volume_consistency": "No Speech Detected",
                    "feedback": (
                        "No reliable speech was detected "
                        "in the recording."
                    ),
                    "duration": round(
                        duration,
                        2
                    ),
                    "speech_duration": 0.0,
                    "energy_profile": []
                }

            # -----------------------------------------------------
            # SPEECH ENERGY
            # -----------------------------------------------------

            speech_rms = rms[
                speech_active
            ]

            if len(speech_rms) == 0:
                return self._no_speech_result()

            max_speech_rms = (
                float(
                    np.max(speech_rms)
                )
                + 1e-6
            )

            normalized = (
                speech_rms
                / max_speech_rms
            )

            volume_std = float(
                np.std(normalized)
            )

            consistency_score = (
                100.0
                - (
                    volume_std
                    * 120.0
                )
            )

            consistency_score = max(
                40.0,
                min(
                    100.0,
                    consistency_score
                )
            )

            if volume_std < 0.15:

                consistency_label = (
                    "Very Consistent"
                )

            elif volume_std < 0.28:

                consistency_label = (
                    "Moderate Consistency"
                )

            else:

                consistency_label = (
                    "Fluctuating Volume"
                )

            # -----------------------------------------------------
            # VOICE FEEDBACK
            # -----------------------------------------------------

            feedback = (
                "Voice projection was clear "
                "and well detected."
            )

            # Compare first/middle/last sections.

            third = len(rms) // 3

            if third >= 3:

                first = float(
                    np.mean(
                        rms[:third]
                    )
                )

                middle = float(
                    np.mean(
                        rms[
                            third:third * 2
                        ]
                    )
                )

                last = float(
                    np.mean(
                        rms[
                            third * 2:
                        ]
                    )
                )

                if (
                    middle
                    < first * 0.65
                ):

                    feedback = (
                        "Voice volume dipped "
                        "noticeably during the "
                        "middle section."
                    )

                elif (
                    last
                    < first * 0.60
                ):

                    feedback = (
                        "Voice projection "
                        "decreased toward the "
                        "end of the presentation."
                    )

            # -----------------------------------------------------
            # VOICE SCORE
            # -----------------------------------------------------

            voice_score = (
                consistency_score * 0.70
                + min(
                    speech_percentage,
                    85.0
                ) * 0.30
            )

            voice_score = max(
                0.0,
                min(
                    100.0,
                    voice_score
                )
            )

            # -----------------------------------------------------
            # ENERGY PROFILE
            # -----------------------------------------------------

            step = max(
                1,
                len(rms) // 50
            )

            energy_profile = []

            for i in range(
                0,
                len(rms),
                step
            ):

                energy = (
                    float(
                        rms[i]
                        / max_speech_rms
                    )
                    * 100.0
                )

                energy_profile.append({
                    "timestamp": round(
                        timestamps[i],
                        2
                    ),
                    "energy": round(
                        min(
                            100.0,
                            energy
                        ),
                        1
                    ),
                    "speech_active": bool(
                        speech_active[i]
                    )
                })

            # -----------------------------------------------------
            # FINAL RESULT
            # -----------------------------------------------------

            return {
                "score": round(
                    voice_score,
                    1
                ),
                "speech_detected": True,
                "voice_activity_percentage": round(
                    speech_percentage,
                    1
                ),
                "volume_consistency": consistency_label,
                "feedback": feedback,
                "duration": round(
                    duration,
                    2
                ),
                "speech_duration": round(
                    speech_duration,
                    2
                ),
                "energy_profile": energy_profile
            }

        except Exception as e:

            print(
                f"[VoiceAnalyzer] Error: {e}"
            )

            return self._no_speech_result()

    def _no_speech_result(self):

        return {
            "score": None,
            "speech_detected": False,
            "voice_activity_percentage": None,
            "volume_consistency": "No Speech Detected",
            "feedback": (
                "No reliable speech was detected "
                "in the recording."
            ),
            "duration": 0.0,
            "speech_duration": 0.0,
            "energy_profile": []
        }