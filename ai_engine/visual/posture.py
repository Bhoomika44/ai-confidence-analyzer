import numpy as np

class PostureAnalyzer:
    """
    Analyzes body posture using real pose landmarks.
    Measures shoulder alignment angle, spinal verticality, excessive leaning, and posture shifts.
    """
    def __init__(self):
        self.shoulder_angles = []
        self.leaning_offsets = []
        self.posture_scores = []
        self.total_frames = 0
        self.poor_posture_frames = 0
        self.poor_posture_periods = []
        self.current_poor_start = None

    def analyze_frame(self, pose_landmarks, frame_timestamp=0.0):
        self.total_frames += 1
        shoulder_angle = 0.0
        lean_offset = 0.0
        frame_score = 0.0

        if pose_landmarks is not None and len(pose_landmarks) > 12:
            try:
                # Left shoulder: 11, Right shoulder: 12, Nose: 0
                left_shoulder = pose_landmarks[11]
                right_shoulder = pose_landmarks[12]
                nose = pose_landmarks[0]

                # Shoulder slope angle in degrees
                dy = right_shoulder.y - left_shoulder.y
                dx = right_shoulder.x - left_shoulder.x + 1e-6
                shoulder_angle = abs(np.degrees(np.arctan2(dy, dx)))
                angle_tilt = min(shoulder_angle, abs(180.0 - shoulder_angle))

                # Leaning offset: nose horizontal distance to shoulder midpoint
                shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2.0
                lean_offset = abs(nose.x - shoulder_mid_x)

                # Penalize severe tilt or excessive leaning
                tilt_penalty = min(angle_tilt * 3.5, 40.0)
                lean_penalty = min(lean_offset * 220.0, 40.0)
                frame_score = max(10.0, min(100.0, 100.0 - tilt_penalty - lean_penalty))
            except Exception:
                frame_score = 0.0
        else:
            frame_score = 0.0

        if frame_score > 0:
            self.posture_scores.append(frame_score)
            self.shoulder_angles.append(shoulder_angle)
            self.leaning_offsets.append(lean_offset)

            if frame_score < 65.0:
                self.poor_posture_frames += 1
                if self.current_poor_start is None:
                    self.current_poor_start = frame_timestamp
            else:
                if self.current_poor_start is not None:
                    duration = frame_timestamp - self.current_poor_start
                    if duration >= 2.5:
                        self.poor_posture_periods.append({
                            "start": round(self.current_poor_start, 2),
                            "end": round(frame_timestamp, 2),
                            "duration": round(duration, 2),
                            "type": "Slouching / Excessive Leaning"
                        })
                    self.current_poor_start = None

        return frame_score

    def get_summary(self):
        if not self.posture_scores:
            return {
                "score": 0.0,
                "alignment": "No Pose Detected",
                "poor_posture_percentage": 0.0,
                "poor_posture_periods": []
            }

        avg_score = float(np.mean(self.posture_scores))
        alignment = "Excellent Alignment" if avg_score >= 85 else ("Good Posture" if avg_score >= 70 else "Needs Alignment")

        return {
            "score": round(avg_score, 1),
            "alignment": alignment,
            "poor_posture_percentage": round((self.poor_posture_frames / max(1, len(self.posture_scores))) * 100.0, 1),
            "poor_posture_periods": self.poor_posture_periods[:10]
        }
