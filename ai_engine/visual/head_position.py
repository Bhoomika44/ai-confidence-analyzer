import numpy as np

class HeadPositionAnalyzer:
    """
    Tracks head orientation (pitch, yaw, roll) and position stability.
    Detects looking down, looking sideways, and erratic head movements.
    """
    def __init__(self):
        self.pitch_history = []
        self.yaw_history = []
        self.roll_history = []
        self.head_down_count = 0
        self.head_side_count = 0
        self.total_frames = 0
        self.valid_frames = 0
        self.unstable_periods = []
        self.current_down_start = None

    def analyze_frame(self, face_landmarks, frame_timestamp=0.0):
        self.total_frames += 1
        pitch = 0.0
        yaw = 0.0
        roll = 0.0
        has_face = False

        if face_landmarks is not None and len(face_landmarks) >= 200:
            try:
                nose = face_landmarks[1]
                chin = face_landmarks[199] if len(face_landmarks) > 199 else face_landmarks[152]
                forehead = face_landmarks[10]
                left_eye = face_landmarks[33]
                right_eye = face_landmarks[263]

                # Yaw: horizontal asymmetry between nose and eye mid-point
                eye_center_x = (left_eye.x + right_eye.x) / 2.0
                yaw = (nose.x - eye_center_x) * 120.0 # Approximate degrees

                # Pitch: vertical positioning of nose relative to eye-to-chin line
                face_height = abs(chin.y - forehead.y) + 1e-6
                nose_rel_y = (nose.y - forehead.y) / face_height
                pitch = (nose_rel_y - 0.60) * 100.0

                # Roll: eye slope
                dy = right_eye.y - left_eye.y
                dx = right_eye.x - left_eye.x + 1e-6
                roll = np.degrees(np.arctan2(dy, dx))
                has_face = True
            except Exception:
                has_face = False

        if has_face:
            self.valid_frames += 1
            self.pitch_history.append(pitch)
            self.yaw_history.append(yaw)
            self.roll_history.append(roll)

            is_looking_down = pitch > 15.0
            is_looking_side = abs(yaw) > 22.0

            if is_looking_down:
                self.head_down_count += 1
                if self.current_down_start is None:
                    self.current_down_start = frame_timestamp
            else:
                if self.current_down_start is not None:
                    dur = frame_timestamp - self.current_down_start
                    if dur >= 2.0:
                        self.unstable_periods.append({
                            "start": round(self.current_down_start, 2),
                            "end": round(frame_timestamp, 2),
                            "duration": round(dur, 2),
                            "type": "Head Down (Reading/Avoiding Audience)"
                        })
                    self.current_down_start = None

            if is_looking_side:
                self.head_side_count += 1

        return {"pitch": round(pitch, 2), "yaw": round(yaw, 2), "roll": round(roll, 2)}

    def get_summary(self):
        if self.valid_frames == 0:
            return {
                "score": 0.0,
                "stability": "No Face Detected",
                "looking_down_percentage": 0.0,
                "looking_side_percentage": 0.0,
                "unstable_periods": []
            }

        down_pct = (self.head_down_count / self.valid_frames) * 100.0
        side_pct = (self.head_side_count / self.valid_frames) * 100.0

        penalty = (down_pct * 0.7) + (side_pct * 0.5)
        score = max(20.0, min(100.0, 100.0 - penalty))

        stability = "Excellent" if score >= 85 else ("Good" if score >= 70 else "Unstable / Looking Away")

        return {
            "score": round(score, 1),
            "stability": stability,
            "looking_down_percentage": round(down_pct, 1),
            "looking_side_percentage": round(side_pct, 1),
            "unstable_periods": self.unstable_periods[:10]
        }
