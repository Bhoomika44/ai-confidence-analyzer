import numpy as np

class FacialExpressionAnalyzer:
    """
    Analyzes observable facial expressions during presentation.
    Detects dynamic expression, smiling/engagement, neutral periods, and monotonic flat expression.
    """
    def __init__(self):
        self.expression_scores = []
        self.mouth_aspect_ratios = []
        self.smile_metrics = []
        self.low_expression_periods = []
        self.current_low_start = None

    def analyze_frame(self, face_landmarks, frame_timestamp=0.0):
        """
        Calculates Mouth Aspect Ratio (MAR) and smile metrics from landmarks.
        Mouth landmarks: Top lip (13), Bottom lip (14), Left corner (61), Right corner (291)
        Eyebrows: Left (70), Right (300)
        """
        engagement = 0.0
        mar = 0.0
        smile = 0.0

        if face_landmarks is not None and len(face_landmarks) >= 300:
            try:
                top_lip = np.array([face_landmarks[13].x, face_landmarks[13].y])
                bot_lip = np.array([face_landmarks[14].x, face_landmarks[14].y])
                left_corner = np.array([face_landmarks[61].x, face_landmarks[61].y])
                right_corner = np.array([face_landmarks[291].x, face_landmarks[291].y])

                mouth_width = np.linalg.norm(right_corner - left_corner) + 1e-6
                mouth_height = np.linalg.norm(bot_lip - top_lip)
                mar = mouth_height / mouth_width

                # Smile indicator: mouth width relative to outer eye distance (33 to 263)
                eye_dist = np.linalg.norm(
                    np.array([face_landmarks[263].x, face_landmarks[263].y]) -
                    np.array([face_landmarks[33].x, face_landmarks[33].y])
                ) + 1e-6

                smile_ratio = mouth_width / eye_dist
                smile = max(0.0, min(1.0, (smile_ratio - 0.45) * 4.0))

                # Dynamic expression score: expressive speaking vs frozen face
                base_score = 65.0 + (smile * 20.0) + (min(mar, 0.4) * 40.0)
                engagement = min(100.0, max(35.0, base_score))
            except Exception:
                engagement = 0.0
        else:
            engagement = 0.0

        if engagement > 0:
            self.expression_scores.append(engagement)
            self.mouth_aspect_ratios.append(mar)
            self.smile_metrics.append(smile)

            if engagement < 55.0:
                if self.current_low_start is None:
                    self.current_low_start = frame_timestamp
            else:
                if self.current_low_start is not None:
                    duration = frame_timestamp - self.current_low_start
                    if duration >= 3.0:
                        self.low_expression_periods.append({
                            "start": round(self.current_low_start, 2),
                            "end": round(frame_timestamp, 2),
                            "duration": round(duration, 2),
                            "type": "Low Facial Expression"
                        })
                    self.current_low_start = None

        return engagement

    def get_summary(self):
        if not self.expression_scores:
            return {
                "score": 0.0,
                "engagement_level": "No Face Detected",
                "average_engagement": 0.0,
                "expression_variance": 0.0,
                "low_expression_periods": []
            }

        avg_score = float(np.mean(self.expression_scores))
        std_variation = float(np.std(self.expression_scores))

        # Reward natural variation (not frozen monotonic expression)
        final_score = min(100.0, max(30.0, avg_score + min(std_variation * 1.5, 10.0)))

        level = "High Engagement" if final_score >= 80 else ("Moderate Expression" if final_score >= 65 else "Low Variation")

        return {
            "score": round(final_score, 1),
            "engagement_level": level,
            "average_engagement": round(avg_score, 1),
            "expression_variance": round(std_variation, 2),
            "low_expression_periods": self.low_expression_periods[:10]
        }
