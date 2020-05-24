import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';

import { NavLink } from 'react-router-dom';

import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles((theme: Theme) => {
  const drawerWidth = 240;
  return createStyles({
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
    },
  })
});

export default function Nav() {
  const dispatch = useDispatch();
  const navOpenMobile = useSelector(state => state.navOpenMobile);
  const classes = useStyles();

  const drawer = (
    <div>
      <div className={classes.toolbar} />
      <List>
        <ListItem button component={NavLink} to="/" activeClassName="selected" exact>
          <ListItemText primary="Overview" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button component={NavLink} to="/browsers" activeClassName="selected" exact>
          <ListItemText primary="Browsers" />
        </ListItem>
        <ListItem button component={NavLink} to="/os" activeClassName="selected" exact>
          <ListItemText primary="OS" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <nav className={classes.drawer} aria-label="mailbox folders">
      <Hidden smUp implementation="css">
        <Drawer
          variant="temporary"
          anchor="left"
          open={navOpenMobile}
          onClose={() => dispatch({type: 'TOGGLE_NAV_MOBILE'})}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </Drawer>
      </Hidden>
      <Hidden xsDown implementation="css">
        <Drawer
          classes={{
            paper: classes.drawerPaper,
          }}
          variant="permanent"
          open
        >
          {drawer}
        </Drawer>
      </Hidden>
    </nav>
  )
}
