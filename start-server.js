const { spawn } = require('child_process');
const http = require('http');

console.log('Starting Prima Facie server...');

// Start Next.js server
const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  cwd: __dirname,
  stdio: 'pipe'
});

nextProcess.stdout.on('data', (data) => {
  console.log(`Next.js: ${data}`);
});

nextProcess.stderr.on('data', (data) => {
  console.error(`Next.js Error: ${data}`);
});

// Test server every 2 seconds
const testServer = () => {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
  }, (res) => {
    console.log(`✅ Server responding on port 3000 - Status: ${res.statusCode}`);
  });
  
  req.on('error', (err) => {
    console.log(`❌ Server not ready: ${err.message}`);
    setTimeout(testServer, 2000);
  });
  
  req.end();
};

setTimeout(testServer, 3000);