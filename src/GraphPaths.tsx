import React from 'react'

import { Metrics } from '../types/metrics'

import { makeStyles } from '@material-ui/core/styles'

const POLLING_INTERVAL_MS = 10000 // TODO: move to server/client common directory

const useStyles = makeStyles({
  path: {
    fill: 'none',
    strokeWidth: POLLING_INTERVAL_MS * 0.75,
    transform: 'scaleY(-1) translateY(-100%)' // Flip vertically so a Y value of zero appears on the bottom
  }
})

interface Props {
  timeseries: Metrics[],
  keys: string[],
  colors: string[],
}

function propsEqual(prevProps: Props, nextProps: Props) {
  // TODO: improve timeseries comparison, perhaps using an immutability library
  // just the timeseries length is compared for now as it's fast and covers known cases
  return prevProps.timeseries.length === nextProps.timeseries.length &&
    prevProps.keys.join('') === nextProps.keys.join('') &&
    prevProps.colors.join('') === nextProps.colors.join('')
}

export default React.memo(function GraphPaths ({ timeseries, keys, colors }: Props) {
  const classes = useStyles()

  const firstTimestamp = timeseries[0].timestamp;

  // Add up values in each entry to get stack segment positions
  const stacks = timeseries.map(metrics => {
    let y = 0
    return keys.map(key => [y, y += (metrics[key] || 0)]) // eslint-disable-line no-return-assign
  })

  // Map stacks to SVG paths
  // Each key is given a separate path so it can be assigned its own color
  const paths = keys.map((key, keyIndex) => (
    <path
      className={classes.path}
      key={key}
      stroke={colors[keyIndex]}
      d={
        stacks.map((stack, index) =>
          `M${timeseries[index].timestamp - firstTimestamp},${stack[keyIndex][0]} V${stack[keyIndex][1]} `
        ).join('')
      }
    />
  ))
  // TODO: Splitting up paths based on a certain duration threshold may improve React reconciliation performance

  return (
    <g>
      {paths}
    </g>
  )
}, propsEqual)
