import numpy as np

class BodyMovementAnalyzer:
    """
    Analyzes body movement and stability from pose landmarks.
    Distinguishes confident dynamic presence from excessive swaying, nervous fidgeting, or rigid stiffness.
    """
    def __init__(self):
        self.displacement_history = []
        self.prev_centroid = None
        self.total_frames = 0
        self.fidgeting_frames = 0
        self.freeze_frames = 0

    def analyze_frame(self, pose_landmarks, frame_timestamp=0.0):
        self.total_frames += 1
        displacement = 0.0

        if pose_landmarks is not None and len(pose_landmarks) > 12:
            try:
                # Centroid of upper body (shoulders 11, 12, nose 0)
                cx = (pose_landmarks[11].x + pose_landmarks[12].x + pose_landmarks[0].x) / 3.0
                cy = (pose_landmarks[11].y + pose_landmarks[12].y + pose_landmarks[0].y) / 3.0
                current_centroid = np.array([cx, cy])

                if self.prev_centroid is not None:
                    displacement = float(np.linalg.norm(current_centroid - self.prev_centroid))
                self.prev_centroid = current_centroid
            except Exception:
                displacement = 0.0
        else:
            displacement = 0.0

        self.displacement_history.append(displacement)

        if displacement > 0.035: # erratic or fidgeting
            self.fidgeting_frames += 1
        elif displacement < 0.001 and displacement > 0:
            self.freeze_frames += 1

        return displacement

    def get_summary(self):
        if self.total_frames == 0 or len(self.displacement_history) == 0:
            return {
                "score": 0.0,
                "movement_style": "No Movement Detected",
                "stability": "Unavailable"
            }

        # If zero displacement recorded across all frames (e.g. no pose detected)
        if sum(self.displacement_history) == 0:
            return {
                "score": 0.0,
                "movement_style": "No Pose Detected",
                "stability": "Unavailable",
                "fidgeting_percentage": 0.0,
                "freeze_percentage": 0.0
            }

        fidget_pct = (self.fidgeting_frames / self.total_frames) * 100.0
        freeze_pct = (self.freeze_frames / self.total_frames) * 100.0

        penalty = (fidget_pct * 0.8) + (freeze_pct * 0.4)
        score = max(30.0, min(100.0, 92.0 - penalty))

        if score >= 82:
            style = "Controlled & Dynamic"
        elif fidget_pct > 20:
            style = "Noticeable Swaying / Fidgeting"
        else:
            style = "Static / Low Movement"

        return {
            "score": round(score, 1),
            "movement_style": style,
            "fidgeting_percentage": round(fidget_pct, 1),
            "freeze_percentage": round(freeze_pct, 1)
        }
