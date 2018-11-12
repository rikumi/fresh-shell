const shell = require('shelljs')
const formatOutput = require('./output')

module.exports = (key) => {
  return (typeof shell[key] === 'function') ? ((...args) => {
    let output = shell[key](...args)
    return key !== 'echo' ? formatOutput(output) : undefined
  }) : undefined
}