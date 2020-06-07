import React, { useState, useEffect, useRef, useCallback } from 'react'

import { Metrics } from '../types/metrics'

import { makeStyles } from '@material-ui/core/styles'
import { useStyles as useLoadingIndicatorStyles } from './LoadingIndicator';

import { solarizedPalette } from './theme'

const DEFAULT_GRAPH_RANGE_MS = 5 * 60 * 1000
const POLLING_INTERVAL_MS = 10000

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
  path: {
    fill: 'none',
    strokeWidth: POLLING_INTERVAL_MS * 0.75,
    transform: 'scaleY(-1) translateY(-100%)' // Flip vertically so a Y value of zero appears on the bottom
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

interface GraphProps {
  data: Metrics[],
  isLoading: boolean,
  keys?: string[],
  colors?: string[],
}

export default function Graph ({ data, isLoading, keys = ['value'], colors = [solarizedPalette.base0] }: GraphProps) {
  const classes = useStyles()
  const loadingIndicatorClasses = useLoadingIndicatorStyles();

  const firstTimestamp = data.length > 0 ? data[0].timestamp : 0;

  // View ranges
  const [rangeDuration, setRangeDuration] = useState(DEFAULT_GRAPH_RANGE_MS)
  const [rangeUntil, setRangeUntil] = useState<number | 'now'>('now')

  // Add up values in each entry to get stack segment positions
  const stacks = data.map(entry => {
    let y = 0
    return keys.map(key => [y, y += (entry[key] || 0)]) // eslint-disable-line no-return-assign
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
          `M${data[index].timestamp - firstTimestamp},${stack[keyIndex][0]} V${stack[keyIndex][1]} `
        ).join('')
      }
    />
  ))
  // TODO: Splitting up paths based on a certain duration threshold may improve React reconciliation performance

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

  // Get the highest point on the graph, to determine the viewBox height
  const maxValue = Math.max(...stacks.map(stack => stack[keys.length - 1][1]))

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
    if (svgRef.current === null) {
      return
    }
    const boundingRect = svgRef.current.getBoundingClientRect()
    let draggedRangeUntil = rangeUntil === 'now' ? now() : rangeUntil
    let lastPageX = event.pageX
    function onMousemove (event) {
      const deltaXRatio = (event.pageX - lastPageX) / boundingRect.width
      draggedRangeUntil -= rangeDuration * deltaXRatio
      draggedRangeUntil = Math.max(draggedRangeUntil, firstTimestamp + rangeDuration)
      setRangeUntil(draggedRangeUntil >= now() ? 'now' : draggedRangeUntil)
      // TODO: calling setRangeUntil() here causes a re-render (and rebuild of the graph) on every
      // mouse move event, which is quite inefficient. Need to find a way to update the viewBox cheaply..
      lastPageX = event.pageX
    }
    window.addEventListener('mousemove', onMousemove)
    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', onMousemove)
    }, { once: true })
  }

  return (
    <div className={classes.root}>
      {isLoading ? <div className={loadingIndicatorClasses.root}></div> :
        <svg
          className={classes.svg}
          viewBox={getViewBox()}
          preserveAspectRatio='none'
          ref={svgRef}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
        >
          {paths}
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
