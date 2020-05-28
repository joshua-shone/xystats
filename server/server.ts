const express = require('express');
const path = require('path');
const app = express();

const {google} = require('googleapis');
const analytics = google.analytics('v3');
const googleServiceAccountAuth = require('../google-service-account-auth.json');

import {Metrics} from '../types/metrics';

const DATA_FETCH_INTERVAL_MS = 3000;

const data: Metrics[] = [];

interface DataListener {
  (param:Metrics): void
}
const dataListeners: DataListener[] = [];

(async function main() {

  const jwtClient = new google.auth.JWT({
    email: googleServiceAccountAuth.client_email,
    key: googleServiceAccountAuth.private_key,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  await new Promise((resolve, reject) => jwtClient.authorize((error, tokens) => {
    if (error) reject(error);
    else resolve();
  }));
  // TODO: don't start Express if JWT authorization fails

  while (true) {
    // Note: I've seen similar projects that use setInterval() for this polling loop, but
    // it can cause a storm of parallel API requests because setInterval doesn't wait for
    // previous iterations to complete in the case of slow network conditions.

    const newData = await fetchFromGoogleAnalytics(jwtClient);
    // TODO: catch API request failures and log

    data.push(newData); // TODO: limit number of entries

    // Notify clients listening with server-sent events
    while (dataListeners.length > 0) {
      const callback = dataListeners.pop();
      callback(newData);
    }

    // TODO: account for duration of Analytics API fetch
    await new Promise(resolve => setTimeout(resolve, DATA_FETCH_INTERVAL_MS));

    // TODO: explicitly listen for exit signal?
  }
})();

app.use(express.static(path.join(__dirname, '../build')));

function sendIndexHtml(request, response) {
  response.sendFile(path.join(__dirname, 'build', 'index.html'));
}

app.get('/', sendIndexHtml);
app.get('/browsers', sendIndexHtml);
app.get('/os', sendIndexHtml);

app.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "http://localhost:3000");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/metrics', (request, response) => {
  response.send(data);
});

app.get('/live-events', async (request, response) => {
  response.status(200);
  response.set({
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
  });

  while (true) {
    const newData = await new Promise(resolve => dataListeners.push(resolve));
    response.write(`data: ${JSON.stringify(newData)}\n\n`);
  }
});

app.listen(8080, () => console.log(`Listening at http://localhost:8080`))

async function fetchFromGoogleAnalytics(jwtClient): Promise<Metrics> {

  const now = (new Date).getTime(); // TODO: synchronization?

  const response = await (<any>analytics.data.realtime.get)({
    auth: jwtClient,
    ids: 'ga:215194843',
    metrics: 'rt:activeUsers',
    dimensions: 'rt:browser,rt:operatingSystem', // TODO: make dimensions configurable
    output: 'json',
  });

  const columnNames = response.data.columnHeaders.map(header => header.name);
  const activeUsersColumnIndex = columnNames.indexOf('rt:activeUsers');
  const rows = response.data.rows || [];

  const activeUsers = rows.reduce((count, row) => count + parseInt(row[activeUsersColumnIndex]), 0);

  function getDimensionAsMap(dimension) {
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
    browsers: getDimensionAsMap('rt:browser'),
    os: getDimensionAsMap('rt:operatingSystem'),
  }
}

function generateInitialRandomData() {
  const data = [];
  const now = (new Date()).getTime();
  const entries = 30;
  for (let i=0; i < entries; i++) {
    data.push(generateRandomData(now - ((entries - i) * DATA_FETCH_INTERVAL_MS)));
  }
  return data;
}

function generateRandomData(timestamp): Metrics {
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
