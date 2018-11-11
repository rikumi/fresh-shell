const output = require('./output')
const cp = require('child_process')
const pathfind = require('./pathfind')

module.exports = (key) => {
  let file = pathfind(key)
  return file && ((...args) => {
    let spawnReturns = cp.spawnSync(file, args, {
      stdio: 'inherit'
    })
    return output(spawnReturns)
  })
}