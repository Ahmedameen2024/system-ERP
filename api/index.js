const serverless = require('serverless-http');

let app;
try {
  // Backend is built to backend/dist/index.js by the build step
  const imported = require('../backend/dist/index.js');
  app = imported.default || imported;
} catch (err) {
  console.error('Failed to load backend app from ../backend/dist/index.js', err);
  throw err;
}

module.exports = serverless(app);
