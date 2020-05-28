import React from 'react'

import { useSelector } from 'react-redux'

import Graph from '../Graph'

export default function OverviewPage () {
  const metrics = useSelector(state => state.metrics)

  if (metrics.length > 0) {
    const activeUsers = metrics.map(entry => ({ timestamp: entry.timestamp, value: entry.activeUsers }))
    return (
      <div className='overview'>
        <div className='current-active-users'>
          <div className='value'>{activeUsers[activeUsers.length - 1].value}</div>
          <label>Active users</label>
        </div>
        <Graph data={activeUsers} />
      </div>
    )
  } else {
    // TODO: pulsing loading effect
    return (
      <div>loading..</div>
    )
  }
}
