import React from 'react'

import { useSelector } from 'react-redux'

import Graph from '../Graph'
import { useStyles as useLoadingIndicatorStyles } from '../LoadingIndicator';

export default function OverviewPage () {
  const timeseries = useSelector(state => state.timeseries)
  const isLoadingMetrics = useSelector(state => state.isLoadingMetrics)

  const activeUsersTimeseries = timeseries.map(entry => ({ timestamp: entry.timestamp, value: entry.activeUsers }))

  const loadingIndicatorClasses = useLoadingIndicatorStyles();

  return (
    <div className='overview'>
      <div className='current-active-users'>
        <div className='value'>
          <span className={isLoadingMetrics ? loadingIndicatorClasses.root : ''}>
            {isLoadingMetrics ? '0' : activeUsersTimeseries[activeUsersTimeseries.length - 1].value}
          </span>
        </div>
        <label>Active users</label>
      </div>
      <Graph timeseries={activeUsersTimeseries} isLoading={isLoadingMetrics} />
    </div>
  )
}
