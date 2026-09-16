def format_timestamp(seconds):
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


class WeakSectionDetector:
    """
    Finds actual weak sections from the analyzed presentation.

    It uses the real timestamps and real detected events.
    It does not create fake scores or fake problems.
    """

    def __init__(self, window_size_sec=20.0, step_size_sec=10.0):
        self.window_size_sec = window_size_sec
        self.step_size_sec = step_size_sec

    def detect_weak_sections(
        self,
        visual_results,
        audio_results,
        duration
    ):
        weak_sections = []
        timeline = []

        try:
            duration = float(duration)
        except (TypeError, ValueError):
            duration = 0.0

        if duration <= 0:
            return {
                "weak_sections": [],
                "timeline": []
            }

        # ---------------------------------------------------------
        # GET ACTUAL EVENTS
        # ---------------------------------------------------------

        eye_data = visual_results.get("eye_contact", {})
        head_data = visual_results.get("head_position", {})
        posture_data = visual_results.get("posture", {})
        expression_data = visual_results.get(
            "facial_expression",
            {}
        )

        filler_data = audio_results.get(
            "filler_words",
            {}
        )

        pause_data = audio_results.get(
            "pauses",
            {}
        )

        speed_data = audio_results.get(
            "speaking_speed",
            {}
        )

        eye_drops = eye_data.get("drops", [])
        head_issues = head_data.get(
            "unstable_periods",
            []
        )
        posture_issues = posture_data.get(
            "poor_posture_periods",
            []
        )

        expression_issues = expression_data.get(
            "low_expression_periods",
            []
        )

        filler_instances = filler_data.get(
            "instances",
            []
        )

        long_pauses = pause_data.get(
            "long_pause_list",
            []
        )

        speed_segments = speed_data.get(
            "segments",
            []
        )

        # ---------------------------------------------------------
        # CREATE WINDOWS
        # ---------------------------------------------------------

        windows = []

        start = 0.0

        while start < duration:

            end = min(
                duration,
                start + self.window_size_sec
            )

            windows.append(
                {
                    "start": round(start, 2),
                    "end": round(end, 2)
                }
            )

            if end >= duration:
                break

            start += self.step_size_sec

        # ---------------------------------------------------------
        # ANALYZE EACH WINDOW
        # ---------------------------------------------------------

        for window in windows:

            start_time = window["start"]
            end_time = window["end"]

            problems = []

            actual_metrics = {}

            # -----------------------------------------------------
            # EYE CONTACT
            # -----------------------------------------------------

            eye_events = self._events_in_window(
                eye_drops,
                start_time,
                end_time
            )

            eye_issue_duration = self._calculate_overlap_duration(
                eye_events,
                start_time,
                end_time
            )

            window_duration = max(
                0.1,
                end_time - start_time
            )

            eye_issue_percentage = (
                eye_issue_duration /
                window_duration
            ) * 100.0

            if eye_events:

                actual_metrics["eye_contact_issue_percentage"] = round(
                    eye_issue_percentage,
                    1
                )

                if eye_issue_percentage >= 50:
                    problems.append(
                        "Low eye contact"
                    )
                elif eye_issue_percentage >= 25:
                    problems.append(
                        "Eye contact dropped"
                    )

            # -----------------------------------------------------
            # HEAD POSITION
            # -----------------------------------------------------

            head_events = self._events_in_window(
                head_issues,
                start_time,
                end_time
            )

            if head_events:

                head_issue_duration = (
                    self._calculate_overlap_duration(
                        head_events,
                        start_time,
                        end_time
                    )
                )

                head_issue_percentage = (
                    head_issue_duration /
                    window_duration
                ) * 100.0

                actual_metrics[
                    "head_issue_percentage"
                ] = round(
                    head_issue_percentage,
                    1
                )

                if head_issue_percentage >= 25:
                    problems.append(
                        "Head position was unstable"
                    )

            # -----------------------------------------------------
            # POSTURE
            # -----------------------------------------------------

            posture_events = self._events_in_window(
                posture_issues,
                start_time,
                end_time
            )

            if posture_events:

                posture_issue_duration = (
                    self._calculate_overlap_duration(
                        posture_events,
                        start_time,
                        end_time
                    )
                )

                posture_issue_percentage = (
                    posture_issue_duration /
                    window_duration
                ) * 100.0

                actual_metrics[
                    "posture_issue_percentage"
                ] = round(
                    posture_issue_percentage,
                    1
                )

                if posture_issue_percentage >= 25:
                    problems.append(
                        "Posture alignment dropped"
                    )

            # -----------------------------------------------------
            # FACIAL EXPRESSION
            # -----------------------------------------------------

            expression_events = self._events_in_window(
                expression_issues,
                start_time,
                end_time
            )

            if expression_events:

                expression_issue_duration = (
                    self._calculate_overlap_duration(
                        expression_events,
                        start_time,
                        end_time
                    )
                )

                expression_issue_percentage = (
                    expression_issue_duration /
                    window_duration
                ) * 100.0

                actual_metrics[
                    "low_expression_percentage"
                ] = round(
                    expression_issue_percentage,
                    1
                )

                if expression_issue_percentage >= 30:
                    problems.append(
                        "Facial expression was less engaging"
                    )

            # -----------------------------------------------------
            # FILLER WORDS
            # -----------------------------------------------------

            window_fillers = []

            for filler in filler_instances:

                timestamp = filler.get(
                    "timestamp",
                    filler.get("time", 0)
                )

                try:
                    timestamp = float(timestamp)
                except (TypeError, ValueError):
                    continue

                if (
                    start_time <= timestamp <= end_time
                ):
                    window_fillers.append(
                        filler
                    )

            filler_count = len(window_fillers)

            if filler_instances:
                actual_metrics[
                    "filler_words"
                ] = filler_count

                if filler_count >= 3:
                    problems.append(
                        f"{filler_count} filler words detected"
                    )

            # -----------------------------------------------------
            # LONG PAUSES
            # -----------------------------------------------------

            window_pauses = []

            for pause in long_pauses:

                pause_start = pause.get(
                    "start",
                    pause.get("timestamp", 0)
                )

                try:
                    pause_start = float(
                        pause_start
                    )
                except (TypeError, ValueError):
                    continue

                if (
                    start_time <= pause_start <= end_time
                ):
                    window_pauses.append(
                        pause
                    )

            pause_count = len(window_pauses)

            if long_pauses:
                actual_metrics[
                    "long_pauses"
                ] = pause_count

                if pause_count >= 1:
                    problems.append(
                        f"{pause_count} long pause(s)"
                    )

            # -----------------------------------------------------
            # SPEAKING SPEED
            # -----------------------------------------------------

            matching_speed_segments = []

            for segment in speed_segments:

                segment_start = segment.get(
                    "start",
                    0
                )

                try:
                    segment_start = float(
                        segment_start
                    )
                except (TypeError, ValueError):
                    continue

                if (
                    start_time <= segment_start <= end_time
                ):
                    wpm = segment.get("wpm")

                    if wpm is not None:
                        try:
                            matching_speed_segments.append(
                                float(wpm)
                            )
                        except (
                            TypeError,
                            ValueError
                        ):
                            pass

            if matching_speed_segments:

                average_wpm = (
                    sum(matching_speed_segments) /
                    len(matching_speed_segments)
                )

                actual_metrics[
                    "speaking_speed_wpm"
                ] = round(
                    average_wpm,
                    1
                )

                if average_wpm > 165:

                    problems.append(
                        f"Speaking too fast ({int(average_wpm)} WPM)"
                    )

                elif average_wpm < 110:

                    problems.append(
                        f"Speaking too slowly ({int(average_wpm)} WPM)"
                    )

            # -----------------------------------------------------
            # DETERMINE WINDOW STATUS
            # -----------------------------------------------------

            if len(problems) >= 2:

                level = "weak"

                status = (
                    "Multiple improvement areas detected"
                )

            elif len(problems) == 1:

                level = "moderate"

                status = problems[0]

            else:

                level = "good"

                status = (
                    "No significant improvement issue detected"
                )

            timeline.append(
                {
                    "timestamp_sec": round(
                        start_time,
                        2
                    ),
                    "timestamp_formatted":
                        format_timestamp(
                            start_time
                        ),
                    "end_timestamp_sec":
                        round(
                            end_time,
                            2
                        ),
                    "end_timestamp_formatted":
                        format_timestamp(
                            end_time
                        ),
                    "status": status,
                    "level": level,
                    "problems": problems,
                    "metrics": actual_metrics
                }
            )

            # -----------------------------------------------------
            # SAVE WEAK SECTION
            # -----------------------------------------------------

            if len(problems) >= 1:

                weak_sections.append(
                    {
                        "id": (
                            f"weak_"
                            f"{len(weak_sections) + 1}"
                        ),

                        "start_sec": round(
                            start_time,
                            2
                        ),

                        "end_sec": round(
                            end_time,
                            2
                        ),

                        "start_time":
                            format_timestamp(
                                start_time
                            ),

                        "end_time":
                            format_timestamp(
                                end_time
                            ),

                        "duration_sec": round(
                            end_time -
                            start_time,
                            2
                        ),

                        "problems": problems,

                        "metrics":
                            actual_metrics,

                        "explanation":
                            self._generate_explanation(
                                problems,
                                start_time,
                                end_time
                            ),

                        "practice_instruction":
                            self._generate_practice_instruction(
                                problems
                            )
                    }
                )

        # ---------------------------------------------------------
        # REMOVE DUPLICATE / OVERLAPPING WEAK SECTIONS
        # ---------------------------------------------------------

        weak_sections = self._merge_overlapping_sections(
            weak_sections
        )

        # Maximum 5 useful sections
        weak_sections = weak_sections[:5]

        return {
            "weak_sections": weak_sections,
            "timeline": timeline
        }

    # =============================================================
    # HELPERS
    # =============================================================

    def _events_in_window(
        self,
        events,
        window_start,
        window_end
    ):

        matching = []

        for event in events:

            start = event.get(
                "start",
                event.get("timestamp", 0)
            )

            end = event.get(
                "end",
                start
            )

            try:
                start = float(start)
                end = float(end)
            except (TypeError, ValueError):
                continue

            if (
                end >= window_start
                and start <= window_end
            ):
                matching.append(event)

        return matching

    def _calculate_overlap_duration(
        self,
        events,
        window_start,
        window_end
    ):

        total = 0.0

        for event in events:

            start = event.get(
                "start",
                event.get("timestamp", 0)
            )

            end = event.get(
                "end",
                start
            )

            try:
                start = float(start)
                end = float(end)
            except (TypeError, ValueError):
                continue

            overlap_start = max(
                window_start,
                start
            )

            overlap_end = min(
                window_end,
                end
            )

            if overlap_end > overlap_start:

                total += (
                    overlap_end -
                    overlap_start
                )

        return total

    def _merge_overlapping_sections(
        self,
        sections
    ):

        if not sections:
            return []

        sections = sorted(
            sections,
            key=lambda x: x["start_sec"]
        )

        merged = []

        for section in sections:

            if not merged:

                merged.append(section)
                continue

            previous = merged[-1]

            if section["start_sec"] <= previous["end_sec"]:

                previous["end_sec"] = max(
                    previous["end_sec"],
                    section["end_sec"]
                )

                previous["end_time"] = format_timestamp(
                    previous["end_sec"]
                )

                previous["duration_sec"] = round(
                    previous["end_sec"] -
                    previous["start_sec"],
                    2
                )

                for problem in section["problems"]:

                    if problem not in previous["problems"]:

                        previous["problems"].append(
                            problem
                        )

                for key, value in section["metrics"].items():

                    if key not in previous["metrics"]:

                        previous["metrics"][key] = value

            else:

                merged.append(section)

        for index, section in enumerate(merged):

            section["id"] = f"weak_{index + 1}"

        return merged

    def _generate_explanation(
        self,
        problems,
        start_time,
        end_time
    ):

        problem_text = ", ".join(
            problems
        )

        return (
            f"Improvement is needed in the "
            f"{format_timestamp(start_time)} to "
            f"{format_timestamp(end_time)} section. "
            f"The analysis detected: {problem_text}."
        )

    def _generate_practice_instruction(
        self,
        problems
    ):

        instructions = []

        for problem in problems:

            problem_lower = problem.lower()

            if "eye contact" in problem_lower:

                instructions.append(
                    "Maintain eye contact with the camera."
                )

            elif "filler" in problem_lower:

                instructions.append(
                    "Replace filler words with short natural pauses."
                )

            elif "speaking too fast" in problem_lower:

                instructions.append(
                    "Slow down and speak at a steady pace."
                )

            elif "speaking too slowly" in problem_lower:

                instructions.append(
                    "Increase your speaking pace slightly."
                )

            elif "pause" in problem_lower:

                instructions.append(
                    "Avoid unnecessary long pauses."
                )

            elif "posture" in problem_lower:

                instructions.append(
                    "Keep your shoulders relaxed and posture upright."
                )

            elif "head" in problem_lower:

                instructions.append(
                    "Keep your head stable and face the camera."
                )

            elif "facial expression" in problem_lower:

                instructions.append(
                    "Use a more natural and engaged facial expression."
                )

        if not instructions:

            instructions.append(
                "Repeat this section while maintaining steady delivery."
            )

        return " ".join(instructions)