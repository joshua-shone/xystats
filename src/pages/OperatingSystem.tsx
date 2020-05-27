import React from 'react';

import { useSelector } from 'react-redux';

import SummaryStats from '../SummaryStats';
import Graph from '../Graph';

import { solarizedPalette } from '../App';

export default function OperatingSystemPage() {
  const metrics = useSelector(state => state.metrics);
  const colors = [solarizedPalette.red, solarizedPalette.green, solarizedPalette.blue];

  if (metrics.length > 0) {
    const os = metrics.map(entry => ({timestamp: entry.timestamp, ...entry.os}));

    return (
      <div className="overview">
        <h2>Operating System</h2>
        <SummaryStats
          values={metrics[metrics.length-1].os}
          colors={colors}
          />
        <Graph
          data={os}
          keys={['Linux', 'Macintosh', 'Windows']}
          colors={colors}
          />
      </div>
    );
  } else {
    return (
      <div>loading..</div>
    );
  }
}
