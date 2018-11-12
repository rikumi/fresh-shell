const rl = require('readline')
const repl = require('repl')

/**
 * This module enables repl.start(options) to take a function
 * as prompt and get that function called every time when it's
 * about to show a prompt.
 */
let lastPrompt = ''

const applyFix = () => {
  const _start = repl.start
  repl.start = (options) => {
    let _prompter
    if (typeof options.prompt === 'function') {
      _prompter = options.prompt
      options.prompt = lastPrompt = _prompter()
    }
    let ret = _start.call(repl, options)
    if (_prompter) {
      ret._prompter = _prompter
    }
    return ret
  }

  const _setPrompt = rl.Interface.prototype.setPrompt
  rl.Interface.prototype.setPrompt = function(prompt, ...args) {
    _setPrompt.call(this, prompt, ...args)
    lastPrompt = prompt
  }

  const _prompt = rl.Interface.prototype.prompt
  rl.Interface.prototype.prompt = function (...args) {
    if (this._prompter && lastPrompt !== '... ') {
      this.setPrompt(lastPrompt = this._prompter())
    }
    return _prompt.call(this, ...args)
  }
}

module.exports = {
  applyFix,
  get lastPrompt() {
    return lastPrompt
  }
}