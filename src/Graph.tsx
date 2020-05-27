import React, { useState, useEffect, useRef } from 'react';

import { makeStyles } from '@material-ui/core/styles';

const DEFAULT_GRAPH_RANGE_MS = 60 * 1000;
const POLLING_INTERVAL_MS = 3000;

const useStyles = makeStyles({
  root: {
    minHeight: '15rem',
    cursor: 'grab',
    flexGrow: 1,
  },
  path: {
    fill: 'none',
    strokeWidth: POLLING_INTERVAL_MS * 0.75,
    transform: 'scaleY(-1) translateY(-100%)', // Flip vertically so a Y value of zero appears on the bottom
  }
});

// TODO: source default color from theme palette

export default function Graph( {data, keys=['value'], colors=['#839496']} ) {

  const classes = useStyles();

  const firstTimestamp = data[0].timestamp;

  // View ranges
  const [rangeDuration, setRangeDuration] = useState(DEFAULT_GRAPH_RANGE_MS);
  const [rangeUntil, setRangeUntil] = useState('now');

  // Add up values in each entry to get stack segment positions
  const stacks = data.map(entry => {
    let y = 0;
    return keys.map(key => [y, y += (entry[key] || 0)]);
  });

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
  ));
  // TODO: Splitting up paths based on a certain duration threshold may improve React reconciliation performance
  // TODO: add X-axis ticks

  // Get the highest point on the graph, to determine the viewBox height
  const maxValue = Math.max(...stacks.map(stack => stack[keys.length-1][1]));

  function getViewBox() {
    const currentRangeUntil = rangeUntil === 'now' ? now() : rangeUntil;

    const minX = (currentRangeUntil - rangeDuration) - firstTimestamp;
    const minY = 0;
    const width = rangeDuration;
    const height = maxValue;

    return `${minX} ${minY} ${width} ${height}`;
  }

  function zoom(factor: number) {
    const currentRangeUntil = rangeUntil === 'now' ? now() : rangeUntil;
    let newRangeUntil = currentRangeUntil + (((rangeDuration * factor) - rangeDuration) / 2);
    newRangeUntil = Math.min(newRangeUntil, now());
    setRangeUntil(newRangeUntil >= now() ? 'now' : newRangeUntil);

    let newRangeDuration = rangeDuration * factor;
    newRangeDuration = Math.min(newRangeDuration, newRangeUntil - firstTimestamp);
    setRangeDuration(newRangeDuration);
  }

  const svgRef = useRef(null);

  useEffect(() => {
    // If the range is locked to 'now', smoothly scroll the graph forward in time
    // by animating the viewBox
    if (rangeUntil === 'now') {
      let animationFrameId = requestAnimationFrame(function callback(timestamp) {
        if (svgRef.current) {
          // A Ref is used to directly set the DOM attribute to avoid thrashing React rendering
          svgRef.current.setAttribute('viewBox', getViewBox());
        }
        animationFrameId = requestAnimationFrame(callback);
      });
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [rangeUntil, rangeDuration, firstTimestamp]);

  function onWheel(event) {
    zoom(event.deltaY > 0 ? 1.1 : 1/1.1);
  }

  function onMouseDown(event) {
    event.preventDefault();
    let draggedRangeUntil = rangeUntil === 'now' ? now() : rangeUntil;
    let lastPageX = event.pageX;
    const boundingRect = svgRef.current.getBoundingClientRect();
    function onMousemove(event) {
      const deltaXRatio = (event.pageX - lastPageX) / boundingRect.width;
      draggedRangeUntil -= rangeDuration * deltaXRatio;
      draggedRangeUntil = Math.max(draggedRangeUntil, firstTimestamp + rangeDuration);
      setRangeUntil(draggedRangeUntil >= now() ? 'now' : draggedRangeUntil);
      // TODO: calling setRangeUntil() here causes a re-render (and rebuild of the graph) on every
      // mouse move event, which is quite inefficient. Need to find a way to update the viewBox cheaply..
      lastPageX = event.pageX;
    }
    window.addEventListener('mousemove', onMousemove);
    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', onMousemove);
    }, {once: true});
  }

  return (
    <svg
      className={classes.root}
      viewBox={getViewBox()}
      preserveAspectRatio="none"
      ref={svgRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
    >
      {paths}
    </svg>
  )
}

function now() {
  return (new Date()).getTime();
}
