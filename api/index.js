const serverless = require('serverless-http');
const path = require('path');

// Force dotenv to load from backend/.env when running locally
// On Vercel, environment variables are injected directly
if (!process.env.VERCEL) {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
}

let app;
try {
  const imported = require('../backend/dist/index.js');
  app = imported.default || imported;
} catch (err) {
  console.error('[Vercel] Failed to load backend app:', err.message);
  // Return a basic error handler
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      success: false,
      message: 'Backend failed to initialize',
      error: err.message
    });
  });
}

module.exports = serverless(app);
