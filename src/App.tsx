import React, { useEffect } from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';

import { useDispatch } from 'react-redux';

import CssBaseline from '@material-ui/core/CssBaseline';

import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
  Theme,
  createStyles
} from '@material-ui/core/styles';

import './App.css';

import AppBar from './AppBar';
import Nav from './Nav';

import OverviewPage from './pages/Overview';
import BrowsersPage from './pages/Browsers';
import OperatingSystemPage from './pages/OperatingSystem';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      // Fetch initial data
      const response = await fetch('/metrics');
      const json = await response.json();
      dispatch({
        type: 'ADD_METRICS',
        metrics: json,
      });

      // Listen for updates
      const eventSource = new EventSource('/live-events');
      eventSource.onmessage = event => {
        const newData = JSON.parse(event.data);
        dispatch({
          type: 'ADD_METRICS',
          metrics: newData,
        });
      }
    })()
  }, [dispatch]);

  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className={classes.root}>
          <CssBaseline />
          <AppBar />
          <Nav />
          <main className={classes.content}>
            <div className={classes.toolbar} />
            <Switch>
              <Route path="/browsers">
                <BrowsersPage/>
              </Route>
              <Route path="/os">
                <OperatingSystemPage/>
              </Route>
              <Route path="/">
                <OverviewPage/>
              </Route>
            </Switch>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

const theme = createMuiTheme({
  palette: {
    type: 'dark',
    background: {
      default: '#002b36',
      paper: '#073642',
    },
    text: {
      primary: '#839496',
    },
    primary: {
      main: '#002b36ff',
    },
  }
});

const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    root: {
      display: 'flex',
      height: '100vh',
    },
    toolbar: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
  })
});

export default App;
