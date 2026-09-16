class ConfidenceScorer:
    """
    Computes overall presentation performance score.

    The score is calculated only when speech is detected.
    A completely silent recording does not receive a confidence score.
    """

    DEFAULT_WEIGHTS = {
        "eye_contact": 0.15,
        "facial_expression": 0.10,
        "head_position": 0.10,
        "posture": 0.12,
        "hand_gestures": 0.10,
        "body_movement": 0.08,
        "voice": 0.12,
        "speaking_speed": 0.13,
        "pauses": 0.10,
        "filler_words": 0.10
    }

    def __init__(self, custom_weights=None):
        self.weights = custom_weights or self.DEFAULT_WEIGHTS

        total = sum(self.weights.values())

        if total > 0:
            self.weights = {
                key: value / total
                for key, value in self.weights.items()
            }

    def calculate_score(self, visual_results, audio_results):

        # ---------------------------------------------------------
        # CHECK WHETHER SPEECH WAS DETECTED
        # ---------------------------------------------------------

        voice_data = audio_results.get("voice", {})

        speech_detected = voice_data.get(
            "speech_detected",
            False
        )

        voice_activity = voice_data.get(
            "voice_activity_percentage",
            0
        )

        if not speech_detected or voice_activity < 1.0:
            return {
                "overall_score": None,
                "performance_level": "No Speech Detected",
                "badge": "Record Again",
                "score_label": "Confidence Not Available",
                "disclaimer": (
                    "A confidence score cannot be calculated "
                    "because no speech was detected."
                ),
                "speech_detected": False,
                "individual_scores": {},
                "strengths": [],
                "weaknesses": [
                    "No speech was detected in the recording. "
                    "Please record again with your microphone enabled."
                ]
            }

        # ---------------------------------------------------------
        # GET REAL SCORES
        # ---------------------------------------------------------

        scores = {
            "eye_contact": self._get_score(
                visual_results, "eye_contact"
            ),

            "facial_expression": self._get_score(
                visual_results, "facial_expression"
            ),

            "head_position": self._get_score(
                visual_results, "head_position"
            ),

            "posture": self._get_score(
                visual_results, "posture"
            ),

            "hand_gestures": self._get_score(
                visual_results, "hand_gestures"
            ),

            "body_movement": self._get_score(
                visual_results, "body_movement"
            ),

            "voice": self._get_score(
                audio_results, "voice"
            ),

            "speaking_speed": self._get_score(
                audio_results, "speaking_speed"
            ),

            "pauses": self._get_score(
                audio_results, "pauses"
            ),

            "filler_words": self._get_score(
                audio_results, "filler_words"
            )
        }

        # ---------------------------------------------------------
        # CALCULATE WEIGHTED SCORE
        # ---------------------------------------------------------

        valid_scores = {}
        valid_weights = {}

        for key in scores:
            if scores[key] is not None:
                valid_scores[key] = scores[key]
                valid_weights[key] = self.weights.get(key, 0)

        total_weight = sum(valid_weights.values())

        if total_weight <= 0:
            return {
                "overall_score": None,
                "performance_level": "Insufficient Data",
                "badge": "Record Again",
                "score_label": "Confidence Not Available",
                "disclaimer": (
                    "There was not enough valid speech data "
                    "to calculate presentation confidence."
                ),
                "speech_detected": False,
                "individual_scores": {},
                "strengths": [],
                "weaknesses": [
                    "Not enough valid speech data was available."
                ]
            }

        overall_score = sum(
            valid_scores[key] *
            (valid_weights[key] / total_weight)
            for key in valid_scores
        )

        overall_score = round(
            min(100.0, max(0.0, overall_score)),
            1
        )

        # ---------------------------------------------------------
        # PERFORMANCE LEVEL
        # ---------------------------------------------------------

        if overall_score >= 88.0:
            level = "Distinguished / Excellent"
            badge = "Executive Presenter"

        elif overall_score >= 78.0:
            level = "Strong / Confident"
            badge = "Confident Speaker"

        elif overall_score >= 65.0:
            level = "Proficient / Moderate"
            badge = "Developing Speaker"

        else:
            level = "Needs Focused Practice"
            badge = "Foundational"

        strengths, weaknesses = self._generate_strengths_weaknesses(
            scores,
            visual_results,
            audio_results
        )

        return {
            "overall_score": overall_score,
            "performance_level": level,
            "badge": badge,
            "score_label": "Estimated Presentation Confidence",
            "disclaimer": (
                "This score represents observable presentation "
                "delivery behaviors and does not assess psychological, "
                "medical, or cognitive conditions."
            ),
            "speech_detected": True,
            "individual_scores": {
                key: round(value, 1)
                for key, value in scores.items()
                if value is not None
            },
            "strengths": strengths,
            "weaknesses": weaknesses
        }

    def _get_score(self, results, key):
        data = results.get(key, {})

        if not isinstance(data, dict):
            return None

        score = data.get("score")

        if score is None:
            return None

        try:
            return float(score)
        except (TypeError, ValueError):
            return None

    def _generate_strengths_weaknesses(
        self,
        scores,
        visual_results,
        audio_results
    ):
        strengths = []
        weaknesses = []

        # Eye contact
        if scores.get("eye_contact") is not None:
            if scores["eye_contact"] >= 78.0:
                strengths.append(
                    "High direct eye contact with the camera/audience, "
                    "creating strong engagement."
                )
            elif scores["eye_contact"] < 65.0:
                weaknesses.append(
                    "Frequent drops in eye contact; consider focusing "
                    "your gaze closer to the lens."
                )

        # Posture
        if scores.get("posture") is not None:
            if scores["posture"] >= 80.0:
                strengths.append(
                    "Upright, stable posture with balanced "
                    "shoulder alignment."
                )
            elif scores["posture"] < 68.0:
                weaknesses.append(
                    "Occasional slouching or leaning observed; "
                    "keep your shoulders level."
                )

        # Speaking speed
        wpm = audio_results.get(
            "speaking_speed", {}
        ).get("wpm")

        if wpm is not None:
            if 130 <= wpm <= 155:
                strengths.append(
                    f"Ideal speaking cadence at an average of {wpm} WPM."
                )
            elif wpm > 165:
                weaknesses.append(
                    f"Speaking pace was hurried ({wpm} WPM); "
                    "aim to slow down."
                )
            elif wpm < 115:
                weaknesses.append(
                    f"Speaking pace was slow ({wpm} WPM); "
                    "add dynamic pacing and energy."
                )

        # Filler words
        filler_count = audio_results.get(
            "filler_words", {}
        ).get("total_count")

        if filler_count is not None:
            if filler_count <= 2:
                strengths.append(
                    "Minimal use of filler words, "
                    "demonstrating articulate delivery."
                )
            elif filler_count >= 5:
                weaknesses.append(
                    f"Detected {filler_count} filler words; "
                    "replace them with deliberate silent pauses."
                )

        # Voice
        if scores.get("voice") is not None:
            if scores["voice"] >= 80.0:
                strengths.append(
                    "Consistent voice volume and vocal projection."
                )
            elif scores["voice"] < 68.0:
                weaknesses.append(
                    audio_results.get("voice", {}).get(
                        "feedback",
                        "Voice volume fluctuated during delivery."
                    )
                )

        # Head position
        if scores.get("head_position") is not None:
            if scores["head_position"] >= 80.0:
                strengths.append(
                    "Stable head orientation facing forward."
                )
            elif scores["head_position"] < 68.0:
                weaknesses.append(
                    "Noticeable downward head tilt; "
                    "avoid looking down at notes."
                )

        # Hand gestures
        if scores.get("hand_gestures") is not None:
            if scores["hand_gestures"] >= 75.0:
                strengths.append(
                    "Natural hand gestures that support spoken points."
                )
            elif scores["hand_gestures"] < 62.0:
                weaknesses.append(
                    "Limited hand movement; use natural open "
                    "hand gestures when appropriate."
                )

        if not strengths:
            strengths.append(
                "Speech was detected and the presentation "
                "was analyzed successfully."
            )

        if not weaknesses:
            weaknesses.append(
                "Continue practicing and refining your delivery."
            )

        return strengths[:4], weaknesses[:4]