'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { getDb } = require('./db/init');
const membersRouter = require('./routes/members');
const sprintsRouter = require('./routes/sprints');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// Initialize DB eagerly so first request doesn't pay the cost
getDb();

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/members', membersRouter);
app.use('/api/sprints', sprintsRouter);

// In production, serve the built React app
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[server error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Quality Buddy API listening on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
