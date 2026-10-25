const http = require('http');

async function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('--- TEST 1: Validation failure (missing fields) ---');
  const res1 = await postJson('/api/generate-cover-letter', {
    candidateName: '',
    jobRole: 'Frontend Dev',
  });
  console.log('Status:', res1.statusCode, 'Response:', res1.data);

  console.log('\n--- TEST 2: Generation via /api/generate ---');
  const res2 = await postJson('/api/generate', {
    candidateName: 'Alex Morgan',
    jobRole: 'Lead Software Architect',
    targetCompany: 'Acme Cloud Solutions',
    keySkills: 'Node.js, TypeScript, Cloud Architecture, GraphQL',
    tone: 'confident',
  });
  console.log('Status:', res2.statusCode);
  console.log('Source:', res2.data.source);
  console.log('Message:', res2.data.message);
  console.log('Sample Cover Letter Output Preview:\n', (res2.data.coverLetter || '').slice(0, 150) + '...');

  console.log('\n--- TEST 3: Static Frontend file serving ---');
  const httpGet = (url) =>
    new Promise((resolve) => {
      http.get(url, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ statusCode: res.statusCode, length: data.length }));
      });
    });

  const res3 = await httpGet('http://localhost:5000/');
  console.log('Frontend index.html response code:', res3.statusCode, 'bytes:', res3.length);

  const res4 = await httpGet('http://localhost:5000/style.css');
  console.log('Frontend style.css response code:', res4.statusCode, 'bytes:', res4.length);

  const res5 = await httpGet('http://localhost:5000/script.js');
  console.log('Frontend script.js response code:', res5.statusCode, 'bytes:', res5.length);
}

runTests().catch(console.error);
