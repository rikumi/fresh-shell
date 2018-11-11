const shell = require('shelljs')
const formatOutput = require('./output')

module.exports = (key) => {
  return shell[key] && ((...args) => {
    let output = shell[key](...args)
    return key !== 'echo' ? formatOutput(output) : undefined
  })
}