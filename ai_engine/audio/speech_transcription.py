import os
import re
import wave

import numpy as np
import speech_recognition as sr


class SpeechTranscriber:
    """
    Detects speech sections and calculates speaking speed.

    Only audio sections that pass speech-activity detection
    are sent to speech recognition.

    No speech:
        score = None
        wpm = None
        word_count = None
        speech_detected = False
    """

    def __init__(self):
        self.recognizer = sr.Recognizer()

    def transcribe_and_calculate_wpm(self, wav_path):

        if not wav_path or not os.path.exists(wav_path):
            return self._no_speech_result()

        try:

            # -------------------------------------------------
            # READ WAV FILE
            # -------------------------------------------------

            with wave.open(wav_path, "rb") as wf:

                channels = wf.getnchannels()
                sample_width = wf.getsampwidth()
                sample_rate = wf.getframerate()
                frame_count = wf.getnframes()

                raw_data = wf.readframes(frame_count)

            if frame_count == 0 or sample_rate <= 0:
                return self._no_speech_result()

            # -------------------------------------------------
            # CONVERT TO NUMPY
            # -------------------------------------------------

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

                usable_length = (
                    len(audio)
                    - (len(audio) % channels)
                )

                audio = audio[:usable_length]

                audio = audio.reshape(
                    -1,
                    channels
                ).mean(axis=1)

            audio = audio.astype(np.float32)

            # -------------------------------------------------
            # NORMALIZE
            # -------------------------------------------------

            if dtype == np.uint8:

                audio = (
                    audio - 128.0
                ) / 128.0

            else:

                max_value = float(
                    np.iinfo(dtype).max
                )

                audio = audio / (
                    max_value + 1e-6
                )

            duration = (
                len(audio)
                / float(sample_rate)
            )

            if duration < 0.5:
                return self._no_speech_result(
                    duration
                )

            # -------------------------------------------------
            # CREATE 50ms AUDIO FRAMES
            # -------------------------------------------------

            frame_duration = 0.05

            frame_size = max(
                1,
                int(
                    sample_rate
                    * frame_duration
                )
            )

            rms_values = []
            zcr_values = []

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

                rms = float(
                    np.sqrt(
                        np.mean(
                            frame * frame
                        )
                    )
                )

                rms_values.append(rms)

                # Zero crossing rate

                crossings = np.sum(
                    np.sign(frame[:-1])
                    != np.sign(frame[1:])
                )

                zcr = (
                    crossings
                    / max(
                        1,
                        len(frame) - 1
                    )
                )

                zcr_values.append(
                    float(zcr)
                )

            if not rms_values:
                return self._no_speech_result(
                    duration
                )

            rms = np.array(
                rms_values,
                dtype=np.float32
            )

            zcr = np.array(
                zcr_values,
                dtype=np.float32
            )

            # -------------------------------------------------
            # ESTIMATE BACKGROUND NOISE
            # -------------------------------------------------

            sorted_rms = np.sort(rms)

            noise_count = max(
                1,
                int(
                    len(sorted_rms) * 0.25
                )
            )

            noise_level = float(
                np.mean(
                    sorted_rms[
                        :noise_count
                    ]
                )
            )

            # -------------------------------------------------
            # SPEECH THRESHOLD
            # -------------------------------------------------

            absolute_threshold = 0.025

            dynamic_threshold = (
                noise_level * 3.0
            )

            energy_threshold = max(
                absolute_threshold,
                dynamic_threshold
            )

            energy_active = (
                rms > energy_threshold
            )

            # Reject extremely high-frequency noise

            zcr_reasonable = (
                zcr < 0.45
            )

            candidates = (
                energy_active
                & zcr_reasonable
            )

            # -------------------------------------------------
            # REMOVE SHORT NOISE BURSTS
            # -------------------------------------------------

            speech_active = np.zeros(
                len(candidates),
                dtype=bool
            )

            minimum_active_frames = 4

            start_index = None

            for i, active in enumerate(
                candidates
            ):

                if active:

                    if start_index is None:
                        start_index = i

                else:

                    if start_index is not None:

                        section_length = (
                            i - start_index
                        )

                        if (
                            section_length
                            >= minimum_active_frames
                        ):

                            speech_active[
                                start_index:i
                            ] = True

                        start_index = None

            # Handle final section

            if start_index is not None:

                section_length = (
                    len(candidates)
                    - start_index
                )

                if (
                    section_length
                    >= minimum_active_frames
                ):

                    speech_active[
                        start_index:
                    ] = True

            # -------------------------------------------------
            # FILL VERY SMALL GAPS
            # -------------------------------------------------

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
                    gap_end
                    - gap_start
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
                    and gap_length
                    <= max_gap_frames
                ):

                    speech_active[
                        gap_start:gap_end
                    ] = True

            # -------------------------------------------------
            # CHECK WHETHER SPEECH EXISTS
            # -------------------------------------------------

            active_frame_count = int(
                np.sum(speech_active)
            )

            speech_duration = (
                active_frame_count
                * frame_duration
            )

            # Require at least 0.75 seconds
            # of detected speech.

            speech_detected = (
                speech_duration >= 0.75
            )

            if active_frame_count < 15:
                speech_detected = False

            if not speech_detected:

                return self._no_speech_result(
                    duration
                )

            # -------------------------------------------------
            # FIND CONTINUOUS SPEECH SEGMENTS
            # -------------------------------------------------

            segments = []

            start_index = None

            for i, active in enumerate(
                speech_active
            ):

                if active:

                    if start_index is None:
                        start_index = i

                else:

                    if start_index is not None:

                        start_time = (
                            start_index
                            * frame_duration
                        )

                        end_time = (
                            i
                            * frame_duration
                        )

                        segment_length = (
                            end_time
                            - start_time
                        )

                        if segment_length >= 0.25:

                            segments.append({
                                "start": round(
                                    start_time,
                                    2
                                ),
                                "end": round(
                                    end_time,
                                    2
                                )
                            })

                        start_index = None

            # Handle final segment

            if start_index is not None:

                start_time = (
                    start_index
                    * frame_duration
                )

                end_time = (
                    len(speech_active)
                    * frame_duration
                )

                segment_length = (
                    end_time
                    - start_time
                )

                if segment_length >= 0.25:

                    segments.append({
                        "start": round(
                            start_time,
                            2
                        ),
                        "end": round(
                            end_time,
                            2
                        )
                    })

            if not segments:

                return self._no_speech_result(
                    duration
                )

            # -------------------------------------------------
            # TRANSCRIBE ONLY SPEECH SEGMENTS
            # -------------------------------------------------

            transcript_parts = []

            recognized_segments = []

            try:

                with sr.AudioFile(
                    wav_path
                ) as source:

                    for segment in segments:

                        start_time = segment[
                            "start"
                        ]

                        end_time = segment[
                            "end"
                        ]

                        segment_duration = (
                            end_time
                            - start_time
                        )

                        if segment_duration < 0.25:
                            continue

                        try:

                            audio_data = (
                                self.recognizer.record(
                                    source,
                                    offset=start_time,
                                    duration=segment_duration
                                )
                            )

                            try:

                                text = (
                                    self.recognizer
                                    .recognize_google(
                                        audio_data
                                    )
                                )

                            except (
                                sr.UnknownValueError,
                                sr.RequestError
                            ):

                                text = ""

                            if text and text.strip():

                                text = text.strip()

                                transcript_parts.append(
                                    text
                                )

                                recognized_segments.append({
                                    "start": start_time,
                                    "end": end_time,
                                    "text": text
                                })

                        except Exception:
                            continue

            except Exception:
                pass

            # -------------------------------------------------
            # BUILD TRANSCRIPT
            # -------------------------------------------------

            transcript_text = " ".join(
                transcript_parts
            ).strip()

            # -------------------------------------------------
            # NO RECOGNIZED SPEECH
            # -------------------------------------------------

            if not transcript_text:

                return {
                    "score": None,
                    "wpm": None,
                    "word_count": None,
                    "pace_category": "Speech Detected but Not Transcribed",
                    "transcript": "",
                    "duration": round(
                        duration,
                        2
                    ),
                    "speech_duration": round(
                        speech_duration,
                        2
                    ),
                    "speech_detected": True,
                    "segments": []
                }

            # -------------------------------------------------
            # COUNT WORDS
            # -------------------------------------------------

            words = re.findall(
                r"\b[\w']+\b",
                transcript_text
            )

            word_count = len(words)

            if word_count == 0:

                return {
                    "score": None,
                    "wpm": None,
                    "word_count": None,
                    "pace_category": "Speech Detected but Not Transcribed",
                    "transcript": transcript_text,
                    "duration": round(
                        duration,
                        2
                    ),
                    "speech_duration": round(
                        speech_duration,
                        2
                    ),
                    "speech_detected": True,
                    "segments": []
                }

            # -------------------------------------------------
            # CALCULATE WPM
            # -------------------------------------------------

            speech_minutes = (
                speech_duration / 60.0
            )

            speech_minutes = max(
                0.1,
                speech_minutes
            )

            wpm = round(
                word_count
                / speech_minutes,
                1
            )

            # -------------------------------------------------
            # SPEAKING PACE SCORE
            # -------------------------------------------------

            if 130 <= wpm <= 155:

                distance = abs(
                    wpm - 142.5
                )

                score = (
                    100.0
                    - min(
                        10.0,
                        distance * 0.25
                    )
                )

                pace_category = (
                    "Optimal Speaking Pace"
                )

            elif wpm > 155:

                penalty = min(
                    55.0,
                    (wpm - 155.0) * 1.2
                )

                score = max(
                    35.0,
                    90.0 - penalty
                )

                pace_category = (
                    "Fast Pace — Consider Slowing Down"
                )

            else:

                penalty = min(
                    55.0,
                    (130.0 - wpm) * 0.8
                )

                score = max(
                    35.0,
                    90.0 - penalty
                )

                pace_category = (
                    "Slow Pace — Aim for More Energy"
                )

            # -------------------------------------------------
            # SEGMENT WPM
            # -------------------------------------------------

            output_segments = []

            for segment in recognized_segments:

                segment_words = re.findall(
                    r"\b[\w']+\b",
                    segment["text"]
                )

                segment_word_count = len(
                    segment_words
                )

                segment_duration = (
                    segment["end"]
                    - segment["start"]
                )

                if (
                    segment_word_count > 0
                    and segment_duration > 0
                ):

                    segment_wpm = round(
                        segment_word_count
                        / (
                            segment_duration
                            / 60.0
                        ),
                        1
                    )

                else:

                    segment_wpm = None

                if segment_wpm is None:

                    status = "Not Available"

                elif segment_wpm > 165:

                    status = "Fast"

                elif segment_wpm < 115:

                    status = "Slow"

                else:

                    status = "Optimal"

                output_segments.append({
                    "start": segment["start"],
                    "end": segment["end"],
                    "wpm": segment_wpm,
                    "status": status
                })

            # -------------------------------------------------
            # FINAL RESULT
            # -------------------------------------------------

            return {
                "score": round(
                    score,
                    1
                ),
                "wpm": wpm,
                "word_count": word_count,
                "pace_category": pace_category,
                "transcript": transcript_text,
                "duration": round(
                    duration,
                    2
                ),
                "speech_duration": round(
                    speech_duration,
                    2
                ),
                "speech_detected": True,
                "segments": output_segments
            }

        except Exception as e:

            print(
                f"[SpeechTranscriber] Error: {e}"
            )

            return self._no_speech_result()

    def _no_speech_result(
        self,
        duration=0.0
    ):

        return {
            "score": None,
            "wpm": None,
            "word_count": None,
            "pace_category": "No Speech Detected",
            "transcript": "",
            "duration": round(
                duration,
                2
            ),
            "speech_duration": 0.0,
            "speech_detected": False,
            "segments": []
        }