const output = require('./output')
const cp = require('child_process')
const pathfind = require('./pathfind')

module.exports = (key) => {
  let file = pathfind(key)
  return file && ((...args) => {
    // Fix for stdin turning into non-raw mode after child process exits and cannot turn back
    // Fix for some child processes not being able to capture any input
    // https://stackoverflow.com/a/25804196
    process.stdin.setRawMode(false)
    let spawnReturns = cp.spawnSync(file, args, { stdio: 'inherit' })
    process.stdin.setRawMode(true)
    return output(spawnReturns)
  })
}