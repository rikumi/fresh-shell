const shell = require('shelljs')
const formatOutput = require('./output')

module.exports = (key) => {
  return (typeof shell[key] === 'function') ? ((...args) => {
    let output = shell[key](...args)
    return formatOutput(key !== 'echo' ? output : undefined)
  }) : undefined
}