import React from 'react';

import { useSelector } from 'react-redux';

import Graph from '../Graph';

export default function BrowsersPage() {
  const metrics = useSelector(state => state.metrics);

  if (metrics.length > 0) {
    const browsers = metrics.map(entry => ({timestamp: entry.timestamp, ...entry.browsers}));
    const latestValues = browsers[browsers.length-1];

    return (
      <div className="overview">
        <div>
          <label>Browsers</label>
        </div>
        <div>
          <span>Chrome: {latestValues.Chrome}</span>
          <span>Firefox: {latestValues.Firefox}</span>
          <span>Safari: {latestValues.Safari}</span>
        </div>
        <Graph
          data={browsers}
          keys={['Chrome', 'Firefox', 'Safari']}
          colors={['#dc322f', '#859900', '#268bd2']}
          />
      </div>
    );
  } else {
    return (
      <div>loading..</div>
    );
  }
}
