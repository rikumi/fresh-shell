const fs = require('fs')
const vm = require('vm')
const repl = require('repl')
const json5 = require('json5')
const config = require('./config')
const context = require('./context')
const prompter = require('./prompter')
const validate = require('is-var-name')
const stringArgv = require('./string-argv')
const expandHomeDir = require('expand-home-dir')

const sandbox = vm.createContext(context)

module.exports = (cmd, ctx, filename, callback) => {
  try {
    if (!cmd.trim()) {
      for (line of prompter.lastPrompt.split('\n')) {
        process.stdout.moveCursor(0, -1)
        process.stdout.clearLine(0)
      }
      return callback(null)
    }

    process.stdout.moveCursor(0, -1)
    process.stdout.clearLine(0)
    console.log(prompter.lastPrompt.split('\n').slice(-1)[0] + config.colorizeCommand(cmd))

    cmd = cmd.split(';').map(cmd => {
      if (typeof context[stringArgv(cmd)[0]] === 'function') {
        cmd = cmd.split('||').map(cmd =>
          cmd.split('&&').map(cmd =>
            cmd.split(/\s*\|\s*/).map((cmd, pipeLevel) => {
              let argv = stringArgv(cmd)
              let arglist = argv.slice(1).map(arg => {
                try { arg = json5.parse(arg) } catch (e) { }

                if (typeof context[arg] === 'string' && validate(arg)) {
                  return arg
                } else {
                  try {
                    let file = expandHomeDir(arg)
                    if (fs.existsSync(file)) arg = file
                  } catch (e) { }
                  return json5.stringify(arg)
                }
              })
              if (pipeLevel) {
                arglist.push('_')
              }
              let invocation = argv[0] + '(' + arglist.join(', ') + ')'
              if (pipeLevel) {
                invocation = (pipeLevel ? '.filter(_ => ' : '') + invocation + ')'
              }
              return invocation
            }).join('')
          ).join(' && ')
        ).join(' || ')
      }
      console.log(config.colorizeOutput(vm.runInContext(cmd, sandbox)))
      return cmd
    }).join('; ')
    callback(null)
  } catch (e) {
    if (e.name === 'SyntaxError' && /^(Unexpected end of input|Unexpected token)/.test(e.message)) {
      return callback(new repl.Recoverable(e))
    } else {
      console.error(e.message)
    }
  }
}