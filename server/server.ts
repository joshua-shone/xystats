const yargs = require('yargs');

const express = require('express');
const path = require('path');
const app = express();

const {google} = require('googleapis');
const analytics = google.analytics('v3');

import {Metrics} from '../types/metrics';

const argv = yargs.options({
  port: {
    type: 'number',
    default: 8080
  },
  polling_interval_ms: {
    type: 'number',
    default: 3000,
    describe: 'The number of milliseconds to wait after each fetch from Google Analytics',
  },
  max_timeseries_entries: {
    type: 'number',
    default: 200,
    describe: 'Once this number of fetches have been made, old metrics will be removed before new metrics are added.',
  },
  generate_random: {
    type: 'boolean',
    default: false,
    describe: 'Generate random metrics instead of fetching from Google Analytics.'
  },
})
.help()
.argv;

const timeseries: Metrics[] = [];

interface MetricsListener {
  (param:Metrics): void
}
const metricsListeners: Set<MetricsListener> = new Set();

main();

async function main() {

  if (argv.generate_random) {

    randomGenerationUpdateLoop();

  } else {

    const googleServiceAccount = require('../google-service-account.json');

    const jwtClient = new google.auth.JWT({
      email: googleServiceAccount.client_email,
      key: googleServiceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    await new Promise((resolve, reject) => jwtClient.authorize((error, tokens) => {
      if (error) reject(error);
      else resolve();
    }));

    googleAnalyticsUpdateLoop(jwtClient);
  }

  // For development convenience this server currently both acts as the API and
  // static fileserver for the client-side assets.
  // In an actual production deployment use of a separate CDN for the static assets would be more appropriate.
  app.use(express.static(path.join(__dirname, '../build')));

  function sendIndexHtml(request, response) {
    response.sendFile(path.join(__dirname, '../build', 'index.html'));
  }

  app.get('/', sendIndexHtml);
  app.get('/browsers', sendIndexHtml);
  app.get('/os', sendIndexHtml);

  app.use((request, response, next) => {
    // Allow the create-react-app development server to connect
    response.header("Access-Control-Allow-Origin", "http://localhost:3000");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.get('/metrics', (request, response) => {
    response.send(timeseries);
  });

  app.get('/live-events', (request, response) => {
    console.log('/live-events connection opened');

    response.status(200);
    response.set({
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
    });

    function onNewMetrics(metrics: Metrics) {
      response.write(`data: ${JSON.stringify(metrics)}\n\n`);
    }

    metricsListeners.add(onNewMetrics);

    response.on('close', () => {
      metricsListeners.delete(onNewMetrics);
      console.log('/live-events connection closed');
    });
  });

  app.listen(argv.port, () => console.log(`Listening at http://:${argv.port}`));
}

async function googleAnalyticsUpdateLoop(jwtClient) {

  while (true) {
    // Note: I've seen similar projects that use setInterval() for this polling loop, but
    // it can cause a storm of parallel API requests because setInterval doesn't wait for
    // previous iterations to complete in the case of slow network conditions.

    const metrics = await fetchFromGoogleAnalytics(jwtClient);

    if (metrics !== null) {
      timeseries.push(metrics);

      if (timeseries.length > argv.max_timeseries_entries) {
        timeseries.splice(0, timeseries.length - argv.max_timeseries_entries);
      }

      // Notify clients listening with server-sent events
      for (const callback of metricsListeners) {
        callback(metrics);
      }
    }

    // TODO: account for duration of Analytics API fetch
    await new Promise(resolve => setTimeout(resolve, argv.polling_interval_ms));

    // TODO: explicitly listen for exit signal?
  }
}

async function fetchFromGoogleAnalytics(jwtClient): Promise<Metrics | null> {

  const now = (new Date).getTime(); // TODO: synchronization?

  try {
    var response = await analytics.data.realtime.get({
      auth: jwtClient,
      ids: 'ga:215194843',
      metrics: 'rt:activeUsers',
      dimensions: 'rt:browser,rt:operatingSystem', // TODO: make dimensions configurable
      output: 'json',
    });
  } catch (error) {
    console.error(error);
    return null;
  }

  const columnNames = response.data.columnHeaders.map(header => header.name);
  const activeUsersColumnIndex = columnNames.indexOf('rt:activeUsers');
  const rows = response.data.rows || [];

  const activeUsers = rows.reduce((count, row) => count + parseInt(row[activeUsersColumnIndex]), 0);

  function getDimensionAsObject(dimension: string) {
    const map = {};
    const dimensionIndex = columnNames.indexOf(dimension);
    for (const row of rows) {
      const key = row[dimensionIndex];
      const value = parseInt(row[row.length-1]);
      map[key] = (map[key] || 0) + value;
    }
    return map;
  }

  return {
    timestamp: now,
    activeUsers: activeUsers,
    browsers: getDimensionAsObject('rt:browser'),
    os: getDimensionAsObject('rt:operatingSystem'),
  }
}

async function randomGenerationUpdateLoop() {
  const now = (new Date()).getTime();

  for (let i=0; i < argv.max_timeseries_entries; i++) {
    timeseries.push(generateRandomMetrics(now - ((argv.max_timeseries_entries - i) * argv.polling_interval_ms)));
  }

  while (true) {
    const metrics = generateRandomMetrics((new Date()).getTime());

    timeseries.push(metrics);

    // Notify clients listening with server-sent events
    for (const callback of metricsListeners) {
      callback(metrics);
    }

    await new Promise(resolve => setTimeout(resolve, argv.polling_interval_ms));
  }
}

function generateRandomMetrics(timestamp: number): Metrics {
  const random = () => Math.floor(Math.random() * 42);

  return {
    timestamp: timestamp,
    activeUsers: random(),
    browsers: {
      Firefox: random(),
      Chrome:  random(),
      Safari:  random(),
    },
    os: {
      Linux:     random(),
      Macintosh: random(),
      Windows:   random(),
    }
  }
}
