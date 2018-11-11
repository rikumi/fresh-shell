const fs = require('fs')
const util = require('util')
const path = require('path')
const chalk = require('chalk')
const moment = require('moment')
const glob = require('glob')
const tokens = require('js-tokens')
const stringArgv = require('string-argv')

const colorizer = (code) => {
  let result = ''
  let match = tokens.default.exec(code)
  while (match) {
    let token = tokens.matchToToken(match)
    result += {
      string: chalk.green,
      comment: chalk.gray,
      regex: chalk.cyan,
      number: chalk.yellow,
      name: chalk.reset,
      punctuator: chalk.gray,
      whitespace: chalk.reset,
      invalid: chalk.red,
    }[token.type](token.value)
    match = tokens.default.exec(code)
  }
  return result
}

module.exports = {
  env: [
    require('./shell'),
    require('./exec'),
    require
  ],
  welcome() {
    return ''
  },
  prompt() {
    return chalk.blue('\n' + path.basename(process.cwd()) + ' ❯ ')
  },
  complete(line) {
    let last = stringArgv(line).slice(-1)[0] || ''
    let pattern = path.join(process.cwd(), last.replace(/(\/|$)/g, '*$1'))
    let hits = glob.sync(pattern)
    hits = hits.map(hit => {
      return path.basename(hit) + (fs.statSync(hit).isDirectory() ? '/' : '')
    })
    return [hits, path.basename(last)]
  },
  colorizeCommand(command) {
    return colorizer(command.trim()) + chalk.gray(' - ' + moment().format('H:mm:ss'))
  },
  colorizeOutput(output) {
    return colorizer(util.inspect(output, false, 8, false))
  }
}