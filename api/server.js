const serverless = require('serverless-http');

let app;
try {
  // Backend is built to backend/dist/index.js by the build step
  app = require('../backend/dist/index.js') || require('../backend/dist/index');
  // If module exports a default (because compiled with esModuleInterop), use it
  app = app.default || app;
} catch (err) {
  console.error('Failed to load backend app from ../backend/dist/index.js', err);
  throw err;
}

module.exports = serverless(app);
