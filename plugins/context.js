const config = require('./config')
const exec = require('./exec')
const exit = require('./exit')

module.exports = new Proxy({
  config,
  exec,
  exit
}, {
  get(target, key) {
    if (typeof key === 'string' && /^\$/.test(key)) {
      return process.env[key.slice(1)]
    }

    if (key in target) {
      return target[key]
    }

    let result
    if (typeof key === 'string' && key !== '') {
      config.env.find(env => {
        try { return result = env(key) } catch (e) {}
      })
    }
    return result
  },
  set(target, key, value) {
    if (/^\$/.test(key)) {
      process.env[key.slice(1)] = value
      return true
    }

    target[key] = value
    return true
  }
})