module.exports = (returns) => {
  let { stdout, stderr, status, signal } = returns || {}

  if (typeof stdout !== 'string') stdout = ''
  if (typeof stderr !== 'string') stderr = ''
  
  let ret = stdout.split(/\r?\n/).filter((k, i, a) => k !== '' || i !== a.length - 1)
  stderr = stderr.split(/\r?\n/).filter((k, i, a) => k !== '' || i !== a.length - 1)

  if (stderr.length) ret.error = stderr
  if (signal) ret.signal = signal
  
  ret.status = status || 0

  Object.defineProperty(ret, 'success', {
    get: _ => !ret.status,
    enumerable: false
  })
  
  return ret
}