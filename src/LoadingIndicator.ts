import { makeStyles } from '@material-ui/core/styles'

import { solarizedPalette } from './theme';

export const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    cursor: 'wait',
    background: solarizedPalette.base0,
    color: 'transparent',
    animationName: '$pulse',
    animationDuration: '1s',
    animationFillMode: 'both',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationTimingFunction: 'ease-in-out',
  },
  '@keyframes pulse': {
    from: { opacity: .4, },
    to: { opacity: 1, },
  }
})
