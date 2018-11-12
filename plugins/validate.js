const vm = require('vm')
const sandbox = vm.createContext()

module.exports = (code) => {
  try {
    vm.runInContext(code, sandbox)
  } catch (e) {
    if (e.name === 'SyntaxError' && /^(Unexpected end of input|Unexpected token)$/.test(e.message)) {
      return e
    }
  }
}