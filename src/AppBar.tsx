import React from 'react'
import { useDispatch } from 'react-redux'

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles'

import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles((theme: Theme) => {
  const drawerWidth = 240
  return createStyles({
    appBar: {
      marginLeft: drawerWidth,
      [theme.breakpoints.up('sm')]: {
        width: `calc(100% - ${drawerWidth}px)`
      }
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none'
      }
    }
  })
})

export default function StatsAppBar () {
  const dispatch = useDispatch()
  const classes = useStyles()
  return (
    <AppBar position='fixed' className={classes.appBar}>
      <Toolbar>
        <IconButton
          color='inherit'
          aria-label='open drawer'
          edge='start'
          onClick={() => dispatch({ type: 'TOGGLE_NAV_MOBILE' })}
          className={classes.menuButton}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant='h6' noWrap>
          xystats
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
