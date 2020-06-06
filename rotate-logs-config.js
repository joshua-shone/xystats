module.exports = {
  filter(data) {return true},
  output: {
    path: "server.log",
    options: {
      path: "logs/",
      size: "100M",
      rotate: 2
    }
  }
}
