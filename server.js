const express = require('express');
const path = require('path');
const app = express();

const {google} = require('googleapis');
const googleServiceAccountAuth = require('./google-service-account-auth.json');
const analytics = google.analytics('v3');

const data = []; // TODO: define types to be shared with client-side code
const dataListeners = [];
const dataFetchIntervalMs = 3000;

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
    const newData = await fetchFromGoogleAnalytics(jwtClient);
//     const newData = await generateRandomData();

    data.push(newData);

    // Notify clients listening with server-sent events
    while (dataListeners.length > 0) {
      const callback = dataListeners.pop();
      callback(newData);
    }

    // TODO: account for duration of Analytics API fetch
    await new Promise(resolve => setTimeout(resolve, dataFetchIntervalMs));

    // TODO: explicitly listen for exit signal?
  }
})();

app.use(express.static(path.join(__dirname, 'build')));

function sendIndexHtml(request, response) {
  response.sendFile(path.join(__dirname, 'build', 'index.html'));
}

app.get('/', sendIndexHtml);
app.get('/browsers', sendIndexHtml);
app.get('/os', sendIndexHtml);

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

app.listen(8080, () => console.log(`Example app listening at http://localhost:8080`))

async function generateRandomData() {
  const now = (new Date).getTime();

  const random = () => Math.floor(Math.random() * 42);

  return {
    timestamp: now,
    activeUsers: {
      value: random(),
    },
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

async function fetchFromGoogleAnalytics(jwtClient) {

  const now = (new Date).getTime(); // TODO: synchronization?

  const response = await analytics.data.realtime.get({
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
