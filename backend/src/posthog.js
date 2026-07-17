'use strict';

require('dotenv').config();

const { PostHog } = require('posthog-node');

const posthog = new PostHog(process.env.POSTHOG_PROJECT_TOKEN, {
  host: process.env.POSTHOG_HOST,
});

function captureServerEvent(req, event, properties = {}) {
  const distinctId = req.get('X-POSTHOG-DISTINCT-ID');
  if (!distinctId) return;

  posthog.capture({
    distinctId,
    event,
    properties,
  });
}

module.exports = { captureServerEvent };
