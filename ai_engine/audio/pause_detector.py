import wave
import audioop


class PauseDetector:
    def __init__(self, min_pause_duration=0.4, long_pause_duration=1.5):
        self.min_pause_duration = min_pause_duration
        self.long_pause_duration = long_pause_duration

    def analyze_wav(self, wav_path):
        try:
            with wave.open(wav_path, "rb") as wav:
                sample_rate = wav.getframerate()
                sample_width = wav.getsampwidth()
                channels = wav.getnchannels()
                audio_data = wav.readframes(wav.getnframes())

            if not audio_data:
                return self._no_speech()

            # Convert stereo to mono
            if channels > 1:
                audio_data = audioop.tomono(
                    audio_data,
                    sample_width,
                    0.5,
                    0.5
                )

            frame_duration = 0.05
            frame_size = int(sample_rate * frame_duration)

            energies = []

            for i in range(0, len(audio_data), frame_size * sample_width):
                frame = audio_data[
                    i:i + frame_size * sample_width
                ]

                if len(frame) < frame_size * sample_width:
                    continue

                rms = audioop.rms(frame, sample_width)
                energies.append(rms)

            if not energies:
                return self._no_speech()

            # Normalize RMS values
            max_energy = max(energies)

            if max_energy == 0:
                return self._no_speech()

            normalized = [
                energy / max_energy
                for energy in energies
            ]

            # Estimate background noise from the quietest frames
            sorted_energy = sorted(normalized)
            noise_count = max(1, int(len(sorted_energy) * 0.25))
            noise_level = sum(sorted_energy[:noise_count]) / noise_count

            # Speech threshold
            threshold = max(0.08, noise_level * 2.5)

            speech_frames = [
                value >= threshold
                for value in normalized
            ]

            # Remove extremely short speech/noise changes.
            # A real speech section should last at least 0.15 sec.
            min_speech_frames = 3

            cleaned = speech_frames[:]

            i = 0

            while i < len(cleaned):
                start = i
                current = cleaned[i]

                while i < len(cleaned) and cleaned[i] == current:
                    i += 1

                length = i - start

                if current and length < min_speech_frames:
                    for j in range(start, i):
                        cleaned[j] = False

            # Find speech range
            speech_indexes = [
                i for i, value in enumerate(cleaned)
                if value
            ]

            if not speech_indexes:
                return self._no_speech()

            first_speech = speech_indexes[0]
            last_speech = speech_indexes[-1]

            pauses = []

            i = first_speech

            while i <= last_speech:
                if cleaned[i]:
                    i += 1
                    continue

                pause_start = i

                while i <= last_speech and not cleaned[i]:
                    i += 1

                pause_end = i

                duration = (pause_end - pause_start) * frame_duration

                # Ignore tiny gaps
                if duration >= self.min_pause_duration:
                    start_time = pause_start * frame_duration
                    end_time = pause_end * frame_duration

                    pauses.append({
                        "start": round(start_time, 2),
                        "end": round(end_time, 2),
                        "duration": round(duration, 2),
                        "is_long": duration >= self.long_pause_duration
                    })

            total_pauses = len(pauses)

            long_pauses = [
                pause for pause in pauses
                if pause["is_long"]
            ]

            # Calculate score from actual pauses
            speech_duration = (
                (last_speech - first_speech + 1)
                * frame_duration
            )

            if total_pauses == 0:
                score = 100.0
            else:
                pause_rate = total_pauses / max(
                    speech_duration / 60.0,
                    0.1
                )

                score = max(
                    0.0,
                    min(
                        100.0,
                        100.0 - (pause_rate * 8.0)
                    )
                )

            return {
                "score": round(score, 1),
                "speech_detected": True,
                "total_pauses": total_pauses,
                "long_pauses": len(long_pauses),
                "pause_details": pauses,
                "speech_duration": round(speech_duration, 2)
            }

        except Exception as e:
            print(f"[PauseDetector] Error: {e}")

            return {
                "score": None,
                "speech_detected": False,
                "total_pauses": None,
                "long_pauses": None,
                "pause_details": [],
                "speech_duration": 0.0
            }

    def _no_speech(self):
        return {
            "score": None,
            "speech_detected": False,
            "total_pauses": None,
            "long_pauses": None,
            "pause_details": [],
            "speech_duration": 0.0
        }


# Compatibility name
PauseAnalyzer = PauseDetector