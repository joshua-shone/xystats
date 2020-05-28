import React from 'react'

import { useSelector } from 'react-redux'

import SummaryStats from '../SummaryStats'
import Graph from '../Graph'

import { solarizedPalette } from '../App'

export default function BrowsersPage () {
  const metrics = useSelector(state => state.metrics)
  const colors = [solarizedPalette.red, solarizedPalette.green, solarizedPalette.blue]

  if (metrics.length > 0) {
    const browsers = metrics.map(entry => ({ timestamp: entry.timestamp, ...entry.browsers }))

    return (
      <div className='overview'>
        <h2>Browsers</h2>
        <SummaryStats
          values={metrics[metrics.length - 1].browsers}
          colors={colors}
        />
        <Graph
          data={browsers}
          keys={['Chrome', 'Firefox', 'Safari']}
          colors={colors}
        />
      </div>
    )
  } else {
    return (
      <div>loading..</div>
    )
  }
}
