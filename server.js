const http = require('http');
const https = require('https');
const fs = require('fs');
const app = require('./app');
const setupSocket = require('./socket');

const PORT = process.env.PORT || 8080;

const httpServer = http.createServer(app);
const httpsServer = https.createServer(
  {
    key: fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem'),
  },
  app
);

setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`HTTP Server is running on port ${PORT}`);
});

httpsServer.listen(8083, () => {
  console.log(`HTTP Server is running on port ${8083}`);
});
