import React, { useState, useEffect, useRef, useCallback } from 'react'

import GraphPaths from './GraphPaths';

import { Metrics } from '../types/metrics'

import { makeStyles } from '@material-ui/core/styles'
import { useStyles as useLoadingIndicatorStyles } from './LoadingIndicator';

import { solarizedPalette } from './theme'

const DEFAULT_GRAPH_RANGE_MS = 5 * 60 * 1000

const MAX_TICK_COUNT = 10
const TICK_INTERVALS_MS = [5000, 10000, 30000, 60000, 60000 * 5, 60000 * 10]

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '15rem',
    overflow: 'hidden',
    cursor: 'grab',
    flexGrow: 1
  },
  svg: {
    flexGrow: 1
  },
  tickContainer: {
    height: '1.1rem',
    position: 'relative'
  },
  tick: {
    position: 'absolute',
    fontSize: '1rem'
  }
})

interface Props {
  timeseries: Metrics[],
  isLoading: boolean,
  keys?: string[],
  colors?: string[],
}

export default function Graph ({ timeseries, isLoading, keys = ['value'], colors = [solarizedPalette.base0] }: Props) {
  const classes = useStyles()
  const loadingIndicatorClasses = useLoadingIndicatorStyles();

  const firstTimestamp = timeseries.length > 0 ? timeseries[0].timestamp : 0;

  // View ranges
  const [rangeDuration, setRangeDuration] = useState(DEFAULT_GRAPH_RANGE_MS)
  const [rangeUntil, setRangeUntil] = useState<number | 'now'>('now')

  const tickTimestamps: number[] = []

  const tickRangeEnd = rangeUntil === 'now' ? now() : rangeUntil
  const tickRangeEndRef = useRef<number>()
  tickRangeEndRef.current = tickRangeEnd
  const tickRangeStart = tickRangeEnd - rangeDuration

  // Find the smallest tick interval that won't exceed the maximum number of ticks
  // TODO: determine MAX_TICK_COUNT based on svg width
  const tickIntervalMs = TICK_INTERVALS_MS.find(interval => (rangeDuration / interval) <= MAX_TICK_COUNT)
  if (tickIntervalMs) {
    const firstTickTimestamp = Math.floor(tickRangeStart / tickIntervalMs) * tickIntervalMs
    for (let i = firstTickTimestamp; i <= tickRangeEnd; i += tickIntervalMs) {
      tickTimestamps.push(i)
    }
  }

  const ticks = tickTimestamps.map(timestamp => (
    <span
      key={timestamp}
      className={classes.tick}
      style={{ left: `${((timestamp - tickRangeStart) / rangeDuration) * 100}%` }}
    >
      {getTickTextForTimestamp(timestamp)}
    </span>
  ))

  // Get the sum of values in each timeseries entry
  const metricsSums = timeseries.map(metrics => keys.reduce((sum, key) => sum + metrics[key], 0))

  // Get the highest point on the graph, to determine the viewBox height
  // TODO: dynamically adjust viewBox height depending on max value in view range
  const maxValue = Math.max(...metricsSums)

  const getViewBox = useCallback(() => {
    const currentRangeUntil = rangeUntil === 'now' ? now() : rangeUntil

    const minX = (currentRangeUntil - rangeDuration) - firstTimestamp
    const minY = 0
    const width = rangeDuration
    const height = maxValue

    return `${minX} ${minY} ${width} ${height}`
  }, [rangeUntil, rangeDuration, firstTimestamp, maxValue])

  function zoom (factor: number) {
    const currentRangeUntil = rangeUntil === 'now' ? now() : rangeUntil
    let newRangeUntil = currentRangeUntil + (((rangeDuration * factor) - rangeDuration) / 2)
    newRangeUntil = Math.min(newRangeUntil, now())
    setRangeUntil(newRangeUntil >= now() ? 'now' : newRangeUntil)

    let newRangeDuration = rangeDuration * factor
    newRangeDuration = Math.min(newRangeDuration, newRangeUntil - firstTimestamp)
    setRangeDuration(newRangeDuration)
  }

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tickContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If the range is locked to 'now', smoothly scroll the graph forward in time
    // by animating the viewBox
    if (rangeUntil === 'now') {
      let animationFrameId = requestAnimationFrame(function callback (timestamp) {
        if (svgRef.current) {
          // A Ref is used to directly set the DOM attribute to avoid thrashing React rendering
          svgRef.current.setAttribute('viewBox', getViewBox())
        }
        if (tickContainerRef.current && tickRangeEndRef.current) {
          tickContainerRef.current.style.transform = `translateX(${((tickRangeEndRef.current - now()) / rangeDuration) * 100}%)`
        }
        animationFrameId = requestAnimationFrame(callback)
      })
      return () => cancelAnimationFrame(animationFrameId)
    }
  }, [rangeUntil, rangeDuration, getViewBox])

  function onWheel (event) {
    zoom(event.deltaY > 0 ? 1.1 : 1 / 1.1)
  }

  function onMouseDown (event) {
    event.preventDefault()
    if (containerRef.current === null) {
      return
    }
    const boundingRect = containerRef.current.getBoundingClientRect()
    let draggedRangeUntil = rangeUntil === 'now' ? now() : rangeUntil
    let lastPageX = event.pageX
    function onMousemove (event) {
      const deltaXRatio = (event.pageX - lastPageX) / boundingRect.width
      draggedRangeUntil -= rangeDuration * deltaXRatio
      draggedRangeUntil = Math.max(draggedRangeUntil, firstTimestamp + rangeDuration)
      setRangeUntil(draggedRangeUntil >= now() ? 'now' : draggedRangeUntil)
      lastPageX = event.pageX
    }
    window.addEventListener('mousemove', onMousemove)
    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', onMousemove)
    }, { once: true })
  }

  return (
    <div className={classes.root} ref={containerRef} onWheel={onWheel} onMouseDown={onMouseDown}>
      {isLoading ? <div className={loadingIndicatorClasses.root}></div> :
        <svg
          className={classes.svg}
          ref={svgRef}
          viewBox={getViewBox()}
          preserveAspectRatio='none'
        >
          <GraphPaths timeseries={timeseries} keys={keys} colors={colors}/>
        </svg>
      }
      <div ref={tickContainerRef} className={classes.tickContainer}>
        {ticks}
      </div>
    </div>
  )
}

function now () {
  return (new Date()).getTime()
}

function getTickTextForTimestamp (timestamp: number) {
  const seconds = String(Math.floor(timestamp / 1000) % 60).padStart(2, '0')
  const minutes = String(Math.floor(timestamp / 60000) % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
