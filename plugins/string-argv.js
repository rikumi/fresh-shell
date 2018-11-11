const stringArgv = require('string-argv')

module.exports = (str) => {
  str = str.replace(/([^ \\]|\\ )+/g, arg => JSON.stringify(arg.replace(/\\ /g, ' ').trim()))
  return stringArgv(str)
}