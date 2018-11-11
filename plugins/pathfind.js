const fs = require('fs')
const path = require('path')

module.exports = (key) => {
  for (let dir of process.env.PATH.split(':')) {
    file = path.join(dir, key)
    if (fs.existsSync(file) && fs.statSync(file).isFile) {
      return file
    }
  }
}