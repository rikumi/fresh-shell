const fs = require('fs')
const vm = require('vm')
const repl = require('repl')
const json5 = require('json5')
const config = require('./config')
const context = require('./context')
const pathfind = require('./pathfind')
const prompter = require('./prompter')
const validateCode = require('./validate')
const stringArgv = require('./string-argv')
const expandHomeDir = require('expand-home-dir')
const validateIdentifier = require('is-var-name')

const sandbox = vm.createContext(context)

module.exports = (cmd, ctx, filename, callback) => {
  let multiline = /\n[\s\S]/.test(cmd)
  try {
    if (!cmd.trim()) {
      for (line of prompter.lastPrompt.split('\n')) {
        process.stdout.moveCursor(0, -1)
        process.stdout.clearLine(0)
      }
      return callback(null)
    }

    cmd = cmd.split(';').map(cmd => {
      if (typeof context[stringArgv(cmd)[0]] === 'function') {
        cmd = cmd.split('||').map(cmd =>
          cmd.split('&&').map(cmd =>
            cmd.split(/\s*\|\s*/).map((cmd, pipeLevel) => {
              let argv = stringArgv(cmd)
              if (pathfind(argv[0]) && !validateIdentifier(argv[0])) {
                argv.unshift('exec')
              }

              let arglist = argv.slice(1).map(arg => {
                try { arg = json5.parse(arg) } catch (e) { }

                if (typeof context[arg] === 'string' && validateIdentifier(arg)) {
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
      return cmd
    }).join('; ')

    process.stdout.moveCursor(0, -1)
    process.stdout.clearLine(0)

    let error = validateCode(cmd)
    let promptLastLine = prompter.lastPrompt.split('\n').slice(-1)[0]
    if (promptLastLine === '... ') {
      promptLastLine = ''
    }
    if (error) {
      let firstLine = !/\n[\s\S]/.test(cmd)
      console.log((firstLine ? promptLastLine : '    ') + config.colorizeCommand(cmd, undefined, false).split('\n').slice(-1)[0])
      return callback(new repl.Recoverable(error))
    } else {
      console.log(promptLastLine + config.colorizeCommand(cmd, undefined, true).split('\n').slice(-1)[0])
    }

    cmd.split(';').map(cmd => {
      let result = vm.runInContext(cmd, sandbox)
      console.log(config.colorizeOutput(result))
    })

    callback(null)
  } catch (e) {
    process.stdout.moveCursor(0, -1)
    process.stdout.clearLine(0)
    console.log(prompter.lastPrompt.split('\n').slice(-1)[0] + config.colorizeCommand(cmd, e, true))
    callback(null)
  }
}