import React from 'react';

import { useSelector } from 'react-redux';

import Graph from '../Graph';

export default function OperatingSystemPage() {
  const metrics = useSelector(state => state.metrics);

  if (metrics.length > 0) {
    const os = metrics.map(entry => ({timestamp: entry.timestamp, ...entry.os}));
    const latestValues = os[os.length-1];

    return (
      <div className="overview">
        <div>
          <label>Operating System</label>
        </div>
        <div>
          <span>Linux: {latestValues.Linux}</span>
          <span>Macintosh: {latestValues.Macintosh}</span>
          <span>Windows: {latestValues.Windows}</span>
        </div>
        <Graph
          data={os}
          keys={['Linux', 'Macintosh', 'Windows']}
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
