const repl = require('repl')
const eval = require('./plugins/eval')
const config = require('./plugins/config')

// change error output into only one-line messages
process.on('unhandledRejection', e => { throw e })
process.on('uncaughtException', e => { console.log(e.message) })

// ignore Ctrl+C from child processes
process.on('SIGINT', () => {})

// TODO: Load custom configurations


// Welcome MOTD
process.stdout.write(config.welcome())

const cli = repl.start({
  prompt: (config._lastPrompt = config.prompt()),
  ignoreUndefined: true,
  completer: config.complete,
  writer: (output) => {
    output = config.colorizeOutput(output)
    cli.setPrompt(config._lastPrompt = config.prompt())
    return output
  },
  eval,
})

require('repl-history')(cli, {
  useHome: true,
  maxSave: 0
})