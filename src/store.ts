import { createStore } from 'redux';

// TODO: add types, shared with server

const initialState = {
  navOpenMobile: false,
  metrics: [],
//   activeUsers: [],
//   browsers: [],
//   os: [],
}

function reducer(state = initialState, action) {
  switch (action.type) {
    case 'ADD_METRICS':
      return {
        ...state,
        metrics: state.metrics.concat(action.metrics),
//         activeUsers: state.activeUsers.concat(action.data.activeUsers || []),
//         browsers: state.browsers.concat(action.data.browsers || []),
//         os: state.os.concat(action.data.os || []),
      }
    case 'TOGGLE_NAV_MOBILE':
      return {
        ...state,
        navOpenMobile: !state.navOpenMobile,
      }
    default:
      return state
  }
}

export default createStore(
  reducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
);
