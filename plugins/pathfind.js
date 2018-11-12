const fs = require('fs')
const path = require('path')

module.exports = (key) => {
  for (let dir of process.env.PATH.split(':').concat([
    '/bin', '/usr/bin', '/usr/local/bin'
  ])) {
    file = path.resolve(dir, key)
    if (fs.existsSync(file) && fs.statSync(file).isFile) {
      return file
    }
  }
}