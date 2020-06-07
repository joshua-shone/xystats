import React from 'react'

import { makeStyles } from '@material-ui/core/styles'

export const useStyles = makeStyles({
  root: {
    width: '40rem',
    height: '2.8rem',
    maxWidth: '70%',
    marginBottom: '1rem',
    flexGrow: 0,
  },
  bar: {
    height: '1.2rem',
    display: 'inline-block',
    overflow: 'hidden',
    color: '#002b36',
    textAlign: 'center'
  },
  label: {
    height: '1rem',
    fontWeight: 'bold',
    marginRight: '1rem'
  }
})

export default function SummaryStats ({ values, colors }) {
  const classes = useStyles()

  const sortedValues = Object.entries(values).map(([label, value]) => ({ label, value }))
  sortedValues.sort((a: any, b: any) => b.value - a.value)

  const total = sortedValues.reduce((count, entry: any) => count + entry.value, 0)

  return (
    <div className={classes.root}>

      <div>{sortedValues.map((entry: any, index) => (
        <span
          key={entry.label}
          className={classes.bar}
          style={{ background: colors[index], width: `${(entry.value / total) * 100}%` }}
        >
          {((entry.value / total) * 100).toFixed(1)}%
        </span>
      ))}
      </div>

      <div>{sortedValues.map((entry: any, index) => (
        <label
          key={entry.label}
          className={classes.label}
          style={{ color: colors[index] }}
        >
          {entry.label}: {entry.value}
        </label>
      ))}
      </div>

    </div>
  )
}
