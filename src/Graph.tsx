import React, { useState, useEffect, useRef } from 'react';

import './Graph.css';

export default function Graph( {data, keys=['value'], colors=['#839496']} ) {
  const firstTimestamp = data[0].timestamp;

  function now() {
    return (new Date()).getTime();
  }

  const [rangeDuration, setRangeDuration] = useState(now() - firstTimestamp);
  const rangeDurationRef = useRef();
  rangeDurationRef.current = rangeDuration;

  const [rangeUntil, setRangeUntil] = useState('now');
  const rangeUntilRef = useRef();
  rangeUntilRef.current = rangeUntil;

  const svgRef = useRef(null);

  // Map data to SVG paths
  const stacks = data.map(entry => {
    let y = 0;
    return keys.map(key => [y, y += (entry[key] || 0)]);
  });
  const maxValue = Math.max(...stacks.map(stack => stack[keys.length-1][1]));
  const paths = keys.map((key, keyIndex) => (
    <path
      key={key}
      stroke={colors[keyIndex]}
      d={'M0,0 ' + stacks.map((stack, index) => `M${data[index].timestamp - firstTimestamp},${stack[keyIndex][0] / maxValue} V${stack[keyIndex][1] / maxValue} `).join('')}
    />
  ));

  // TODO: add X-axis ticks

  function onWheel(event) {
    zoom(event.deltaY < 0 ? 0.1 : -0.1);
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
      setRangeUntil(draggedRangeUntil >= now() ? 'now' : draggedRangeUntil); // TODO: throttle?
      lastPageX = event.pageX;
    }
    window.addEventListener('mousemove', onMousemove);
    window.addEventListener('mouseup', () => {
      window.removeEventListener('mousemove', onMousemove);
    }, {once: true});
  }

  function zoom(amount: number) {
    const currentRangeUntil = rangeUntil === 'now' ? now() : rangeUntil;
    let newRangeUntil = currentRangeUntil - (rangeDuration * (amount / 2));
    newRangeUntil = Math.min(newRangeUntil, now());
    setRangeUntil(newRangeUntil >= now() ? 'now' : newRangeUntil);
    rangeUntilRef.current = newRangeUntil;

    let newRangeDuration = rangeDuration * (1 - amount);
    newRangeDuration = Math.min(newRangeDuration, newRangeUntil - firstTimestamp);
    setRangeDuration(newRangeDuration);
  }

  function getViewBox() {
    const currentRangeUntil = rangeUntil === 'now' ? now() : rangeUntil;
    // TODO: allow SVG origin to start at timestamp 0 instead of firstTimestamp
    return `${(currentRangeUntil - rangeDuration) - firstTimestamp} 0 ${rangeDuration} 1`;
  }

  useEffect(() => {
    let animationFrameId = requestAnimationFrame(function callback(timestamp) {
      if (svgRef.current) {
        const currentRangeUntil = rangeUntilRef.current === 'now' ? now() : rangeUntilRef.current;
        svgRef.current.viewBox.baseVal.x = (currentRangeUntil - rangeDurationRef.current) - firstTimestamp;
      }
      animationFrameId = requestAnimationFrame(callback);
    });
    return () => cancelAnimationFrame(animationFrameId);
  }, [firstTimestamp]);

  return (
    <svg className="graph" viewBox={getViewBox()} preserveAspectRatio="none" ref={svgRef} onWheel={onWheel} onMouseDown={onMouseDown}>
      <g>
        {paths}
      </g>
    </svg>
  )
}
