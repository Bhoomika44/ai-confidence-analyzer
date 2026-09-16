import re


class FillerWordDetector:
    """
    Detects common filler words from an actual speech transcript.

    Important:
    - No speech -> No Speech Detected
    - Speech detected + no fillers -> 0 filler words
    - Speech detected + fillers -> actual filler count
    """

    COMMON_FILLERS = [
        "um",
        "uh",
        "er",
        "ah",
        "hmm",
        "like",
        "you know",
        "basically",
        "actually",
        "literally",
        "sort of",
        "kind of",
        "i mean",
        "right"
    ]

    def __init__(self):
        pass

    def detect(
        self,
        transcript_text,
        duration=30.0,
        speech_detected=None
    ):

        # ---------------------------------------------------------
        # NO SPEECH
        # ---------------------------------------------------------

        if speech_detected is False:

            return self._no_speech_result()

        # ---------------------------------------------------------
        # EMPTY TRANSCRIPT
        # ---------------------------------------------------------

        if (
            transcript_text is None
            or not str(transcript_text).strip()
        ):

            # If the caller explicitly says speech exists,
            # we know speech happened but transcription failed.

            if speech_detected is True:

                return {
                    "score": None,
                    "total_count": None,
                    "rate_per_minute": None,
                    "fluency_category": (
                        "Speech Detected but Not Transcribed"
                    ),
                    "breakdown": {},
                    "instances": [],
                    "speech_detected": True
                }

            return self._no_speech_result()

        text_lower = str(
            transcript_text
        ).lower()

        # ---------------------------------------------------------
        # NORMALIZE TEXT
        # ---------------------------------------------------------

        words = re.findall(
            r"\b[\w']+\b",
            text_lower
        )

        if not words:

            if speech_detected is True:

                return {
                    "score": None,
                    "total_count": None,
                    "rate_per_minute": None,
                    "fluency_category": (
                        "Speech Detected but Not Transcribed"
                    ),
                    "breakdown": {},
                    "instances": [],
                    "speech_detected": True
                }

            return self._no_speech_result()

        # ---------------------------------------------------------
        # FILLER DETECTION
        # ---------------------------------------------------------

        filler_instances = []
        filler_counts = {}

        # ---------------------------------------------------------
        # MULTI-WORD FILLERS
        # ---------------------------------------------------------

        multi_fillers = [
            "you know",
            "sort of",
            "kind of",
            "i mean"
        ]

        for phrase in multi_fillers:

            pattern = (
                r"\b"
                + re.escape(phrase)
                + r"\b"
            )

            for match in re.finditer(
                pattern,
                text_lower
            ):

                position_ratio = (
                    match.start()
                    / max(
                        1,
                        len(text_lower)
                    )
                )

                approx_time = round(
                    position_ratio
                    * float(duration),
                    1
                )

                filler_instances.append({
                    "word": phrase,
                    "timestamp": approx_time,
                    "type": "phrase"
                })

                filler_counts[phrase] = (
                    filler_counts.get(
                        phrase,
                        0
                    )
                    + 1
                )

        # ---------------------------------------------------------
        # SINGLE-WORD FILLERS
        # ---------------------------------------------------------

        single_fillers = [
            "um",
            "uh",
            "er",
            "ah",
            "hmm",
            "like",
            "basically",
            "actually",
            "literally",
            "right"
        ]

        for word in single_fillers:

            pattern = (
                r"\b"
                + re.escape(word)
                + r"\b"
            )

            for match in re.finditer(
                pattern,
                text_lower
            ):

                position_ratio = (
                    match.start()
                    / max(
                        1,
                        len(text_lower)
                    )
                )

                approx_time = round(
                    position_ratio
                    * float(duration),
                    1
                )

                filler_instances.append({
                    "word": word,
                    "timestamp": approx_time,
                    "type": "single"
                })

                filler_counts[word] = (
                    filler_counts.get(
                        word,
                        0
                    )
                    + 1
                )

        # ---------------------------------------------------------
        # SORT BY TIME
        # ---------------------------------------------------------

        filler_instances.sort(
            key=lambda item: item["timestamp"]
        )

        total_filler_count = len(
            filler_instances
        )

        # ---------------------------------------------------------
        # ZERO FILLERS
        # ---------------------------------------------------------

        if total_filler_count == 0:

            return {
                "score": 100.0,
                "total_count": 0,
                "rate_per_minute": 0.0,
                "fluency_category": (
                    "No Filler Words Detected"
                ),
                "breakdown": {},
                "instances": [],
                "speech_detected": True
            }

        # ---------------------------------------------------------
        # FILLER RATE
        # ---------------------------------------------------------

        safe_duration = max(
            1.0,
            float(duration)
        )

        minutes = max(
            0.1,
            safe_duration / 60.0
        )

        rate_per_min = (
            total_filler_count
            / minutes
        )

        # ---------------------------------------------------------
        # FILLER SCORE
        # ---------------------------------------------------------

        if rate_per_min <= 1.0:

            score = max(
                90.0,
                100.0
                - (
                    rate_per_min
                    * 10.0
                )
            )

            fluency = (
                "Very Few Filler Words"
            )

        elif rate_per_min <= 4.0:

            score = max(
                70.0,
                90.0
                - (
                    (rate_per_min - 1.0)
                    * 6.5
                )
            )

            fluency = (
                "Moderate Filler Usage"
            )

        else:

            score = max(
                35.0,
                70.0
                - (
                    (rate_per_min - 4.0)
                    * 5.0
                )
            )

            fluency = (
                "Frequent Filler Words"
            )

        # ---------------------------------------------------------
        # RESULT
        # ---------------------------------------------------------

        return {
            "score": round(
                score,
                1
            ),
            "total_count": total_filler_count,
            "rate_per_minute": round(
                rate_per_min,
                1
            ),
            "fluency_category": fluency,
            "breakdown": filler_counts,
            "instances": filler_instances,
            "speech_detected": True
        }

    def _no_speech_result(self):

        return {
            "score": None,
            "total_count": None,
            "rate_per_minute": None,
            "fluency_category": "No Speech Detected",
            "breakdown": {},
            "instances": [],
            "speech_detected": False
        }