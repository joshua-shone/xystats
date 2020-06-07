import { createStore } from 'redux'

import { Metrics } from '../types/metrics'

interface State {
  timeseries: Metrics[],
  isLoadingMetrics: boolean,
  navOpenMobile: boolean,
}

const initialState: State = {
  timeseries: [],
  isLoadingMetrics: true,
  navOpenMobile: false
}

function reducer (state: State = initialState, action) {
  switch (action.type) {
    case 'ADD_METRICS':
      return {
        ...state,
        timeseries: state.timeseries.concat(action.timeseries)
      }
    case 'SET_METRICS_LOADING_STATE':
      return {
        ...state,
        isLoadingMetrics: action.isLoadingMetrics
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
