import React from 'react'

import { useSelector } from 'react-redux'

import SummaryStats from '../SummaryStats'
import Graph from '../Graph'
import { useStyles as useLoadingIndicatorStyles } from '../LoadingIndicator'
import { useStyles as useSummaryStatsStyles } from '../SummaryStats'

import { solarizedPalette } from '../theme'

export default function BrowsersPage () {
  const timeseries = useSelector(state => state.timeseries)
  const isLoadingMetrics = useSelector(state => state.isLoadingMetrics)

  const colors = [solarizedPalette.red, solarizedPalette.green, solarizedPalette.blue]

  const loadingIndicatorClasses = useLoadingIndicatorStyles();
  const summaryStatsClasses = useSummaryStatsStyles();

  const browsersTimeseries = timeseries.map(entry => ({ timestamp: entry.timestamp, ...entry.browsers }))

  return (
    <div className='overview'>
      <h2>Browsers</h2>
      {isLoadingMetrics ?
        <div className={`${loadingIndicatorClasses.root} ${summaryStatsClasses.root}`}></div>
        :
        <SummaryStats
          values={timeseries[timeseries.length - 1].browsers}
          colors={colors}
        />
      }
      <Graph
        timeseries={browsersTimeseries}
        isLoading={isLoadingMetrics}
        keys={['Chrome', 'Firefox', 'Safari']}
        colors={colors}
      />
    </div>
  )
}
