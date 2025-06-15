const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>Test Server</title></head>
    <body>
      <h1>Test Server Running</h1>
      <p>Port: ${process.env.PORT || 3003}</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
  `);
});

const port = process.env.PORT || 3003;
server.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${port}`);
});