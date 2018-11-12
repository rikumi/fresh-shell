const vm = require('vm')

module.exports = (code) => {
  try {
    vm.runInNewContext(code)
  } catch (e) {
    if (e.name === 'SyntaxError' && /^(Unexpected end of input|Unexpected token)$/.test(e.message)) {
      return e
    }
  }
}