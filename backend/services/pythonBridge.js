const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const runPythonAnalysis = (videoPath, audioPath = null, mode = 'full', io = null, presentationId = null) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', '..', 'ai_engine', 'analyze_presentation.py');
    const args = [pythonScript, '--video', videoPath, '--mode', mode];
    if (audioPath) {
      args.push('--audio', audioPath);
    }

    console.log(`[PythonBridge] Launching Python analyzer: python ${args.join(' ')}`);

    const pythonProcess = spawn('python', args, {
      cwd: path.join(__dirname, '..', '..', 'ai_engine')
    });

    let outputBuffer = '';
    let errorBuffer = '';
    let isCapturingJson = false;
    let jsonLines = [];

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      outputBuffer += text;

      const lines = text.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line === '__JSON_START__') {
          isCapturingJson = true;
          jsonLines = [];
          continue;
        }

        if (line === '__JSON_END__') {
          isCapturingJson = false;
          continue;
        }

        if (isCapturingJson) {
          jsonLines.push(line);
          continue;
        }

        // Try parsing real-time progress update
        try {
          if (line.startsWith('{') && line.endsWith('}')) {
            const parsed = JSON.parse(line);
            if (parsed.type === 'progress' && io && presentationId) {
              io.to(`presentation_${presentationId}`).emit('analysis_progress', {
                presentationId,
                step: parsed.step,
                progress: parsed.percent
              });
            }
          }
        } catch (e) {
          // Not a progress json
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      errorBuffer += data.toString();
      console.warn(`[Python stderr] ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0 && jsonLines.length === 0) {
        console.error(`[PythonBridge] Process exited with code ${code}. Stderr: ${errorBuffer}`);
        return reject(new Error(`Python analysis process failed with code ${code}: ${errorBuffer}`));
      }

      try {
        let jsonString = jsonLines.join('');
        if (!jsonString) {
          // Attempt fallback search in complete buffer
          const startIdx = outputBuffer.indexOf('__JSON_START__');
          const endIdx = outputBuffer.indexOf('__JSON_END__');
          if (startIdx !== -1 && endIdx !== -1) {
            jsonString = outputBuffer.substring(startIdx + 14, endIdx).trim();
          }
        }

        if (!jsonString) {
          throw new Error('No JSON output markers received from Python analyzer');
        }

        const analysisData = JSON.parse(jsonString);
        resolve(analysisData);
      } catch (err) {
        console.error('[PythonBridge] Failed to parse analysis JSON:', err.message);
        reject(err);
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('[PythonBridge] Failed to start Python process:', err);
      reject(err);
    });
  });
};

module.exports = { runPythonAnalysis };
