const fs = require('fs')
const vm = require('vm')
const repl = require('repl')
const json5 = require('json5')
const config = require('./config')
const context = require('./context')
const pathfind = require('./pathfind')
const prompter = require('./prompter')
const validateCode = require('./validate')
const stringWidth = require('string-width')
const stringArgv = require('string-to-argv')
const expandHomeDir = require('expand-home-dir')
const validateIdentifier = require('is-var-name')

const sandbox = vm.createContext(context)

const clearLines = (prompt, cmd) => {
  let lines = (prompt + cmd.replace(/\n$/, '') + '|').split('\n').map(cmd => {
    return Math.ceil(Math.max(1, stringWidth(cmd)) / (process.stdout.columns || 60))
  }).reduce((a, b) => a + b, 0)
  
  for (let line = 0; line < lines; line++) {
    process.stdout.moveCursor(0, -1)
    process.stdout.clearLine(0)
  }
}

module.exports = (cmd, ctx, filename, callback) => {
  let originalCmd = cmd
  let promptLastLine = prompter.lastPrompt.split('\n').slice(-1)[0]
  if (promptLastLine === '... ') {
    promptLastLine = ''
  }

  try {
    if (!cmd.trim()) {
      clearLines(prompter.lastPrompt, cmd)
      return callback(null)
    }

    cmd = cmd.split(/\s*;\s*/g).map(cmd =>
      cmd.split(/\s*\|\|\s*/g).map((cmd, i, a) =>
        cmd.split(/\s*&&\s*/g).map((cmd, j, b) => {
          let [argv0, argv1] = stringArgv(cmd.trim().replace(/\n/g, ' '))
          if (typeof context[argv0] === 'function' && (!argv1 || !/^=/.test(argv1))) {
            let judged = i < a.length - 1 || j < b.length - 1
            cmd = cmd.trim().replace(/\n/g, ' ').split(/\s*\|\s*/).map((cmd, pipeLevel) => {
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

            if (judged) {
              cmd += '.success'
            }
          }
          return cmd
        }).join(' && ')
      ).join(' || ')
    ).join('; ')

    clearLines(promptLastLine, originalCmd.split('\n').slice(-1)[0])

    let error = validateCode(cmd)
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
    clearLines(promptLastLine, originalCmd)
    console.log(promptLastLine + config.colorizeCommand(cmd, e, true))
    callback(null)
  }
}