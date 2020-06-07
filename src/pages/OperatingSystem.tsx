import React from 'react'

import { useSelector } from 'react-redux'

import SummaryStats from '../SummaryStats'
import Graph from '../Graph'
import { useStyles as useLoadingIndicatorStyles } from '../LoadingIndicator'
import { useStyles as useSummaryStatsStyles } from '../SummaryStats'

import { solarizedPalette } from '../theme'

export default function OperatingSystemPage () {
  const timeseries = useSelector(state => state.timeseries)
  const isLoadingMetrics = useSelector(state => state.isLoadingMetrics)

  const colors = [solarizedPalette.red, solarizedPalette.green, solarizedPalette.blue]

  const loadingIndicatorClasses = useLoadingIndicatorStyles();
  const summaryStatsClasses = useSummaryStatsStyles();

  const osTimeseries = timeseries.map(entry => ({ timestamp: entry.timestamp, ...entry.os }))

  return (
    <div className='overview'>
      <h2>Operating System</h2>
      {isLoadingMetrics ?
        <div className={`${loadingIndicatorClasses.root} ${summaryStatsClasses.root}`}></div>
        :
        <SummaryStats
          values={timeseries[timeseries.length - 1].browsers}
          colors={colors}
        />
      }
      <Graph
        data={osTimeseries}
        isLoading={isLoadingMetrics}
        keys={['Linux', 'Macintosh', 'Windows']}
        colors={colors}
      />
    </div>
  )
}
