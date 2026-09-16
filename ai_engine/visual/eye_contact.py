import numpy as np

class EyeContactAnalyzer:
    """
    Analyzes eye contact and gaze direction toward the webcam camera.
    Estimates contact strictly when the presenter's face is oriented toward
    and looking directly into the camera. Returns 0% when looking away or no face.
    """
    def __init__(self):
        self.total_frames = 0
        self.eye_contact_frames = 0
        self.gaze_history = []
        self.drops = []
        self.current_drop_start = None

    def analyze_frame(self, face_landmarks, frame_timestamp=0.0, frame_width=640, frame_height=480):
        self.total_frames += 1
        is_contact = False
        ratio = 0.5

        if face_landmarks is not None and len(face_landmarks) >= 264:
            try:
                # Key eye and face landmarks
                left_outer = np.array([face_landmarks[33].x, face_landmarks[33].y])
                left_inner = np.array([face_landmarks[133].x, face_landmarks[133].y])
                right_inner = np.array([face_landmarks[362].x, face_landmarks[362].y])
                right_outer = np.array([face_landmarks[263].x, face_landmarks[263].y])
                nose_tip = face_landmarks[1]

                # Head pose yaw check: nose relative to center of eye span
                face_center_x = (face_landmarks[33].x + face_landmarks[263].x) / 2.0
                yaw_offset = abs(nose_tip.x - face_center_x)

                # Head pose pitch check: nose relative to eye line and chin
                eye_y = (face_landmarks[33].y + face_landmarks[263].y) / 2.0
                chin_y = face_landmarks[152].y if len(face_landmarks) > 152 else (eye_y + 0.3)
                face_span = max(1e-5, chin_y - eye_y)
                pitch_ratio = (nose_tip.y - eye_y) / face_span

                # Head must be facing generally towards camera (not turned sideways or looking down/up)
                is_facing_camera = (yaw_offset < 0.055) and (0.30 <= pitch_ratio <= 0.65)

                if is_facing_camera:
                    if len(face_landmarks) >= 478:
                        # Iris centers available
                        left_iris = np.array([face_landmarks[468].x, face_landmarks[468].y])
                        right_iris = np.array([face_landmarks[473].x, face_landmarks[473].y])

                        left_width = np.linalg.norm(left_inner - left_outer) + 1e-6
                        right_width = np.linalg.norm(right_outer - right_inner) + 1e-6

                        left_ratio = np.linalg.norm(left_iris - left_outer) / left_width
                        right_ratio = np.linalg.norm(right_iris - right_inner) / right_width
                        ratio = float((left_ratio + right_ratio) / 2.0)

                        # Iris center looking directly into camera
                        if 0.35 <= ratio <= 0.65:
                            is_contact = True
                    else:
                        # With frontal face orientation, estimate eye contact
                        if yaw_offset < 0.038:
                            is_contact = True
                            ratio = 0.5
            except Exception:
                is_contact = False
        else:
            is_contact = False

        if is_contact:
            self.eye_contact_frames += 1
            if self.current_drop_start is not None:
                drop_duration = frame_timestamp - self.current_drop_start
                if drop_duration >= 2.0:
                    self.drops.append({
                        "start": round(self.current_drop_start, 2),
                        "end": round(frame_timestamp, 2),
                        "duration": round(drop_duration, 2),
                        "type": "Looking Away From Camera"
                    })
                self.current_drop_start = None
        else:
            if self.current_drop_start is None:
                self.current_drop_start = frame_timestamp

        self.gaze_history.append({
            "timestamp": round(frame_timestamp, 2),
            "in_contact": is_contact,
            "ratio": round(ratio, 3)
        })

        return is_contact

    def get_summary(self):
        if self.total_frames == 0 or self.eye_contact_frames == 0:
            percentage = 0.0
            score = 0.0
        else:
            percentage = round((self.eye_contact_frames / self.total_frames) * 100.0, 1)
            score = min(100.0, max(0.0, percentage))

        return {
            "score": round(score, 1),
            "percentage": percentage,
            "total_frames": self.total_frames,
            "contact_frames": self.eye_contact_frames,
            "drops": self.drops[:10],
            "gaze_history": self.gaze_history[::15] # sampled for frontend charts
        }
