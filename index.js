#!/usr/bin/env node
const fs = require('fs')
const os = require('os')
const vm = require('vm')
const repl = require('repl')
const path = require('path')
const eval = require('./plugins/eval')
const config = require('./plugins/config')
const context = require('./plugins/context')

// enable REPL prompt as a function
require('./plugins/prompter').applyFix()

// change error output into only one-line messages
process.on('unhandledRejection', e => { throw e })
process.on('uncaughtException', e => { console.log(e.message) })

// ignore Ctrl+C from child processes
process.on('SIGINT', () => {})

// load custom configurations
try {
  vm.runInContext(fs.readFileSync(path.join(os.homedir(), '.jeshrc.js')).toString(), context)
} catch (e) {}

const cli = repl.start({
  prompt: config.prompt,
  ignoreUndefined: true,
  completer: config.complete,
  eval,
})

require('repl-history')(cli, {
  useHome: true,
  maxSave: 0
})