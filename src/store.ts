import { createStore } from 'redux'

import { Metrics } from '../types/metrics'

interface State {
  metrics: Metrics[],
  navOpenMobile: boolean,
}

const initialState: State = {
  metrics: [],
  navOpenMobile: false
}

function reducer (state: State = initialState, action) {
  switch (action.type) {
    case 'ADD_METRICS':
      return {
        ...state,
        metrics: state.metrics.concat(action.metrics)
      }
    case 'TOGGLE_NAV_MOBILE':
      return {
        ...state,
        navOpenMobile: !state.navOpenMobile
      }
    default:
      return state
  }
}

export default createStore(
  reducer,
  (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
)
