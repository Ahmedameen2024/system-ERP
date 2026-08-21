const serverless = require('serverless-http');
const path = require('path');

if (!process.env.VERCEL) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });
  } catch (e) { }
}

let app;
try {
  let imported;
  try {
    imported = require('../../backend/dist/index.js');
  } catch (e) {
    imported = require('../backend/dist/index.js');
  }
  app = imported.default || imported;
} catch (err) {
  console.error('[Vercel Frontend API] Failed to load backend app:', err.message);
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
