import math


class HandGestureAnalyzer:
    def __init__(
        self,
        movement_threshold=0.018,
        min_movement_frames=3,
        window_size=5
    ):
        self.movement_threshold = movement_threshold
        self.min_movement_frames = min_movement_frames
        self.window_size = window_size

    def analyze(self, hand_landmarks_history, fps=30.0):
        if not hand_landmarks_history:
            return self._cannot_analyze()

        visible_frames = 0
        movement_frames = 0
        movement_events = []

        previous_positions = []
        consecutive_movement = 0
        event_start = None

        for frame_index, hands in enumerate(hand_landmarks_history):

            if not hands:
                if consecutive_movement >= self.min_movement_frames:
                    end_time = frame_index / fps

                    movement_events.append({
                        "start": round(event_start, 2),
                        "end": round(end_time, 2),
                        "duration": round(
                            max(0.0, end_time - event_start),
                            2
                        )
                    })

                consecutive_movement = 0
                event_start = None
                previous_positions = []
                continue

            current_positions = self._get_hand_positions(hands)

            if not current_positions:
                consecutive_movement = 0
                event_start = None
                previous_positions = []
                continue

            visible_frames += 1

            if not previous_positions:
                previous_positions = current_positions
                continue

            movement = self._calculate_movement(
                previous_positions,
                current_positions
            )

            if movement >= self.movement_threshold:

                movement_frames += 1
                consecutive_movement += 1

                if consecutive_movement == self.min_movement_frames:
                    event_start = max(
                        0.0,
                        (
                            frame_index
                            - self.min_movement_frames
                            + 1
                        ) / fps
                    )

            else:

                if consecutive_movement >= self.min_movement_frames:

                    end_time = frame_index / fps

                    movement_events.append({
                        "start": round(event_start, 2),
                        "end": round(end_time, 2),
                        "duration": round(
                            max(0.0, end_time - event_start),
                            2
                        )
                    })

                consecutive_movement = 0
                event_start = None

            previous_positions = current_positions

        # Close final movement event
        if consecutive_movement >= self.min_movement_frames:

            end_time = len(hand_landmarks_history) / fps

            movement_events.append({
                "start": round(event_start, 2),
                "end": round(end_time, 2),
                "duration": round(
                    max(0.0, end_time - event_start),
                    2
                )
            })

        # Ignore extremely short movements
        movement_events = [
            event
            for event in movement_events
            if event["duration"] >= 0.15
        ]

        if visible_frames == 0:
            return self._cannot_analyze()

        active_percentage = (
            movement_frames / visible_frames
        ) * 100.0

        if movement_frames == 0:

            score = 0.0
            gesture_rate = "No Hand Movement Detected"

        else:

            score = min(
                100.0,
                active_percentage * 2.5
            )

            if active_percentage < 5:
                gesture_rate = "Low Hand Movement"

            elif active_percentage < 20:
                gesture_rate = "Moderate Hand Movement"

            else:
                gesture_rate = "Frequent Hand Movement"

        result = {
            "score": round(score, 1),
            "gesture_rate": gesture_rate,
            "active_gesture_percentage": round(
                active_percentage,
                1
            ),
            "hand_detected_percentage": round(
                (
                    visible_frames
                    / len(hand_landmarks_history)
                ) * 100,
                1
            ),
            "hands_detected": True,
            "movement_events": movement_events,
            "total_gesture_events": len(movement_events)
        }

        return result

    def get_summary(self, result):
        """
        Compatibility method used by analyze_presentation.py.
        Converts the detailed analysis result into a simple summary.
        """

        if not result:
            return {
                "score": None,
                "gesture_rate": "Cannot Analyze",
                "active_gesture_percentage": None,
                "hands_detected": False
            }

        return {
            "score": result.get("score"),
            "gesture_rate": result.get(
                "gesture_rate",
                "Cannot Analyze"
            ),
            "active_gesture_percentage": result.get(
                "active_gesture_percentage"
            ),
            "hands_detected": result.get(
                "hands_detected",
                False
            )
        }

    def _get_hand_positions(self, hands):

        positions = []

        for hand in hands:

            if isinstance(hand, dict):
                landmarks = hand.get(
                    "landmarks",
                    hand
                )
            else:
                landmarks = hand

            if not landmarks:
                continue

            indexes = [
                0,
                4,
                8,
                12,
                16,
                20
            ]

            selected = []

            for index in indexes:

                if index >= len(landmarks):
                    continue

                point = landmarks[index]

                try:

                    if isinstance(point, dict):

                        x = float(
                            point.get("x", 0)
                        )

                        y = float(
                            point.get("y", 0)
                        )

                    else:

                        x = float(point.x)
                        y = float(point.y)

                    selected.append((x, y))

                except (
                    AttributeError,
                    TypeError,
                    ValueError
                ):
                    continue

            if selected:
                positions.append(selected)

        return positions

    def _calculate_movement(
        self,
        previous_positions,
        current_positions
    ):

        distances = []

        hand_count = min(
            len(previous_positions),
            len(current_positions)
        )

        for hand_index in range(hand_count):

            previous_hand = previous_positions[
                hand_index
            ]

            current_hand = current_positions[
                hand_index
            ]

            point_count = min(
                len(previous_hand),
                len(current_hand)
            )

            for point_index in range(point_count):

                x1, y1 = previous_hand[
                    point_index
                ]

                x2, y2 = current_hand[
                    point_index
                ]

                distance = math.sqrt(
                    (x2 - x1) ** 2
                    +
                    (y2 - y1) ** 2
                )

                distances.append(distance)

        if not distances:
            return 0.0

        return sum(distances) / len(distances)

    def _cannot_analyze(self):

        return {
            "score": None,
            "gesture_rate": "Cannot Analyze",
            "active_gesture_percentage": None,
            "hand_detected_percentage": 0.0,
            "hands_detected": False,
            "movement_events": [],
            "total_gesture_events": 0
        }


# Compatibility name
HandGestureDetector = HandGestureAnalyzer