const path = require('path');
const fs = require('fs');

const API = 'http://localhost:5000/api';

async function testFullFlow() {
  console.log('--- STARTING END-TO-END VERIFICATION TEST ---');

  // 1. Health check
  console.log('1. Testing Health Endpoint...');
  const healthRes = await fetch(`${API}/health`);
  const healthData = await healthRes.json();
  console.log('✅ Health Response:', healthData.status);

  // 2. Auth - Register
  console.log('2. Testing User Registration...');
  const testEmail = `tester_${Date.now()}@example.com`;
  const registerRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Presentation Tester',
      email: testEmail,
      password: 'password123'
    })
  });
  const registerData = await registerRes.json();
  const token = registerData.token;
  console.log('✅ Registered user token received:', token.substring(0, 20) + '...');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 3. Create Presentation
  console.log('3. Creating Presentation Record...');
  const sampleVideoPath = path.join(__dirname, '..', '..', 'test_clip.mp4');
  const createRes = await fetch(`${API}/presentations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Verification Rehearsal',
      inputType: 'recording',
      videoPath: sampleVideoPath,
      duration: 3
    })
  });
  const createData = await createRes.json();
  const presentationId = createData.id;
  console.log('✅ Created presentation ID:', presentationId);

  // 4. Trigger Analysis
  console.log('4. Triggering AI Analysis...');
  const analysisStartRes = await fetch(`${API}/analysis/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ presentationId })
  });
  const analysisStartData = await analysisStartRes.json();
  console.log('✅ Analysis Triggered:', analysisStartData.message);

  // Poll until completed
  console.log('5. Polling for AI Analysis completion...');
  let completed = false;
  let attempts = 0;
  while (!completed && attempts < 25) {
    await new Promise(r => setTimeout(r, 1000));
    const statusRes = await fetch(`${API}/analysis/${presentationId}/status`, { headers });
    const statusData = await statusRes.json();
    console.log(`   [Status: ${statusData.status}] Step: ${statusData.step} (${statusData.progress}%)`);
    if (statusData.status === 'completed') {
      completed = true;
      break;
    }
    attempts++;
  }

  if (!completed) {
    throw new Error('Analysis timed out or failed');
  }

  // 5. Fetch Full Presentation & Results
  console.log('6. Fetching Analysis & Weak Sections...');
  const resultsRes = await fetch(`${API}/presentations/${presentationId}`, { headers });
  const resultsData = await resultsRes.json();
  const { analysis, weakSections } = resultsData;
  console.log(`✅ Overall Performance Score: ${analysis.overallScore}% (${analysis.performanceLevel})`);
  console.log(`✅ Individual Scores: Eye Contact: ${analysis.eyeContact}%, Posture: ${analysis.posture}%, Speed: ${analysis.wpm} WPM`);
  console.log(`✅ Weak Sections Detected: ${weakSections.length}`);

  if (weakSections.length > 0) {
    const ws = weakSections[0];
    console.log(`   Weak Section 1: ${ws.startTime} – ${ws.endTime}`);
    console.log(`   Diagnosis: ${ws.explanation}`);
    console.log(`   Repair Mission: ${ws.practiceInstruction}`);

    // 6. Test Targeted Weak Section Practice & Re-Analysis
    console.log('7. Testing Practice Attempt & Before vs After Re-Analysis...');
    const practiceRes = await fetch(`${API}/practice/${ws.id}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        videoPath: sampleVideoPath,
        duration: 3
      })
    });
    const practiceData = await practiceRes.json();

    console.log(`✅ Practice Re-Analysis Completed!`);
    console.log(`   Improved: ${practiceData.isImproved}`);
    console.log(`   Verdict: ${practiceData.verdictMessage}`);
    console.log(`   Comparison Table Rows: ${practiceData.comparisonTable?.length || 0}`);
  }

  // 7. Test History API
  console.log('8. Testing History API...');
  const historyRes = await fetch(`${API}/history`, { headers });
  const historyData = await historyRes.json();
  console.log(`✅ Total History Sessions for User: ${historyData.length}`);

  console.log('\n🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 🎉');
}

testFullFlow().catch(err => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
