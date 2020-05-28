export interface Metrics {
  timestamp: number,
  activeUsers: number,
  browsers: {
    [key: string]: number,
  },
  os: {
    [key: string]: number,
  }
}
